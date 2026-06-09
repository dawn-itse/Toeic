/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  LayoutDashboard, 
  Layers, 
  Brain, 
  PlusSquare, 
  Keyboard,
  Volume2,
  FileText
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSetTab: (tab: string) => void;
  onStartReview: () => void;
}

export default function Sidebar({ currentTab, onSetTab, onStartReview }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard },
    { id: 'my-decks', label: 'Bộ thẻ của tôi', icon: Layers },
    { id: 'study', label: 'Chế độ học tập', icon: Brain },
    { id: 'add-new', label: 'Thêm mới', icon: PlusSquare },
    { id: 'fill-word', label: 'Điền từ', icon: Keyboard },
    { id: 'ipa', label: 'Bảng âm IPA', icon: Volume2 },
    { id: 'toeic-test', label: 'Luyện đề TOEIC', icon: FileText },
  ];

  return (
    <aside 
      id="sidebar"
      className="flex flex-col h-screen py-8 px-6 fixed left-0 top-0 z-40 bg-white border-r border-[#E0E0D6] w-64 select-none"
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-12 px-2 cursor-pointer" onClick={() => onSetTab('dashboard')}>
        <div className="w-10 h-10 bg-[#5A5A40] rounded-xl flex items-center justify-center text-white text-xl font-bold tracking-tighter shadow-sm font-sans">Z</div>
        <div>
          <h1 className="text-xl font-bold font-sans tracking-tight text-[#3D3D33]">Dawn</h1>
          <p className="text-[10px] text-[#A3A392] font-semibold tracking-wider uppercase font-sans">Study With Dawn</p>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex flex-col gap-1 grow">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => onSetTab(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-left cursor-pointer active:scale-98 ${
                isActive
                  ? 'bg-[#F5F5F0] text-[#5A5A40] font-semibold shadow-sm'
                  : 'text-[#7C7C6B] hover:bg-[#F5F5F0]/60 hover:text-[#5A5A40]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-[#5A5A40]' : 'text-[#7C7C6B]'}`} />
              <span className="text-sm tracking-wide font-sans font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Floating Action Button at Bottom */}
      <div className="mt-auto pt-6">
        <button
          id="btn-sidebar-quick-review"
          onClick={onStartReview}
          className="w-full py-4 px-4 bg-[#5A5A40] text-white text-sm font-semibold rounded-xl hover:bg-[#4A4A35] transition-all cursor-pointer active:scale-95 shadow-md shadow-[#5A5A40]/10 flex items-center justify-center gap-2"
        >
          <Brain className="w-4 h-4 text-white" />
          <span>Bắt đầu ôn tập hàng ngày</span>
        </button>
      </div>
    </aside>
  );
}
