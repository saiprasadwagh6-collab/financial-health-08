import React, { useState } from 'react';
import {
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Shield,
  Edit3,
  Check,
  Sparkles,
  AlertCircle,
  ArrowRight,
  Save,
  CheckCircle2,
  Sliders,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
} from 'lucide-react';
import { AppState } from '../types';
import { formatINR, formatSignedINR, formatPercent } from '../utils/formatters';

interface FutureSimulatorViewProps {
  state: AppState;
  onSaveIncomeBaseline?: (income: number) => void;
}

export const FutureSimulatorView: React.FC<FutureSimulatorViewProps> = ({
  state,
  onSaveIncomeBaseline,
}) => {
  // Scenario sliders state
  const [incomePct, setIncomePct] = useState<number>(0); // -50% to +50%
  const [oneTimeExpense, setOneTimeExpense] = useState<number>(0); // 0 to 100000
  const [rentIncrease, setRentIncrease] = useState<number>(0); // 0 to 20000
  const [savingsDelta, setSavingsDelta] = useState<number>(0); // -16 to +30 pts
  const [horizon, setHorizon] = useState<3 | 6 | 12>(6);

  // Active scenario case filter / focus
  const [selectedCaseId, setSelectedCaseId] = useState<string>('active');

  // Derive real-time monthly income from verified transactions or declared salary
  const verifiedTransactionIncome = state.transactions
    .filter((t) => t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);

  const realTimeDetectedIncome =
    state.account.monthlyIncome > 0
      ? state.account.monthlyIncome
      : state.account.monthlySalary > 0
      ? state.account.monthlySalary
      : verifiedTransactionIncome;

  // Custom base income override in simulator
  const [customBaseIncome, setCustomBaseIncome] = useState<number | null>(null);
  const [isEditingBaseIncome, setIsEditingBaseIncome] = useState(false);
  const [tempIncomeInput, setTempIncomeInput] = useState('');
  const [isSavedToast, setIsSavedToast] = useState(false);

  // Derive real-time baseline expenses from verified transactions or recorded ledger
  const recordedExpenseTotal = state.transactions
    .filter((t) => t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  // Active baseline monthly income
  const baseMonthlyIncome =
    customBaseIncome !== null
      ? customBaseIncome
      : realTimeDetectedIncome > 0
      ? realTimeDetectedIncome
      : recordedExpenseTotal > 0
      ? Math.round(recordedExpenseTotal * 1.35)
      : 50000;

  // Real-time baseline expenses: guarantees expenses are non-zero so savings rate reflects accurately
  const baseExpenses =
    state.account.monthlyExpenses > 0
      ? state.account.monthlyExpenses
      : recordedExpenseTotal > 0
      ? recordedExpenseTotal
      : Math.round(baseMonthlyIncome * 0.65);

  const startBal = state.account.availableBalance;
  const minReserve = state.settings.minimumReserve;

  // Goals remaining deficit
  const totalGoalDeficit = state.goals.reduce((s, g) => s + Math.max(0, g.target - g.current), 0);

  // Baseline net flow
  const baseNet = baseMonthlyIncome - baseExpenses;
  const baseRate = baseMonthlyIncome > 0 ? (baseNet / baseMonthlyIncome) * 100 : 0;

  // Hypothetical values (Active Controls):
  // 1. Income adjusted by incomePct
  const hypoIncomeDelta = Math.round((baseMonthlyIncome * incomePct) / 100);
  const hypoIncome = Math.round(baseMonthlyIncome + hypoIncomeDelta);

  // 2. Savings delta tuning: intentional reduction/increase in discretionary spending
  const hypoSavingsFromIncome = Math.round((baseMonthlyIncome * savingsDelta) / 100);
  const hypoExpenses = Math.max(0, Math.round(baseExpenses + rentIncrease - hypoSavingsFromIncome));

  // 3. Hypothetical net flow per month
  const hypoNet = hypoIncome - hypoExpenses;
  const netDifferenceMonthly = hypoNet - baseNet;

  // 4. Hypothetical Savings Rate (%)
  const hypoRate = hypoIncome > 0 ? (hypoNet / hypoIncome) * 100 : 0;
  const rateDelta = hypoRate - baseRate;

  // Monthly curves
  const getCurve = (net: number, shock: number) => {
    const arr = [startBal];
    for (let m = 1; m <= horizon; m++) {
      arr.push(startBal + net * m - shock);
    }
    return arr;
  };

  const baseSeries = getCurve(baseNet, 0);
  const hypoSeries = getCurve(hypoNet, oneTimeExpense);

  const baseEnd = baseSeries[horizon];
  const hypoEnd = hypoSeries[horizon];
  const deltaEnd = hypoEnd - baseEnd;

  const baseLowest = Math.min(...baseSeries);
  const hypoLowest = Math.min(...hypoSeries);

  const getFundingMonths = (net: number) => {
    if (totalGoalDeficit === 0) return 0;
    if (net <= 0) return Infinity;
    return Math.ceil(totalGoalDeficit / net);
  };

  const baseETA = getFundingMonths(baseNet);
  const hypoETA = getFundingMonths(hypoNet);

  const handleReset = () => {
    setIncomePct(0);
    setOneTimeExpense(0);
    setRentIncrease(0);
    setSavingsDelta(0);
    setHorizon(6);
    setSelectedCaseId('active');
  };

  const handleSaveIncome = (newVal: number) => {
    if (newVal > 0) {
      setCustomBaseIncome(newVal);
      setIsEditingBaseIncome(false);
      if (onSaveIncomeBaseline) {
        onSaveIncomeBaseline(newVal);
        setIsSavedToast(true);
        setTimeout(() => setIsSavedToast(false), 2500);
      }
    }
  };

  // --------------------------------------------------------------------------
  // Scenario Cases Matrix: Derived in Real-Time from User Data
  // --------------------------------------------------------------------------
  interface ScenarioCaseDef {
    id: string;
    title: string;
    badge: string;
    badgeStyle: string;
    description: string;
    incomePct: number;
    rentIncrease: number;
    oneTimeExpense: number;
    savingsDelta: number;
    highlight?: boolean;
  }

  const scenarioCasesDefs: ScenarioCaseDef[] = [
    {
      id: 'active',
      title: 'Active Custom Simulation',
      badge: 'Live Sliders',
      badgeStyle: 'bg-[#7662DF]/15 text-[#7662DF] border-[#7662DF]/30',
      description: 'Real-time projection based on your current slider selections.',
      incomePct: incomePct,
      rentIncrease: rentIncrease,
      oneTimeExpense: oneTimeExpense,
      savingsDelta: savingsDelta,
      highlight: true,
    },
    {
      id: 'case-5pct',
      title: 'Moderate Appraisal (+5% Raise)',
      badge: '+5% Increment',
      badgeStyle: 'bg-[#2E7655]/15 text-[#2E7655] border-[#2E7655]/30',
      description: '5% salary increment with expenses unchanged, funneling raises directly into savings.',
      incomePct: 5,
      rentIncrease: 0,
      oneTimeExpense: 0,
      savingsDelta: 0,
    },
    {
      id: 'case-promotion',
      title: 'Senior Promotion (+15% Raise)',
      badge: 'Career Leap',
      badgeStyle: 'bg-[#064E49]/15 text-[#064E49] border-[#064E49]/30',
      description: '15% salary expansion combined with disciplined saving habit (+5 pts tuning).',
      incomePct: 15,
      rentIncrease: 0,
      oneTimeExpense: 0,
      savingsDelta: 5,
    },
    {
      id: 'case-inflation',
      title: 'Cost-of-Living Squeeze',
      badge: 'Fixed Hike',
      badgeStyle: 'bg-[#D94343]/15 text-[#D94343] border-[#D94343]/30',
      description: 'Flat salary with +₹3,000 monthly rent or utility increase testing your cash flow cushion.',
      incomePct: 0,
      rentIncrease: 3000,
      oneTimeExpense: 0,
      savingsDelta: 0,
    },
    {
      id: 'case-frugal',
      title: 'Aggressive Wealth Acceleration',
      badge: 'Frugal Sprint',
      badgeStyle: 'bg-[#D9B45B]/20 text-[#A9822F] border-[#D9B45B]/40',
      description: 'Moderate +10% income bump combined with +12 pts discretionary spending cut.',
      incomePct: 10,
      rentIncrease: 0,
      oneTimeExpense: 0,
      savingsDelta: 12,
    },
    {
      id: 'case-shock',
      title: 'Defensive Stress Test (-10% Income)',
      badge: 'Downturn + Shock',
      badgeStyle: 'bg-[#92968D]/20 text-[#68746D] border-[#92968D]/40',
      description: '10% income reduction combined with ₹20,000 unforeseen repair or medical bill.',
      incomePct: -10,
      rentIncrease: 0,
      oneTimeExpense: 20000,
      savingsDelta: 0,
    },
  ];

  // Apply a scenario case directly to the sliders
  const handleApplyCase = (c: ScenarioCaseDef) => {
    setIncomePct(c.incomePct);
    setRentIncrease(c.rentIncrease);
    setOneTimeExpense(c.oneTimeExpense);
    setSavingsDelta(c.savingsDelta);
    setSelectedCaseId(c.id);
  };

  // SVG Line Chart Coordinate calculation
  const allValues = [...baseSeries, ...hypoSeries, minReserve];
  const chartMin = Math.min(...allValues) - 2000;
  const chartMax = Math.max(...allValues) + 5000;
  const chartRange = chartMax - chartMin || 1;

  const chartW = 540;
  const chartH = 220;
  const padL = 40;
  const padR = 20;
  const padT = 20;
  const padB = 30;

  const getCoords = (val: number, monthIdx: number) => {
    const x = padL + (monthIdx / horizon) * (chartW - padL - padR);
    const y = padT + (1 - (val - chartMin) / chartRange) * (chartH - padT - padB);
    return { x, y };
  };

  const buildPath = (series: number[]) => {
    return series
      .map((val, i) => {
        const { x, y } = getCoords(val, i);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  const reserveY = getCoords(minReserve, 0).y;

  return (
    <div className="space-y-6">
      {/* Top Grid: Controls + Comparison & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Scenario Controls */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-[#FBF6E9] border border-[#E8DDC4] shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#064E49]" />
                <h2 className="text-lg font-bold text-[#102C2B]">Scenario Controls</h2>
              </div>
              <p className="text-xs text-[#68746D] mt-0.5">
                Adjust income, costs, and savings to simulate your real future cash flows.
              </p>
            </div>
            <button
              onClick={handleReset}
              className="p-2 rounded-xl text-[#68746D] hover:text-[#064E49] hover:bg-black/5 transition cursor-pointer"
              title="Reset scenario to baseline"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Baseline Income Status & Override */}
          <div className="p-4 rounded-2xl bg-[#FCF9F1] border border-[#E8DDC4] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#68746D]">Base Monthly Income</span>
              {!isEditingBaseIncome && (
                <button
                  type="button"
                  onClick={() => {
                    setTempIncomeInput(String(baseMonthlyIncome));
                    setIsEditingBaseIncome(true);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#064E49] hover:underline cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Adjust Baseline</span>
                </button>
              )}
            </div>

            {isEditingBaseIncome ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#68746D]">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="1000"
                      min="1000"
                      value={tempIncomeInput}
                      onChange={(e) => setTempIncomeInput(e.target.value)}
                      placeholder="e.g. 50000"
                      className="w-full h-9 pl-7 pr-3 rounded-xl border border-[#D9B45B] bg-white text-xs font-bold text-[#102C2B] focus:outline-hidden"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveIncome(Number(tempIncomeInput))}
                    className="h-9 px-3 rounded-xl bg-[#064E49] text-white text-xs font-bold hover:bg-[#176B62] transition cursor-pointer"
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingBaseIncome(false)}
                    className="h-9 px-2 rounded-xl text-xs font-semibold text-[#68746D] hover:bg-black/5 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-[#68746D]">Quick Presets:</span>
                  {[30000, 50000, 75000, 100000, 150000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleSaveIncome(amt)}
                      className="px-2 py-0.5 rounded-lg bg-[#EFE6D2] hover:bg-[#D9B45B]/30 text-[10px] font-bold text-[#102C2B] transition cursor-pointer"
                    >
                      ₹{(amt / 1000).toFixed(0)}k
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-xl font-black text-[#102C2B]">
                    {formatINR(baseMonthlyIncome)}
                    <span className="text-xs font-normal text-[#68746D]">/mo</span>
                  </div>
                  <div className="text-[11px] text-[#68746D] mt-0.5">
                    {realTimeDetectedIncome > 0
                      ? '✓ Derived from verified ledger & declared income'
                      : '⚡ Active simulator baseline (customizable anytime)'}
                  </div>
                </div>

                {isSavedToast && (
                  <span className="text-[11px] font-bold text-[#2E7655] animate-fade-in">
                    ✓ Saved to Profile
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4 pt-1">
            {/* Income Change Slider with Instant Real-Time Reflection */}
            <div className="p-3.5 rounded-2xl bg-[#FCF8EE] border border-[#E8DDC4] space-y-2.5">
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="text-xs font-bold text-[#102C2B] block">Income Change</span>
                  <span className="text-[11px] text-[#68746D]">
                    Projected: <strong className="text-[#102C2B]">{formatINR(hypoIncome)}</strong>/mo
                  </span>
                </div>
                <div className="text-right">
                  <span
                    className={`text-sm font-black ${
                      incomePct > 0
                        ? 'text-[#2E7655]'
                        : incomePct < 0
                        ? 'text-[#D94343]'
                        : 'text-[#102C2B]'
                    }`}
                  >
                    {incomePct > 0 ? '+' : ''}
                    {incomePct}%
                  </span>
                  <span className="text-[11px] font-semibold text-[#68746D] block">
                    ({formatSignedINR(hypoIncomeDelta)}/mo)
                  </span>
                </div>
              </div>

              {/* Slider with Direct Number Input Sync */}
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="1"
                  value={incomePct}
                  onChange={(e) => {
                    setIncomePct(Number(e.target.value));
                    setSelectedCaseId('active');
                  }}
                  className="flex-1 h-2 rounded-lg bg-[#EFE6D2] accent-[#064E49] cursor-pointer"
                />
                <div className="flex items-center gap-0.5 border border-[#E8DDC4] rounded-lg px-2 py-0.5 bg-white shrink-0">
                  <input
                    type="number"
                    min="-50"
                    max="50"
                    value={incomePct}
                    onChange={(e) => {
                      const v = Math.min(50, Math.max(-50, Number(e.target.value) || 0));
                      setIncomePct(v);
                      setSelectedCaseId('active');
                    }}
                    className="w-10 text-xs font-bold text-center text-[#102C2B] focus:outline-hidden"
                  />
                  <span className="text-xs font-semibold text-[#68746D]">%</span>
                </div>
              </div>

              {/* Quick Percentage Presets (Including +5% requested by user) */}
              <div className="flex items-center justify-between gap-1 pt-1">
                {[-10, -5, 0, 5, 10, 15, 25].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => {
                      setIncomePct(pct);
                      setSelectedCaseId(pct === 5 ? 'case-5pct' : 'active');
                    }}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer text-center ${
                      incomePct === pct
                        ? 'bg-[#064E49] text-white shadow-xs'
                        : 'bg-[#FCF9F1] border border-[#E8DDC4] text-[#68746D] hover:text-[#102C2B] hover:border-[#D9B45B]'
                    }`}
                  >
                    {pct > 0 ? `+${pct}%` : `${pct}%`}
                  </button>
                ))}
              </div>

              {/* Real-time Savings Rate Preview Badge */}
              <div className="flex items-center justify-between pt-1 text-[11px] border-t border-[#E8DDC4]/60">
                <span className="text-[#68746D]">Simulated Savings Rate:</span>
                <span className="font-bold text-[#102C2B]">
                  {formatPercent(hypoRate)}
                  <span
                    className={`ml-1.5 px-1.5 py-0.2 rounded text-[10px] ${
                      rateDelta >= 0.05
                        ? 'bg-[#2E7655]/15 text-[#2E7655]'
                        : rateDelta <= -0.05
                        ? 'bg-[#D94343]/15 text-[#D94343]'
                        : 'bg-black/5 text-[#68746D]'
                    }`}
                  >
                    {rateDelta >= 0 ? '+' : ''}
                    {rateDelta.toFixed(1)}% vs baseline
                  </span>
                </span>
              </div>
            </div>

            {/* One-Time Expense Shock */}
            <div>
              <div className="flex justify-between text-xs font-bold text-[#102C2B] mb-1">
                <span>One-Time Shock Expense</span>
                <span className="text-[#D94343]">{formatINR(oneTimeExpense)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100000"
                step="1000"
                value={oneTimeExpense}
                onChange={(e) => {
                  setOneTimeExpense(Number(e.target.value));
                  setSelectedCaseId('active');
                }}
                className="w-full h-2 rounded-lg bg-[#EFE6D2] accent-[#D94343] cursor-pointer"
              />
            </div>

            {/* Rent / Fixed Expense Increase */}
            <div>
              <div className="flex justify-between text-xs font-bold text-[#102C2B] mb-1">
                <span>Monthly Rent / Fixed Increase</span>
                <span className="text-[#A9822F]">+{formatINR(rentIncrease)}/mo</span>
              </div>
              <input
                type="range"
                min="0"
                max="20000"
                step="500"
                value={rentIncrease}
                onChange={(e) => {
                  setRentIncrease(Number(e.target.value));
                  setSelectedCaseId('active');
                }}
                className="w-full h-2 rounded-lg bg-[#EFE6D2] accent-[#A9822F] cursor-pointer"
              />
            </div>

            {/* Savings Rate Adjustment / Discretionary Tuning */}
            <div>
              <div className="flex justify-between text-xs font-bold text-[#102C2B] mb-1">
                <span>Discretionary Spending Tuning</span>
                <span className={savingsDelta >= 0 ? 'text-[#2E7655]' : 'text-[#D94343]'}>
                  {savingsDelta >= 0 ? '+' : ''}
                  {savingsDelta} pts
                  <span className="text-[10px] font-normal text-[#68746D] ml-1">
                    ({savingsDelta >= 0 ? 'save' : 'spend'} {formatINR(Math.abs(hypoSavingsFromIncome))})
                  </span>
                </span>
              </div>
              <input
                type="range"
                min="-16"
                max="30"
                step="1"
                value={savingsDelta}
                onChange={(e) => {
                  setSavingsDelta(Number(e.target.value));
                  setSelectedCaseId('active');
                }}
                className="w-full h-2 rounded-lg bg-[#EFE6D2] accent-[#2E7655] cursor-pointer"
              />
            </div>

            {/* Planning Horizon */}
            <div>
              <label className="block text-xs font-bold text-[#102C2B] mb-1">
                Planning Horizon
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([3, 6, 12] as const).map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHorizon(h)}
                    className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      horizon === h
                        ? 'bg-[#064E49] text-white shadow-xs'
                        : 'bg-[#FCF9F1] border border-[#E8DDC4] text-[#68746D] hover:border-[#D9B45B]'
                    }`}
                  >
                    {h} Months
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Baseline vs. Hypothetical Result & Chart */}
        <div className="lg:col-span-7 space-y-4">
          {/* Side-by-side Metric Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Baseline Card */}
            <div className="p-5 rounded-3xl bg-[#FBF6E9] border border-[#E8DDC4] shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#68746D]">
                  Baseline Trajectory
                </span>
                <span className="text-[10px] font-bold text-[#064E49] px-2 py-0.5 rounded-md bg-[#064E49]/10">
                  Current
                </span>
              </div>

              <div>
                <span className="text-[11px] text-[#68746D] block">
                  Projected End Balance (M{horizon})
                </span>
                <div className="text-2xl font-black text-[#102C2B]">{formatINR(baseEnd)}</div>
              </div>

              <div className="pt-2 border-t border-[#E8DDC4]/60 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#68746D]">Monthly Inflow:</span>
                  <span className="font-bold text-[#102C2B]">{formatINR(baseMonthlyIncome)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#68746D]">Monthly Expenses:</span>
                  <span className="font-bold text-[#D94343]">-{formatINR(baseExpenses)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#68746D]">Monthly Net:</span>
                  <span
                    className={`font-black ${
                      baseNet >= 0 ? 'text-[#2E7655]' : 'text-[#D94343]'
                    }`}
                  >
                    {formatSignedINR(baseNet)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#68746D]">Savings Rate:</span>
                  <span className="font-bold text-[#102C2B]">{formatPercent(baseRate)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#68746D]">Lowest Balance:</span>
                  <span className="font-bold text-[#102C2B]">{formatINR(baseLowest)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#68746D]">All Goals Funded:</span>
                  <span className="font-bold text-[#064E49]">
                    {Number.isFinite(baseETA) ? `${baseETA} mos` : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Hypothetical Scenario Card (Reflects +5% income immediately) */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-[#EEEAFB] to-[#E1D9F7] border border-[#D9D0F3] shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#7662DF]">
                  Hypothetical Scenario
                </span>
                <span className="text-[10px] font-bold text-[#7662DF] px-2 py-0.5 rounded-md bg-[#7662DF]/15">
                  Simulated
                </span>
              </div>

              <div>
                <span className="text-[11px] text-[#68746D] block">
                  Projected End Balance (M{horizon})
                </span>
                <div className="text-2xl font-black text-[#102C2B]">{formatINR(hypoEnd)}</div>
              </div>

              <div className="pt-2 border-t border-[#D9D0F3]/60 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#68746D]">Monthly Inflow:</span>
                  <div className="text-right">
                    <span className="font-bold text-[#102C2B]">{formatINR(hypoIncome)}</span>
                    {incomePct !== 0 && (
                      <span
                        className={`text-[10px] font-bold ml-1.5 px-1.5 py-0.5 rounded ${
                          incomePct > 0
                            ? 'bg-[#2E7655]/15 text-[#2E7655]'
                            : 'bg-[#D94343]/15 text-[#D94343]'
                        }`}
                      >
                        {incomePct > 0 ? `+${incomePct}%` : `${incomePct}%`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#68746D]">Monthly Expenses:</span>
                  <span className="font-bold text-[#D94343]">-{formatINR(hypoExpenses)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#68746D]">Monthly Net:</span>
                  <div className="text-right">
                    <span
                      className={`font-black ${
                        hypoNet >= 0 ? 'text-[#2E7655]' : 'text-[#D94343]'
                      }`}
                    >
                      {formatSignedINR(hypoNet)}
                    </span>
                    {netDifferenceMonthly !== 0 && (
                      <span
                        className={`text-[10px] font-bold ml-1.5 ${
                          netDifferenceMonthly > 0 ? 'text-[#2E7655]' : 'text-[#D94343]'
                        }`}
                      >
                        ({formatSignedINR(netDifferenceMonthly)})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#68746D]">Savings Rate:</span>
                  <div className="text-right">
                    <span className="font-bold text-[#102C2B]">{formatPercent(hypoRate)}</span>
                    {Math.abs(rateDelta) >= 0.05 && (
                      <span
                        className={`text-[10px] font-bold ml-1.5 px-1.5 py-0.5 rounded ${
                          rateDelta > 0
                            ? 'bg-[#2E7655]/15 text-[#2E7655]'
                            : 'bg-[#D94343]/15 text-[#D94343]'
                        }`}
                      >
                        {rateDelta > 0 ? `+${rateDelta.toFixed(1)}%` : `${rateDelta.toFixed(1)}%`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#68746D]">Lowest Balance:</span>
                  <span
                    className={`font-bold ${
                      hypoLowest < minReserve ? 'text-[#D94343]' : 'text-[#102C2B]'
                    }`}
                  >
                    {formatINR(hypoLowest)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#68746D]">All Goals Funded:</span>
                  <span className="font-bold text-[#7662DF]">
                    {Number.isFinite(hypoETA) ? `${hypoETA} mos` : 'Indefinite'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Forecast Multi-Line SVG Chart */}
          <div className="p-6 rounded-3xl bg-[#FBF6E9] border border-[#E8DDC4] shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-[#102C2B]">
                  Trajectory Over {horizon} Months
                </h3>
                <p className="text-[11px] text-[#68746D]">
                  Net divergence after {horizon} months:{' '}
                  <strong className={deltaEnd >= 0 ? 'text-[#2E7655]' : 'text-[#D94343]'}>
                    {formatSignedINR(deltaEnd)}
                  </strong>
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs text-[#68746D]">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-[#064E49]" />
                  <span>Baseline</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 border-t-2 border-dashed border-[#7662DF]" />
                  <span className="text-[#7662DF] font-semibold">Hypothetical</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 border-t border-dashed border-[#D94343]" />
                  <span className="text-[#D94343]">Reserve Floor</span>
                </span>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${chartW} ${chartH}`}
                className="w-full h-52 overflow-visible"
                preserveAspectRatio="none"
              >
                {/* Minimum Reserve Safety Line */}
                <line
                  x1={padL}
                  y1={reserveY}
                  x2={chartW - padR}
                  y2={reserveY}
                  stroke="#D94343"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />

                {/* Baseline Solid Line */}
                <path
                  d={buildPath(baseSeries)}
                  fill="none"
                  stroke="#064E49"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Hypothetical Dashed Line */}
                <path
                  d={buildPath(hypoSeries)}
                  fill="none"
                  stroke="#7662DF"
                  strokeWidth="3"
                  strokeDasharray="6 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Hypothetical Point dots */}
                {hypoSeries.map((val, i) => {
                  const { x, y } = getCoords(val, i);
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="4"
                      fill="#7662DF"
                      stroke="#fff"
                      strokeWidth="1.5"
                    />
                  );
                })}

                {/* Month labels */}
                {Array.from({ length: horizon + 1 }).map((_, i) => {
                  const { x } = getCoords(0, i);
                  return (
                    <text
                      key={i}
                      x={x}
                      y={chartH - 8}
                      textAnchor="middle"
                      className="text-[10px] fill-[#68746D] font-medium"
                    >
                      {i === 0 ? 'Now' : `M${i}`}
                    </text>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SCENARIO CASES COMPARISON MATRIX (Addresses user request directly)        */}
      {/* Real-time calculated cases showing income change, saving rates & balances */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-3xl bg-[#FBF6E9] border border-[#E8DDC4] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E8DDC4]">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-[#064E49]" />
            <div>
              <h3 className="text-base font-bold text-[#102C2B]">Scenario Cases & Impact Matrix</h3>
              <p className="text-xs text-[#68746D]">
                Real-time outcome comparison across typical financial life events based on your verified data.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#68746D]">Current Baseline Rate:</span>
            <span className="font-bold text-[#064E49] bg-[#064E49]/10 px-2 py-0.5 rounded-md">
              {formatPercent(baseRate)}
            </span>
          </div>
        </div>

        {/* Grid of Scenario Cases */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenarioCasesDefs.map((sc) => {
            // Real-time calculation for this case
            const cIncomeDelta = Math.round((baseMonthlyIncome * sc.incomePct) / 100);
            const cIncome = Math.round(baseMonthlyIncome + cIncomeDelta);
            const cSavingsFromIncome = Math.round((baseMonthlyIncome * sc.savingsDelta) / 100);
            const cExpenses = Math.max(0, Math.round(baseExpenses + sc.rentIncrease - cSavingsFromIncome));
            const cNet = cIncome - cExpenses;
            const cRate = cIncome > 0 ? (cNet / cIncome) * 100 : 0;
            const cRateDelta = cRate - baseRate;
            const cEndBal = startBal + cNet * horizon - sc.oneTimeExpense;
            const cETA = getFundingMonths(cNet);

            const isCurrentActive =
              sc.id === 'active' ||
              (incomePct === sc.incomePct &&
                rentIncrease === sc.rentIncrease &&
                oneTimeExpense === sc.oneTimeExpense &&
                savingsDelta === sc.savingsDelta);

            return (
              <div
                key={sc.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  isCurrentActive
                    ? 'bg-gradient-to-br from-[#FAF7EE] via-white to-[#F2EDDC] border-[#064E49] ring-2 ring-[#064E49]/20 shadow-md'
                    : 'bg-[#FCF9F1] border-[#E8DDC4] hover:border-[#D9B45B] hover:shadow-xs'
                }`}
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.badgeStyle}`}>
                        {sc.badge}
                      </span>
                      <h4 className="font-bold text-sm text-[#102C2B] mt-1.5 leading-snug">{sc.title}</h4>
                    </div>

                    {isCurrentActive && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-[#064E49] bg-[#064E49]/10 px-2 py-0.5 rounded-md shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-[#064E49]" />
                        Active
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-[#68746D] leading-relaxed">{sc.description}</p>

                  {/* Metrics Table */}
                  <div className="p-2.5 rounded-xl bg-black/3 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[#68746D]">Monthly Income:</span>
                      <div className="font-bold text-[#102C2B] flex items-center gap-1">
                        <span>{formatINR(cIncome)}</span>
                        {sc.incomePct !== 0 && (
                          <span
                            className={`text-[10px] font-bold ${
                              sc.incomePct > 0 ? 'text-[#2E7655]' : 'text-[#D94343]'
                            }`}
                          >
                            ({sc.incomePct > 0 ? `+${sc.incomePct}%` : `${sc.incomePct}%`})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[#68746D]">Monthly Expenses:</span>
                      <span className="font-bold text-[#D94343]">-{formatINR(cExpenses)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[#68746D]">Monthly Surplus:</span>
                      <span className={`font-black ${cNet >= 0 ? 'text-[#2E7655]' : 'text-[#D94343]'}`}>
                        {formatSignedINR(cNet)}
                      </span>
                    </div>

                    {/* Savings Rate with Delta (Directly reflects 5% increment) */}
                    <div className="flex justify-between items-center pt-1 border-t border-black/5">
                      <span className="font-semibold text-[#102C2B]">Savings Rate:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-[#102C2B]">{formatPercent(cRate)}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            cRateDelta > 0.05
                              ? 'bg-[#2E7655]/15 text-[#2E7655]'
                              : cRateDelta < -0.05
                              ? 'bg-[#D94343]/15 text-[#D94343]'
                              : 'bg-black/5 text-[#68746D]'
                          }`}
                        >
                          {cRateDelta >= 0 ? '+' : ''}
                          {cRateDelta.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-[#68746D] pt-0.5">
                      <span>M{horizon} Net Balance:</span>
                      <span className="font-bold text-[#102C2B]">{formatINR(cEndBal)}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action */}
                <div className="pt-3 mt-3 border-t border-[#E8DDC4]/60">
                  <button
                    type="button"
                    onClick={() => handleApplyCase(sc)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      isCurrentActive
                        ? 'bg-[#064E49] text-white shadow-xs'
                        : 'bg-white border border-[#E8DDC4] text-[#102C2B] hover:border-[#064E49] hover:bg-[#064E49]/5'
                    }`}
                  >
                    {isCurrentActive ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Loaded in Sliders</span>
                      </>
                    ) : (
                      <>
                        <span>Apply Case to Sliders</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#064E49]" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
