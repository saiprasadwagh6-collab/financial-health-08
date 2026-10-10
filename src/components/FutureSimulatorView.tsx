import React, { useState } from 'react';
import { RotateCcw, TrendingUp, TrendingDown, Shield } from 'lucide-react';
import { AppState } from '../types';
import { formatINR, formatSignedINR, formatPercent } from '../utils/formatters';

interface FutureSimulatorViewProps {
  state: AppState;
}

export const FutureSimulatorView: React.FC<FutureSimulatorViewProps> = ({ state }) => {
  const [incomePct, setIncomePct] = useState(0); // -50 to +50
  const [oneTimeExpense, setOneTimeExpense] = useState(0); // 0 to 100000
  const [rentIncrease, setRentIncrease] = useState(0); // 0 to 20000
  const [savingsDelta, setSavingsDelta] = useState(0); // -16 to +30
  const [horizon, setHorizon] = useState<3 | 6 | 12>(6);

  const totalMonthlyIncome = state.transactions
    .filter((t) => t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);

  const baseExpenses = state.account.monthlyExpenses;
  const startBal = state.account.availableBalance;
  const minReserve = state.settings.minimumReserve;

  // Goals remaining deficit
  const totalGoalDeficit = state.goals.reduce((s, g) => s + Math.max(0, g.target - g.current), 0);

  // Baseline net flow
  const baseNet = totalMonthlyIncome - baseExpenses;

  // Hypothetical values
  const hypoIncome = totalMonthlyIncome * (1 + incomePct / 100);
  const hypoSavingsFromIncome = (totalMonthlyIncome * savingsDelta) / 100;
  const hypoExpenses = Math.max(0, baseExpenses + rentIncrease - hypoSavingsFromIncome);
  const hypoNet = hypoIncome - hypoExpenses;

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

  const baseRate = totalMonthlyIncome > 0 ? (baseNet / totalMonthlyIncome) * 100 : 0;
  const hypoRate = hypoIncome > 0 ? (hypoNet / hypoIncome) * 100 : 0;

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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Scenario Controls */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-[#FBF6E9] border border-[#E8DDC4] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#102C2B]">Scenario Controls</h2>
              <p className="text-xs text-[#68746D]">
                Hypothetical forward simulations. Never alters actual balance or history.
              </p>
            </div>
            <button
              onClick={handleReset}
              className="p-2 rounded-xl text-[#68746D] hover:text-[#064E49] hover:bg-black/5 transition"
              title="Reset scenario to baseline"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4 pt-1">
            {/* Income Change */}
            <div>
              <div className="flex justify-between text-xs font-bold text-[#102C2B] mb-1">
                <span>Income Change</span>
                <span className={incomePct >= 0 ? 'text-[#2E7655]' : 'text-[#D94343]'}>
                  {incomePct > 0 ? '+' : ''}
                  {incomePct}%
                </span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                step="1"
                value={incomePct}
                onChange={(e) => setIncomePct(Number(e.target.value))}
                className="w-full h-2 rounded-lg bg-[#EFE6D2] cursor-pointer"
              />
            </div>

            {/* One-Time Expense */}
            <div>
              <div className="flex justify-between text-xs font-bold text-[#102C2B] mb-1">
                <span>One-Time Shock Expense</span>
                <span className="text-[#D94343]">{formatINR(oneTimeExpense)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="60000"
                step="1000"
                value={oneTimeExpense}
                onChange={(e) => setOneTimeExpense(Number(e.target.value))}
                className="w-full h-2 rounded-lg bg-[#EFE6D2] cursor-pointer"
              />
            </div>

            {/* Rent Increase */}
            <div>
              <div className="flex justify-between text-xs font-bold text-[#102C2B] mb-1">
                <span>Monthly Rent Increase</span>
                <span className="text-[#A9822F]">+{formatINR(rentIncrease)}/mo</span>
              </div>
              <input
                type="range"
                min="0"
                max="15000"
                step="500"
                value={rentIncrease}
                onChange={(e) => setRentIncrease(Number(e.target.value))}
                className="w-full h-2 rounded-lg bg-[#EFE6D2] cursor-pointer"
              />
            </div>

            {/* Savings Rate Adjustment */}
            <div>
              <div className="flex justify-between text-xs font-bold text-[#102C2B] mb-1">
                <span>Savings Rate Tuning</span>
                <span className={savingsDelta >= 0 ? 'text-[#2E7655]' : 'text-[#D94343]'}>
                  {savingsDelta >= 0 ? '+' : ''}
                  {savingsDelta} pts
                </span>
              </div>
              <input
                type="range"
                min="-16"
                max="30"
                step="1"
                value={savingsDelta}
                onChange={(e) => setSavingsDelta(Number(e.target.value))}
                className="w-full h-2 rounded-lg bg-[#EFE6D2] cursor-pointer"
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
                    className={`py-2 rounded-xl text-xs font-bold transition ${
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
            {/* Baseline */}
            <div className="p-5 rounded-3xl bg-[#FBF6E9] border border-[#E8DDC4] shadow-sm space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#68746D]">
                Baseline Trajectory
              </span>
              <div className="text-2xl font-black text-[#102C2B]">{formatINR(baseEnd)}</div>
              <div className="pt-2 border-t border-[#E8DDC4]/60 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#68746D]">Monthly Net:</span>
                  <span className="font-bold text-[#2E7655]">{formatSignedINR(baseNet)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#68746D]">Savings Rate:</span>
                  <span className="font-bold text-[#102C2B]">{formatPercent(baseRate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#68746D]">Lowest Balance:</span>
                  <span className="font-bold text-[#102C2B]">{formatINR(baseLowest)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#68746D]">All Goals Funded:</span>
                  <span className="font-bold text-[#064E49]">
                    {Number.isFinite(baseETA) ? `${baseETA} mos` : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Hypothetical */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-[#EEEAFB] to-[#E1D9F7] border border-[#D9D0F3] shadow-sm space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7662DF]">
                Hypothetical Scenario
              </span>
              <div className="text-2xl font-black text-[#102C2B]">{formatINR(hypoEnd)}</div>
              <div className="pt-2 border-t border-[#D9D0F3]/60 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#68746D]">Monthly Net:</span>
                  <span
                    className={`font-bold ${
                      hypoNet >= 0 ? 'text-[#2E7655]' : 'text-[#D94343]'
                    }`}
                  >
                    {formatSignedINR(hypoNet)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#68746D]">Savings Rate:</span>
                  <span className="font-bold text-[#102C2B]">{formatPercent(hypoRate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#68746D]">Lowest Balance:</span>
                  <span
                    className={`font-bold ${
                      hypoLowest < minReserve ? 'text-[#D94343]' : 'text-[#102C2B]'
                    }`}
                  >
                    {formatINR(hypoLowest)}
                  </span>
                </div>
                <div className="flex justify-between">
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
                  <span className="text-[#D94343]">Reserve</span>
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
    </div>
  );
};
