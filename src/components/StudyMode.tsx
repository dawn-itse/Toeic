/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Card, Deck, CardStatus } from '../types';
import { 
  RotateCcw, 
  HelpCircle, 
  Check, 
  Play, 
  Smile, 
  ShieldAlert, 
  Brain, 
  Activity, 
  TrendingUp, 
  Info,
  Timer,
  Volume2
} from 'lucide-react';
import { speakEnglish } from '../utils/speech';

interface StudyModeProps {
  decks: Deck[];
  cards: Card[];
  selectedDeckId: string;
  onSetTab: (tab: string) => void;
  onRateCard: (cardId: string, rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY') => void;
}

export default function StudyMode({
  decks,
  cards,
  selectedDeckId,
  onSetTab,
  onRateCard
}: StudyModeProps) {
  const selectedDeck = decks.find(d => d.id === selectedDeckId) || decks[0];
  
  // Filter cards for the study session (we can review any cards but let's prioritize CẦN ÔN, ĐANG HỌC, and MỚI)
  const sessionCards = cards.filter(c => c.deckId === selectedDeck.id && c.status !== 'ĐÃ THUỘC');
  // Fallback: If no cards are pending review, load all cards from the deck so they can play anyway!
  const reviewPool = sessionCards.length > 0 ? sessionCards : cards.filter(c => c.deckId === selectedDeck.id);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0); // in seconds
  const [showStatsFloating, setShowStatsFloating] = useState(true);

  // Focus timer logic
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleRate = (rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY') => {
    if (reviewPool.length === 0) return;
    const currentCard = reviewPool[currentIndex];
    
    // Call parent handler
    onRateCard(currentCard.id, rating);

    // Reset card state and advance index
    setIsFlipped(false);
    if (currentIndex < reviewPool.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Trigger completed screen by advancing index past pool bounds
      setCurrentIndex(reviewPool.length);
    }
  };

  const handleRestartSession = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const currentCard = reviewPool[currentIndex];
  const isFinished = reviewPool.length === 0 || currentIndex >= reviewPool.length;

  const progressPercent = reviewPool.length > 0
    ? Math.min(100, Math.round((currentIndex / reviewPool.length) * 100))
    : 100;

  // Stats calculate for float box
  const currentNeedReviewNum = cards.filter(c => c.deckId === selectedDeck.id && (c.status === 'CẦN ÔN' || c.status === 'ĐANG HỌC')).length;
  const currentNewNum = cards.filter(c => c.deckId === selectedDeck.id && c.status === 'MỚI').length;

  return (
    <div id="study-mode-page" className="animate-fade-in py-4 max-w-[1200px] mx-auto px-6 relative select-none">
      
      {isFinished ? (
        /* Celebration Completed Screen */
        <div className="max-w-xl mx-auto py-12 text-center space-y-8 animate-scale-up">
          <div className="w-18 h-18 bg-[#E8E8E0] text-[#5A5A40] rounded-full flex items-center justify-center mx-auto shadow-md border border-[#E0E0D6]">
            <Check className="w-9 h-9" />
          </div>
          
          <div className="space-y-3">
            <h2 className="text-3xl font-bold font-sans text-[#3D3D33]">Hoàn thành chương trình!</h2>
            <p className="text-sm font-serif italic text-[#7C7C6B] max-w-sm mx-auto leading-relaxed">
              Tuyệt vời, Julian! Bạn đã hoàn thành toàn bộ thẻ ôn tập ngày hôm nay trong bộ <span className="font-bold text-[#5A5A40]">"{selectedDeck.name}"</span>.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#E0E0D6] p-6 flex justify-around shadow-sm max-w-md mx-auto select-none">
            <div className="text-center">
              <span className="text-[10px] font-bold text-[#7C7C6B] uppercase tracking-wider block font-sans">Thời gian ôn</span>
              <span className="text-xl font-bold text-[#3D3D33] font-sans mt-1 block">{formatTimer(sessionDuration)}</span>
            </div>
            <div className="w-px bg-[#E0E0D6]"></div>
            <div className="text-center">
              <span className="text-[10px] font-bold text-[#7C7C6B] uppercase tracking-wider block font-sans">Chuỗi ngày</span>
              <span className="text-xl font-bold text-[#F27D7D] font-sans mt-1 block">14 Ngày 🔥</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 max-w-sm mx-auto">
            <button
              onClick={handleRestartSession}
              className="flex-1 bg-[#5A5A40] text-white py-3 px-4 font-sans font-semibold rounded-xl hover:bg-[#4A4A35] transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Học lại từ đầu</span>
            </button>
            <button
              onClick={() => onSetTab('dashboard')}
              className="flex-1 bg-[#E8E8E0] text-[#5A5A40] hover:bg-[#E0E0D6]/60 py-3 px-4 font-sans font-semibold rounded-xl transition-all cursor-pointer text-sm"
            >
              Về bảng khiển
            </button>
          </div>
        </div>
      ) : (
        /* Active review flashcard session */
        <div className="max-w-2xl mx-auto py-4 space-y-6">
          
          {/* Header Progress Counter */}
          <div className="space-y-2 text-center">
            <div className="flex justify-between items-end">
              <h2 className="text-lg font-bold font-sans text-[#3D3D33] truncate max-w-[70%]">{selectedDeck.name}</h2>
              <span className="text-xs font-semibold text-[#7C7C6B] font-sans">
                {currentIndex + 1} / {reviewPool.length} Thẻ
              </span>
            </div>
            
            <div className="w-full bg-[#E0E0D6]/60 h-1.5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#5A5A40] rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Tactile Stacked Flashcard Frame */}
          <div className="relative w-full aspect-[16/10] select-none">
            {/* Front Card (Interactive Player Card) */}
            <div
              id="interactive-study-card"
              onClick={handleFlip}
              className="absolute inset-0 bg-white rounded-3xl border-2 border-[#E8E2D6] hover:border-[#5A5A40]/40 shadow-[0_32px_64px_-16px_rgba(90,90,64,0.12)] p-8 flex flex-col justify-between cursor-pointer group active:scale-[0.99] transition-all duration-300 overflow-hidden z-10"
            >
              {/* Brain/Psychology Aesthetic Silhouette on Back */}
              <div className="absolute right-4 top-4 opacity-[0.03] select-none pointer-events-none transition-all group-hover:scale-105">
                <Brain className="w-36 h-36" />
              </div>

              {/* Inner Content Card (Dynamic Term vs Definition toggle) */}
              <div className="text-center my-auto px-4">
                <span className="text-[10px] font-bold text-[#7C7C6B] tracking-widest uppercase block font-sans mb-3 opacity-60">
                  {isFlipped ? 'ĐỊNH NGHĨA / NGHĨA' : 'TỪ / THUẬT NGỮ'}
                </span>

                {/* Flipped representation changes formatting */}
                {!isFlipped ? (
                  <div className="flex flex-col items-center justify-center gap-3">
                    <h3 className="text-3xl font-bold font-sans text-[#5A5A40] leading-normal tracking-wide">
                      {currentCard.front}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speakEnglish(currentCard.front);
                      }}
                      className="p-2 rounded-full bg-[#E8E8E0] text-[#5A5A40] hover:bg-[#5A5A40] hover:text-white transition-all cursor-pointer shadow-sm active:scale-90"
                      title="Phát âm từ này (Nhấn vào loa)"
                    >
                      <Volume2 className="w-5 h-5 animate-pulse" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 animate-fade-in px-2">
                    <div className="flex items-center justify-center gap-3">
                      <h3 className="text-2xl font-bold font-sans text-[#5A5A40]">
                        {currentCard.front}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          speakEnglish(currentCard.front);
                        }}
                        className="p-1.5 rounded-full bg-[#E8E8E0]/60 text-[#5A5A40] hover:bg-[#5A5A40] hover:text-white transition-all cursor-pointer shadow-sm active:scale-90"
                        title="Phát âm từ này (Nhấn vào loa)"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="h-px bg-[#E8E2D6] w-16 mx-auto"></div>
                    <p className="text-base text-[#3D3D33] font-serif leading-relaxed italic max-w-md mx-auto whitespace-pre-line">
                      {currentCard.back}
                    </p>
                    {currentCard.example && (
                      <p className="text-xs text-[#7C7C6B] italic font-serif leading-relaxed font-semibold">
                        VD: {currentCard.example}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Flip Hint */}
              <div className="flex items-center justify-center gap-1.5 text-xs text-[#7C7C6B]/80 font-sans font-medium text-center self-center bg-[#F5F5F0]/80 py-1.5 px-4 rounded-full border border-[#E0E0D6] hover:border-[#5A5A40]/30 transition-all">
                <RotateCcw className="w-3.5 h-3.5 text-[#5A5A40]" />
                <span>Chạm thẻ để lật</span>
              </div>
            </div>

            {/* Back Stack Card 1 (60% visible) */}
            <div className="absolute -bottom-3 left-4 right-4 h-full bg-white border border-[#E8E2D6] rounded-3xl shadow-sm opacity-60 pointer-events-none z-0"></div>
            {/* Back Stack Card 2 (30% visible) */}
            <div className="absolute -bottom-6 left-8 right-8 h-full bg-white border border-[#E8E2D6] rounded-3xl shadow-sm opacity-30 pointer-events-none -z-10"></div>
          </div>

          {/* Rating Spaced Repetition Buttons */}
          <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
            
            {/* Again Action Button */}
            <button
              onClick={() => handleRate('AGAIN')}
              className="flex flex-col items-center py-4 bg-white rounded-2xl border border-[#E0E0D6] hover:bg-[#F27D7D] hover:border-[#F27D7D] hover:text-white active:scale-95 cursor-pointer group transition-all duration-200"
            >
              <span className="text-base font-bold font-sans text-[#9E3D3D] group-hover:text-white transition-colors">Học lại</span>
              <span className="text-[10px] font-sans font-semibold text-[#7C7C6B] group-hover:text-white/80 transition-colors mt-1">&lt; 1 phút</span>
            </button>

            {/* Hard Action Button */}
            <button
              onClick={() => handleRate('HARD')}
              className="flex flex-col items-center py-4 bg-white rounded-2xl border border-[#E0E0D6] hover:bg-[#F2C07D] hover:border-[#F2C07D] hover:text-[#3D3D33] active:scale-95 cursor-pointer group transition-all duration-200"
            >
              <span className="text-base font-bold font-sans text-[#8F5F2D] group-hover:text-[#3D3D33] transition-colors">Khó</span>
              <span className="text-[10px] font-sans font-semibold text-[#7C7C6B] group-hover:text-[#3D3D33]/80 transition-colors mt-1">2 ngày</span>
            </button>

            {/* Good Action Button */}
            <button
              onClick={() => handleRate('GOOD')}
              className="flex flex-col items-center py-4 bg-white rounded-2xl border border-[#E0E0D6] hover:bg-[#5A5A40] hover:border-[#5A5A40] hover:text-white active:scale-95 cursor-pointer group transition-all duration-200"
            >
              <span className="text-base font-bold font-sans text-[#5A5A40] group-hover:text-white transition-colors">Tốt</span>
              <span className="text-[10px] font-sans font-semibold text-[#7C7C6B] group-hover:text-white/80 transition-colors mt-1">4 ngày</span>
            </button>

            {/* Easy Action Button */}
            <button
              onClick={() => handleRate('EASY')}
              className="flex flex-col items-center py-4 bg-white rounded-2xl border border-[#E0E0D6] hover:bg-[#99B080] hover:border-[#99B080] hover:text-white active:scale-95 cursor-pointer group transition-all duration-200"
            >
              <span className="text-base font-bold font-sans text-[#4E5F3D] group-hover:text-white transition-colors">Dễ</span>
              <span className="text-[10px] font-sans font-semibold text-[#7C7C6B] group-hover:text-white/80 transition-colors mt-1">7 ngày</span>
            </button>

          </div>

          {/* Focus Mode Metadata */}
          <div className="pt-6 border-t border-[#E0E0D6]/40 flex items-center justify-center gap-8 text-xs text-[#7C7C6B]">
            <div className="flex items-center gap-1.5 font-sans">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5A5A40] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5A5A40]"></span>
              </span>
              <span>Chế độ tập trung đang bật</span>
            </div>
            <div className="flex items-center gap-1.5 font-sans font-medium text-[#3D3D33]">
              <Timer className="w-4 h-4 text-[#5A5A40]" />
              <span>Phiên học: {formatTimer(sessionDuration)}</span>
            </div>
          </div>

        </div>
      )}

      {/* Floating Statistics Sidebar Trigger (bottom-right) */}
      <div className="fixed bottom-6 right-6 lg:right-10 flex flex-col items-end gap-3 z-20 select-none">
        {showStatsFloating && (
          <div className="bg-white rounded-xl border border-[#E0E0D6] shadow-lg shadow-[#5A5A40]/5 p-3.5 flex flex-col gap-2 max-w-[210px] hover:border-[#5A5A40]/25 transition-all text-xs animate-fade-in select-none">
            <h5 className="font-semibold text-[#5A5A40] border-b border-[#F5F5F0] pb-1 font-sans">Bộ ôn tập hiện tại</h5>
            <div className="flex items-center gap-2 font-sans font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F27D7D]"></span>
              <span className="text-[#7C7C6B]">Cần ôn hôm nay:</span>
              <span className="font-semibold text-[#3D3D33] ml-auto">{currentNeedReviewNum}</span>
            </div>
            <div className="flex items-center gap-2 font-sans font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5A5A40]"></span>
              <span className="text-[#7C7C6B]">Thẻ mới học thêm:</span>
              <span className="font-semibold text-[#3D3D33] ml-auto">{currentNewNum}</span>
            </div>
          </div>
        )}

        {/* Dynamic toggle active metrics */}
        <button
          onClick={() => setShowStatsFloating(!showStatsFloating)}
          className="w-11 h-11 bg-[#5A5A40] text-white hover:bg-[#4A4A35] rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl active:scale-95 transition-all cursor-pointer border border-[#E0E0D6]/20"
          title="Thông tin ôn tập"
        >
          <Activity className="w-5 h-5 text-white" />
        </button>
      </div>

    </div>
  );
}
