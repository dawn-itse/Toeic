/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Deck, Card, DailyQuest } from '../types';
import { Flame, CheckSquare, Brain, ArrowRight, Trophy, Zap, CheckCircle2, Bookmark, ArrowUpRight } from 'lucide-react';

interface DashboardProps {
  decks: Deck[];
  cards: Card[];
  streak: number;
  todayReviewed: number;
  todayGoal: number;
  onSetTab: (tab: string) => void;
  onSelectDeck: (deckId: string) => void;
  xp: number;
  level: number;
  quests: DailyQuest[];
  onClaimQuest: (questId: string) => void;
}

export default function Dashboard({
  decks,
  cards,
  streak,
  todayReviewed,
  todayGoal,
  onSetTab,
  onSelectDeck,
  xp,
  level,
  quests,
  onClaimQuest
}: DashboardProps) {
  // Calculate dynamic stats
  const totalCardsToReview = cards.filter(c => c.status === 'CẦN ÔN' || c.status === 'ĐANG HỌC').length;
  const numDecksWithReview = Array.from(new Set(cards.filter(c => c.status === 'CẦN ÔN').map(c => c.deckId))).length;
  
  // Progress calculations
  const progressPercent = Math.min(100, Math.round((todayReviewed / todayGoal) * 100));

  // Count items per deck
  const getDeckStats = (deckId: string) => {
    const deckCards = cards.filter(c => c.deckId === deckId);
    const newCount = deckCards.filter(c => c.status === 'MỚI').length;
    const reviewCount = deckCards.filter(c => c.status === 'CẦN ÔN' || c.status === 'ĐANG HỌC').length;
    const masteredCount = deckCards.filter(c => c.status === 'ĐÃ THUỘC').length;
    
    return {
      newCount: newCount,
      reviewCount: reviewCount,
      masteredCount: masteredCount,
      isActiveReview: reviewCount > 0
    };
  };

  return (
    <div id="dashboard-page" className="space-y-10 animate-fade-in py-4 max-w-[1200px] mx-auto px-6">
      
      {/* Greetings Header */}
      <div>
        <h2 className="text-3xl font-bold font-sans text-[#3D3D33]">Chào mừng trở lại.</h2>
        <p className="text-sm font-serif italic text-[#7C7C6B] mt-2">
          Sẵn sàng cho phiên tập trung hôm nay? Bạn có <span className="font-semibold text-[#5A5A40]">{totalCardsToReview} thẻ</span> cần ôn tập trong <span className="font-semibold text-[#5A5A40]">{numDecksWithReview || 2} bộ thẻ</span> phổ biến.
        </p>
      </div>

      {/* Bento Stats Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none">
        
        {/* Streak Bento */}
        <div className="bg-white p-6 rounded-2xl border border-[#E0E0D6] shadow-sm flex flex-col justify-between min-h-[160px] hover:border-[#7C7C6B]/40 transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-[#7C7C6B] tracking-wider uppercase font-sans">Chuỗi ngày học tập</span>
            <Flame className="w-5 h-5 text-[#F27D7D]" />
          </div>
          <div className="my-2">
            <span className="text-4xl font-bold font-sans text-[#3D3D33]">{streak}</span>
            <span className="text-sm text-[#7C7C6B] font-sans font-medium ml-1"> Ngày</span>
          </div>
          <div className="w-full bg-[#E8E8E0] h-1 rounded-full overflow-hidden">
            <div className="bg-[#5A5A40] h-full rounded-full" style={{ width: '80%' }}></div>
          </div>
        </div>

        {/* Progress Bento */}
        <div className="bg-white p-6 rounded-2xl border border-[#E0E0D6] shadow-sm flex flex-col justify-between min-h-[160px] hover:border-[#7C7C6B]/40 transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-[#7C7C6B] tracking-wider uppercase font-sans">Tiến độ hôm nay</span>
            <CheckSquare className="w-5 h-5 text-[#5A5A40]" />
          </div>
          <div className="my-2">
            <span className="text-4xl font-bold font-sans text-[#3D3D33]">{todayReviewed}</span>
            <span className="text-lg text-[#7C7C6B] font-sans font-medium"> / {todayGoal} Thẻ</span>
          </div>
          <p className="text-xs text-[#7C7C6B] font-sans">Đã hoàn thành {progressPercent}% mục tiêu ngày</p>
        </div>

        {/* Action Callout Bento (Forest Green -> Natural Olive/Sage) */}
        <div className="bg-[#5A5A40] text-white p-6 rounded-2xl shadow-md shadow-[#5A5A40]/15 flex flex-col justify-between min-h-[160px] hover:bg-[#4A4A35] transition-all duration-300">
          <div className="flex justify-between items-start text-white/80">
            <span className="text-xs font-semibold tracking-wider uppercase font-sans">Lần ôn tập tới</span>
            <Brain className="w-5 h-5 text-white/90" />
          </div>
          <div className="my-2">
            <h3 className="text-xl font-bold font-sans text-white">Ôn tập chuyên sâu</h3>
            <p className="text-xs text-white/80 mt-1">Duyệt thẻ sắp xếp khoa học dựa trên trí nhớ</p>
          </div>
          <button
            id="btn-bento-start"
            onClick={() => onSetTab('study')}
            className="w-full bg-white text-[#5A5A40] text-xs font-bold font-sans py-2.5 px-4 rounded-xl hover:bg-[#F5F5F0] transition-colors cursor-pointer text-center"
          >
            Bắt đầu ngay
          </button>
        </div>

      </div>

      {/* Decks & Daily Quests Dual-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Your Decks (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold font-sans text-[#3D3D33]">Bộ thẻ của bạn</h3>
            <button
              onClick={() => onSetTab('my-decks')}
              className="text-xs font-semibold text-[#5A5A40] hover:text-[#4A4A35] transition-colors flex items-center gap-1 font-sans cursor-pointer group"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {decks.slice(0, 4).map((deck) => {
              const stats = getDeckStats(deck.id);
              const isCompleted = deck.isCompleted || (stats.reviewCount === 0 && stats.newCount === 0);

              return (
                <div
                  key={deck.id}
                  onClick={() => {
                    onSelectDeck(deck.id);
                    onSetTab('my-decks');
                  }}
                  className="bg-white rounded-2xl border border-[#E0E0D6] shadow-sm overflow-hidden flex flex-col cursor-pointer hover:shadow-md hover:border-[#5A5A40]/30 transition-all duration-300"
                >
                  {/* Visual Banner */}
                  <div className="relative h-40 bg-slate-100 overflow-hidden">
                    <img
                      alt={deck.name}
                      src={deck.image}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                    {/* Status Overlay */}
                    <div className="absolute left-4 bottom-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wider uppercase border ${
                        isCompleted 
                          ? 'bg-[#E8E8E0] text-[#5A5A40] border-[#E0E0D6]' 
                          : 'bg-[#ffdad6] text-[#93000a] border-[#ffdad6]'
                      }`}>
                        {isCompleted ? 'ĐÃ HOÀN THÀNH' : 'CẦN ÔN'}
                      </span>
                    </div>
                  </div>

                  {/* Content body */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold font-sans text-[#3D3D33] line-clamp-1">{deck.name}</h4>
                      <p className="text-[11px] text-[#7C7C6B] line-clamp-2 mt-1.5 font-serif italic text-justify leading-relaxed">
                        {deck.description}
                      </p>
                    </div>

                    {/* Quantitative Stats */}
                    <div className="mt-4 pt-3 border-t border-[#E8E2D6] flex gap-6 select-none">
                      <div>
                        <span className="text-[9px] font-bold text-[#A3A392] tracking-wider uppercase font-sans">Mới</span>
                        <p className="text-xs font-bold text-[#3D3D33] font-sans mt-0.5">{stats.newCount}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-[#A3A392] tracking-wider uppercase font-sans">Cần ôn</span>
                        <p className="text-xs font-bold text-[#5A5A40] font-sans mt-0.5">{stats.reviewCount}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-[#A3A392] tracking-wider uppercase font-sans">Đã thuộc</span>
                        <p className="text-xs font-bold text-[#7C7C6B] font-sans mt-0.5">{stats.masteredCount}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Duolingo Daily Quests (Span 1) */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold font-sans text-[#3D3D33] flex items-center gap-2">
              <span>Nhiệm vụ ngày</span>
              <span className="text-[10px] py-0.5 px-2 bg-amber-100 text-amber-800 rounded-full font-bold uppercase tracking-wider font-sans">Mới</span>
            </h3>
            <span className="text-xs font-serif italic text-[#7C7C6B]">Đặt lại 00:00</span>
          </div>

          <div className="bg-white rounded-2xl border border-[#E0E0D6] p-6 shadow-sm space-y-6">
            
            {/* Quest explanation header */}
            <div className="flex items-start gap-3 bg-[#F5F5F0] p-4 rounded-xl border border-dashed border-[#E0E0D6]">
              <Trophy className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-[#3D3D33] font-sans">Học tập & Tích lũy XP</p>
                <p className="text-[10px] text-[#7C7C6B] mt-0.5 leading-relaxed font-sans">
                  Hoàn thành nhiệm vụ để thu thới XP giúp thăng hạng tài khoản nhanh chóng!
                </p>
              </div>
            </div>

            {/* List of active quests */}
            <div className="space-y-5">
              {quests.map((quest) => {
                const percent = Math.min(100, Math.round((quest.current / quest.target) * 100));
                const isFinished = quest.current >= quest.target;
                
                return (
                  <div key={quest.id} className="space-y-2 border-b border-[#F5F5F0] pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-[#3D3D33] font-sans flex items-center gap-1.5">
                          {quest.title}
                          {quest.completed && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600 fill-green-50" />
                          )}
                        </h4>
                        <p className="text-[10px] text-[#7C7C6B] mt-0.5 leading-relaxed font-sans font-medium">{quest.description}</p>
                      </div>
                      <span className="text-[10px] font-bold font-mono text-[#5A5A40] bg-[#E8E8E0] px-1.5 py-0.5 rounded">
                        +{quest.xpReward} XP
                      </span>
                    </div>

                    {/* Progress slider bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-grow bg-[#E8E8E0] h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isFinished ? 'bg-green-500' : 'bg-[#5A5A40]'
                          }`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-bold text-[#3D3D33] font-mono whitespace-nowrap">
                        {quest.current}/{quest.target}
                      </span>
                    </div>

                    {/* Active conditional button */}
                    <div className="flex justify-end pt-1">
                      {isFinished && !quest.completed ? (
                        <button
                          onClick={() => onClaimQuest(quest.id)}
                          className="text-[10px] bg-amber-500 text-white font-bold py-1.5 px-3 rounded-lg hover:bg-amber-600 transition-colors cursor-pointer flex items-center gap-1 font-sans active:scale-95 shadow-sm shadow-amber-500/10 animate-pulse"
                        >
                          <span>Nhận Thưởng</span>
                          <Zap className="w-3 h-3 text-white fill-white" />
                        </button>
                      ) : quest.completed ? (
                        <span className="text-[10px] text-green-600 font-bold flex items-center gap-1 font-sans bg-green-50 py-1 px-2.5 rounded-md border border-green-200">
                          <span>Đã nhận thưởng</span>
                          <CheckCircle2 className="w-3 h-3 text-green-600 fill-green-50" />
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            if (quest.category === 'REVIEW') onSetTab('study');
                            else if (quest.category === 'SPELL') onSetTab('fill-word');
                            else if (quest.category === 'IPA') onSetTab('ipa');
                          }}
                          className="text-[10px] text-[#5A5A40] font-bold hover:text-[#4A4A35] flex items-center gap-0.5 font-sans cursor-pointer group"
                        >
                          <span>Đi tới làm ngay</span>
                          <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
