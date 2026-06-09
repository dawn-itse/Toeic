/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from 'react';
import { Deck } from '../types';
import { Quote, Plus, Sparkles, TrendingUp, Cpu, Calendar } from 'lucide-react';

interface AddNewCardProps {
  decks: Deck[];
  selectedDeckId: string;
  onAddCard: (deckId: string, front: string, back: string, example?: string) => void;
  onSetTab: (tab: string) => void;
}

export default function AddNewCard({
  decks,
  selectedDeckId,
  onAddCard,
  onSetTab
}: AddNewCardProps) {
  const [deckId, setDeckId] = useState(selectedDeckId || decks[0]?.id || 'deck-vocab');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [example, setExample] = useState('');
  const [addedCount, setAddedCount] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const handleSaveCard = (e: FormEvent, addAnotherOption: boolean = false) => {
    e.preventDefault();

    if (!front.trim()) {
      triggerToast('Vui lòng nhập Từ/Cụm từ ở mặt trước.');
      return;
    }
    if (!back.trim()) {
      triggerToast('Vui lòng nhập định nghĩa/dịch nghĩa ở mặt sau.');
      return;
    }

    onAddCard(deckId, front.trim(), back.trim(), example.trim() || undefined);
    
    // Incremental progress session stats
    setAddedCount(prev => prev + 1);
    triggerToast(`Đã thêm thành công thẻ "${front}" vào bộ từ vựng.`);

    // Reset fields
    setFront('');
    setBack('');
    setExample('');

    if (!addAnotherOption) {
      // Redirect to deck browser
      setTimeout(() => {
        onSetTab('my-decks');
      }, 800);
    }
  };

  return (
    <div id="add-new-page" className="animate-fade-in py-4 max-w-[1200px] mx-auto px-6 space-y-8 select-none">
      
      {/* Toast Alert Feedback */}
      {showToast && (
        <div className="fixed top-20 right-6 bg-[#5A5A40] text-white px-5 py-3 rounded-xl border border-[#E0E0D6] shadow-lg text-xs font-sans z-50 animate-scale-up">
          {toastMessage}
        </div>
      )}

      {/* Header Info */}
      <div>
        <h2 className="text-3xl font-bold font-sans text-[#3D3D33]">Tạo thẻ mới</h2>
        <p className="text-sm font-serif italic text-[#7C7C6B] mt-1.5 max-w-2xl text-justify">
          Thêm từ mới vào bộ từ vựng của bạn. Tập trung vào một định nghĩa rõ ràng và ví dũ ngữ cảnh phong phú giúp kích hoạt khả năng ghi nhớ tốt hơn.
        </p>
      </div>

      {/* Main Flashcard Form Frame */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#E0E0D6] shadow-md shadow-[#5A5A40]/3">
        <form onSubmit={(e) => handleSaveCard(e, false)} className="space-y-6">
          
          {/* Deck Selector Box */}
          <div className="col-span-full">
            <label className="block text-xs font-bold font-sans text-[#5A5A40] uppercase tracking-wider mb-2">Chọn bộ thẻ</label>
            <div className="relative">
              <select
                value={deckId}
                onChange={(e) => setDeckId(e.target.value)}
                className="w-full appearance-none bg-white border border-[#E0E0D6] rounded-xl px-4 py-3.5 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/10 focus:border-[#5A5A40] transition-all cursor-pointer text-[#3D3D33] font-medium"
              >
                {decks.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#7C7C6B]">
                <span className="text-xs font-bold font-sans">Chọn</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Front Input Box */}
            <div className="space-y-2">
              <label className="block text-xs font-bold font-sans text-[#5A5A40] uppercase tracking-wider">Mặt trước (Từ/Cụm từ)</label>
              <textarea
                value={front}
                onChange={(e) => setFront(e.target.value)}
                placeholder="Nhập từ hoặc cụm từ..."
                rows={4}
                className="w-full bg-[#F5F5F0]/30 border border-[#E0E0D6] rounded-xl p-4 text-lg font-sans font-semibold focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/10 focus:border-[#5A5A40] transition-all resize-none shadow-inner placeholder-[#7C7C6B]"
              ></textarea>
              <p className="text-[11px] text-[#7C7C6B] italic font-serif">Giữ nội dung ngắn gọn và súc tích.</p>
            </div>

            {/* Back Input Box */}
            <div className="space-y-2">
              <label className="block text-xs font-bold font-sans text-[#5A5A40] uppercase tracking-wider">Mặt sau (Định nghĩa/Dịch nghĩa)</label>
              <textarea
                value={back}
                onChange={(e) => setBack(e.target.value)}
                placeholder="Nhập định nghĩa hoặc dịch nghĩa..."
                rows={4}
                className="w-full bg-[#F5F5F0]/30 border border-[#E0E0D6] rounded-xl p-4 text-sm font-serif focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/10 focus:border-[#5A5A40] transition-all resize-none shadow-inner placeholder-[#7C7C6B]"
              ></textarea>
              <p className="text-[11px] text-[#7C7C6B] italic font-serif">Cung cấp nghĩa phổ biến nhất trước.</p>
            </div>

          </div>

          {/* Example Input Box */}
          <div className="space-y-2">
            <label className="block text-xs font-bold font-sans text-[#5A5A40] uppercase tracking-wider">Câu ví dụ</label>
            <div className="relative">
              <Quote className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#E0E0D6]" />
              <input
                type="text"
                value={example}
                onChange={(e) => setExample(e.target.value)}
                placeholder="Sử dụng từ này trong một câu..."
                className="w-full pl-12 pr-4 py-3.5 bg-[#F5F5F0]/30 border border-[#E0E0D6] rounded-xl text-sm font-serif italic focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/10 focus:border-[#5A5A40] transition-all shadow-inner placeholder-[#7C7C6B]"
              />
            </div>
          </div>

          {/* Action Trigger Row */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#E0E0D6]/40 mt-6">
            <button
              type="submit"
              className="flex-1 bg-[#5A5A40] text-white py-3 px-4 font-sans font-semibold rounded-xl hover:bg-[#4A4A35] transition-all cursor-pointer shadow-md shadow-[#5A5A40]/10 text-center text-sm active:scale-95"
            >
              Lưu thẻ
            </button>
            
            <button
              type="button"
              onClick={(e) => handleSaveCard(e, true)}
              className="flex-1 bg-[#E8E8E0] text-[#5A5A40] py-3 px-4 font-sans font-semibold rounded-xl hover:bg-[#E0E0D6]/60 transition-all cursor-pointer text-center text-sm active:scale-95"
            >
              Lưu và thêm thẻ khác
            </button>
            
            <button
              type="button"
              onClick={() => onSetTab('my-decks')}
              className="px-6 py-3 text-[#7C7C6B] font-sans font-semibold hover:text-[#9E3D3D] transition-colors text-center text-sm cursor-pointer active:scale-95"
            >
              Hủy
            </button>
          </div>

        </form>
      </div>

      {/* Productivity Stats Details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 select-none">
        
        {/* Dynamic Cards Added */}
        <div className="bg-[#F5F5F0]/60 p-5 rounded-2xl flex items-center gap-4 border border-[#E0E0D6]">
          <TrendingUp className="w-6 h-6 text-[#5A5A40]" />
          <div>
            <p className="text-[10px] font-bold text-[#7C7C6B] uppercase tracking-wider font-sans">Tiến độ phiên học</p>
            <p className="text-lg font-bold text-[#3D3D33] font-sans mt-0.5">{addedCount} Thẻ đã thêm</p>
          </div>
        </div>

        {/* Cognitive Index */}
        <div className="bg-[#F5F5F0]/60 p-5 rounded-2xl flex items-center gap-4 border border-[#E0E0D6]">
          <Sparkles className="w-6 h-6 text-[#5A5A40]" />
          <div>
            <p className="text-[10px] font-bold text-[#7C7C6B] uppercase tracking-wider font-sans">Tải trọng nhận thức</p>
            <p className="text-lg font-bold text-[#3D3D33] font-sans mt-0.5">Tối ưu ✨</p>
          </div>
        </div>

        {/* Dynamic Goal Counter */}
        <div className="bg-[#F5F5F0]/60 p-5 rounded-2xl flex items-center gap-4 border border-[#E0E0D6]">
          <Calendar className="w-6 h-6 text-[#5A5A40]" />
          <div>
            <p className="text-[10px] font-bold text-[#7C7C6B] uppercase tracking-wider font-sans">Mục tiêu ngày</p>
            <p className="text-lg font-bold text-[#3D3D33] font-sans mt-0.5">60% Hoàn thành</p>
          </div>
        </div>

      </div>

    </div>
  );
}
