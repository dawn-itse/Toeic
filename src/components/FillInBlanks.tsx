/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Card, Deck } from '../types';
import { getMaskedDisplay, verifyAnswer } from '../data';
import { ArrowLeft, Lightbulb, Check, ChevronRight, HelpCircle, Volume2, RotateCcw } from 'lucide-react';
import { speakEnglish } from '../utils/speech';
import { fireConfettiSmall } from '../utils/confetti';

interface FillInBlanksProps {
  decks: Deck[];
  cards: Card[];
  onSetTab: (tab: string) => void;
  onUpdateCardStatus: (cardId: string, status: 'CẦN ÔN' | 'ĐANG HỌC' | 'ĐÃ THUỘC' | 'MỚI') => void;
  onAnswerCorrect?: (xpGained: number) => void;
  onAnswerWrong?: () => void;
  hearts?: number;
  unlimitedHearts?: boolean;
}

export default function FillInBlanks({
  decks,
  cards,
  onSetTab,
  onUpdateCardStatus,
  onAnswerCorrect,
  onAnswerWrong,
  hearts = 5,
  unlimitedHearts = false
}: FillInBlanksProps) {
  const [activeDeckId, setActiveDeckId] = useState(() => {
    const has327Deck = decks.some(d => d.id === 'deck-vocab327');
    return has327Deck ? 'deck-vocab327' : 'deck-vocab';
  });

  const fillingCards = cards.filter(c => c.deckId === activeDeckId);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [guess, setGuess] = useState('');
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [hintLettersExposed, setHintLettersExposed] = useState<number>(0);
  const [feedback, setFeedback] = useState<'IDLE' | 'CORRECT' | 'WRONG'>('IDLE');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Reset progress on active deck shift
  useEffect(() => {
    setCurrentIndex(0);
    setGuess('');
    setHintLettersExposed(0);
    setFeedback('IDLE');
    setFeedbackMsg('');
  }, [activeDeckId]);

  const currentCard = fillingCards[currentIndex] || fillingCards[0];

  // Reset guessing states when jumping cards
  useEffect(() => {
    setGuess('');
    setHintLettersExposed(0);
    setFeedback('IDLE');
    setFeedbackMsg('');
  }, [currentIndex]);

  const handleHint = () => {
    if (!currentCard) return;
    const word = currentCard.front;
    
    // Increment the number of exposed hint characters
    if (hintLettersExposed < word.length) {
      setHintLettersExposed(prev => prev + 1);
      
      // Let's dynamically fill the guess box with first N letters to guide them!
      const hintSlice = word.substring(0, hintLettersExposed + 1);
      setGuess(hintSlice);
    }
  };

  const handleCheck = () => {
    if (!currentCard) return;

    // Direct check if user has 0 hearts left
    if (hearts === 0 && !unlimitedHearts) {
      setFeedback('WRONG');
      setFeedbackMsg('⚠️ Bạn đã hết Trái tim học tập! Hãy di chuột vào biểu tượng Trái tim ở thanh tiêu đề góc trên bên phải để nạp đầy bằng 50 XP hoặc bật Trái Tim Vô Hạn để bỏ qua giới hạn nhé.');
      return;
    }

    const isCorrect = verifyAnswer(currentCard.front, guess);

    if (isCorrect) {
      setFeedback('CORRECT');
      setFeedbackMsg('Chính xác! Bạn được cộng +10 XP đóng góp vào nhiệm vụ hằng ngày hệt như Duolingo. 🎉');
      
      // 🎉 Hiệu ứng ăn mừng pháo hoa nhẹ nhàng
      fireConfettiSmall();
      
      // Mark card status as 'ĐÃ THUỘC'
      onUpdateCardStatus(currentCard.id, 'ĐÃ THUỘC');

      // Trigger gamified callback
      if (onAnswerCorrect) {
        onAnswerCorrect(10);
      }

      // Auto advance if toggled
      if (autoAdvance) {
        const timer = setTimeout(() => {
          handleNextCard();
        }, 1500);
        return () => clearTimeout(timer);
      }
    } else {
      setFeedback('WRONG');
      
      if (!unlimitedHearts) {
        const nextHearts = Math.max(0, hearts - 1);
        if (nextHearts === 0) {
          setFeedbackMsg('Opps! Sai rồi. Bạn vừa mất Trái Tim cuối cùng! Hãy ấn nạp đầy Trái tim phía trên để tiếp tục thử thách nhé.');
        } else {
          setFeedbackMsg(`Chưa chính xác! Bạn đã mất 1 Trái tim (Còn lại ${nextHearts}/5). Hãy kiểm tra lại nhé!`);
        }
        if (onAnswerWrong) {
          onAnswerWrong();
        }
      } else {
        setFeedbackMsg('Chưa chính xác! Nhưng bạn đang kích hoạt Trái Tim Vô Hạn nên không lo mất mạng nhé. Hãy thử lại nào!');
      }
      
      // Mark card status as 'CẦN ÔN'
      onUpdateCardStatus(currentCard.id, 'CẦN ÔN');
    }
  };

  const handleNextCard = () => {
    if (currentIndex < fillingCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Loop back to start
      setCurrentIndex(0);
    }
  };

  // Stats
  const masteredCount = cards.filter(c => c.deckId === activeDeckId && c.status === 'ĐÃ THUỘC').length;
  const remainingCount = cards.filter(c => c.deckId === activeDeckId && c.status !== 'ĐÃ THUỘC').length;

  return (
    <div id="fill-in-blanks-page" className="animate-fade-in py-4 max-w-[1200px] mx-auto px-6 space-y-6 select-none">
      
      {/* Deck Selector Tabs */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-[#E0E0D6] mb-2">
        {decks.filter(d => cards.some(c => c.deckId === d.id)).map(d => {
          const isActive = d.id === activeDeckId;
          const count = cards.filter(c => c.deckId === d.id).length;
          return (
            <button
              key={d.id}
              onClick={() => setActiveDeckId(d.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl font-sans transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#5A5A40] text-white shadow-sm'
                  : 'bg-white text-[#7C7C6B] border border-[#E0E0D6] hover:bg-[#E8E8E0]/40'
              }`}
            >
              {d.name} ({count} thẻ)
            </button>
          );
        })}
      </div>

      {/* Navigation and Auto-Advance Selector Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSetTab('dashboard')}
            className="p-1.5 rounded-full hover:bg-[#E8E8E0]/60 text-[#7C7C6B] hover:text-[#5A5A40] transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold font-sans text-[#3D3D33]">Điền từ</h2>
        </div>

        {/* Dynamic Advance Toggle Switch */}
        <div className="flex items-center gap-3 select-none">
          <span className="text-xs font-semibold text-[#7C7C6B] font-sans">Tự động chuyển thẻ</span>
          <button
            onClick={() => setAutoAdvance(!autoAdvance)}
            className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-300 relative focus:outline-none cursor-pointer ${
              autoAdvance ? 'bg-[#5A5A40]' : 'bg-[#E0E0D6]'
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                autoAdvance ? 'translate-x-5' : 'translate-x-0'
              }`}
            ></div>
          </button>
        </div>
      </div>

      {currentIndex >= fillingCards.length ? (
        /* Empty review scenario fallback */
        <div className="bg-white p-12 text-center rounded-2xl border border-[#E0E0D6] shadow-sm space-y-4 max-w-xl mx-auto animate-scale-up">
          <h3 className="text-xl font-bold font-sans text-[#3D3D33]">Tất cả cụm từ đều đã hoàn thành!</h3>
          <p className="text-sm font-serif italic text-[#7C7C6B]">
            Chúc mừng bạn đã trả lời đúng hết tất cả thẻ. Hãy đặt lại trạng thái hoặc thêm thẻ mới nhé!
          </p>
          <button
            onClick={() => setCurrentIndex(0)}
            className="bg-[#5A5A40] text-white py-2.5 px-6 font-sans font-semibold rounded-xl hover:bg-[#4A4A35] transition-all cursor-pointer text-sm"
          >
            Chơi lại
          </button>
        </div>
      ) : (
        /* Active Game Canvas Frame */
        <div className="max-w-2xl mx-auto space-y-6">
          
          <div className="bg-white p-8 md:p-10 rounded-2xl border border-[#E0E0D6] shadow-md shadow-[#5A5A40]/3 flex flex-col items-center text-center space-y-8">
            
            {/* Header info */}
            <div>
              <span className="text-[10px] font-bold text-[#7C7C6B] tracking-widest uppercase block font-sans">
                {decks.find(d => d.id === activeDeckId)?.category || 'Cụm từ tiếng Anh phổ biến'}
              </span>
            </div>

            {/* Word Display with Blanks */}
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-mono text-[#5A5A40] font-bold tracking-widest select-none">
                {getMaskedDisplay(currentCard.front)}
              </h1>
              <p className="text-base text-[#7C7C6B] mt-4 font-serif italic leading-relaxed max-w-md mx-auto">
                "{currentCard.back}"
              </p>
            </div>

            {/* Answer Input field */}
            <div className="w-full max-w-md space-y-1">
              <input
                type="text"
                value={guess}
                onChange={(e) => {
                  setGuess(e.target.value);
                  setFeedback('IDLE');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCheck();
                }}
                placeholder="Nhập từ của bạn..."
                className={`w-full px-6 py-4 bg-[#F5F5F0]/60 rounded-xl border focus:outline-none focus:ring-4 font-sans text-lg text-center font-bold transition-all placeholder-[#7C7C6B] ${
                  feedback === 'CORRECT'
                    ? 'border-[#99B080] bg-[#99B080]/10 text-[#4E5F3D] focus:ring-[#99B080]/20'
                    : feedback === 'WRONG'
                    ? 'border-[#F27D7D] bg-[#F27D7D]/10 text-[#9E3D3D] focus:ring-[#F27D7D]/20 animate-shake'
                    : 'border-[#E0E0D6] focus:border-[#5A5A40] focus:ring-[#5A5A40]/10'
                }`}
              />
              {feedbackMsg && (
                <p className={`text-xs font-sans font-medium pt-2 ${
                  feedback === 'CORRECT' ? 'text-[#4E5F3D]' : 'text-[#9E3D3D]'
                }`}>
                  {feedbackMsg}
                </p>
              )}
            </div>

            {/* Hint & Verification controls */}
            <div className="flex gap-4 select-none flex-wrap justify-center">
              <button
                onClick={() => speakEnglish(currentCard.front)}
                className="flex items-center gap-1.5 text-xs text-[#5A5A40] font-sans font-semibold px-4 py-2.5 border border-[#5A5A40] rounded-xl hover:bg-[#E8E8E0]/40 transition-colors cursor-pointer active:scale-95"
                title="Nghe phát âm từ vựng này"
              >
                <Volume2 className="w-4 h-4 text-[#5A5A40]" />
                <span>Nghe từ</span>
              </button>

              <button
                onClick={handleHint}
                className="flex items-center gap-1.5 text-xs text-[#5A5A40] font-sans font-semibold px-4 py-2.5 border border-[#5A5A40] rounded-xl hover:bg-[#E8E8E0]/40 transition-colors cursor-pointer active:scale-95"
              >
                <Lightbulb className="w-4 h-4" />
                <span>Gợi ý</span>
              </button>

              <button
                onClick={handleCheck}
                className="bg-[#5A5A40] text-white font-sans font-semibold px-6 py-2.5 rounded-xl hover:bg-[#4A4A35] transition-all cursor-pointer active:scale-95 text-xs"
              >
                Kiểm tra
              </button>

              {/* Nút Reset nhỏ gọn, tinh tế */}
              <button
                onClick={() => {
                  setGuess('');
                  setHintLettersExposed(0);
                  setFeedback('IDLE');
                  setFeedbackMsg('');
                }}
                title="Xóa câu trả lời và thử lại từ đầu"
                className="flex items-center gap-1 text-xs text-[#A3A392] font-sans font-medium px-3 py-2.5 border border-[#E0E0D6] rounded-xl hover:bg-[#F5F5F0] hover:text-[#7C7C6B] hover:border-[#C8C8BE] transition-all cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              {feedback === 'CORRECT' && !autoAdvance && (
                <button
                  onClick={handleNextCard}
                  className="bg-[#5A5A40] text-white font-sans font-semibold px-4 py-2.5 rounded-xl hover:bg-[#4A4A35] transition-all cursor-pointer flex items-center gap-1 text-xs animate-pulse"
                >
                  <span>Tiếp tục</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>

          {/* Under progress indicators info mapping */}
          <div className="pt-4 flex justify-center gap-16 select-none text-center">
            <div>
              <p className="text-[11px] font-bold text-[#7C7C6B] tracking-wider uppercase font-sans">Đã thuộc</p>
              <p className="text-xl font-bold text-[#5A5A40] font-sans mt-0.5">{masteredCount}</p>
            </div>
            <div className="w-px bg-[#E0E0D6]"></div>
            <div>
              <p className="text-[11px] font-bold text-[#7C7C6B] tracking-wider uppercase font-sans">Còn lại</p>
              <p className="text-xl font-bold text-[#3D3D33] font-sans mt-0.5">{remainingCount}</p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
