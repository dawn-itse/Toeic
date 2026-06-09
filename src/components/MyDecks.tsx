/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Deck, Card, CardStatus } from '../types';
import { Plus, Edit, Trash2, ChevronLeft, ChevronRight, Check, Volume2 } from 'lucide-react';
import { speakEnglish } from '../utils/speech';

interface MyDecksProps {
  decks: Deck[];
  cards: Card[];
  selectedDeckId: string;
  onSelectDeck: (deckId: string) => void;
  onSetTab: (tab: string) => void;
  onDeleteCard: (cardId: string) => void;
  onEditCard: (cardId: string, updatedFront: string, updatedBack: string, updatedStatus: CardStatus) => void;
  searchQuery: string;
}

export default function MyDecks({
  decks,
  cards,
  selectedDeckId,
  onSelectDeck,
  onSetTab,
  onDeleteCard,
  onEditCard,
  searchQuery
}: MyDecksProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Inline editing state
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');
  const [editStatus, setEditStatus] = useState<CardStatus>('CẦN ÔN');

  const selectedDeck = decks.find(d => d.id === selectedDeckId) || decks[0];

  // Filtering cards in the selected deck
  const deckCards = cards.filter(c => c.deckId === selectedDeck.id);

  // Apply search query if defined
  const filteredCards = deckCards.filter(c => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.front.toLowerCase().includes(query) ||
      c.back.toLowerCase().includes(query)
    );
  });

  // Pagination calculation
  const totalItems = filteredCards.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCards = filteredCards.slice(startIndex, startIndex + itemsPerPage);

  // Bento stat calculations
  const needReviewCount = deckCards.filter(c => c.status === 'CẦN ÔN' || c.status === 'ĐANG HỌC').length;
  const learningCount = deckCards.filter(c => c.status === 'ĐANG HỌC' || c.status === 'MỚI').length;
  const masteredCount = deckCards.filter(c => c.status === 'ĐÃ THUỘC').length;

  const totalPossible = deckCards.length || 1;
  const masteryPercentage = Math.round((deckCards.filter(c => c.status === 'ĐÃ THUỘC').length / (deckCards.length || 1)) * 100);

  const handleStartEdit = (card: Card) => {
    setEditingCardId(card.id);
    setEditFront(card.front);
    setEditBack(card.back);
    setEditStatus(card.status);
  };

  const handleSaveEdit = (cardId: string) => {
    if (!editFront.trim() || !editBack.trim()) return;
    onEditCard(cardId, editFront.trim(), editBack.trim(), editStatus);
    setEditingCardId(null);
  };

  return (
    <div id="my-decks-page" className="animate-fade-in py-4 max-w-[1200px] mx-auto px-6 space-y-8 select-none">
      
      {/* Dynamic Deck Selector on Top */}
      <div className="flex flex-wrap gap-2 pb-4 border-b border-[#E0E0D6]">
        {decks.map(d => {
          const isActive = d.id === selectedDeck.id;
          return (
            <button
              key={d.id}
              onClick={() => {
                onSelectDeck(d.id);
                setCurrentPage(1);
                setEditingCardId(null);
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-lg font-sans transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#5A5A40] text-white shadow-sm'
                  : 'bg-white text-[#7C7C6B] border border-[#E0E0D6] hover:bg-[#F5F5F0]'
              }`}
            >
              {d.name}
            </button>
          );
        })}
      </div>

      {/* Header Contextual Info */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-[#7C7C6B] text-xs font-semibold mb-2 font-sans">
            <span className="hover:text-[#5A5A40] cursor-pointer" onClick={() => onSetTab('dashboard')}>Bộ thẻ của tôi</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#A3A392]" />
            <span className="text-[#5A5A40]">{selectedDeck.category}</span>
          </nav>
          <h2 className="text-3xl font-bold font-sans text-[#3D3D33]">{selectedDeck.name}</h2>
          <p className="font-serif italic text-sm text-[#7C7C6B] mt-1.5">
            {totalCardsToReview() || deckCards.length} thẻ đang hoạt động trong bộ này • Độ thông thạo: {masteryPercentage}%
          </p>
        </div>

        {/* Create Card Triggers */}
        <button
          id="btn-add-card-mydecks"
          onClick={() => onSetTab('add-new')}
          className="bg-[#5A5A40] text-white py-2.5 px-5 rounded-xl text-sm font-semibold hover:bg-[#4A4A35] transition-all cursor-pointer shadow-md shadow-[#5A5A40]/10 flex items-center justify-center gap-1.5 active:scale-95"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>Thêm thẻ mới</span>
        </button>
      </div>

      {/* Bento-style Stats Header details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Urgent reviews */}
        <div className="bg-white p-5 rounded-2xl border border-[#E0E0D6] shadow-sm hover:border-[#5A5A40]/30 transition-all duration-300">
          <span className="text-[10px] font-bold text-[#7C7C6B] tracking-wider uppercase font-sans">CẦN ÔN HÔM NAY</span>
          <div className="text-2xl font-bold text-[#5A5A40] font-sans mt-1.5">{needReviewCount} Thẻ</div>
          <div className="mt-4 h-1.5 w-full bg-[#F5F5F0] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#5A5A40] rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, (needReviewCount / (totalPossible || 1)) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* In-learning progress */}
        <div className="bg-white p-5 rounded-2xl border border-[#E0E0D6] shadow-sm hover:border-[#7C7C6B]/40 transition-all duration-300">
          <span className="text-[10px] font-bold text-[#7C7C6B] tracking-wider uppercase font-sans">ĐANG HỌC</span>
          <div className="text-2xl font-bold text-[#7C7C6B] font-sans mt-1.5">{learningCount} Thẻ</div>
          <div className="mt-4 h-1.5 w-full bg-[#F5F5F0] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#7C7C6B] rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, (learningCount / (totalPossible || 1)) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Mastered statistics summary */}
        <div className="bg-white p-5 rounded-2xl border border-[#E0E0D6] shadow-sm hover:border-[#7C7C6B]/40 transition-all duration-300">
          <span className="text-[10px] font-bold text-[#7C7C6B] tracking-wider uppercase font-sans">ĐÃ THUỘC</span>
          <div className="text-2xl font-bold text-[#3D3D33] font-sans mt-1.5">{masteredCount} Thẻ</div>
          <div className="mt-4 h-1.5 w-full bg-[#F5F5F0] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#99B080] rounded-full transition-all duration-500" 
              style={{ width: `${masteryPercentage}%` }}
            ></div>
          </div>
        </div>

      </div>

      {/* Vocabulary Card Table List */}
      <div className="bg-white rounded-2xl border border-[#E0E0D6] shadow-sm overflow-hidden">
        
        <table className="w-full text-left border-collapse">
          
          <thead className="bg-[#F5F5F0]/60 border-b border-[#E0E0D6]">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-[#7C7C6B] tracking-wider uppercase font-sans">Mặt trước (Thuật ngữ)</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#7C7C6B] tracking-wider uppercase font-sans">Mặt sau (Nghĩa)</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#7C7C6B] tracking-wider uppercase font-sans">Trạng thái</th>
              <th className="px-6 py-4 text-xs font-semibold text-[#7C7C6B] tracking-wider uppercase font-sans text-right">Thao tác</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#E0E0D6]/40">
            {paginatedCards.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-[#7C7C6B] font-sans italic text-sm">
                  {searchQuery ? 'Không tìm thấy thẻ nào khớp với ý bạn tìm kiếm.' : 'Chưa có thẻ nào trong bộ này. Nhấp vào "Thêm thẻ mới" để tạo.'}
                </td>
              </tr>
            ) : (
              paginatedCards.map((card) => {
                const isEditing = editingCardId === card.id;

                return (
                  <tr key={card.id} className="hover:bg-[#F5F5F0]/30 transition-colors">
                    
                    {/* Front word column */}
                    <td className="px-6 py-5">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFront}
                          onChange={(e) => setEditFront(e.target.value)}
                          className="px-3 py-1.5 text-sm bg-white border border-[#E0E0D6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/15 focus:border-[#5A5A40] font-sans font-medium text-black w-full"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-serif italic text-sm text-[#5A5A40] font-bold">
                            {card.front}
                          </span>
                          <button
                            onClick={() => speakEnglish(card.front)}
                            className="p-1 rounded-full text-[#7C7C6B] hover:bg-[#E8E8E0] hover:text-[#5A5A40] transition-colors cursor-pointer"
                            title="Nghe phát âm từ vựng"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Back meaning column */}
                    <td className="px-6 py-5">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editBack}
                          onChange={(e) => setEditBack(e.target.value)}
                          className="px-3 py-1.5 text-sm bg-white border border-[#E0E0D6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/15 focus:border-[#5A5A40] font-serif text-[#3D3D33] w-full"
                        />
                      ) : (
                        <div className="space-y-1">
                          <p className="font-serif text-sm text-[#3D3D33] whitespace-pre-line">{card.back}</p>
                          {card.example && (
                            <p className="text-xs text-[#7C7C6B] italic">VD: "{card.example}"</p>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Status badge chip column */}
                    <td className="px-6 py-5">
                      {isEditing ? (
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value as CardStatus)}
                          className="px-2 py-1 bg-white border border-[#E0E0D6] rounded-lg text-xs font-sans focus:outline-none cursor-pointer"
                        >
                          <option value="MỚI">MỚI</option>
                          <option value="CẦN ÔN">CẦN ÔN</option>
                          <option value="ĐANG HỌC">ĐANG HỌC</option>
                          <option value="ĐÃ THUỘC">ĐÃ THUỘC</option>
                        </select>
                      ) : (
                        <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded tracking-wide uppercase border ${
                          card.status === 'ĐÃ THUỘC'
                            ? 'bg-[#E8E8E0] text-[#7C7C6B] border-[#E0E0D6]'
                            : card.status === 'CẦN ÔN'
                            ? 'bg-[#ffdad6]/40 text-[#93000a] border-[#ffdad6]/60'
                            : card.status === 'ĐANG HỌC'
                            ? 'bg-[#F5F5F0] text-[#5A5A40] border-[#E8E2D6]'
                            : 'bg-[#c5eadf]/20 text-[#4E5F3D] border-[#baecdc]'
                        }`}>
                          {card.status}
                        </span>
                      )}
                    </td>

                    {/* Actions column */}
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2 text-xs">
                        {isEditing ? (
                          <button
                            onClick={() => handleSaveEdit(card.id)}
                            className="p-1 px-2.5 bg-[#5A5A40] text-white hover:bg-[#4A4A35] rounded-md flex items-center gap-1 font-sans font-semibold cursor-pointer active:scale-95"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Lưu</span>
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStartEdit(card)}
                              className="p-2 hover:bg-[#E8E8E0]/60 rounded-lg text-[#7C7C6B] hover:text-[#5A5A40] transition-all cursor-pointer active:scale-90"
                              title="Chỉnh sửa thẻ"
                            >
                              <Edit className="w-4.5 h-4.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Bạn chắc chắn muốn xóa thẻ "${card.front}"?`)) {
                                  onDeleteCard(card.id);
                                }
                              }}
                              className="p-2 hover:bg-[#ffdad6]/20 rounded-lg text-[#7C7C6B] hover:text-[#9E3D3D] transition-all cursor-pointer active:scale-90"
                              title="Xóa thẻ"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>

        </table>

        {/* Footer controls & pagination summary */}
        <div className="px-6 py-4 flex items-center justify-between bg-[#F5F5F0]/30 border-t border-[#E0E0D6]/40">
          <span className="text-xs font-semibold text-[#7C7C6B] font-sans">
            Hiển thị {filteredCards.length > 0 ? startIndex + 1 : 0} đến {Math.min(startIndex + itemsPerPage, filteredCards.length)} trên {totalItems} thẻ
          </span>

          <div className="flex gap-2 select-none">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3.5 py-1.5 border border-[#E0E0D6] rounded-xl text-xs font-sans font-medium text-[#7C7C6B] hover:bg-[#F5F5F0] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Trước</span>
            </button>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3.5 py-1.5 border border-[#E0E0D6] rounded-xl text-xs font-sans font-medium text-[#7C7C6B] hover:bg-[#F5F5F0] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
            >
              <span>Tiếp</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );

  function totalCardsToReview() {
    return deckCards.length;
  }
}
