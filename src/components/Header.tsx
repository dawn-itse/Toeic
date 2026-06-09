/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Search, Bell, Settings, Heart, Zap, Trophy, ShieldAlert, Sparkles } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSetSearchQuery: (query: string) => void;
  placeholderText?: string;
  xp: number;
  level: number;
  hearts: number;
  unlimitedHearts: boolean;
  onToggleUnlimitedHearts: () => void;
  onReplenishHearts: () => void;
}

export default function Header({ 
  searchQuery, 
  onSetSearchQuery, 
  placeholderText = "Tìm kiếm thẻ trong bộ...",
  xp,
  level,
  hearts,
  unlimitedHearts,
  onToggleUnlimitedHearts,
  onReplenishHearts
}: HeaderProps) {
  const [showNotification, setShowNotification] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-[#F5F5F0]/80 backdrop-blur-md border-b border-[#E0E0D6]/50 flex-shrink-0 select-none">
      <div className="flex flex-col md:flex-row justify-between items-center w-full px-6 py-4 max-w-[1200px] mx-auto gap-4">
        
        {/* Search Bar Input */}
        <div className="flex items-center gap-6 flex-grow w-full md:w-auto">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#7C7C6B]" />
            <input
              id="header-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSetSearchQuery(e.target.value)}
              placeholder={placeholderText}
              className="w-full pl-11 pr-4 py-2 bg-white rounded-full border border-[#E0E0D6] focus:border-[#5A5A40] focus:ring-2 focus:ring-[#5A5A40]/10 font-sans text-sm focus:outline-none transition-all placeholder-[#7C7C6B] text-[#3D3D33]"
            />
            {searchQuery && (
              <button 
                onClick={() => onSetSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#7C7C6B] hover:text-[#5A5A40] font-medium"
              >
                Xóa
              </button>
            )}
          </div>
        </div>

        {/* Gamified Duolingo indicators & Action Controls */}
        <div className="flex items-center justify-between md:justify-end gap-5 w-full md:w-auto mt-2 md:mt-0">
          
          {/* XP & Level Panel */}
          <div className="flex items-center gap-4 border border-[#E0E0D6] bg-white px-3.5 py-1.5 rounded-2xl shadow-sm">
            
            {/* Level */}
            <div className="flex items-center gap-1" title="Cấp độ từ vựng đại dương">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold font-sans text-[#3D3D33]">Lv.{level}</span>
            </div>

            {/* Separator */}
            <div className="h-4 w-px bg-[#E0E0D6]"></div>

            {/* XP */}
            <div className="flex items-center gap-1.5" title="Điểm kinh nghiệm học tập (XP)">
              <Zap className="w-4 h-4 text-[#F29F05]" />
              <span className="text-xs font-bold font-sans text-[#3D3D33]">{xp} XP</span>
            </div>
          </div>

          {/* Hearts / HP System */}
          <div className="relative group">
            <div 
              className="flex items-center gap-1.5 border border-[#ffdad6] bg-red-50/50 px-3 py-1.5 rounded-2xl cursor-pointer hover:bg-red-50 transition-all select-none"
              title="Nhấn để thiết lập mạng/trái tim học tập"
            >
              <Heart className={`w-4 h-4 text-[#EA2B2B] ${hearts === 0 && !unlimitedHearts ? 'animate-bounce' : 'fill-[#EA2B2B]'}`} />
              <span className="text-xs font-bold font-sans text-[#EA2B2B]">
                {unlimitedHearts ? 'Vô hạn' : `${hearts}/5`}
              </span>
            </div>
            
            {/* Custom Interactive Heart Helper Dropdown */}
            <div className="invisible group-hover:visible absolute right-0 mt-2 w-64 bg-white rounded-xl border border-[#E0E0D6] shadow-xl p-4 text-xs z-50 transition-all duration-200">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#F5F5F0]">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h4 className="font-semibold text-[#5A5A40] font-sans">Mạng trái tim học tập</h4>
              </div>

              <p className="text-[#7C7C6B] leading-relaxed mb-3">
                Khi học ở chế độ <strong>Điền từ</strong>, mỗi lần gõ đáp án sai bạn sẽ mất 1 Trái tim.
              </p>

              <div className="space-y-2">
                {/* Hearts replenishment action if hearts < 5 */}
                {!unlimitedHearts && (
                  <button
                    onClick={onReplenishHearts}
                    disabled={xp < 50 && hearts >= 5}
                    className={`w-full py-2 px-3 rounded-lg text-[10px] font-sans font-bold flex items-center justify-between transition-all ${
                      hearts >= 5 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : xp >= 50
                        ? 'bg-[#5A5A40] text-white hover:bg-[#4A4A35] cursor-pointer'
                        : 'bg-red-100 text-red-500 cursor-not-allowed'
                    }`}
                  >
                    <span>Hồi đầy 5 Trái tim</span>
                    <span className="bg-black/10 py-0.5 px-2 rounded font-sans">-50 XP</span>
                  </button>
                )}

                {/* Zen unlimited mode button */}
                <button
                  onClick={onToggleUnlimitedHearts}
                  className="w-full py-2 px-3 border border-[#5A5A40] hover:bg-[#E8E8E0]/40 transition-colors text-[10px] font-bold text-[#5A5A40] rounded-lg cursor-pointer text-center font-sans block"
                >
                  {unlimitedHearts ? 'Bật chế độ giới hạn (Thử thách)' : 'Kích hoạt Trái Tim Vô Hạn (Zen)'}
                </button>
              </div>
            </div>
          </div>

          <div className="h-6 w-px bg-[#E0E0D6]"></div>

          {/* Notifications Button */}
          <div className="relative">
            <button
              id="btn-notifications"
              onClick={() => {
                setShowNotification(!showNotification);
                setShowSettings(false);
              }}
              className="text-[#7C7C6B] hover:text-[#5A5A40] transition-colors relative p-1.5 rounded-full hover:bg-[#E8E8E0]/40 cursor-pointer active:scale-95"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#F27D7D] rounded-full"></span>
            </button>
            {showNotification && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl border border-[#E0E0D6] shadow-lg p-4 text-xs z-50">
                <h4 className="font-semibold text-sm text-[#5A5A40] mb-2 font-sans">Thông báo</h4>
                <div className="space-y-3">
                  <div className="pb-2 border-b border-[#F5F5F0] text-[#3D3D33]">
                    <p className="font-medium text-black">Cố lên!</p>
                    <p className="mt-0.5 text-[#7C7C6B]">Bạn đang tích lũy XP cực nhanh hôm nay. Tiếp tục phát huy nhé!</p>
                  </div>
                  <div className="text-[#3D3D33]">
                    <p className="font-medium text-black">Mục tiêu ngày</p>
                    <p className="mt-0.5 text-[#7C7C6B]">Đặt mục tiêu hoàn thành các Quests ngày trong bảng điều khiển để nhận quà lớn!</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Settings Button */}
          <div className="relative">
            <button
              id="btn-settings"
              onClick={() => {
                setShowSettings(!showSettings);
                setShowNotification(false);
              }}
              className="text-[#7C7C6B] hover:text-[#5A5A40] transition-colors p-1.5 rounded-full hover:bg-[#E8E8E0]/40 cursor-pointer active:scale-95"
            >
              <Settings className="w-5 h-5" />
            </button>
            {showSettings && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-[#E0E0D6] shadow-lg p-3 text-xs z-50">
                <h4 className="font-semibold text-sm text-[#5A5A40] mb-2 font-sans px-2">Cài đặt</h4>
                <div className="flex flex-col">
                  <button className="text-left py-2 px-2 hover:bg-[#F5F5F0] rounded-lg text-[#3D3D33] font-medium transition-colors">Thiết lập tài khoản</button>
                  <button className="text-left py-2 px-2 hover:bg-[#F5F5F0] rounded-lg text-[#3D3D33] font-medium transition-colors">Tải trọng nhận thức</button>
                  <button className="text-left py-2 px-2 hover:bg-[#ffdad6]/20 rounded-lg text-[#9E3D3D] font-medium transition-colors">Đặt lại dữ liệu app</button>
                </div>
              </div>
            )}
          </div>

          {/* Persona Headshot Avatar */}
          <div className="w-8 h-8 rounded-full overflow-hidden border border-[#E0E0D6] shadow-sm flex-shrink-0">
            <img
              id="user-avatar"
              alt="Ảnh đại diện"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCnxoV8I4cjBLD1fDMjM48l3KjXkwXrSk4bmU4k_oVkIOfByKBzw7U-PIq2bM2BVd-vyQeff2rQLnaK-5_WTXk6IGYlSs9ilEXvg43RX60yj-X0_kgybkRcKVQRvlNk1MfDno07rJkmoCYrdBlIdhSXV7UsHW8Ijj_szHX5kXNmG2T5fpx-gyfMFs-w6MN7IivxyOtNP_e4oORlgSNYHkHUIdFEyTBP4GX21CAslgt69qDwiWPj_npaaTYiTeKu1foQaQYECVS2sY6W"
            />
          </div>
        </div>

      </div>
    </header>
  );
}
