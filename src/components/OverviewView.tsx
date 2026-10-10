import React, { useState } from 'react';
import {
  Wallet,
  Coins,
  Brain,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Shield,
  Laptop,
  Plane,
  Car,
  Target,
  UploadCloud,
  Plus,
  Pencil,
  Landmark,
} from 'lucide-react';
import { AppState, PageId, Transaction, Goal } from '../types';
import { formatINR, formatSignedINR, formatDate } from '../utils/formatters';

interface OverviewViewProps {
  state: AppState;
  onNavigate: (page: PageId) => void;
  onSelectTransaction: (tx: Transaction) => void;
  onSelectGoal: (goal: Goal) => void;
  onOpenImportModal?: () => void;
  onOpenAccountSetup?: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  state,
  onNavigate,
  onSelectTransaction,
  onSelectGoal,
  onOpenImportModal,
  onOpenAccountSetup,
}) => {
  const [period, setPeriod] = useState<7 | 30 | 60 | 90>(7);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  const { account, settings, transactions, health, goals, sparklines } = state;

  const hasData = transactions.length > 0;

  // Real monthly income derived from actual transactions
  const totalIncome = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  // Real monthly expenses derived from actual transactions
  const totalExpense = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Generate chart data dynamically based on real balance
  const getForecastPoints = () => {
    if (!hasData && account.availableBalance === 0) {
      return Array.from({ length: period }, (_, i) => ({
        label: period <= 7 ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i % 7] : '',
        value: 0,
      }));
    }

    const currentBal = account.availableBalance;
    const dailyBurn = totalExpense > 0 ? Math.round(totalExpense / 30) : 0;
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const points: { label: string; value: number }[] = [];

    const today = new Date();
    const salaryDay = account.salaryCreditDay || 1;
    let runningVal = currentBal;

    for (let i = 0; i < period; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + i);

      if (account.monthlySalary > 0 && futureDate.getDate() === salaryDay) {
        runningVal += account.monthlySalary;
      } else {
        runningVal = Math.max(0, runningVal - dailyBurn);
      }

      let label = '';
      if (period <= 7) {
        label = weekdays[i % 7];
      } else if (period <= 30) {
        label = i % 5 === 0 ? `D+${i + 1}` : '';
      } else {
        label = i % 14 === 0 ? `W${Math.floor(i / 7) + 1}` : '';
      }
      points.push({ label, value: runningVal });
    }
    return points;
  };

  const chartPoints = getForecastPoints();
  const maxVal = Math.max(...chartPoints.map((p) => p.value), settings.minimumReserve * 1.5, 1000);
  const minVal = 0;

  // Goal icon helper
  const getGoalIcon = (iconName: string) => {
    switch (iconName) {
      case 'shield':
        return <Shield className="w-4 h-4 text-[#A9822F]" />;
      case 'laptop':
        return <Laptop className="w-4 h-4 text-[#1C4E86]" />;
      case 'plane':
        return <Plane className="w-4 h-4 text-[#7662DF]" />;
      case 'car':
        return <Car className="w-4 h-4 text-[#2E7655]" />;
      default:
        return <Target className="w-4 h-4 text-[#2E7655]" />;
    }
  };

  // Sparkline SVG renderer
  const renderSparkline = (data: number[], strokeColor: string) => {
    if (!data || data.length < 2 || data.every((d) => d === 0)) {
      return (
        <div className="h-9 flex items-center text-[10px] text-[#68746D]">
          — Awaiting history
        </div>
      );
    }
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const w = 180;
    const h = 36;
    const points = data
      .map((val, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((val - min) / range) * (h - 8) - 4;
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <svg className="w-full h-9 overflow-visible" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  // Domino calculation for real data
  const realBuffer = account.reserveBuffer;
  const targetGoal = goals[0];
  const shockAmount = 5000;
  const realPostponementMonths =
    state.goalContribution > 0 ? Math.ceil(shockAmount / state.goalContribution) : 1;

  return (
    <div className="space-y-6">
      {/* Onboarding Setup Banner if baseline is not set yet */}
      {!account.isSetupCompleted && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-[#FFF9EF] via-[#FCF9F1] to-[#FAF4E7] border-2 border-[#D9B45B] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#064E49] text-white text-[10px] font-bold tracking-wide uppercase">
              Step 1: Set Account Baseline
            </div>
            <h2 className="text-lg font-bold text-[#102C2B]">
              Configure Your Current Bank Balance & Salary
            </h2>
            <p className="text-xs text-[#68746D] max-w-xl">
              Set your actual opening bank balance and salary credit schedule so all statement debits/credits calculate against your true baseline and never turn negative.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            {onOpenAccountSetup && (
              <button
                onClick={onOpenAccountSetup}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#064E49] text-white text-xs sm:text-sm font-bold hover:bg-[#176B62] transition shadow-xs"
              >
                <Landmark className="w-4 h-4 text-[#F3D58A]" />
                <span>Set Bank Balance & Salary</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* If zero data uploaded yet */}
      {!hasData && account.isSetupCompleted && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-[#FCF9F1] via-[#FFF9EF] to-[#FAF4E7] border border-[#E8DDC4] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h2 className="text-lg font-bold text-[#102C2B]">
              Bank Baseline Active ({formatINR(account.availableBalance)})
            </h2>
            <p className="text-xs text-[#68746D] max-w-xl">
              Now upload your bank statement (.csv, .xlsx, .tsv, .txt) to automatically categorize transactions and run live cash flow flight simulations.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            {onOpenImportModal && (
              <button
                onClick={onOpenImportModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#064E49] text-white text-xs sm:text-sm font-bold hover:bg-[#176B62] transition shadow-xs"
              >
                <UploadCloud className="w-4 h-4 text-[#F3D58A]" />
                <span>Upload Statement</span>
              </button>
            )}
            <button
              onClick={() => onNavigate('transactions')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#D9B45B] bg-white text-xs sm:text-sm font-bold text-[#102C2B] hover:bg-[#FAF4E7] transition shadow-xs"
            >
              <Plus className="w-4 h-4 text-[#064E49]" />
              <span>Add Transaction</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Main Column */}
        <div className="xl:col-span-8 space-y-6">
          {/* Top 3 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Available Balance */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#E7F0DE] to-[#D7E6CD] border border-[#CFE0C4] shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-[#2E7655]/15 text-[#2E7655]">
                      <Wallet className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-bold text-[#102C2B]/80 uppercase tracking-wider">
                      Available Balance
                    </span>
                  </div>
                  {onOpenAccountSetup && (
                    <button
                      onClick={onOpenAccountSetup}
                      className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg bg-white/90 border border-[#CFE0C4] text-[#064E49] hover:bg-white transition shadow-2xs"
                      title="Update or edit your current bank balance"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Edit Balance</span>
                    </button>
                  )}
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#102C2B] mt-3 tracking-tight">
                  {formatINR(account.availableBalance)}
                </div>
              </div>
              <div className="mt-3">
                {renderSparkline(sparklines.balance, '#2E7655')}
                <div className="text-[11px] text-[#68746D] mt-1 font-medium flex justify-between">
                  <span>{hasData ? `${transactions.length} records processed` : 'Live Baseline'}</span>
                  {account.primaryBank && <span className="font-semibold text-[#064E49]">{account.primaryBank}</span>}
                </div>
              </div>
            </div>

            {/* Monthly Income */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#FCF1D2] to-[#F7E4B2] border border-[#EFDDAB] shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-[#A9822F]/15 text-[#A9822F]">
                      <Coins className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-bold text-[#102C2B]/80 uppercase tracking-wider">
                      Monthly Inflow
                    </span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#2E7655] text-white">
                    Income
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#102C2B] mt-3 tracking-tight">
                  {formatINR(totalIncome > 0 ? totalIncome : account.monthlySalary)}
                </div>
              </div>
              <div className="mt-3">
                {renderSparkline(sparklines.income, '#A9822F')}
                <div className="text-[11px] text-[#68746D] mt-1 font-medium">
                  {account.monthlySalary > 0
                    ? `Salary: ${formatINR(account.monthlySalary)} on ${account.salaryCreditDay}st/th`
                    : 'Statement credits'}
                </div>
              </div>
            </div>

            {/* AI Finance Coach */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#EEEAFB] to-[#E1D9F7] border border-[#D9D0F3] shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-[#7662DF]/20 text-[#7662DF]">
                    <Brain className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-bold text-[#102C2B]/80 uppercase tracking-wider">
                    AI Flight Coach
                  </span>
                </div>
                <p className="text-xs text-[#102C2B]/80 mt-2 font-medium leading-relaxed">
                  {hasData
                    ? `Current liquid cash holds ${formatINR(realBuffer)} buffer above your safety floor.`
                    : account.availableBalance > 0
                    ? `Baseline balance set to ${formatINR(account.availableBalance)}. Upload statement to model cash velocity.`
                    : 'Set your bank balance and upload statements to start flight simulation.'}
                </p>
              </div>
              <button
                onClick={() => onNavigate('simulator')}
                className="mt-3 inline-flex items-center justify-between px-3 py-2 rounded-xl bg-[#064E49] text-white text-xs font-bold hover:bg-[#176B62] transition shadow-xs"
              >
                <span>Explore Scenarios</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 7/30/60/90 Day Cash Flow Forecast Chart */}
          <div className="p-6 rounded-3xl bg-[#FBF6E9] border border-[#E8DDC4] shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8DDC4]/60">
              <div>
                <h2 className="text-lg font-bold text-[#102C2B]">
                  {period}-Day Cash Flow Forecast
                </h2>
                <p className="text-xs text-[#68746D] mt-0.5">
                  Forward projection starting from your actual balance of {formatINR(account.availableBalance)}.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#FCF9F1] border border-[#E8DDC4] text-xs font-semibold">
                  {([7, 30, 60, 90] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setPeriod(d)}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        period === d
                          ? 'bg-[#064E49] text-white font-bold'
                          : 'text-[#68746D] hover:text-[#102C2B]'
                      }`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 text-xs text-[#68746D]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#064E49]" />
                    <span>Projected</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-4 border-t-2 border-dashed border-[#D94343]" />
                    <span className="text-[#D94343] font-semibold">
                      Floor ({formatINR(settings.minimumReserve)})
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="relative pt-6 pb-2">
              <div className="h-56 flex items-end gap-1 sm:gap-2 relative">
                {/* Minimum Reserve Horizontal Line */}
                <div
                  className="absolute left-0 right-0 border-b-2 border-dashed border-[#D94343]/80 z-10 pointer-events-none"
                  style={{
                    bottom: `${((settings.minimumReserve - minVal) / (maxVal - minVal)) * 100}%`,
                  }}
                >
                  <span className="absolute right-0 -top-3 text-[10px] font-bold text-white bg-[#D94343] px-1.5 py-0.5 rounded shadow-xs">
                    Floor: {formatINR(settings.minimumReserve)}
                  </span>
                </div>

                {chartPoints.map((pt, idx) => {
                  const heightPct = Math.max(3, ((pt.value - minVal) / (maxVal - minVal)) * 100);
                  const isBelowReserve = pt.value < settings.minimumReserve;
                  const isHovered = hoveredBarIndex === idx;

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                      onMouseEnter={() => setHoveredBarIndex(idx)}
                      onMouseLeave={() => setHoveredBarIndex(null)}
                    >
                      {isHovered && (
                        <div className="absolute -top-10 z-30 px-2 py-1 bg-[#102C2B] text-white text-[11px] font-bold rounded-lg whitespace-nowrap shadow-md pointer-events-none">
                          {formatINR(pt.value)}
                          {isBelowReserve && (
                            <span className="block text-[9px] text-[#F3D58A] font-normal">
                              Below Reserve
                            </span>
                          )}
                        </div>
                      )}

                      <div
                        className={`w-full max-w-[36px] rounded-t-lg transition-all duration-200 ${
                          !hasData
                            ? 'bg-[#EFE6D2]'
                            : isBelowReserve
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

          {/* Recent Transactions Table */}
          <div className="p-6 rounded-3xl bg-[#FBF6E9] border border-[#E8DDC4] shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8DDC4]/60">
              <div>
                <h2 className="text-lg font-bold text-[#102C2B]">Recent Transactions</h2>
                <p className="text-xs text-[#68746D] mt-0.5">
                  Actual ledger entries from your statements or manual additions.
                </p>
              </div>
              <button
                onClick={() => onNavigate('transactions')}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#064E49] hover:text-[#176B62] transition"
              >
                <span>View All ({transactions.length})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[#68746D] border-b border-[#E8DDC4]/60">
                    <th className="py-2.5 font-semibold">Merchant / Narration</th>
                    <th className="py-2.5 font-semibold text-right">Amount</th>
                    <th className="py-2.5 font-semibold pl-4">Category</th>
                    <th className="py-2.5 font-semibold pl-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DDC4]/40">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-[#68746D]">
                        No transactions recorded yet. Click "Upload Statement" to import your real bank data.
                      </td>
                    </tr>
                  ) : (
                    transactions.slice(0, 5).map((t) => (
                      <tr
                        key={t.id}
                        onClick={() => onSelectTransaction(t)}
                        className="hover:bg-white/60 transition cursor-pointer group"
                      >
                        <td className="py-3">
                          <div className="font-bold text-[#102C2B] group-hover:text-[#064E49] transition">
                            {t.merchant}
                          </div>
                          <div className="text-[11px] text-[#68746D]">{t.description}</div>
                        </td>
                        <td
                          className={`py-3 text-right font-bold text-sm ${
                            t.amount < 0 ? 'text-[#D94343]' : 'text-[#2E7655]'
                          }`}
                        >
                          {formatSignedINR(t.amount)}
                        </td>
                        <td className="py-3 pl-4">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FAF4E7] border border-[#E8DDC4] text-[#102C2B]">
                            {t.category}
                          </span>
                        </td>
                        <td className="py-3 pl-4 text-[#68746D] whitespace-nowrap">
                          {formatDate(t.date)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column / Widgets */}
        <div className="xl:col-span-4 space-y-6">
          {/* Financial Health Widget */}
          <div className="p-6 rounded-3xl bg-[#FBF6E9] border border-[#E8DDC4] shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DDC4]/60">
              <h3 className="font-bold text-base text-[#102C2B]">Financial Health</h3>
              <button
                onClick={() => onNavigate('health')}
                className="text-xs font-bold text-[#064E49] hover:underline"
              >
                Diagnostic
              </button>
            </div>

            <div className="flex items-center gap-6 mt-4">
              {/* Donut Graphic */}
              <div className="relative w-28 h-28 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#EFE6D2"
                    strokeWidth="12"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#064E49"
                    strokeWidth="12"
                    strokeDasharray={`${(health.score / 100) * 251.2} 251.2`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-[#102C2B] leading-none">
                    {health.score}
                  </span>
                  <span className="text-[10px] font-bold text-[#2E7655] uppercase mt-0.5">
                    {health.label}
                  </span>
                </div>
              </div>

              {/* Split breakdown */}
              <div className="flex-1 space-y-2">
                {health.split.map((s) => (
                  <div key={s.key} className="space-y-0.5">
                    <div className="flex justify-between text-xs font-semibold text-[#102C2B]">
                      <span>{s.key}</span>
                      <span>{s.value}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#EFE6D2] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${s.value}%`, backgroundColor: s.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Financial Domino Alert Card */}
          <div
            onClick={() => onNavigate('domino')}
            className="p-6 rounded-3xl bg-gradient-to-br from-[#FFF8EE] to-[#FCEFE3] border border-[#F3D58A] shadow-sm cursor-pointer hover:shadow-md transition group"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#D9B45B]/30">
              <div className="flex items-center gap-2 text-[#D94343]">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span className="font-bold text-sm text-[#102C2B]">Financial Domino Engine</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#68746D] group-hover:translate-x-1 transition" />
            </div>

            <p className="text-xs text-[#68746D] mt-3 leading-relaxed">
              {hasData
                ? `A single ₹5,000 emergency expense would draw down your reserve buffer to ${formatINR(
                    Math.max(0, realBuffer - 5000)
                  )}${targetGoal ? ` and delay ${targetGoal.name} by ${realPostponementMonths} month(s).` : '.'}`
                : 'Simulate single unexpected shocks to see how they impact your reserve floor.'}
            </p>

            <div className="flex items-center justify-between gap-2 mt-4 p-3 rounded-2xl bg-white/70 border border-[#D9B45B]/40 text-center text-[11px] font-bold">
              <div className="flex-1">
                <span className="block text-[#D94343]">Shock</span>
                <span className="text-[#102C2B] text-xs">₹5,000</span>
              </div>
              <span className="text-[#A9822F]">→</span>
              <div className="flex-1">
                <span className="block text-[#A9822F]">Buffer</span>
                <span className="text-[#102C2B] text-xs">{formatINR(Math.max(0, realBuffer - 5000))}</span>
              </div>
              <span className="text-[#A9822F]">→</span>
              <div className="flex-1">
                <span className="block text-[#7662DF]">Impact</span>
                <span className="text-[#102C2B] text-xs">Simulate</span>
              </div>
            </div>
          </div>

          {/* Goal Optimizer Mini Widget */}
          <div className="p-6 rounded-3xl bg-[#FBF6E9] border border-[#E8DDC4] shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DDC4]/60">
              <div>
                <h3 className="font-bold text-base text-[#102C2B]">Goal Optimizer</h3>
                <p className="text-[11px] text-[#68746D]">
                  {goals.length} active milestone{goals.length === 1 ? '' : 's'}
                </p>
              </div>
              <button
                onClick={() => onNavigate('goals')}
                className="text-xs font-bold text-[#064E49] hover:underline"
              >
                Plan Goals
              </button>
            </div>

            <div className="space-y-3 mt-4">
              {goals.length === 0 ? (
                <div className="p-4 rounded-2xl bg-[#FCF8EE] border border-[#F0E7D2] text-center text-xs text-[#68746D] space-y-2">
                  <p>No milestone goals established yet.</p>
                  <button
                    onClick={() => onNavigate('goals')}
                    className="px-3 py-1.5 rounded-xl bg-[#064E49] text-white text-xs font-bold hover:bg-[#176B62]"
                  >
                    + Add Financial Goal
                  </button>
                </div>
              ) : (
                goals.slice(0, 3).map((g) => {
                  const pct = Math.min(100, Math.round((g.current / g.target) * 100));
                  return (
                    <div
                      key={g.id}
                      onClick={() => onSelectGoal(g)}
                      className="p-3 rounded-2xl bg-[#FCF8EE] border border-[#F0E7D2] hover:bg-white transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-[#D9B45B]/15">
                            {getGoalIcon(g.icon)}
                          </span>
                          <span className="font-semibold text-xs text-[#102C2B]">{g.name}</span>
                        </div>
                        <span className="text-xs font-bold text-[#102C2B]">{pct}%</span>
                      </div>

                      <div className="w-full h-1.5 rounded-full bg-[#E9E1CC] overflow-hidden mt-2.5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#2E7655] to-[#4A9670] transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[10px] text-[#68746D] mt-1.5 font-medium">
                        <span>Saved: {formatINR(g.current)}</span>
                        <span>Target: {formatINR(g.target)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
