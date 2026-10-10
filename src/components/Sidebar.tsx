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
    { id: 'overview', label: 'Overview', icon: <PieChart className="w-4 h-4 shrink-0" /> },
    { id: 'transactions', label: 'Transactions', icon: <CreditCard className="w-4 h-4 shrink-0" /> },
    { id: 'health', label: 'Financial Health', icon: <Activity className="w-4 h-4 shrink-0" /> },
    { id: 'cashflow', label: 'Cash Flow', icon: <BarChart3 className="w-4 h-4 shrink-0" /> },
    { id: 'domino', label: 'Financial Domino', icon: <Network className="w-4 h-4 shrink-0" /> },
    { id: 'goals', label: 'Goal Optimizer', icon: <Target className="w-4 h-4 shrink-0" /> },
    { id: 'simulator', label: 'Future Simulator', icon: <Send className="w-4 h-4 shrink-0" /> },
    { id: 'insights', label: 'Insights', icon: <Sparkles className="w-4 h-4 shrink-0" /> },
    { id: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4 shrink-0" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4 shrink-0" /> },
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

      {/* Sidebar container - Locked static on desktop, full height */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 z-50 w-72 md:w-60 lg:w-68 xl:w-72 flex flex-col justify-between p-4 md:p-5 rounded-none md:rounded-3xl bg-linear-to-b from-[#064E49] via-[#043E3A] to-[#012B26] text-[#F7F2E6] shadow-2xl transition-transform duration-300 ease-out md:translate-x-0 h-full shrink-0 select-none ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
          {/* Brand header with Official ArthDrishti Logo */}
          <div className="flex items-center justify-between pb-3.5 border-b border-[#D9B45B]/20 shrink-0">
            <div className="w-full pr-1">
              <ArthDrishtiLogo variant="sidebar" className="w-full max-w-[230px]" />
            </div>

            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-[#F7F2E6]/80 hover:text-white hover:bg-white/10 shrink-0 ml-1 cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User profile mini widget */}
          <div className="flex items-center gap-3 py-3 my-2 px-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="w-10 h-10 rounded-full border-2 border-[#D9B45B] bg-[#003D34] flex items-center justify-center text-sm font-bold text-[#F3D58A] shrink-0 shadow-inner">
              {userName.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-[#D9B45B] font-medium">Welcome back,</div>
              <div className="font-bold text-sm text-white truncate">{userName}</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto pr-1 py-1 space-y-1">
            {navItems.map((item) => {
              const active = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all text-left ${
                    active
                      ? 'bg-linear-to-r from-[#ECCB78] via-[#D9B45B] to-[#C79F48] text-[#012B26] font-bold shadow-md shadow-[#D9B45B]/25 translate-x-1'
                      : 'text-[#F7F2E6]/80 hover:text-white hover:bg-white/8'
                  }`}
                >
                  <span className={`${active ? 'text-[#012B26]' : 'text-[#D9B45B]'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-3 border-t border-[#D9B45B]/20">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-[#D9B45B]/60 text-xs md:text-sm font-semibold text-[#F7F2E6] hover:bg-[#D9B45B]/15 hover:border-[#D9B45B] transition shadow-xs"
          >
            <LogOut className="w-4 h-4 text-[#D9B45B]" />
            <span>Switch to Sign In</span>
          </button>
        </div>
      </aside>
    </>
  );
};
