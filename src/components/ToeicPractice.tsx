/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Volume2, 
  Award, 
  Clock, 
  BookOpen, 
  Sparkles, 
  History, 
  ChevronRight, 
  ArrowLeft, 
  ListFilter,
  Check,
  AlertTriangle,
  HelpCircle,
  PlayCircle,
  Focus,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  RefreshCw
} from 'lucide-react';
import { fireConfettiBig } from '../utils/confetti';

// Simplified model for TOEIC Test Structure
interface ToeicQuestion {
  id: number;
  number: number;
  part: number;
  questionText?: string;
  image?: string;
  audioStart?: number; // Starting timestamp in seconds
  options: { label: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  passageText?: string; // For Parts 3, 4, 6, 7 (reading passages or conversation text)
  graphicTitle?: string; // Visual graphic titles (e.g. "Maxx Cosmetics Gift Card")
}

interface ToeicTest {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  totalQuestions: number;
  questions: ToeicQuestion[];
  timesTaken: number;
}

interface TestAttempt {
  date: string;
  testId: string;
  testName: string;
  mode: 'full' | 'listening' | 'reading';
  scoreListening: number;
  scoreReading: number;
  totalScore: number;
  correctAnswersCount: number;
  totalQuestionsCount: number;
}

// Map correct answers to approximate TOEIC scoring matrix keys
const estimateToeicScore = (listeningCorrect: number, readingCorrect: number, mode: 'full' | 'listening' | 'reading'): { listening: number; reading: number; total: number } => {
  // Approximate standard scoring table
  // Listening range: 5 to 495
  // Reading range: 5 to 495
  let lScore = 0;
  let rScore = 0;

  if (listeningCorrect > 0) {
    if (listeningCorrect >= 96) lScore = 495;
    else if (listeningCorrect >= 90) lScore = 470;
    else if (listeningCorrect >= 80) lScore = 425;
    else if (listeningCorrect >= 70) lScore = 370;
    else if (listeningCorrect >= 60) lScore = 315;
    else if (listeningCorrect >= 50) lScore = 260;
    else if (listeningCorrect >= 40) lScore = 200;
    else if (listeningCorrect >= 30) lScore = 145;
    else if (listeningCorrect >= 20) lScore = 95;
    else if (listeningCorrect >= 10) lScore = 45;
    else lScore = 10;
  }

  if (readingCorrect > 0) {
    if (readingCorrect >= 96) rScore = 495;
    else if (readingCorrect >= 90) rScore = 465;
    else if (readingCorrect >= 80) rScore = 415;
    else if (readingCorrect >= 70) rScore = 355;
    else if (readingCorrect >= 60) rScore = 295;
    else if (readingCorrect >= 50) rScore = 240;
    else if (readingCorrect >= 40) rScore = 185;
    else if (readingCorrect >= 30) rScore = 130;
    else if (readingCorrect >= 20) rScore = 80;
    else if (readingCorrect >= 10) rScore = 35;
    else rScore = 10;
  }

  if (mode === 'listening') {
    return { listening: lScore, reading: 0, total: lScore };
  }
  if (mode === 'reading') {
    return { listening: 0, reading: rScore, total: rScore };
  }
  return { listening: lScore, reading: rScore, total: lScore + rScore };
};

export default function ToeicPractice() {
  const [viewMode, setViewMode] = useState<'list' | 'exam' | 'result' | 'history'>('list');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'listening' | 'reading'>('all');
  const [activeTest, setActiveTest] = useState<ToeicTest | null>(null);
  const [examMode, setExamMode] = useState<'full' | 'listening' | 'reading'>('full');
  
  // Timer states
  const [timeLeft, setTimeLeft] = useState<number>(120 * 60); // 120 minutes in seconds
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Audio player custom states
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);

  // Active exam interaction states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<{ [questionId: number]: string }>({});
  const [isAnswerSheetOpen, setIsAnswerSheetOpen] = useState<boolean>(true);

  // ✅ FOCUS MODE state
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);

  // Auto-save key per test
  const AUTOSAVE_KEY = 'toeic_autosave_answers';

  // History state loaded from local storage
  const [attemptHistory, setAttemptHistory] = useState<TestAttempt[]>([]);

  // Results display state
  const [scoreResult, setScoreResult] = useState<{
    listening: number;
    reading: number;
    total: number;
    correctCount: number;
    listeningCorrect: number;
    readingCorrect: number;
    totalListeningInTest: number;
    totalReadingInTest: number;
  } | null>(null);

  // Load history on mount
  useEffect(() => {
    const rawHistory = localStorage.getItem('toeic_practice_history');
    if (rawHistory) {
      try {
        setAttemptHistory(JSON.parse(rawHistory));
      } catch (e) {
        console.error('Failed to load TOEIC history', e);
      }
    }
  }, []);

  // ✅ AUTO-SAVE: Lưu đáp án mỗi khi userAnswers thay đổi
  useEffect(() => {
    if (viewMode === 'exam' && activeTest) {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({
        testId: activeTest.id,
        answers: userAnswers,
        questionIndex: currentQuestionIndex,
        timeLeft,
        examMode
      }));
    }
  }, [userAnswers, currentQuestionIndex]);

  // ✅ AUTO-RESTORE: Khôi phục đáp án khi bắt đầu lại đề thi (sau F5)
  const tryRestoreAutoSave = (testId: string): { answers: Record<number, string>; questionIndex: number } | null => {
    try {
      const raw = localStorage.getItem(AUTOSAVE_KEY);
      if (!raw) return null;
      const saved = JSON.parse(raw);
      if (saved.testId === testId && Object.keys(saved.answers).length > 0) {
        return { answers: saved.answers, questionIndex: saved.questionIndex || 0 };
      }
    } catch (e) { /* ignore */ }
    return null;
  };

  // ✅ KEYBOARD SHORTCUTS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bỏ qua khi đang gõ vào input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (viewMode === 'exam') {
        // Space: Play/Pause audio
        if (e.code === 'Space') {
          e.preventDefault();
          togglePlayAudio();
        }
        // Arrow Left: Tua lùi 5 giây
        if (e.code === 'ArrowLeft') {
          e.preventDefault();
          if (audioRef.current) {
            audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
            setCurrentTime(audioRef.current.currentTime);
          }
        }
        // Arrow Right: Tua tiến 5 giây
        if (e.code === 'ArrowRight') {
          e.preventDefault();
          if (audioRef.current) {
            audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 5);
            setCurrentTime(audioRef.current.currentTime);
          }
        }
        // Enter: Nộp bài
        if (e.code === 'Enter' && e.ctrlKey) {
          e.preventDefault();
          if (window.confirm('Nhấn Ctrl+Enter để nộp bài. Bạn có chắc chưa?')) {
            handleSubmitExam();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, isPlaying, duration]);

  // ✅ FOCUS MODE: Fullscreen + ẩn sidebar
  const toggleFocusMode = () => {
    if (!isFocusMode) {
      // Bật focus mode: fullscreen
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      // Ẩn sidebar bằng cách thêm class vào container app
      const sidebar = document.querySelector('[class*="ml-64"]')?.previousElementSibling as HTMLElement;
      if (sidebar) sidebar.style.display = 'none';
      const mainContent = document.querySelector('.ml-64') as HTMLElement;
      if (mainContent) mainContent.style.marginLeft = '0';
    } else {
      // Tắt focus mode
      if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      const sidebar = document.querySelector('[id="zencards-app-container"] > div:first-child') as HTMLElement;
      if (sidebar) sidebar.style.display = '';
      const mainContent = document.querySelector('.ml-64') as HTMLElement;
      if (mainContent) mainContent.style.marginLeft = '';
    }
    setIsFocusMode(!isFocusMode);
  };

  // Save attempt to history
  const saveAttempt = (attempt: TestAttempt) => {
    const updated = [attempt, ...attemptHistory];
    setAttemptHistory(updated);
    localStorage.setItem('toeic_practice_history', JSON.stringify(updated));
  };

  // Actual TOEIC Practice Tests Database (digitized directly based on the user's PDF and requested layout structure)
  const toeicTests: ToeicTest[] = [
    {
      id: 'toeic-test-02',
      name: 'TOEIC Actual Test 02',
      description: 'Đề thi chuẩn hóa New Economy 1000 chuyên sâu định dạng đề thi thật ETS.',
      durationMinutes: 120,
      totalQuestions: 200,
      timesTaken: 142,
      questions: [
        // PART 1
        {
          id: 1,
          number: 1,
          part: 1,
          audioStart: 0, // seconds
          image: '/imgs/p1.png',
          questionText: 'Hãy nghe và chọn mô tả đúng nhất cho bức tranh số 1.',
          options: [
            { label: 'A', text: 'An airplane is taking off from the runway.' },
            { label: 'B', text: 'A luggage container is being loaded onto the aircraft.' },
            { label: 'C', text: 'An aircraft is parked at the departure terminal gate.' },
            { label: 'D', text: 'Cargo trucks are driving away from the airport.' }
          ],
          correctAnswer: 'C',
          explanation: 'Bức tranh số 1 biểu diễn một chiếc máy bay đang đỗ tại cửa nhà ga khởi hành (terminal gate). Phù hợp nhất là phương án C: "An aircraft is parked at the departure terminal gate."'
        },
        {
          id: 2,
          number: 2,
          part: 1,
          audioStart: 45, // seconds
          image: '/imgs/p2.png',
          questionText: 'Hãy nghe và chọn mô tả đúng nhất cho bức tranh số 2.',
          options: [
            { label: 'A', text: 'The woman is signing a sales contract.' },
            { label: 'B', text: 'The woman is taking a sip from her coffee cup.' },
            { label: 'C', text: 'The woman is looking down at a printed newspaper.' },
            { label: 'D', text: 'The woman is working at a laptop with her hand on her chin.' }
          ],
          correctAnswer: 'D',
          explanation: 'Bức tranh số 2 mô tả một phụ nữ đang ngồi tựa cằm vào tay và nhìn vào máy tính xách tay. Phương án D là chuẩn xác nhất: "The woman is working at a laptop with her hand on her chin."'
        },
        {
          id: 3,
          number: 3,
          part: 1,
          audioStart: 90, // seconds
          image: '/imgs/p3.png',
          questionText: 'Hãy nghe và chọn mô tả đúng nhất cho bức tranh số 3.',
          options: [
            { label: 'A', text: 'A woman is polishing the windshield of her sedan.' },
            { label: 'B', text: 'A woman is rolling a spare tire toward the front of the car.' },
            { label: 'C', text: 'A woman is leaning over to check a car tire on the roadside.' },
            { label: 'D', text: 'A woman is putting groceries into the rear trunk.' }
          ],
          correctAnswer: 'C',
          explanation: 'Bức tranh số 3 vẽ một người phụ nữ đang có xu hướng cúi xuống kiểm tra chiếc lốp xe ô tô ven đường. Phương án đúng: C.'
        },
        {
          id: 4,
          number: 4,
          part: 1,
          audioStart: 135,
          image: '/imgs/p4.png',
          questionText: 'Hãy nghe và chọn mô tả đúng nhất cho bức tranh số 4.',
          options: [
            { label: 'A', text: 'Several skiers are riding a cable hoist lift.' },
            { label: 'B', text: 'A group of people is skiing down a snowy slope.' },
            { label: 'C', text: 'A ski instructor is lecturing to trainees.' },
            { label: 'D', text: 'A heavy tractor is clearing snow off the road.' }
          ],
          correctAnswer: 'B',
          explanation: 'Bức tranh số 4 vẽ một vài người đang trượt tuyết xuống dốc núi phủ đầy tuyết. Do đó chọn B: "A group of people is skiing down a snowy slope."'
        },
        {
          id: 5,
          number: 5,
          part: 1,
          audioStart: 180,
          image: '/imgs/p5.png',
          questionText: 'Hãy nghe và chọn mô tả đúng nhất cho bức tranh số 5.',
          options: [
            { label: 'A', text: 'A businesswoman is presenting charts on a whiteboard.' },
            { label: 'B', text: 'The executives are pouring wine into glasses.' },
            { label: 'C', text: 'They are distributing printouts to the audience.' },
            { label: 'D', text: 'The speaker is wiping the whiteboard clean.' }
          ],
          correctAnswer: 'A',
          explanation: 'Bức tranh số 5 chỉ một người phụ nữ trẻ đang đứng thuyết trình các sơ đồ biểu đồ tròn hiển thị trên tấm bảng trắng trước cuộc họp. Chọn A.'
        },
        {
          id: 6,
          number: 6,
          part: 1,
          audioStart: 225,
          image: '/imgs/p6.png',
          questionText: 'Hãy nghe và chọn mô tả đúng nhất cho bức tranh số 6.',
          options: [
            { label: 'A', text: 'An operator is adjusting a headphone wire.' },
            { label: 'B', text: 'Two people are looking at the screen of a laptop together.' },
            { label: 'C', text: 'All workers are standing up in their office cubicles.' },
            { label: 'D', text: 'A supervisor is typing a report on the keyboard.' }
          ],
          correctAnswer: 'B',
          explanation: 'Tranh số 6 thể hiện hai đồng nghiệp nam đang ghé sát người cùng xem thông tin trực tiếp hiển thị trên màn hình laptop đặt trên bàn làm việc chung. Phương án đúng: B.'
        },

        // PART 2 (Listening)
        {
          id: 7,
          number: 7,
          part: 2,
          audioStart: 300,
          questionText: 'Nghe câu hỏi hoặc phát biểu và chọn phản hồi phù hợp nhất: "Should we order lunch now or wait for Mr. Kim to arrive?"',
          options: [
            { label: 'A', text: 'Yes, we should try that new Vietnamese restaurant.' },
            { label: 'B', text: "Let's wait for him; he should be here in ten minutes." },
            { label: 'C', text: 'I bought a sandwich for breakfast yesterday.' }
          ],
          correctAnswer: 'B',
          explanation: 'Đây là câu hỏi lựa chọn (lunch now OR wait for Mr. Kim). Câu trả lời B: "Let\'s wait for him..." là câu hồi đáp lịch sự và logic.'
        },
        {
          id: 8,
          number: 8,
          part: 2,
          audioStart: 330,
          questionText: 'Nghe câu hỏi hoặc phát biểu và chọn phản hồi phù hợp nhất: "Who won the top design reward at the conference?"',
          options: [
            { label: 'A', text: 'The lead graphic artist from Apex Solutions.' },
            { label: 'B', text: 'It was held in San Francisco again.' },
            { label: 'C', text: 'No, I registered online last Wednesday.' }
          ],
          correctAnswer: 'A',
          explanation: 'Câu hỏi "Who" (Ai là người chiến thắng giải thiết kế hàng đầu?). Phản hồi A chỉ người thiết kế chính của Apex Solutions là đáp án duy nhất đúng.'
        },
        {
          id: 9,
          number: 9,
          part: 2,
          audioStart: 360,
          questionText: 'Nghe câu hỏi hoặc phát biểu và chọn phản hồi phù hợp nhất: "When will the building security badge expire?"',
          options: [
            { label: 'A', text: 'At the end of this current fiscal year.' },
            { label: 'B', text: 'Please contact the human resource office.' },
            { label: 'C', text: 'Yes, secure the entrance door carefully.' }
          ],
          correctAnswer: 'A',
          explanation: 'Câu hỏi "When" (Khi nào thẻ an ninh tòa nhà hết hạn?). Phản hồi phù hợp nhất về mặt thời gian là A: "Vào cuối năm tài chính hiện tại."'
        },

        // PART 3 (Listening)
        {
          id: 32,
          number: 32,
          part: 3,
          audioStart: 900,
          passageText: "[Đoạn hội thoại] \nWoman: Hi John, have you seen the agenda for our upcoming corporate team retreat? It seems like they want us to present our market expansion results already on the first afternoon. \nMan: Yes, I noticed that. I am actually quite concerned because our graphic designs department hasn't finished the slides yet. They said they need two more days. \nWoman: In that case, we should check with the organizing committee. Perhaps they can shift our session to the second morning so we have enough time to finalize the presentation.",
          questionText: 'What are the speakers discussing?',
          options: [
            { label: 'A', text: 'An upcoming presentation scheduled for a team retreat.' },
            { label: 'B', text: 'A change in corporate health insurance guidelines.' },
            { label: 'C', text: 'Hiring new graphic designers for the campaign.' },
            { label: 'D', text: 'The budget estimates for market expansion.' }
          ],
          correctAnswer: 'A',
          explanation: 'Đoạn đầu cuộc đối thoại đề cập trực tiếp đến chương trình buổi dã ngoại nhóm của công ty và buổi thuyết trình kết quả mở rộng thị trường ngay ngày đầu tiên.'
        },
        {
          id: 33,
          number: 33,
          part: 3,
          audioStart: 900,
          questionText: 'What problem does the woman mention?',
          options: [
            { label: 'A', text: 'The conference room has been double-booked.' },
            { label: 'B', text: 'The market results data are completely missing.' },
            { label: 'C', text: 'The slide graphics are not complete yet.' },
            { label: 'D', text: 'The organizing director is absent.' }
          ],
          correctAnswer: 'C',
          explanation: 'Người đàn ông giải thích: "our graphic designs department hasn\'t finished the slides yet" (Phòng đồ họa vẫn chưa vẽ xong các slide). Câu C mô tả chính xác vấn đề này.'
        },
        {
          id: 34,
          number: 34,
          part: 3,
          audioStart: 900,
          questionText: 'What does the woman say she will do?',
          options: [
            { label: 'A', text: 'Postpone the team retreat date.' },
            { label: 'B', text: 'Contact the organizing committee to request a schedule shift.' },
            { label: 'C', text: 'Design the slide presentation on her own.' },
            { label: 'D', text: 'Cancel her travel flight seats.' }
          ],
          correctAnswer: 'B',
          explanation: 'Người phụ nữ nói rõ: "we should check with the organizing committee. Perhaps they can shift our session to the second morning..." (Chúng ta nên liên hệ ban tổ chức dời lịch phát biểu).'
        },

        // PART 4 (Listening)
        {
          id: 71,
          number: 71,
          part: 4,
          audioStart: 1500,
          passageText: "[Bài nói ngắn] \nGood afternoon, passengers. This is a special update regarding our museum schedules. Our special exhibition on Egyptian artifacts on the second floor has attracted record crowds today. Due to this high interest, we will be extending its hours of operation by two full hours until 8 PM this evening. Please note that tickets can still be purchased online or directly via the main service desk in the central lobby. Guided tours will depart every thirty minutes. Thank you.",
          questionText: 'Who is the message probably for?',
          options: [
            { label: 'A', text: 'Museum tour guides.' },
            { label: 'B', text: 'Visitors of a historical museum.' },
            { label: 'C', text: 'Lobby security guards.' },
            { label: 'D', text: 'Egyptian ticket agency personnel.' }
          ],
          correctAnswer: 'B',
          explanation: 'Bài nói ngắn cập nhật thông tin kéo dài giờ hoạt động của một triển lãm di vật Ai Cập tại bảo tàng, hướng đến đối tượng là khách tham quan (B).'
        },
        {
          id: 72,
          number: 72,
          part: 4,
          audioStart: 1500,
          questionText: 'What is mentioned about the exhibition?',
          options: [
            { label: 'A', text: 'It has been canceled due to repairs.' },
            { label: 'B', text: 'It is sponsored by an Egyptian airline company.' },
            { label: 'C', text: 'Its hours of operation are extended today.' },
            { label: 'D', text: 'It is restricted only to VIP members.' }
          ],
          correctAnswer: 'C',
          explanation: 'Thông báo nêu rõ: "we will be extending its hours of operation by two full hours until 8 PM this evening." (Chúng tôi kéo dài thời gian mở cửa thêm 2 tiếng tối nay).'
        },
        {
          id: 73,
          number: 73,
          part: 4,
          audioStart: 1500,
          questionText: 'How can listeners receive more information?',
          options: [
            { label: 'A', text: 'By calling the local police department.' },
            { label: 'B', text: 'By visiting the main service lobby desk.' },
            { label: 'C', text: 'By listening to a radio broadcast next week.' },
            { label: 'D', text: 'By downloading a custom smart-phone application.' }
          ],
          correctAnswer: 'B',
          explanation: 'Loa thông báo: "tickets can still be purchased... via the main service desk in the central lobby." (Có thể mua vé hoặc hỏi tin tại quầy dịch vụ trung tâm ở sảnh chính).'
        },

        // PART 5 (Reading)
        {
          id: 101,
          number: 101,
          part: 5,
          questionText: 'With the help of one of the IT technicians, the missing accounting files have been ________.',
          options: [
            { label: 'A', text: 'recover' },
            { label: 'B', text: 'recovers' },
            { label: 'C', text: 'recovering' },
            { label: 'D', text: 'recovered' }
          ],
          correctAnswer: 'D',
          explanation: 'Cấu trúc "have been + V-ed" ở thể bị động hoàn thành. Do đó chọn "recovered" (đã được khôi phục thành công).'
        },
        {
          id: 102,
          number: 102,
          part: 5,
          questionText: 'A private reception for gallery donors will be ________ on March 5, prior to the grand opening of the exhibit.',
          options: [
            { label: 'A', text: 'held' },
            { label: 'B', text: 'faced' },
            { label: 'C', text: 'claimed' },
            { label: 'D', text: 'made' }
          ],
          correctAnswer: 'A',
          explanation: 'Động từ "held" (phân từ của hold) mang nghĩa "tổ chức một buổi tiệc/tiếp đón" (be held: được tổ chức). Chọn A.'
        },
        {
          id: 103,
          number: 103,
          part: 5,
          questionText: 'Aurora Furnishings is finding it difficult to make a profit in its ________ competitive market.',
          options: [
            { label: 'A', text: 'increases' },
            { label: 'B', text: 'increased' },
            { label: 'C', text: 'increasingly' },
            { label: 'D', text: 'increase' }
          ],
          correctAnswer: 'C',
          explanation: 'Cần trạng từ "increasingly" (ngày càng, ngày một tăng) để bổ nghĩa cho tính từ "competitive" phía sau.'
        },
        {
          id: 104,
          number: 104,
          part: 5,
          questionText: 'A minor electrical malfunction was discovered by the pilot ________ before the plane took off.',
          options: [
            { label: 'A', text: 'barely' },
            { label: 'B', text: 'shortly' },
            { label: 'C', text: 'absolutely' },
            { label: 'D', text: 'exclusively' }
          ],
          correctAnswer: 'B',
          explanation: '"shortly before" là một cụm trạng từ phổ biến mang nghĩa là "chỉ một thời gian ngắn trước khi..." (Ngay trước khi máy bay cất cánh).'
        },
        {
          id: 105,
          number: 105,
          part: 5,
          questionText: 'We will make a final decision about changing the landscaping of the property after reviewing the ________ costs.',
          options: [
            { label: 'A', text: 'estimation' },
            { label: 'B', text: 'estimate' },
            { label: 'C', text: 'estimated' },
            { label: 'D', text: 'estimating' }
          ],
          correctAnswer: 'C',
          explanation: 'Tính từ phân từ "estimated" bổ nghĩa cho danh từ "costs" mang ý nghĩa là "chi phí ước tính, chi phí dự tính". Chọn C.'
        },
        {
          id: 106,
          number: 106,
          part: 5,
          questionText: 'MyHealth Co. has produced a wide range of vitamin supplements for ________ two decades.',
          options: [
            { label: 'A', text: 'along' },
            { label: 'B', text: 'during' },
            { label: 'C', text: 'over' },
            { label: 'D', text: 'when' },
          ],
          correctAnswer: 'C',
          explanation: 'Dùng giới từ "over" trước một số đếm thời gian mang ý nghĩa "hơn" (over two decades: hơn hai thập kỷ qua).'
        },

        // PART 6 (Reading)
        {
          id: 131,
          number: 131,
          part: 6,
          passageText: "Employee Spring Training\n\nLawrence Paper is dedicated to helping all of its employees fulfill their potential. That is why we have once again organized 2 days of spring training. Human Resources has put together a wide range of topics for this year's workshops, [131] sales techniques, computer skills, communication strategies, and goal setting. We still have two workshop time slots available, so if there is something you've been dying to learn about, please let us know. It's quite possible we [132] it into this year's spring training. [133] free to [134] any ideas you might have to Nancy Kensington in the human resources department.",
          questionText: 'Select the best word to complete blank [131].',
          options: [
            { label: 'A', text: 'distributing' },
            { label: 'B', text: 'locating' },
            { label: 'C', text: 'including' },
            { label: 'D', text: 'advancing' }
          ],
          correctAnswer: 'C',
          explanation: 'Động từ mang nghĩa "bao gồm" là "including", liệt kê danh sách chủ đề đào tạo phía sau như sales, kỹ năng máy tính,...'
        },
        {
          id: 132,
          number: 132,
          part: 6,
          questionText: 'Select the best phrase to complete blank [132].',
          options: [
            { label: 'A', text: 'were incorporating' },
            { label: 'B', text: 'should incorporate' },
            { label: 'C', text: 'are incorporating' },
            { label: 'D', text: 'could incorporate' }
          ],
          correctAnswer: 'D',
          explanation: 'Dùng cấu trúc khả năng "could incorporate" (Chúng tôi hoàn toàn có thể cân nhắc tích hợp chương trình mà bạn đề xuất).'
        },
        {
          id: 133,
          number: 133,
          part: 6,
          questionText: 'Select the best word/phrase to complete blank [133].',
          options: [
            { label: 'A', text: 'Feel' },
            { label: 'B', text: 'Find' },
            { label: 'C', text: 'Be' },
            { label: 'D', text: 'Look' }
          ],
          correctAnswer: 'A',
          explanation: 'Mẫu câu đề xuất quen thuộc "Feel free to..." (Thoải mái tự do đưa ra bất kỳ ý tưởng sáng kiến nào của bạn).'
        },
        {
          id: 134,
          number: 134,
          part: 6,
          questionText: 'Select the best word to complete blank [134].',
          options: [
            { label: 'A', text: 'create' },
            { label: 'B', text: 'request' },
            { label: 'C', text: 'submit' },
            { label: 'D', text: 'transfer' }
          ],
          correctAnswer: 'C',
          explanation: 'Cổ vũ nhân viên nộp (submit) ý tưởng đến Nancy Kensington của phòng nhân lực. Chọn C.'
        },

        // PART 7 (Reading)
        {
          id: 147,
          number: 147,
          part: 7,
          passageText: "This Amazing World Photography Competition\n\nThe monthly travel magazine 'This Amazing World' is offering a discounted subscription rate for those who sign up during the month of November. 'This Amazing World' has been in print for over 30 years and offers readers insider tips and expert know-how to help you plan the vacation of your dreams. The magazine includes vacation package advertisements, reviews from travelers, and insightful essays to introduce you to various cultures, cuisines, and travel destinations.\n\nSubmit your travel photos to our This Amazing World Photography Competition for a chance to win a fantastic vacation to Scotland! The winner of the top prize will receive round-trip tickets and a $2,000 travel voucher for a hotel stay for two people.",
          questionText: 'What is mentioned about the magazine?',
          options: [
            { label: 'A', text: 'It is a literary journal.' },
            { label: 'B', text: 'It includes a recipe booklet supplement.' },
            { label: 'C', text: 'It provides travel advice.' },
            { label: 'D', text: 'It has an online-only version.' }
          ],
          correctAnswer: 'C',
          explanation: 'Triết lý của tạp chí được nhắc tới: "provides travel advice" (cung cấp cẩm nang lời khuyên du lịch chuyên sâu hữu ích từ chuyên gia).'
        },
        {
          id: 148,
          number: 148,
          part: 7,
          questionText: 'What is suggested about the competition?',
          options: [
            { label: 'A', text: 'It is sponsored by professional photographers.' },
            { label: 'B', text: 'It awards a complimentary vacation stay package to the main winner.' },
            { label: 'C', text: 'It accepts digital photographs only.' },
            { label: 'D', text: 'It features photos exclusively taken in Scotland.' }
          ],
          correctAnswer: 'B',
          explanation: 'Nội dung cuộc thi nhiếp ảnh: "chance to win a fantastic vacation to Scotland... with a hotel stay for two people". Tương ứng kết quả phái sinh B.'
        }
      ]
    }
  ];

  // Combine customized actual answers to populate standard 200 grid
  // Fill other blank values with mock defaults so they can click all 200!
  const generateFullAnswerSheet = (test: ToeicTest) => {
    const fullQuestions: { [number: number]: ToeicQuestion } = {};
    
    // Seed real ones
    test.questions.forEach(q => {
      fullQuestions[q.number] = q;
    });

    // Populate mock placeholders for the remaining of the 200 questions
    // This allows navigating the entire answer sheet perfectly!
    for (let i = 1; i <= 200; i++) {
      if (!fullQuestions[i]) {
        let questionPart = 1;
        if (i <= 6) questionPart = 1;
        else if (i <= 31) questionPart = 2;
        else if (i <= 70) questionPart = 3;
        else if (i <= 100) questionPart = 4;
        else if (i <= 130) questionPart = 5;
        else if (i <= 146) questionPart = 6;
        else questionPart = 7;

        fullQuestions[i] = {
          id: i,
          number: i,
          part: questionPart,
          questionText: `Câu hỏi số ${i} (Sách Đề Practice Test 02 - Trang tương ứng thuộc Part ${questionPart}). Hãy lựa chọn đáp án tối ưu nhất.`,
          options: [
            { label: 'A', text: 'Phương án lựa chọn A' },
            { label: 'B', text: 'Phương án lựa chọn B' },
            { label: 'C', text: 'Phương án lựa chọn C' },
            { label: 'D', text: 'Phương án lựa chọn D' }
          ],
          correctAnswer: ['A', 'B', 'C', 'D'][Math.floor(((i * 7) + 3) % 4)], // Deterministic default correct answer
          explanation: `Giải thích chi tiết phương án và phân tích ngữ nghĩa cho câu ${i} trong đề thi thử.`
        };
      }
    }

    return Object.values(fullQuestions).sort((a,b) => a.number - b.number);
  };

  const getFullQuestions = () => {
    if (!activeTest) return [];
    return generateFullAnswerSheet(activeTest);
  };

  const allQuestions = getFullQuestions();

  // Filter list of tests based on selection
  const filteredTests = toeicTests.filter(test => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'listening') return true; // Available for filter practice
    if (selectedFilter === 'reading') return true;
    return true;
  });

  // Start exam session
  const handleStartExam = (test: ToeicTest, mode: 'full' | 'listening' | 'reading') => {
    setActiveTest(test);
    setExamMode(mode);
    setViewMode('exam');

    // ✅ Thử khôi phục auto-save nếu có
    const restored = tryRestoreAutoSave(test.id);
    if (restored && Object.keys(restored.answers).length > 0) {
      const confirmRestore = window.confirm(
        `Hệ thống phát hiện bài làm dở dang của bạn (${Object.keys(restored.answers).length} câu đã trả lời). Bạn có muốn tiếp tục từ chỗ dang dở không?\n\n✅ OK = Tiếp tục làm tiếp\n❌ Hủy = Bắt đầu lại từ đầu`
      );
      if (confirmRestore) {
        setUserAnswers(restored.answers);
        setCurrentQuestionIndex(restored.questionIndex);
      } else {
        setUserAnswers({});
        localStorage.removeItem(AUTOSAVE_KEY);
        let initialIndex = 0;
        if (mode === 'reading') initialIndex = 100;
        setCurrentQuestionIndex(initialIndex);
      }
    } else {
      setUserAnswers({});
      let initialIndex = 0;
      if (mode === 'reading') initialIndex = 100;
      setCurrentQuestionIndex(initialIndex);
    }

    // Set time according to mode
    let durationSec = 120 * 60;
    if (mode === 'listening') durationSec = 45 * 60;
    if (mode === 'reading') durationSec = 75 * 60;

    setTimeLeft(durationSec);
    setIsTimerRunning(true);

    // Audio init
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.playbackRate = playbackRate;
      }
    }, 100);
  };

  // Timer interval update
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsTimerRunning(false);
            // Handle auto-submit when time is up
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  // Audio controls
  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(e => console.log('Audio playback error', e));
      setIsPlaying(true);
    }
  };

  const changePlaybackSpeed = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleAudioLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // Skip to specific audio timestamp (e.g. customized buttons)
  const jumpToTime = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
      if (!isPlaying) {
        audioRef.current.play().catch(e => console.log(e));
        setIsPlaying(true);
      }
    }
  };

  // Specific Jump mapping for Part 1 - 4
  const jumpToPartAudio = (partNum: number) => {
    if (partNum === 1) jumpToTime(0);
    if (partNum === 2) jumpToTime(300); // 5:00 minutes
    if (partNum === 3) jumpToTime(900); // 15:00 minutes
    if (partNum === 4) jumpToTime(1500); // 25:00 minutes
  };

  // Answer handler
  const handleSelectOption = (questionNumber: number, optionLabel: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionNumber]: optionLabel
    }));
  };

  // Format time
  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Submit and grade the TOEIC practice test
  const handleSubmitExam = () => {
    setIsTimerRunning(false);
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }

    if (!activeTest) return;

    let listeningCorrect = 0;
    let readingCorrect = 0;
    let totalListening = 0;
    let totalReading = 0;

    allQuestions.forEach(q => {
      const isListening = q.part <= 4;
      const isCorrect = userAnswers[q.number] === q.correctAnswer;

      if (isListening) {
        totalListening++;
        if (isCorrect) listeningCorrect++;
      } else {
        totalReading++;
        if (isCorrect) readingCorrect++;
      }
    });

    const scaledScore = estimateToeicScore(listeningCorrect, readingCorrect, examMode);

    const result = {
      listening: scaledScore.listening,
      reading: scaledScore.reading,
      total: scaledScore.total,
      correctCount: listeningCorrect + readingCorrect,
      listeningCorrect,
      readingCorrect,
      totalListeningInTest: totalListening,
      totalReadingInTest: totalReading
    };

    setScoreResult(result);

    // ✅ Xóa auto-save sau khi nộp bài thành công
    localStorage.removeItem(AUTOSAVE_KEY);

    // ✅ Pháo hoa ăn mừng nếu điểm >= 500 (tương đương thi khá)
    if (scaledScore.total >= 500) {
      setTimeout(() => fireConfettiBig(), 600);
    }

    // Save attempt recording to localStorage
    const attempt: TestAttempt = {
      date: new Date().toLocaleString('vi-VN'),
      testId: activeTest.id,
      testName: activeTest.name,
      mode: examMode,
      scoreListening: scaledScore.listening,
      scoreReading: scaledScore.reading,
      totalScore: scaledScore.total,
      correctAnswersCount: listeningCorrect + readingCorrect,
      totalQuestionsCount: allQuestions.length
    };
    saveAttempt(attempt);

    setViewMode('result');
  };

  const currentQuestion = allQuestions[currentQuestionIndex];

  return (
    <div id="toeic-root" className="max-w-[1200px] mx-auto px-6 py-4 font-sans select-none">
      
      {/* 1. LIST VIEW OF THE PRACTICE EXAMS */}
      {viewMode === 'list' && (
        <div className="space-y-8 animate-fade-in">
          {/* Header Description */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-2xl border border-[#E0E0D6] shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#5A5A40]/10 text-[#5A5A40]">MỚI</span>
                <span className="text-xs text-[#7C7C6B] font-medium uppercase tracking-wider">Học tập trung sâu</span>
              </div>
              <h2 className="text-2xl font-bold text-[#3D3D33] tracking-tight">Luyện đề thi thử TOEIC</h2>
              <p className="text-sm text-[#7C7C6B] mt-1 max-w-2xl">
                Luyện tập đầy đủ 2 kỹ năng nghe và đọc dựa trên danh mục đề thực tế. Tích hợp bộ đếm giờ tiêu chuẩn 120 phút, custom MP3 player hỗ trợ dời mốc thời gian thông minh và đáp án chấm điểm tự động.
              </p>
            </div>
            
            <button 
              onClick={() => setViewMode('history')}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#F5F5F0] hover:bg-[#EAEAE3] text-[#5A5A40] text-sm font-semibold rounded-xl border border-[#E0E0D6] transition-all cursor-pointer active:scale-95"
            >
              <History className="w-4 h-4" />
              <span>Lịch sử làm bài ({attemptHistory.length})</span>
            </button>
          </div>

          {/* Tab Selection Filter */}
          <div className="flex items-center justify-between border-b border-[#E0E0D6] pb-4">
            <div className="flex bg-[#EAEAE3]/60 p-1 rounded-xl">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  selectedFilter === 'all' 
                    ? 'bg-white text-[#5A5A40] shadow-sm' 
                    : 'text-[#7C7C6B] hover:text-[#5A5A40]'
                }`}
              >
                Tất cả đề
              </button>
              <button
                onClick={() => setSelectedFilter('listening')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  selectedFilter === 'listening' 
                    ? 'bg-white text-[#5A5A40] shadow-sm' 
                    : 'text-[#7C7C6B] hover:text-[#5A5A40]'
                }`}
              >
                Chỉ phần Nghe
              </button>
              <button
                onClick={() => setSelectedFilter('reading')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  selectedFilter === 'reading' 
                    ? 'bg-white text-[#5A5A40] shadow-sm' 
                    : 'text-[#7C7C6B] hover:text-[#5A5A40]'
                }`}
              >
                Chỉ phần Đọc
              </button>
            </div>

            <div className="text-xs text-[#7C7C6B] font-medium">
              Hiển thị: <strong>{filteredTests.length} đề thi</strong>
            </div>
          </div>

          {/* Bento Grid Card of Exams */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTests.map((test) => (
              <div 
                key={test.id} 
                className="bg-white rounded-2xl border border-[#E0E0D6] overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col group"
              >
                <div className="aspect-[16/9] w-full bg-[#EAEAE3] overflow-hidden relative">
                  <img 
                    src="https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=800&q=80" 
                    alt={test.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] font-bold text-[#5A5A40] border border-[#E0E0D6]">
                    ETS FORMAT
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[#3D3D33] group-hover:text-[#5A5A40] transition-colors">{test.name}</h3>
                    <p className="text-xs text-[#7C7C6B] mt-1.5 line-clamp-2 leading-relaxed">
                      {test.description}
                    </p>
                    
                    <div className="grid grid-cols-3 gap-2 mt-4 py-3 border-y border-[#F5F5F0]">
                      <div className="text-center">
                        <div className="text-[10px] uppercase font-bold text-[#A3A392]">Mã Đề</div>
                        <div className="text-xs font-semibold text-[#3D3D33] mt-0.5">EST02</div>
                      </div>
                      <div className="text-center border-x border-[#F5F5F0]">
                        <div className="text-[10px] uppercase font-bold text-[#A3A392]">Thời gian</div>
                        <div className="text-xs font-semibold text-[#3D3D33] mt-0.5">{test.durationMinutes} phút</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] uppercase font-bold text-[#A3A392]">Số câu hỏi</div>
                        <div className="text-xs font-semibold text-[#3D3D33] mt-0.5">{test.totalQuestions} câu</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-2">
                    <button 
                      onClick={() => handleStartExam(test, 'full')}
                      className="w-full py-3 bg-[#5A5A40] hover:bg-[#4A4A35] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-97"
                    >
                      <BookOpen className="w-4 h-4 text-white" />
                      <span>Bắt đầu thi Full Test (120 phút)</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => handleStartExam(test, 'listening')}
                        className="py-2 px-3 bg-[#F5F5F0] hover:bg-[#EAEAE3] text-[#5A5A40] text-[11px] font-bold rounded-xl border border-[#E0E0D6] transition-all cursor-pointer text-center active:scale-97"
                      >
                        Chỉ nghe (45p)
                      </button>
                      <button 
                        onClick={() => handleStartExam(test, 'reading')}
                        className="py-2 px-3 bg-[#F5F5F0] hover:bg-[#EAEAE3] text-[#5A5A40] text-[11px] font-bold rounded-xl border border-[#E0E0D6] transition-all cursor-pointer text-center active:scale-97"
                      >
                        Chỉ đọc (75p)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. EXAM WORKSPACE ROOM */}
      {viewMode === 'exam' && activeTest && (
        <div className={`space-y-6 animate-fade-in relative transition-all duration-300 ${isFocusMode ? 'bg-[#F0F0E8] min-h-screen p-6 rounded-2xl' : ''}`}>
          
          {/* Top Info Bar with Countdown Timer */}
          <div className="bg-white p-4 rounded-xl border border-[#E0E0D6] flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20 shadow-sm">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  if (window.confirm("Bạn có chắc chắn muốn thoát khỏi phòng thi? Dự án tiến trình hiện tại chưa nộp bài sẽ bị hủy bỏ.")) {
                    setIsTimerRunning(false);
                    if (audioRef.current) audioRef.current.pause();
                    if (isFocusMode) toggleFocusMode();
                    setViewMode('list');
                  }
                }}
                className="p-2 hover:bg-[#F5F5F0] rounded-lg text-[#7C7C6B] hover:text-[#3D3D33] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#A3A392] tracking-wider">Phòng thi TOEIC</span>
                <h3 className="text-base font-bold text-[#3D3D33]">{activeTest.name}</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#A3A392]/20 text-[#5A5A40] capitalize border border-[#E0E0D6]">
                Chế độ: {examMode === 'full' ? 'Full Test' : examMode === 'listening' ? 'Chỉ phần Nghe' : 'Chỉ phần Đọc'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* ✅ NÚT FOCUS MODE */}
              <button
                onClick={toggleFocusMode}
                title={isFocusMode ? 'Thoát chế độ tập trung (Esc)' : 'Bật chế độ tập trung toàn màn hình'}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                  isFocusMode
                    ? 'bg-[#5A5A40] text-white border-[#5A5A40]'
                    : 'bg-[#F5F5F0] text-[#5A5A40] border-[#E0E0D6] hover:bg-[#EAEAE3]'
                }`}
              >
                {isFocusMode ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isFocusMode ? 'Thoát tập trung' : 'Tập trung'}</span>
              </button>

              {/* Countdown indicator */}
              <div className="flex items-center gap-2 bg-[#EAEAE3] px-4 py-2 rounded-xl border border-[#E0E0D6]">
                <Clock className="w-4 h-4 text-[#5A5A40] animate-pulse" />
                <span className="text-base font-bold font-mono text-[#3D3D33]">{formatTime(timeLeft)}</span>
              </div>

              <button 
                onClick={handleSubmitExam}
                className="px-6 py-2 bg-[#5A5A40] hover:bg-[#4A4A35] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer active:scale-95"
              >
                Nộp bài thi
              </button>
            </div>
          </div>

          {/* ✅ KEYBOARD SHORTCUTS HINT BAR */}
          <div className="flex flex-wrap gap-3 items-center px-1 text-[10px] text-[#A3A392] font-mono select-none">
            <span className="font-semibold text-[#7C7C6B]">Phím tắt:</span>
            <span className="bg-[#EAEAE3] px-2 py-0.5 rounded border border-[#E0E0D6]">Space = Play/Pause</span>
            <span className="bg-[#EAEAE3] px-2 py-0.5 rounded border border-[#E0E0D6]">← → = Tua ±5s</span>
            <span className="bg-[#EAEAE3] px-2 py-0.5 rounded border border-[#E0E0D6]">Ctrl+Enter = Nộp bài</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 items-start">
            
            {/* COLUMN LEFT: Question and rich media (Audio Player for Listening context) */}
            <div className="flex-1 space-y-6 w-full lg:max-w-[70%]">
              
              {/* Custom Integrated Audio Player (For Parts 1, 2, 3, 4 only) */}
              {examMode !== 'reading' && (
                <div className="bg-[#5A5A40] text-white p-5 rounded-2xl border border-[#4A4A35] shadow-md space-y-4 relative overflow-hidden">
                  {/* Decorative faint background graphics */}
                  <div className="absolute right-0 bottom-0 translate-y-8 translate-x-8 opacity-5">
                    <Volume2 className="w-48 h-48" />
                  </div>

                  <audio 
                    id="toeicAudio" 
                    ref={audioRef}
                    src="Test2.mp3"
                    onTimeUpdate={handleAudioTimeUpdate}
                    onLoadedMetadata={handleAudioLoadedMetadata}
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-5 h-5 text-white/80" />
                      <div>
                        <span className="text-[10px] text-white/60 uppercase font-bold tracking-widest">Trình ghi âm phát tập trung</span>
                        <h4 className="text-xs font-bold font-sans text-white">File Audio đề bài liên tục: Test2.mp3</h4>
                      </div>
                    </div>

                    {/* Speed Controls (0.8x, 1.0x, 1.2x) */}
                    <div className="flex items-center gap-1.5 bg-black/20 p-1 rounded-lg border border-white/10">
                      <span className="text-[9px] text-white/50 font-semibold px-1">Tốc độ</span>
                      {[0.8, 1.0, 1.2].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => changePlaybackSpeed(rate)}
                          className={`text-[9px] font-bold px-2 py-0.5 rounded transition-all cursor-pointer ${
                            playbackRate === rate 
                              ? 'bg-white text-[#5A5A40]' 
                              : 'text-white/75 hover:bg-white/10'
                          }`}
                        >
                          {rate === 1.0 ? 'Chuẩn' : `${rate}x`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Main Control Audio Wave Bar */}
                  <div className="flex items-center gap-4">
                    {/* ✅ Tua lùi 5s */}
                    <button
                      onClick={() => {
                        if (audioRef.current) {
                          audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
                          setCurrentTime(audioRef.current.currentTime);
                        }
                      }}
                      title="Tua lùi 5 giây (←)"
                      className="w-8 h-8 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-90 shrink-0"
                    >
                      <SkipBack className="w-4 h-4" />
                    </button>

                    <button 
                      onClick={togglePlayAudio}
                      className="w-10 h-10 bg-white hover:bg-white/90 text-[#5A5A40] rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-sm shrink-0"
                    >
                      {isPlaying ? <Pause className="w-5 h-5 text-[#5A5A40] fill-[#5A5A40]" /> : <Play className="w-5 h-5 text-[#5A5A40] fill-[#5A5A40] translate-x-0.5" />}
                    </button>

                    {/* ✅ Tua tiến 5s */}
                    <button
                      onClick={() => {
                        if (audioRef.current) {
                          audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 5);
                          setCurrentTime(audioRef.current.currentTime);
                        }
                      }}
                      title="Tua tiến 5 giây (→)"
                      className="w-8 h-8 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-90 shrink-0"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>

                    <div className="flex-grow space-y-1">
                      {/* Range slider for scrubber */}
                      <input 
                        type="range"
                        min={0}
                        max={duration || 100}
                        value={currentTime}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (audioRef.current) {
                            audioRef.current.currentTime = val;
                            setCurrentTime(val);
                          }
                        }}
                        className="w-full accent-white bg-white/20 h-1 rounded-lg cursor-pointer transition-all"
                      />
                      
                      <div className="flex items-center justify-between text-[11px] text-white/70 font-mono">
                        <span>{formatTime(Math.round(currentTime))}</span>
                        <span>{duration ? formatTime(Math.round(duration)) : '00:00'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Jump directly to parts section (Custom sync request) */}
                  <div className="pt-2 border-t border-white/10 flex flex-wrap gap-2 items-center justify-between">
                    <span className="text-[10px] text-white/50 font-semibold">Tua nhanh theo Phần:</span>
                    <div className="flex gap-1.5 flex-wrap">
                      <button 
                        onClick={() => jumpToPartAudio(1)}
                        className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded text-[11px] font-semibold text-white tracking-wide transition-all cursor-pointer"
                      >
                        Part 1 (0:00)
                      </button>
                      <button 
                        onClick={() => jumpToPartAudio(2)}
                        className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded text-[11px] font-semibold text-white tracking-wide transition-all cursor-pointer"
                      >
                        Part 2 (5:00)
                      </button>
                      <button 
                        onClick={() => jumpToPartAudio(3)}
                        className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded text-[11px] font-semibold text-white tracking-wide transition-all cursor-pointer"
                      >
                        Part 3 (15:00)
                      </button>
                      <button 
                        onClick={() => jumpToPartAudio(4)}
                        className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded text-[11px] font-semibold text-white tracking-wide transition-all cursor-pointer"
                      >
                        Part 4 (25:00)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ACTIVE QUESTION PANEL DISPLAY */}
              <div className="bg-white p-6 rounded-2xl border border-[#E0E0D6] space-y-6 shadow-sm">
                
                {/* Part Header navigation details */}
                <div className="flex items-center justify-between border-b border-[#F5F5F0] pb-4">
                  <div>
                    <span className="px-2.5 py-0.5 bg-[#EAEAE3] text-[#5A5A40] text-[10px] font-bold rounded-full mr-2">
                      PART {currentQuestion.part}
                    </span>
                    <span className="text-xs text-[#7C7C6B] font-semibold">
                      {currentQuestion.part === 1 ? 'Mô tả hình ảnh (Action Photographs)' : 
                       currentQuestion.part === 2 ? 'Hỏi - Đáp (Question-Response)' : 
                       currentQuestion.part === 3 ? 'Đoạn hội thoại (Conversations)' : 
                       currentQuestion.part === 4 ? 'Bài phát biểu ngắn (Short Talks)' : 
                       currentQuestion.part === 5 ? 'Điền từ vào câu (Incomplete Sentences)' : 
                       currentQuestion.part === 6 ? 'Điền từ vào đoạn văn (Text Completion)' : 
                       'Đọc hiểu đoạn văn (Reading Comprehension)'}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-[#7C7C6B]">
                    Câu hỏi <span className="text-[#3D3D33] font-bold">{currentQuestionIndex + 1}</span> / {allQuestions.length}
                  </div>
                </div>

                {/* Sub-instruction for Part */}
                <div className="text-xs text-[#7C7C6B] italic leading-relaxed bg-[#F5F5F0] p-3 rounded-xl border-l-4 border-[#5A5A40]">
                  {currentQuestion.part === 1 && "Nhìn vào bức ảnh trong đề thi và nghe 4 phát biểu tương ứng (A, B, C, D) từ trình phát nhạc rồi tích chọn đáp án thích hợp."}
                  {currentQuestion.part === 2 && "Nghe một câu hỏi hoặc phát biểu bằng tiếng Anh và chọn câu trả lời phản hồi tốt nhất (A, B hoặc C) tương thích."}
                  {currentQuestion.part === 3 && "Đọc câu hỏi, lắng nghe đoạn hội thoại phát ra từ đĩa nghe rồi click chọn một trong bốn phương án đúng nhất."}
                  {currentQuestion.part === 4 && "Nhìn câu hỏi, nghe cuộc độc thoại/thuyết trình của 1 người nói và lựa chọn phương án giải quyết tối ưu nhất."}
                  {currentQuestion.part === 5 && "Chọn một trong bốn từ/cụm từ (A, B, C, D) để điền vào chỗ trống tạo thành câu hoàn chỉnh và chính xác ngữ pháp."}
                  {currentQuestion.part === 6 && "Đọc đoạn văn bản và chọn phương án thích hợp điền vào các chỗ trống được đánh số từ [131] đến [134]."}
                  {currentQuestion.part === 7 && "Đọc kỹ các tài liệu văn bản, quảng cáo, hội thoại chat hoặc thông báo để đưa ra câu trả lời tương ứng ở dưới."}
                </div>

                {/* Rich media: Images attached context (For Part 1 or Part 3,4,7 graphic details) */}
                {currentQuestion.image && (
                  <div className="w-full bg-[#F5F5F0] p-2 rounded-xl border border-[#E0E0D6] overflow-hidden">
                    <img 
                      src={currentQuestion.image} 
                      alt={`Question image #${currentQuestion.number}`} 
                      className="w-full max-h-[380px] object-contain mx-auto rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                {/* Rich media: Passage/Conversation Box (Used in Part 3, 4 dialog references, Part 6 email, Part 7 reading passages) */}
                {currentQuestion.passageText && (
                  <div className="bg-[#FBFBFA] border border-[#E0E0D6] p-5 rounded-xl text-sm leading-relaxed text-[#3D3D33] whitespace-pre-wrap font-sans font-medium">
                    {currentQuestion.passageText}
                  </div>
                )}

                {/* Actual Question Text Prompt */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-[#3D3D33] text-lg select-text">Q{currentQuestion.number}.</span>
                    <p className="text-[#3D3D33] text-base font-semibold select-text mt-0.5">
                      {currentQuestion.questionText || "Nhìn vào đề bài chọn đáp án tối ưu."}
                    </p>
                  </div>

                  {/* Playing Segment Help button for current question location targeting */}
                  {currentQuestion.part <= 4 && (
                    <button 
                      onClick={() => currentQuestion.audioStart !== undefined && jumpToTime(currentQuestion.audioStart)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#5A5A40]/10 hover:bg-[#5A5A40]/20 text-[#5A5A40] text-[11px] font-bold rounded-lg transition-all cursor-pointer mt-1"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>Phát đoạn nghe của câu này</span>
                    </button>
                  )}
                </div>

                {/* Multiple Options List Selection layout */}
                <div className="grid grid-cols-1 gap-3 pt-2">
                  {currentQuestion.options.map((option) => {
                    const isSelected = userAnswers[currentQuestion.number] === option.label;
                    return (
                      <button
                        key={option.label}
                        onClick={() => handleSelectOption(currentQuestion.number, option.label)}
                        className={`flex items-center gap-4 p-4 rounded-xl text-left border transition-all cursor-pointer active:scale-98 ${
                          isSelected
                            ? 'bg-[#5A5A40]/10 border-[#5A5A40] shadow-sm'
                            : 'bg-white hover:bg-[#FBFBFA] border-[#E0E0D6] hover:border-[#7C7C6B]/40'
                        }`}
                      >
                        <span className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center text-xs transition-all shrink-0 ${
                          isSelected
                            ? 'bg-[#5A5A40] text-white'
                            : 'bg-[#F2F2EB] text-[#7C7C6B]'
                        }`}>
                          {option.label}
                        </span>
                        
                        <span className={`text-[14px] font-medium leading-normal ${
                          isSelected ? 'text-[#3D3D33] font-semibold' : 'text-[#55554B]'
                        }`}>
                          {option.text}
                        </span>
                      </button>
                    );
                  })}
                </div>

              </div>

              {/* Next/Prev Navigation controls at foot */}
              <div className="flex items-center justify-between py-2">
                <button
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                  className="px-5 py-2.5 bg-white hover:bg-[#F2F2EB] border border-[#E0E0D6] text-xs font-bold text-[#5A5A40] disabled:opacity-40 rounded-xl transition-all disabled:cursor-not-allowed cursor-pointer"
                >
                  Câu trước
                </button>

                <div className="text-xs text-[#7C7C6B] font-medium font-mono">
                  Đã trả lời: {Object.keys(userAnswers).length} / {allQuestions.length} câu
                </div>

                <button
                  disabled={currentQuestionIndex === allQuestions.length - 1}
                  onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                  className="px-5 py-2.5 bg-white hover:bg-[#F2F2EB] border border-[#E0E0D6] text-xs font-bold text-[#5A5A40] disabled:opacity-40 rounded-xl transition-all disabled:cursor-not-allowed cursor-pointer"
                >
                  Câu tiếp theo
                </button>
              </div>

            </div>

            {/* COLUMN RIGHT: Grid Answer Sheet of 200 Questions */}
            <div className={`w-full lg:w-[30%] shrink-0 space-y-4 ${isAnswerSheetOpen ? 'block' : 'hidden md:block'}`}>
              
              <div className="bg-white p-5 rounded-2xl border border-[#E0E0D6] shadow-sm space-y-4 max-h-[820px] overflow-y-auto sticky top-[90px]">
                
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#3D3D33] flex items-center gap-1.5 uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-[#5A5A40]" />
                    <span>Phiếu trả lời (Answer Sheet)</span>
                  </h4>
                  <span className="text-[11px] font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                    1 - 200
                  </span>
                </div>

                <div className="text-[11px] text-[#7C7C6B] leading-relaxed">
                  Nhấp vào số câu bất kỳ để di chuyển nhanh góc màn hình làm việc đến câu hỏi đó. Ô có nền xanh là câu đã trả lời.
                </div>

                {/* Scrollable multi-columns / grids of answer sheets */}
                <div className="grid grid-cols-5 gap-2 pt-2">
                  {allQuestions.map((q, idx) => {
                    const ans = userAnswers[q.number];
                    const isSelected = currentQuestionIndex === idx;
                    const hasAnswer = ans !== undefined;

                    return (
                      <button
                        key={q.number}
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className={`py-2 text-[11px] font-bold rounded-lg border font-mono transition-all text-center flex flex-col items-center justify-center relative cursor-pointer ${
                          isSelected
                            ? 'bg-[#5A5A40] text-white border-[#5A5A40] ring-2 ring-[#5A5A40]/20'
                            : hasAnswer
                              ? 'bg-[#EAEAE3] text-[#5A5A40] border-[#5A5A40]/40'
                              : 'bg-white text-[#7C7C6B] border-[#E0E0D6] hover:bg-[#F5F5F0]'
                        }`}
                      >
                        <span>{q.number}</span>
                        {hasAnswer && (
                          <span className={`text-[9px] mt-0.5 uppercase ${isSelected ? 'text-white/80' : 'text-[#5A5A40]'}`}>
                            {ans}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-[#F5F5F0] space-y-2">
                  <button 
                    onClick={handleSubmitExam}
                    className="w-full py-3 bg-[#5A5A40] hover:bg-[#4A4A35] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer text-center"
                  >
                    Nộp bài chấm điểm
                  </button>
                  {/* ✅ Nút Reset đáp án */}
                  <button
                    onClick={() => {
                      if (window.confirm('Xóa toàn bộ đáp án đã chọn và làm lại từ đầu?')) {
                        setUserAnswers({});
                        setCurrentQuestionIndex(0);
                        localStorage.removeItem(AUTOSAVE_KEY);
                      }
                    }}
                    className="w-full py-2 flex items-center justify-center gap-1.5 text-[#A3A392] hover:text-[#7C7C6B] text-[11px] font-semibold rounded-xl border border-[#E0E0D6] hover:bg-[#F5F5F0] transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset toàn bộ đáp án</span>
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* 3. EXAM RESULTS VIEW BOARD */}
      {viewMode === 'result' && scoreResult && activeTest && (
        <div className="space-y-8 animate-fade-in text-center max-w-4xl mx-auto">
          
          {/* Result Summary Hero Box */}
          <div className="bg-white p-8 rounded-3xl border border-[#E0E0D6] shadow-sm space-y-6 relative overflow-hidden">
            {/* Soft decorative background illustration */}
            <div className="absolute -left-12 -top-12 opacity-5 translate-y-2">
              <Award className="w-64 h-64 text-[#5A5A40]" />
            </div>

            <div>
              <span className="text-xs text-[#7C7C6B] font-bold uppercase tracking-widest bg-emerald-100 text-[#5A5A40] px-3 py-1 rounded-full">
                Đã hoàn thành thi thử!
              </span>
              <h2 className="text-2xl font-bold text-[#3D3D33] mt-3 tracking-tight">KẾT QUẢ ĐỒNG BỘ: {activeTest.name}</h2>
              <p className="text-xs text-[#7C7C6B] mt-1">Hệ thống đo lường hiệu suất ETS và chấm điểm tự động.</p>
            </div>

            {/* Giant Score Circles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto py-4">
              
              <div className="bg-[#F5F5F0] p-5 rounded-2xl border border-[#E0E0D6] text-center">
                <div className="text-[10px] uppercase font-bold text-[#7C7C6B] tracking-wide">Điểm Listening</div>
                <div className="text-3xl font-extrabold text-[#5A5A40] mt-1">{scoreResult.listening} <span className="text-xs text-[#7C7C6B]/80 font-semibold">/ 495</span></div>
                <p className="text-[11px] text-[#A3A392] font-semibold mt-1.5">Số câu đúng: {scoreResult.listeningCorrect} / {scoreResult.totalListeningInTest}</p>
              </div>

              <div className="bg-[#F5F5F0] p-5 rounded-2xl border border-[#E0E0D6] text-center">
                <div className="text-[10px] uppercase font-bold text-[#7C7C6B] tracking-wide">Điểm Reading</div>
                <div className="text-3xl font-extrabold text-[#5A5A40] mt-1">{scoreResult.reading} <span className="text-xs text-[#7C7C6B]/80 font-semibold">/ 495</span></div>
                <p className="text-[11px] text-[#A3A392] font-semibold mt-1.5">Số câu đúng: {scoreResult.readingCorrect} / {scoreResult.totalReadingInTest}</p>
              </div>

              <div className="bg-[#5A5A40] text-white p-5 rounded-2xl text-center shadow-sm">
                <div className="text-[10px] uppercase font-bold text-white/70 tracking-wide">Tổng điểm TOEIC</div>
                <div className="text-4xl font-black text-white mt-1">{scoreResult.total} <span className="text-xs text-white/70 font-semibold">/ 990</span></div>
                <p className="text-[11px] text-white/80 font-semibold mt-1.5">Tổng số câu đúng: {scoreResult.correctCount} / {allQuestions.length}</p>
              </div>

            </div>

            <div className="border-t border-[#F5F5F0] pt-6 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="text-left">
                <span className="text-xs font-bold text-[#5A5A40] flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  Bạn có 150 câu hỏi cần rà soát lại giải thích chi tiết ở dưới.
                </span>
                <p className="text-[11px] text-[#7C7C6B] mt-0.5">Tiến trình đã được lưu vào hệ thống lịch sử của trình duyệt cá nhân.</p>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setViewMode('list')}
                  className="px-5 py-2.5 bg-[#F5F5F0] hover:bg-[#EAEAE3] text-[#5A5A40] text-xs font-bold rounded-xl border border-[#E0E0D6] transition-all cursor-pointer active:scale-95"
                >
                  Về danh sách đề
                </button>
                <button 
                  onClick={() => {
                    // Start review on same list
                    setCurrentQuestionIndex(0);
                    setViewMode('exam'); // reuse exam tab for browsing answers & explanations!
                    // Note: user can browse explanations because we will display correct indicators in the review mode now!
                  }}
                  className="px-5 py-2.5 bg-[#5A5A40] hover:bg-[#4A4A35] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  Xem lại và Xem Giải thích chi tiết
                </button>
              </div>
            </div>

          </div>

          {/* DETAILED EXPLANATIONS ROW BY ROW */}
          <div className="text-left space-y-6">
            <h3 className="text-lg font-bold text-[#3D3D33] border-b border-[#E0E0D6] pb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#5A5A40]" />
              <span>Phân tích Đáp án &amp; Giải thích chi tiết từng câu hỏi</span>
            </h3>

            <div className="space-y-4">
              {allQuestions.map((q) => {
                const isCorrect = userAnswers[q.number] === q.correctAnswer;
                const userAns = userAnswers[q.number] || "Chưa làm";

                return (
                  <div key={q.id} className="bg-white p-5 rounded-2xl border border-[#E0E0D6] space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#5A5A40] bg-[#F5F5F0] px-2.5 py-1 rounded-lg">
                          Câu {q.number} (Part {q.part})
                        </span>
                        
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          isCorrect 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {isCorrect ? 'Đúng' : 'Sai'}
                        </span>
                      </div>

                      <div className="text-xs text-[#7C7C6B] font-medium font-mono">
                        Chọn: <strong className="text-[#3D3D33]">{userAns}</strong> | Đáp án đúng: <strong className="text-emerald-700">{q.correctAnswer}</strong>
                      </div>
                    </div>

                    {q.image && (
                      <div className="max-w-[200px] bg-[#F5F5F0] p-1 rounded-lg border border-[#E0E0D6] overflow-hidden">
                        <img src={q.image} alt="Thumbnail explanation" className="w-[180px] h-auto rounded" referrerPolicy="no-referrer" />
                      </div>
                    )}

                    {q.passageText && (
                      <p className="text-xs font-mono bg-[#FBFBFA] border border-[#F2F2EB] p-2.5 rounded text-[#7C7C6B]">
                        {q.passageText.substring(0, 150)}...
                      </p>
                    )}

                    <div className="space-y-1 select-text">
                      <p className="text-sm font-semibold text-[#3D3D33]">{q.questionText || "Nhìn đề bài phần Listening"}</p>
                      <div className="pl-3 border-l-2 border-[#5A5A40]/40 mt-2 space-y-1">
                        <p className="text-xs text-[#7C7C6B] font-semibold">Tóm tắt cách giải:</p>
                        <p className="text-xs text-[#3d3d33] leading-relaxed font-sans font-medium">{q.explanation}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* 4. PRACTICE HISTORY VIEW */}
      {viewMode === 'history' && (
        <div className="space-y-6 animate-fade-in">
          <div className="relative flex items-center gap-3">
            <button 
              onClick={() => setViewMode('list')}
              className="p-2 hover:bg-[#F2F2EB] rounded-lg text-[#7C7C6B] hover:text-[#3D3D33] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 animate-pulse" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-[#3D3D33] tracking-tight">Lịch sử luyện thi TOEIC của bạn</h2>
              <p className="text-xs text-[#7C7C6B]">Toàn bộ kết quả điểm thi được ghi nhận tự động offline an toàn trong thiết bị của bạn.</p>
            </div>
          </div>

          {attemptHistory.length === 0 ? (
            <div className="bg-white py-16 px-6 text-center rounded-2xl border border-[#E0E0D6] max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 bg-[#F5F5F0] rounded-full flex items-center justify-center mx-auto text-[#7C7C6B]">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[#3D3D33]">Chưa có lịch sử làm bài thi thử</h3>
              <p className="text-xs text-[#7C7C6B]">Sau khi bạn hoàn thành ít nhất một đề thi thử và bấm nút "Nộp bài", kết quả điểm thi ước lượng sẽ xuất hiện tại đây.</p>
              <button 
                onClick={() => setViewMode('list')}
                className="px-4 py-2 bg-[#5A5A40] text-xs text-white font-bold rounded-lg cursor-pointer"
              >
                Làm đề thi ngay
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E0E0D6] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F5F5F0] border-b border-[#E0E0D6] text-[10px] font-bold text-[#7C7C6B] uppercase tracking-wider">
                      <th className="py-4 px-6">Ngày làm bài</th>
                      <th className="py-4 px-6">Đề thi</th>
                      <th className="py-4 px-6 text-center">Chế độ</th>
                      <th className="py-4 px-6 text-center">Số câu đúng</th>
                      <th className="py-4 px-6 text-center">Điểm Listening</th>
                      <th className="py-4 px-6 text-center">Điểm Reading</th>
                      <th className="py-4 px-6 text-center bg-[#5A5A40]/5">Tổng điểm quy đổi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5F5F0]">
                    {attemptHistory.map((attempt, idx) => (
                      <tr key={idx} className="hover:bg-[#FBFBFA]/60 text-xs text-[#3D3D33]">
                        <td className="py-4 px-6 text-[#7C7C6B] font-medium font-mono">{attempt.date}</td>
                        <td className="py-4 px-6 font-semibold text-[#5A5A40]">{attempt.testName}</td>
                        <td className="py-4 px-6 text-center capitalize">
                          <span className="px-2 py-0.5 bg-[#EAEAE3] text-[#5A5A40] font-bold rounded-full text-[10px]">
                            {attempt.mode === 'full' ? 'Full Test' : attempt.mode === 'listening' ? 'Nhóm nghe' : 'Nhóm đọc'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center font-bold text-[#3D3D33]">{attempt.correctAnswersCount} / {attempt.totalQuestionsCount}</td>
                        <td className="py-4 px-6 text-center font-mono font-semibold text-[#7C7C6B]">{attempt.scoreListening}</td>
                        <td className="py-4 px-6 text-center font-mono font-semibold text-[#7C7C6B]">{attempt.scoreReading}</td>
                        <td className="py-4 px-6 text-center bg-[#5A5A40]/5 font-extrabold text-[#5A5A40] font-mono text-sm">{attempt.totalScore} / 990</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button 
              onClick={() => {
                if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử điểm thi? Thao tác này không thể thu hồi.")) {
                  localStorage.removeItem('toeic_practice_history');
                  setAttemptHistory([]);
                }
              }}
              className="text-xs text-[#7C7C6B] hover:text-rose-700 transition-colors cursor-pointer font-bold"
            >
              Xóa sạch lịch sử thi
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
