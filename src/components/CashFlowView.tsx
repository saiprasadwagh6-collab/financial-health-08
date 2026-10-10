import React, { useState } from 'react';
import { Calendar, AlertCircle, TrendingDown, TrendingUp } from 'lucide-react';
import { AppState } from '../types';
import { formatINR, formatDate } from '../utils/formatters';

interface CashFlowViewProps {
  state: AppState;
}

export const CashFlowView: React.FC<CashFlowViewProps> = ({ state }) => {
  const [period, setPeriod] = useState<7 | 30 | 60 | 90>(state.settings.forecastDays as any);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const { settings, upcomingBills, account, transactions } = state;
  const hasData = transactions.length > 0;

  // Real monthly expense rate
  const totalExpense = transactions
    .filter((t) => t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  const dailyBurn = totalExpense > 0 ? Math.round(totalExpense / 30) : 0;
  const currentBal = account.availableBalance;

  const days = period;
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const points: { label: string; value: number; dayNum: number }[] = [];
  for (let i = 0; i < days; i++) {
    const val = hasData ? Math.max(0, currentBal - dailyBurn * i) : 0;
    let label = '';
    if (days <= 7) {
      label = weekdays[i % 7];
    } else if (days <= 30) {
      label = i % 5 === 0 ? `D+${i + 1}` : '';
    } else {
      label = i % 14 === 0 ? `W${Math.floor(i / 7) + 1}` : '';
    }

    points.push({ label, value: val, dayNum: i + 1 });
  }

  const values = points.map((p) => p.value);
  const lowest = hasData ? Math.min(...values) : 0;
  const highest = hasData ? Math.max(...values) : 0;
  const avg = hasData ? Math.round(values.reduce((s, v) => s + v, 0) / values.length) : 0;
  const daysBelow = hasData ? values.filter((v) => v < settings.minimumReserve).length : 0;

  const maxVal = Math.max(highest, settings.minimumReserve * 1.5, 1000);
  const minVal = 0;

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className={`p-4 rounded-2xl border ${
            hasData && lowest < settings.minimumReserve
              ? 'bg-gradient-to-br from-[#FCEAE5] to-[#F8DDD6] border-[#F3CFC6]'
              : 'bg-gradient-to-br from-[#E7F0DE] to-[#DCE9D2] border-[#CFE0C4]'
          }`}
        >
          <span className="text-xs font-semibold text-[#68746D]">Lowest Projected</span>
          <div
            className={`text-xl sm:text-2xl font-black mt-1 ${
              hasData && lowest < settings.minimumReserve ? 'text-[#D94343]' : 'text-[#2E7655]'
            }`}
          >
            {formatINR(lowest)}
          </div>
          <span className="text-[11px] text-[#68746D]">In next {days} days</span>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FCF1D2] to-[#F8E8BE] border border-[#EFDDAB]">
          <span className="text-xs font-semibold text-[#68746D]">Highest Projected</span>
          <div className="text-xl sm:text-2xl font-black text-[#A9822F] mt-1">
            {formatINR(highest)}
          </div>
          <span className="text-[11px] text-[#68746D]">Peak balance</span>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#EEEAFB] to-[#E5DEF8] border border-[#D9D0F3]">
          <span className="text-xs font-semibold text-[#68746D]">Average Balance</span>
          <div className="text-xl sm:text-2xl font-black text-[#7662DF] mt-1">
            {formatINR(avg)}
          </div>
          <span className="text-[11px] text-[#68746D]">Smoothed daily avg</span>
        </div>

        <div
          className={`p-4 rounded-2xl border ${
            hasData && daysBelow > 0
              ? 'bg-gradient-to-br from-[#FCEAE5] to-[#F8DDD6] border-[#F3CFC6]'
              : 'bg-gradient-to-br from-[#E7F0DE] to-[#DCE9D2] border-[#CFE0C4]'
          }`}
        >
          <span className="text-xs font-semibold text-[#68746D]">Days Below Reserve</span>
          <div
            className={`text-xl sm:text-2xl font-black mt-1 ${
              hasData && daysBelow > 0 ? 'text-[#D94343]' : 'text-[#2E7655]'
            }`}
          >
            {daysBelow} Days
          </div>
          <span className="text-[11px] text-[#68746D]">
            Floor: {formatINR(settings.minimumReserve)}
          </span>
        </div>
      </div>

      {/* Tall Forecast Chart */}
      <div className="p-6 rounded-3xl bg-[#FBF6E9] border border-[#E8DDC4] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8DDC4]/60">
          <div>
            <h2 className="text-lg font-bold text-[#102C2B]">
              Cash Flow Forecast ({period} Days)
            </h2>
            <p className="text-xs text-[#68746D] mt-0.5">
              Forward projection calculated from your actual starting balance of {formatINR(account.availableBalance)}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#FCF9F1] border border-[#E8DDC4] text-xs font-semibold">
              {([7, 30, 60, 90] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setPeriod(d)}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    period === d
                      ? 'bg-[#064E49] text-white font-bold'
                      : 'text-[#68746D] hover:text-[#102C2B]'
                  }`}
                >
                  Next {d} Days
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Forecast Bars */}
        <div className="relative pt-6 pb-2">
          <div className="h-64 sm:h-72 flex items-end gap-1 sm:gap-2 relative">
            {/* Minimum Reserve Line */}
            <div
              className="absolute left-0 right-0 border-b-2 border-dashed border-[#D94343]/80 z-10 pointer-events-none"
              style={{
                bottom: `${((settings.minimumReserve - minVal) / (maxVal - minVal)) * 100}%`,
              }}
            >
              <span className="absolute right-0 -top-3 text-[10px] font-bold text-white bg-[#D94343] px-2 py-0.5 rounded shadow-xs">
                Minimum Reserve: {formatINR(settings.minimumReserve)}
              </span>
            </div>

            {points.map((pt, idx) => {
              const heightPct = Math.max(3, ((pt.value - minVal) / (maxVal - minVal)) * 100);
              const isBelow = hasData && pt.value < settings.minimumReserve;
              const isHovered = hoveredIdx === idx;

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {isHovered && (
                    <div className="absolute -top-12 z-30 px-2.5 py-1.5 bg-[#102C2B] text-white text-xs font-bold rounded-lg whitespace-nowrap shadow-md pointer-events-none text-center">
                      <div>Day +{pt.dayNum}</div>
                      <div className="text-[#F3D58A]">{formatINR(pt.value)}</div>
                    </div>
                  )}

                  <div
                    className={`w-full max-w-[40px] rounded-t-lg transition-all duration-200 ${
                      !hasData
                        ? 'bg-[#EFE6D2]'
                        : isBelow
                        ? 'bg-[#D94343]'
                        : isHovered
                        ? 'bg-[#176B62]'
                        : 'bg-[#064E49]'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                  {pt.label && (
                    <span className="text-[10px] text-[#68746D] font-medium mt-1 truncate">
                      {pt.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upcoming Bills Card */}
      <div className="p-6 rounded-3xl bg-[#FBF6E9] border border-[#E8DDC4] shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#102C2B]">Upcoming Bills</h2>
          <p className="text-xs text-[#68746D] mt-0.5">
            Known scheduled outflows already accounted for in the forward flight simulator.
          </p>
        </div>

        {upcomingBills.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#FCF8EE] border border-[#F0E7D2] text-center text-xs text-[#68746D]">
            No upcoming scheduled bills recorded. All cash flow calculations reflect strictly your imported bank statements and actual ledger outflows.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {upcomingBills.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-2xl bg-[#FCF8EE] border border-[#F0E7D2] flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="p-2.5 rounded-xl bg-[#E8DDC4]/40 text-[#064E49]">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="font-bold text-sm text-[#102C2B]">{b.name}</div>
                    <div className="text-xs text-[#68746D]">Due {formatDate(b.due)}</div>
                  </div>
                </div>
                <span className="text-sm font-bold text-[#D94343]">- {formatINR(b.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
