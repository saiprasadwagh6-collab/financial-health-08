import React, { useState } from 'react';
import { Bell, Search, Menu, LogIn, LayoutDashboard, Landmark } from 'lucide-react';
import { PageId, NotificationItem, Transaction, Goal, InsightItem } from '../types';
import { formatSignedINR, formatDate } from '../utils/formatters';

interface HeaderProps {
  pageTitle: string;
  pageSubtitle: string;
  onOpenMobileNav: () => void;
  notifications: NotificationItem[];
  onSelectNotification: (notif: NotificationItem) => void;
  onMarkAllRead: () => void;
  transactions: Transaction[];
  goals: Goal[];
  insights: InsightItem[];
  onNavigate: (page: PageId) => void;
  onSelectTransaction: (tx: Transaction) => void;
  onSelectGoal: (goal: Goal) => void;
  isAuthMode: boolean;
  onToggleAuthMode: () => void;
  onOpenAccountSetup?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  pageTitle,
  pageSubtitle,
  onOpenMobileNav,
  notifications,
  onSelectNotification,
  onMarkAllRead,
  transactions,
  goals,
  insights,
  onNavigate,
  onSelectTransaction,
  onSelectGoal,
  isAuthMode,
  onToggleAuthMode,
  onOpenAccountSetup,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const q = searchQuery.trim().toLowerCase();
  const searchResults = q
    ? {
        transactions: transactions
          .filter(
            (t) =>
              t.merchant.toLowerCase().includes(q) ||
              t.description.toLowerCase().includes(q) ||
              t.category.toLowerCase().includes(q)
          )
          .slice(0, 4),
        goals: goals.filter((g) => g.name.toLowerCase().includes(q)).slice(0, 3),
        insights: insights.filter((i) => i.title.toLowerCase().includes(q) || i.explanation.toLowerCase().includes(q)).slice(0, 2),
      }
    : null;

  const totalResults = searchResults
    ? searchResults.transactions.length + searchResults.goals.length + searchResults.insights.length
    : 0;

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E8DDC4]/60">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileNav}
          className="md:hidden p-2.5 rounded-xl border border-[#E8DDC4] bg-[#FCF9F1] text-[#102C2B] hover:bg-white transition"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-[#102C2B] tracking-tight leading-tight">
            {pageTitle}
          </h1>
          <p className="text-sm text-[#68746D] mt-0.5">{pageSubtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
        {/* Set Bank Balance & Baseline Button */}
        {onOpenAccountSetup && (
          <button
            onClick={onOpenAccountSetup}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold rounded-xl border border-[#064E49] bg-[#064E49] text-white hover:bg-[#176B62] transition shadow-xs"
            title="Set or update your actual bank balance, monthly salary, and salary credit day"
          >
            <Landmark className="w-4 h-4 text-[#F3D58A]" />
            <span className="hidden sm:inline">Set Bank Balance</span>
            <span className="sm:hidden">Balance</span>
          </button>
        )}

        {/* Toggle Login / Applet Mode preview button */}
        <button
          onClick={onToggleAuthMode}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-[#D9B45B] bg-[#FFF9EF] text-[#064E49] hover:bg-[#F3D58A]/30 transition shadow-xs"
          title="Toggle between Login Screen and Dashboard views"
        >
          {isAuthMode ? (
            <>
              <LayoutDashboard className="w-4 h-4 text-[#064E49]" />
              <span>Back to Dashboard</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4 text-[#D9B45B]" />
              <span>Preview Login Screen</span>
            </>
          )}
        </button>

        {/* Global Search Bar */}
        <div className="relative flex-1 sm:w-72 md:w-80">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#68746D] pointer-events-none" />
            <input
              type="search"
              placeholder="Search transactions, goals..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              className="w-full h-10 pl-10 pr-3 rounded-xl border border-[#E8DDC4] bg-[#FCF9F1] text-sm text-[#102C2B] placeholder:text-[#92968D] focus:outline-hidden focus:border-[#D9B45B] focus:ring-2 focus:ring-[#D9B45B]/20 transition"
            />
          </div>

          {/* Search Results Dropdown */}
          {showSearchDropdown && q.length > 0 && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowSearchDropdown(false)}
              />
              <div className="absolute left-0 right-0 top-12 z-50 bg-[#FCF9F1] border border-[#E8DDC4] rounded-2xl shadow-xl max-h-96 overflow-y-auto p-2">
                {totalResults === 0 ? (
                  <p className="text-xs text-[#68746D] p-3 text-center">
                    No matching records found for "{searchQuery}"
                  </p>
                ) : (
                  <>
                    {searchResults && searchResults.transactions.length > 0 && (
                      <div className="mb-2">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[#92968D] px-2 py-1">
                          Transactions
                        </div>
                        {searchResults.transactions.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => {
                              onSelectTransaction(t);
                              setShowSearchDropdown(false);
                              setSearchQuery('');
                            }}
                            className="w-full text-left p-2 rounded-xl hover:bg-[#D9B45B]/15 flex items-center justify-between text-xs transition"
                          >
                            <div>
                              <div className="font-semibold text-[#102C2B]">{t.merchant}</div>
                              <div className="text-[11px] text-[#68746D]">
                                {t.category} · {formatDate(t.date)}
                              </div>
                            </div>
                            <span
                              className={`font-bold ${
                                t.amount < 0 ? 'text-[#D94343]' : 'text-[#2E7655]'
                              }`}
                            >
                              {formatSignedINR(t.amount)}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {searchResults && searchResults.goals.length > 0 && (
                      <div className="mb-2">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[#92968D] px-2 py-1">
                          Goals
                        </div>
                        {searchResults.goals.map((g) => (
                          <button
                            key={g.id}
                            onClick={() => {
                              onSelectGoal(g);
                              setShowSearchDropdown(false);
                              setSearchQuery('');
                            }}
                            className="w-full text-left p-2 rounded-xl hover:bg-[#D9B45B]/15 flex items-center justify-between text-xs transition"
                          >
                            <span className="font-semibold text-[#102C2B]">{g.name}</span>
                            <span className="text-[11px] text-[#68746D]">
                              {Math.round((g.current / g.target) * 100)}% complete
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {searchResults && searchResults.insights.length > 0 && (
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-[#92968D] px-2 py-1">
                          Insights
                        </div>
                        {searchResults.insights.map((i) => (
                          <button
                            key={i.id}
                            onClick={() => {
                              onNavigate('insights');
                              setShowSearchDropdown(false);
                              setSearchQuery('');
                            }}
                            className="w-full text-left p-2 rounded-xl hover:bg-[#D9B45B]/15 text-xs transition"
                          >
                            <div className="font-semibold text-[#102C2B]">{i.title}</div>
                            <div className="text-[11px] text-[#68746D] truncate">{i.explanation}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Notifications Button */}
        <div className="relative">
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="relative p-2.5 rounded-xl border border-[#E8DDC4] bg-[#FCF9F1] text-[#102C2B] hover:bg-white transition"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-[#A9822F]" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#D94343] ring-2 ring-[#FCF9F1]" />
            )}
          </button>

          {/* Notifications Panel */}
          {showNotifDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifDropdown(false)}
              />
              <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 bg-[#FCF9F1] border border-[#E8DDC4] rounded-2xl shadow-xl p-3">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E8DDC4]">
                  <div className="font-bold text-sm text-[#102C2B]">
                    Notifications {unreadCount > 0 && `(${unreadCount})`}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkAllRead}
                      className="text-xs font-semibold text-[#064E49] hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-[#68746D] py-4 text-center">No notifications</p>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          onSelectNotification(n);
                          setShowNotifDropdown(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl transition flex gap-2.5 items-start ${
                          n.unread
                            ? 'bg-[#D9B45B]/15 hover:bg-[#D9B45B]/25'
                            : 'hover:bg-black/5'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            n.unread ? 'bg-[#D94343]' : 'bg-transparent'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#102C2B] leading-snug">{n.title}</p>
                          <p className="text-[11px] text-[#68746D] line-clamp-2 mt-0.5">{n.body}</p>
                          <span className="text-[10px] text-[#92968D] block mt-1">{n.time}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
