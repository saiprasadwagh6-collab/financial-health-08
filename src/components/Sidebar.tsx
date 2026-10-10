import React from 'react';
import {
  PieChart,
  CreditCard,
  Activity,
  BarChart3,
  Network,
  Target,
  Send,
  Sparkles,
  FileText,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { PageId } from '../types';
import { ArthDrishtiLogo } from './ArthDrishtiLogo';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  userName: string;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  userName,
  isMobileOpen,
  onCloseMobile,
  onLogout,
}) => {
  const navItems: { id: PageId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <PieChart className="w-3.5 h-3.5 shrink-0" /> },
    { id: 'transactions', label: 'Transactions', icon: <CreditCard className="w-3.5 h-3.5 shrink-0" /> },
    { id: 'health', label: 'Financial Health', icon: <Activity className="w-3.5 h-3.5 shrink-0" /> },
    { id: 'cashflow', label: 'Cash Flow', icon: <BarChart3 className="w-3.5 h-3.5 shrink-0" /> },
    { id: 'domino', label: 'Financial Domino', icon: <Network className="w-3.5 h-3.5 shrink-0" /> },
    { id: 'goals', label: 'Goal Optimizer', icon: <Target className="w-3.5 h-3.5 shrink-0" /> },
    { id: 'simulator', label: 'Future Simulator', icon: <Send className="w-3.5 h-3.5 shrink-0" /> },
    { id: 'insights', label: 'Insights', icon: <Sparkles className="w-3.5 h-3.5 shrink-0" /> },
    { id: 'reports', label: 'Reports', icon: <FileText className="w-3.5 h-3.5 shrink-0" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-3.5 h-3.5 shrink-0" /> },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container - Locked static on desktop, completely non-scrollable, all tabs fit on one screen */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-50 w-64 md:w-56 lg:w-60 xl:w-64 flex flex-col justify-between p-3 md:p-3.5 rounded-none md:rounded-3xl bg-linear-to-b from-[#064E49] via-[#043E3A] to-[#012B26] text-[#F7F2E6] shadow-2xl transition-transform duration-300 ease-out md:translate-x-0 h-full shrink-0 select-none overflow-hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
          {/* Brand header with Official ArthDrishti Logo */}
          <div className="flex items-center justify-between pb-2 border-b border-[#D9B45B]/20 shrink-0">
            <div className="w-full pr-1">
              <ArthDrishtiLogo variant="sidebar" className="w-full max-w-[200px]" />
            </div>

            <button
              onClick={onCloseMobile}
              className="md:hidden p-1 rounded-lg text-[#F7F2E6]/80 hover:text-white hover:bg-white/10 shrink-0 ml-1 cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User profile mini widget - compact to guarantee all tabs fit without scrolling */}
          <div className="flex items-center gap-2.5 py-1.5 px-2.5 my-2 rounded-xl bg-white/5 border border-white/10 shrink-0">
            <div className="w-7 h-7 rounded-full border border-[#D9B45B] bg-[#003D34] flex items-center justify-center text-xs font-bold text-[#F3D58A] shrink-0 shadow-inner">
              {userName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] text-[#D9B45B] leading-none font-medium">Welcome,</div>
              <div className="font-semibold text-xs text-white truncate leading-tight mt-0.5">{userName}</div>
            </div>
          </div>

          {/* Navigation Links - Static container, no scroll, smaller font size for full screen view */}
          <nav className="flex-1 flex flex-col justify-start space-y-0.5 xl:space-y-1 overflow-hidden pr-0.5">
            {navItems.map((item) => {
              const active = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 md:py-1.5 xl:py-2 rounded-lg text-[11.5px] xl:text-xs font-medium transition-all text-left cursor-pointer ${
                    active
                      ? 'bg-linear-to-r from-[#ECCB78] via-[#D9B45B] to-[#C79F48] text-[#012B26] font-bold shadow-sm shadow-[#D9B45B]/25 translate-x-0.5'
                      : 'text-[#F7F2E6]/75 hover:text-white hover:bg-white/8'
                  }`}
                >
                  <span className={`${active ? 'text-[#012B26]' : 'text-[#D9B45B]'}`}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer - Compact */}
        <div className="pt-2 border-t border-[#D9B45B]/20 shrink-0">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg border border-[#D9B45B]/50 text-[11px] font-semibold text-[#F7F2E6] hover:bg-[#D9B45B]/15 hover:border-[#D9B45B] transition shadow-2xs cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-[#D9B45B]" />
            <span>Switch to Sign In</span>
          </button>
        </div>
      </aside>
    </>
  );
};
