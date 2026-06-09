/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Volume2, Sparkles, BookOpen, Check } from 'lucide-react';
import { speakEnglish, speakPhonemeThenWord } from '../utils/speech';

interface IpaSound {
  symbol: string;
  type: 'monophthong' | 'diphthong' | 'consonant-voiced' | 'consonant-voiceless';
  word: string;
  wordMeaning: string;
  mouthTip: string;
  exampleSound: string; // fallback clean approximation phonetic pronunciation
}

const IPA_DATA: IpaSound[] = [
  // --- MONOPHTHONGS (Nguyên âm đơn) ---
  {
    symbol: 'iː',
    type: 'monophthong',
    word: 'see',
    wordMeaning: 'nhìn thấy',
    mouthTip: 'Môi mở rộng sang hai bên như nở một nụ cười, lưỡi nâng cao chạm nhẹ răng hàm bên.',
    exampleSound: 'ee'
  },
  {
    symbol: 'ɪ',
    type: 'monophthong',
    word: 'ship',
    wordMeaning: 'tàu thủy',
    mouthTip: 'Môi hơi mở, phát âm ngắn dứt khoát hơn âm /iː/, dẹt nhẹ cơ miệng.',
    exampleSound: 'ih'
  },
  {
    symbol: 'ʊ',
    type: 'monophthong',
    word: 'good',
    wordMeaning: 'tốt',
    mouthTip: 'Môi hơi tròn hướng ra ngoài, lưỡi thu về phía sau, thời gian phát âm rất ngắn dứt khoát.',
    exampleSound: 'uh'
  },
  {
    symbol: 'uː',
    type: 'monophthong',
    word: 'shoot',
    wordMeaning: 'bắn',
    mouthTip: 'Môi tròn và nhô mạnh ra phía trước (chu môi), lưỡi lùi sâu, âm thanh phát ra ngân dài hơn.',
    exampleSound: 'oo'
  },
  {
    symbol: 'e',
    type: 'monophthong',
    word: 'bed',
    wordMeaning: 'cái giường',
    mouthTip: 'Môi mở rộng vừa phải ở chiều dọc, lưỡi đặt thấp hơn âm /ɪ/, phát âm tự nhiên.',
    exampleSound: 'eh'
  },
  {
    symbol: 'ə',
    type: 'monophthong',
    word: 'teacher',
    wordMeaning: 'giáo viên',
    mouthTip: 'Âm ơ ngắn (schwa). Thả lỏng hoàn toàn tất cả các cơ miệng, phát âm nhẹ nhàng, cực ngắn.',
    exampleSound: 'er'
  },
  {
    symbol: 'ɜː',
    type: 'monophthong',
    word: 'girl',
    wordMeaning: 'cô gái',
    mouthTip: 'Âm ơ dài. Giữ khẩu hình như âm /ə/ nhưng nâng lưỡi hơi cong nhẹ về phía vòm họng và kéo dài hơi.',
    exampleSound: 'hur'
  },
  {
    symbol: 'ɔː',
    type: 'monophthong',
    word: 'door',
    wordMeaning: 'cánh cửa',
    mouthTip: 'Môi tròn căng và nhô ra trước, hàm dưới hạ thấp hơn mười phần so với âm u dài, kéo dài hơi.',
    exampleSound: 'or'
  },
  {
    symbol: 'æ',
    type: 'monophthong',
    word: 'cat',
    wordMeaning: 'con mèo',
    mouthTip: 'Âm a bẹt. Mở rộng miệng cả chiều ngang lẫn chiều dọc (hạ hàm thấp), đầu lưỡi chạm vào răng cửa dưới.',
    exampleSound: 'ah'
  },
  {
    symbol: 'ʌ',
    type: 'monophthong',
    word: 'cup',
    wordMeaning: 'cái chén',
    mouthTip: 'Âm á. Miệng mở hẹp tự nhiên, lưỡi nâng nhẹ phía sau, phát âm dứt khoát ngắn gọn.',
    exampleSound: 'up'
  },
  {
    symbol: 'ɑː',
    type: 'monophthong',
    word: 'father',
    wordMeaning: 'người cha',
    mouthTip: 'Mở rộng miệng tự nhiên theo chiều dọc như đang bác sĩ khám họng, lưỡi đặt rất thấp, kéo dài hơi sâu.',
    exampleSound: 'aa'
  },
  {
    symbol: 'ɒ',
    type: 'monophthong',
    word: 'hot',
    wordMeaning: 'nóng',
    mouthTip: 'Âm o ngắn. Tròn môi nhẹ, hạ hẳn cơ hàm dưới xuống sâu hơn một chút, âm phát gọn nhanh.',
    exampleSound: 'ott'
  },

  // --- DIPHTHONGS (Nguyên âm đôi) ---
  {
    symbol: 'ɪə',
    type: 'diphthong',
    word: 'ear',
    wordMeaning: 'cái tai',
    mouthTip: 'Bắt đầu ở vị trí của âm /ɪ/ rồi chuyển dần sang âm /ə/ một cách mượt mà liên tục.',
    exampleSound: 'ear'
  },
  {
    symbol: 'eɪ',
    type: 'diphthong',
    word: 'train',
    wordMeaning: 'tàu hỏa',
    mouthTip: 'Bắt đầu phát âm /e/ rồi khép dần miệng tròn dẹt chuyển sang âm /ɪ/ gộp lại thành âm "ây".',
    exampleSound: 'ay'
  },
  {
    symbol: 'ʊə',
    type: 'diphthong',
    word: 'tour',
    wordMeaning: 'chuyến du lịch',
    mouthTip: 'Bắt đầu phát âm khẩu hình âm /ʊ/ rồi lơi dần cơ miệng phát âm sang âm /ə/.',
    exampleSound: 'u-er'
  },
  {
    symbol: 'ɔɪ',
    type: 'diphthong',
    word: 'boy',
    wordMeaning: 'con trai',
    mouthTip: 'Bắt đầu phát âm /ɔː/ tròn căng môi rồi dẹt miệng mượt mà trượt dần sang âm /ɪ/.',
    exampleSound: 'oy'
  },
  {
    symbol: 'əʊ',
    type: 'diphthong',
    word: 'coat',
    wordMeaning: 'áo khoác',
    mouthTip: 'Phát âm /ə/ thả lỏng hẹp rồi thu nhỏ môi, nhô ra chuyển dần sang /ʊ/. Gần giống âm "âu".',
    exampleSound: 'oh'
  },
  {
    symbol: 'eə',
    type: 'diphthong',
    word: 'hair',
    wordMeaning: 'tóc',
    mouthTip: 'Bắt đầu phát âm khẩu hình âm /e/ mở dọc rồi thả lỏng cơ miệng lùi về âm /ə/.',
    exampleSound: 'air'
  },
  {
    symbol: 'aɪ',
    type: 'diphthong',
    word: 'fine',
    wordMeaning: 'tốt, khỏe',
    mouthTip: 'Mở rộng miệng phát âm /ɑː/ sâu rồi khép dần hàm dẹt miệng chuyển sang /ɪ/ thành âm "ai".',
    exampleSound: 'aye'
  },
  {
    symbol: 'aʊ',
    type: 'diphthong',
    word: 'house',
    wordMeaning: 'ngôi nhà',
    mouthTip: 'Mở rộng miệng phát âm /ɑː/ rồi khép thu tròn kín môi chuyển sành âm /ʊ/ tạo âm "au/ao".',
    exampleSound: 'ow'
  },

  // --- CONSONANTS (Phụ âm) ---
  {
    symbol: 'p',
    type: 'consonant-voiceless',
    word: 'pen',
    wordMeaning: 'bút viết',
    mouthTip: 'Mím chặt hai môi lại chặn luồng khí, sau đó bật mạnh hơi ra. Dây thanh không rung (Vô thanh).',
    exampleSound: 'p'
  },
  {
    symbol: 'b',
    type: 'consonant-voiced',
    word: 'bed',
    wordMeaning: 'cái giường',
    mouthTip: 'Khẩu hình giống âm /p/ bặm môi chặn khí nhưng dùng lực thanh quản rung mạnh cổ họng (Hữu thanh).',
    exampleSound: 'b'
  },
  {
    symbol: 't',
    type: 'consonant-voiceless',
    word: 'tea',
    wordMeaning: 'trà',
    mouthTip: 'Đặt đầu lưỡi vào chân răng cửa trên, bật mạnh hơi xuống. Đầu lưỡi hạ tự do. Không rung cổ.',
    exampleSound: 't'
  },
  {
    symbol: 'd',
    type: 'consonant-voiced',
    word: 'dog',
    wordMeaning: 'con chó',
    mouthTip: 'Khẩu hình đặt răng và lưỡi giống âm /t/ nhưng bật từ sâu thanh quản tạo âm dập rung cổ họng.',
    exampleSound: 'd'
  },
  {
    symbol: 'tʃ',
    type: 'consonant-voiceless',
    word: 'cheese',
    wordMeaning: 'phô mai',
    mouthTip: 'Chu nhẹ môi tròn, đưa đầu lưỡi chặn sau răng hàm trên rồi bật hơi mạnh cọ qua vòm họng.',
    exampleSound: 'ch'
  },
  {
    symbol: 'dʒ',
    type: 'consonant-voiced',
    word: 'june',
    wordMeaning: 'tháng sáu',
    mouthTip: 'Khẩu hình tròn chu tương tự âm /tʃ/ nhưng cần bật âm hữu thanh làm rung to thanh quản ở cổ.',
    exampleSound: 'j'
  },
  {
    symbol: 'k',
    type: 'consonant-voiceless',
    word: 'car',
    wordMeaning: 'xe hơi',
    mouthTip: 'Nâng cuống lưỡi chạm nhẹ phần vòm phế quản mềm để chặn luồng hơi, bật dứt khoát khạc hơi.',
    exampleSound: 'k'
  },
  {
    symbol: 'g',
    type: 'consonant-voiced',
    word: 'go',
    wordMeaning: 'đi',
    mouthTip: 'Nâng cuống lưỡi chặn khí giống âm /k/ nhưng dùng lực đẩy phát âm sâu rung rung họng.',
    exampleSound: 'g'
  },
  {
    symbol: 'f',
    type: 'consonant-voiceless',
    word: 'fly',
    wordMeaning: 'bay',
    mouthTip: 'Đặt khít răng hàm bên trên chạm hờ vào làn môi dưới, đẩy nhẹ hơi qua khe răng của bạn.',
    exampleSound: 'f'
  },
  {
    symbol: 'v',
    type: 'consonant-voiced',
    word: 'video',
    wordMeaning: 'băng hình',
    mouthTip: 'Vị trí răng hàm trên chạm môi giống hệt âm /f/ nhưng cần bật giọng làm rung dây thanh quản.',
    exampleSound: 'v'
  },
  {
    symbol: 'θ',
    type: 'consonant-voiceless',
    word: 'thin',
    wordMeaning: 'mỏng',
    mouthTip: 'Đặt nhẹ đầu lưỡi ở giữa hai hàm răng cửa, thổi mạnh luồng hơi kẹp giữa lưỡi răng ra ngoài.',
    exampleSound: 'th'
  },
  {
    symbol: 'ð',
    type: 'consonant-voiced',
    word: 'this',
    wordMeaning: 'cái này',
    mouthTip: 'Đặt kẹp đầu lưỡi giữa răng giống âm /θ/ nhưng phát âm giọng từ sâu trong xương cổ họng rung mạnh.',
    exampleSound: 'th-voiced'
  },
  {
    symbol: 's',
    type: 'consonant-voiceless',
    word: 'see',
    wordMeaning: 'nhìn thấy',
    mouthTip: 'Hai răng khép hờ hẹp, lưỡi đặt sau răng, đẩy luồng hơi rít nhẹ luồn đều qua khe răng.',
    exampleSound: 's'
  },
  {
    symbol: 'z',
    type: 'consonant-voiced',
    word: 'zoo',
    wordMeaning: 'sở thú',
    mouthTip: 'Khẩu hình răng khép rít luồng hơi giống âm /s/ nhưng kéo dài cường độ rung thanh quản xè xè.',
    exampleSound: 'z'
  },
  {
    symbol: 'ʃ',
    type: 'consonant-voiceless',
    word: 'shall',
    wordMeaning: 'sẽ làm',
    mouthTip: 'Môi cong đều ra ngoài (chu miệng), lưỡi thụt nhẹ về phía sau, thổi hơi sột sột rất mạnh qua kẽ môi.',
    exampleSound: 'sh'
  },
  {
    symbol: 'ʒ',
    type: 'consonant-voiced',
    word: 'television',
    wordMeaning: 'vô tuyến',
    mouthTip: 'Chu khẩu hình sột sột hệt âm /ʃ/ nhưng rung dây thanh giống âm /z/ khi đẩy hơi ra.',
    exampleSound: 'zh'
  }
];

interface IpaChartProps {
  onEarnXpAndRecord: (amount: number, category: 'REVIEW' | 'SPELL' | 'IPA') => void;
  xpState: number;
}

export default function IpaChart({ onEarnXpAndRecord, xpState }: IpaChartProps) {
  const [selectedSound, setSelectedSound] = useState<IpaSound>(IPA_DATA[0]);
  const [activeTab, setActiveTab] = useState<'vowels' | 'consonants'>('vowels');
  const [soundCheckedCount, setSoundCheckedCount] = useState<string[]>([]);

  // Split data
  const monophthongs = IPA_DATA.filter((s) => s.type === 'monophthong');
  const diphthongs = IPA_DATA.filter((s) => s.type === 'diphthong');
  const voicedConsonants = IPA_DATA.filter((s) => s.type === 'consonant-voiced');
  const voicelessConsonants = IPA_DATA.filter((s) => s.type === 'consonant-voiceless');

  const handlePlaySound = (sound: IpaSound) => {
    setSelectedSound(sound);
    
    // Pronounce the phoneme first, then the word!
    speakPhonemeThenWord(sound.exampleSound || sound.symbol, sound.word);

    // Dynamic gamification: if this is first time listening in session, award 5 XP to user!
    if (!soundCheckedCount.includes(sound.symbol)) {
      const nextChecked = [...soundCheckedCount, sound.symbol];
      setSoundCheckedCount(nextChecked);
      
      // Award 5 XP for exploring pronunciation
      onEarnXpAndRecord(10, 'IPA');
    }
  };

  return (
    <div id="ipa-page" className="max-w-[1200px] mx-auto px-6 space-y-8 animate-fade-in py-4">
      
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E0E0D6] pb-6">
        <div>
          <span className="text-[10px] font-bold text-[#5A5A40] tracking-widest uppercase block font-sans mb-1">Cẩm nang phát âm</span>
          <h2 className="text-3xl font-bold font-sans text-[#3D3D33] flex items-center gap-2">
            Bảng Ký Tự Ngữ Âm Quốc Tế (IPA)
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
          </h2>
          <p className="text-sm font-serif italic text-[#7C7C6B] mt-2">
            Học cách đặt khẩu hình miệng, lưỡi và lắng nghe phát âm từng âm tiết căn bản chuẩn xác nhất.
          </p>
        </div>

        {/* Action badge */}
        <div className="flex items-center gap-3 bg-[#E8E8E0] py-2 px-4 rounded-xl border border-[#D0D0C2]">
          <BookOpen className="w-5 h-5 text-[#5A5A40]" />
          <div>
            <p className="text-[10px] font-bold text-[#7C7C6B] uppercase font-sans">Đã thử nghiệm âm</p>
            <p className="text-sm font-bold text-[#5A5A40] font-sans">
              {soundCheckedCount.length} / {IPA_DATA.length} âm (Thưởng +10 XP/âm)
            </p>
          </div>
        </div>
      </div>

      {/* Guide Card for Beginners */}
      <div className="bg-gradient-to-r from-amber-50/50 to-orange-50/50 p-6 rounded-2xl border border-amber-200/50 text-sm leading-relaxed text-[#5A5A40] grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-bold text-[#3D3D33] font-sans flex items-center gap-1.5 mb-2">
            💡 Học viên mới bắt đầu cần lưu ý:
          </h4>
          <p className="font-serif italic text-justify text-[#7C7C6B]">
            Mỗi từ trong Tiếng Anh được cấu tạo từ các âm tiết IPA này, không phải từ các mặt chữ cái alphabet ghép lại thông lờ. Việc nắm rõ vị trí đặt lưỡi, khẩu hình hẹp hay rộng, dây thanh mạc quản có rung hay không quyết định hoàn toàn nét tự nhiên của ngữ điệu của bạn!
          </p>
        </div>
        <div className="bg-white/80 p-4 rounded-xl border border-amber-200/30 flex flex-col justify-center">
          <ul className="space-y-1.5 text-xs text-[#7C7C6B] list-disc pl-5">
            <li><strong>Nguyên âm đơn</strong>: Tiếng phát ra từ họng tròn mộc. Ký hiệu dấu hai chấm <strong className="text-[#5A5A40]">(:)</strong> chỉ các âm kéo dài hơi.</li>
            <li><strong>Nguyên âm đôi</strong>: Trượt giọng mượt từ nguyên âm này sang nguyên âm kia liên tiếp.</li>
            <li><strong>Phụ âm vô thanh</strong>: Chỉ bật luồng hơi ra từ miệng răng (Không rung cổ họng).</li>
            <li><strong>Phụ âm hữu thanh</strong>: Rung mạnh họng sâu ở cổ để phát âm tương ứng.</li>
          </ul>
        </div>
      </div>

      {/* Interactive Layout: Grid panel Left + Control focus Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Tabs & Pronunciation Grid */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Audio Tab selector buttons */}
          <div className="flex gap-2 bg-[#E8E8E0]/60 p-1 rounded-2xl border border-[#E0E0D6] max-w-sm">
            <button
              onClick={() => setActiveTab('vowels')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
                activeTab === 'vowels'
                  ? 'bg-white text-[#5A5A40] shadow-sm'
                  : 'text-[#7C7C6B] hover:text-[#5A5A40]'
              }`}
            >
              Vowels (Nguyên âm)
            </button>
            <button
              onClick={() => setActiveTab('consonants')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
                activeTab === 'consonants'
                  ? 'bg-white text-[#5A5A40] shadow-sm'
                  : 'text-[#7C7C6B] hover:text-[#5A5A40]'
              }`}
            >
              Consonants (Phụ âm)
            </button>
          </div>

          {/* Grid Panel Render */}
          {activeTab === 'vowels' ? (
            <div className="space-y-6">
              
              {/* Short / Long Vowels Monophthongs section */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-[#5A5A40] uppercase tracking-wider font-sans">
                  Monophthongs - Nguyên âm đơn
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {monophthongs.map((sound) => {
                    const isSelected = selectedSound.symbol === sound.symbol;
                    const explored = soundCheckedCount.includes(sound.symbol);
                    return (
                      <button
                        key={sound.symbol}
                        onClick={() => handlePlaySound(sound)}
                        className={`p-4 rounded-xl border text-center transition-all cursor-pointer flex flex-col justify-center items-center gap-1.5 relative ${
                          isSelected
                            ? 'bg-[#5A5A40] text-white border-[#5A5A40] shadow-md scale-102'
                            : 'bg-white hover:bg-[#E8E8E0]/40 border-[#E0E0D6] text-[#3D3D33]'
                        }`}
                      >
                        {explored && (
                          <span className="absolute top-1 right-1 text-[8px] bg-green-500 text-white rounded-full p-0.5" title="Đã tập phát âm">
                            <Check className="w-2 h-2" />
                          </span>
                        )}
                        <span className="text-2xl font-bold font-sans tracking-wide">/{sound.symbol}/</span>
                        <span className={`text-[10px] font-mono ${isSelected ? 'text-white/80' : 'text-[#7C7C6B]'}`}>
                          {sound.word}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Diphthongs section */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-[#5A5A40] uppercase tracking-wider font-sans">
                  Diphthongs - Nguyên âm đôi
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {diphthongs.map((sound) => {
                    const isSelected = selectedSound.symbol === sound.symbol;
                    const explored = soundCheckedCount.includes(sound.symbol);
                    return (
                      <button
                        key={sound.symbol}
                        onClick={() => handlePlaySound(sound)}
                        className={`p-4 rounded-xl border text-center transition-all cursor-pointer flex flex-col justify-center items-center gap-1.5 relative ${
                          isSelected
                            ? 'bg-[#5A5A40] text-white border-[#5A5A40] shadow-md scale-102'
                            : 'bg-white hover:bg-[#E8E8E0]/40 border-[#E0E0D6] text-[#3D3D33]'
                        }`}
                      >
                        {explored && (
                          <span className="absolute top-1 right-1 text-[8px] bg-green-500 text-white rounded-full p-0.5" title="Đã tập phát âm">
                            <Check className="w-2 h-2" />
                          </span>
                        )}
                        <span className="text-2xl font-bold font-sans tracking-wide">/{sound.symbol}/</span>
                        <span className={`text-[10px] font-mono ${isSelected ? 'text-white/80' : 'text-[#7C7C6B]'}`}>
                          {sound.word}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Voiceless Consonants */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-[#B06060] uppercase tracking-wider font-sans">
                  Voiceless - Phụ âm vô thanh (Không rung cổ)
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {voicelessConsonants.map((sound) => {
                    const isSelected = selectedSound.symbol === sound.symbol;
                    const explored = soundCheckedCount.includes(sound.symbol);
                    return (
                      <button
                        key={sound.symbol}
                        onClick={() => handlePlaySound(sound)}
                        className={`p-4 rounded-xl border text-center transition-all cursor-pointer flex flex-col justify-center items-center gap-1.5 relative ${
                          isSelected
                            ? 'bg-[#B06060] text-white border-[#B06060] shadow-md scale-102'
                            : 'bg-white hover:bg-[#E8E8E0]/40 border-[#E0E0D6] text-[#3D3D33]'
                        }`}
                      >
                        {explored && (
                          <span className="absolute top-1 right-1 text-[8px] bg-green-500 text-white rounded-full p-0.5" title="Đã tập phát âm">
                            <Check className="w-2 h-2" />
                          </span>
                        )}
                        <span className="text-2xl font-bold font-sans tracking-wide">/{sound.symbol}/</span>
                        <span className={`text-[10px] font-mono ${isSelected ? 'text-white/80' : 'text-[#7C7C6B]'}`}>
                          {sound.word}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Voiced Consonants */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-[#5A5A40] uppercase tracking-wider font-sans">
                  Voiced - Phụ âm hữu thanh (Rung to họng cổ)
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {voicedConsonants.map((sound) => {
                    const isSelected = selectedSound.symbol === sound.symbol;
                    const explored = soundCheckedCount.includes(sound.symbol);
                    return (
                      <button
                        key={sound.symbol}
                        onClick={() => handlePlaySound(sound)}
                        className={`p-4 rounded-xl border text-center transition-all cursor-pointer flex flex-col justify-center items-center gap-1.5 relative ${
                          isSelected
                            ? 'bg-[#5A5A40] text-white border-[#5A5A40] shadow-md scale-102'
                            : 'bg-white hover:bg-[#E8E8E0]/40 border-[#E0E0D6] text-[#3D3D33]'
                        }`}
                      >
                        {explored && (
                          <span className="absolute top-1 right-1 text-[8px] bg-green-500 text-white rounded-full p-0.5" title="Đã tập phát âm">
                            <Check className="w-2 h-2" />
                          </span>
                        )}
                        <span className="text-2xl font-bold font-sans tracking-wide">/{sound.symbol}/</span>
                        <span className={`text-[10px] font-mono ${isSelected ? 'text-white/80' : 'text-[#7C7C6B]'}`}>
                          {sound.word}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Right column: Dynamic Pronunciation Assistant */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E0E0D6] shadow-sm space-y-6">
            
            {/* Assistant badge description */}
            <div className="text-center pb-4 border-b border-[#E8E2D6] space-y-1">
              <span className="text-[10px] font-bold text-[#5A5A40] bg-[#F5F5F0] py-1 px-3 rounded-md uppercase font-sans">
                Gia sư ngữ âm thông minh
              </span>
              <h3 className="text-2xl font-bold font-sans text-[#3D3D33] pt-2">
                /{selectedSound.symbol}/
              </h3>
              <p className="text-xs uppercase tracking-wider font-sans text-[#7C7C6B] font-semibold">
                {selectedSound.type.includes('monophthong')
                  ? 'Nguyên âm đơn'
                  : selectedSound.type.includes('diphthong')
                  ? 'Nguyên âm đôi'
                  : selectedSound.type.includes('voiceless')
                  ? 'Phụ âm vô thanh (Không rung)'
                  : 'Phụ âm hữu thanh (Có rung)'}
              </p>
            </div>

            {/* Listen Action container */}
            <div className="bg-[#F5F5F0] p-6 rounded-2xl border border-[#E0E0D6] flex flex-col items-center justify-center text-center space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#7C7C6B] font-sans">Mẫu câu minh họa</p>
              
              <div>
                <span className="text-2xl font-bold font-sans text-[#3D3D33] block tracking-wide font-mono">
                  "{selectedSound.word}"
                </span>
                <span className="text-xs text-[#7C7C6B] font-serif italic block mt-1">
                  ({selectedSound.wordMeaning})
                </span>
              </div>

              <button
                onClick={() => handlePlaySound(selectedSound)}
                className="bg-[#5A5A40] text-white py-3 px-6 rounded-xl hover:bg-[#4A4A35] transition-all flex items-center justify-center gap-2 text-xs font-sans font-semibold cursor-pointer shadow-md shadow-[#5A5A40]/10 active:scale-95"
              >
                <Volume2 className="w-5 h-5 text-white animate-bounce" />
                <span>Nghe phát âm chuẩn</span>
              </button>
            </div>

            {/* Beginner's mouth placement assistant */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#3D3D33] uppercase tracking-wider font-sans">
                👅 Hướng dẫn đặt khẩu hình (Mẹo phát âm):
              </h4>
              <p className="text-xs leading-relaxed text-[#7C7C6B] font-serif italic text-justify bg-[#F9F9F6] p-4 rounded-xl border border-dashed border-[#E0E0D6]">
                {selectedSound.mouthTip}
              </p>
            </div>

            {/* Interaction hint */}
            <p className="text-[10px] text-justify leading-relaxed text-[#A3A392] font-sans">
              *Ấn chọn các âm tiết khác từ lưới bảng để khám phá cách đọc, sơ đồ môi răng và tích lũy XP tăng cấp độ Duolingo nhé!
            </p>

          </div>
        </div>

      </div>

    </div>
  );
}
