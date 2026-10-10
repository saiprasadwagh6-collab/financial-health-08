import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Wallet,
  Target,
  Sparkles,
  CreditCard,
  Zap,
} from 'lucide-react';
import { AppState, Goal } from '../types';
import { formatINR } from '../utils/formatters';

interface DominoViewProps {
  state: AppState;
}

export const DominoView: React.FC<DominoViewProps> = ({ state }) => {
  const [eventName, setEventName] = useState('Unexpected medical bill');
  const [eventAmount, setEventAmount] = useState<number>(5000);
  const [selectedGoalId, setSelectedGoalId] = useState<string>(
    state.goals[0]?.id || ''
  );

  const buffer = state.account.reserveBuffer;
  const minimumReserve = state.settings.minimumReserve;
  const contribution = state.goalContribution > 0 ? state.goalContribution : 2500;

  const selectedGoal = state.goals.find((g) => g.id === selectedGoalId) || state.goals[0];

  // Calculations strictly from real data
  const remainingBuffer = buffer - eventAmount;
  const safeRemaining = Math.max(0, remainingBuffer);
  const reserveDeficit = Math.max(0, -remainingBuffer);
  const monthsDelay =
    eventAmount <= 0
      ? 0
      : contribution > 0
      ? Math.ceil(eventAmount / contribution)
      : 1;

  // Presets
  const presets = [
    { label: 'Minor repair · ₹2,000', event: 'Minor appliance repair', amount: 2000 },
    { label: 'Unforeseen bill · ₹5,000', event: 'Unforeseen bill', amount: 5000 },
    { label: 'Medical emergency · ₹15,000', event: 'Medical emergency', amount: 15000 },
    { label: 'Vehicle repair · ₹25,000', event: 'Vehicle repair', amount: 25000 },
  ];

  // Alternatives calculations using real data
  const efGoal = state.goals.find((g) => /emergency|reserve/i.test(g.name));
  const efCovered = efGoal ? efGoal.current >= eventAmount : false;
  const efRemaining = efGoal ? Math.max(0, efGoal.current - eventAmount) : 0;

  const emiMonthly = Math.round(eventAmount / 3);
  const emiBufferRemaining = buffer - emiMonthly;

  const actualMonthlyExpenses = state.account.monthlyExpenses;
  const wantsMonthly = Math.round(actualMonthlyExpenses * 0.3);
  const wantsCut = Math.max(500, Math.round(wantsMonthly * 0.2));
  const weeksToRecover = Math.ceil(eventAmount / (wantsCut / 4.33 || 1));

  const freelanceGig = 3000;
  const netShock = Math.max(0, eventAmount - freelanceGig);
  const gigDelayMonths = netShock === 0 ? 0 : Math.ceil(netShock / contribution);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Trigger Event Simulator */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-[#FBF6E9] border border-[#E8DDC4] shadow-sm space-y-4">
          <div>
            <div className="flex items-center gap-2 text-[#D94343]">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h2 className="text-lg font-bold text-[#102C2B]">Trigger Event Simulator</h2>
            </div>
            <p className="text-xs text-[#68746D] mt-1 leading-relaxed">
              Test hypothetical shocks against your real liquid reserve buffer of{' '}
              <strong className="text-[#102C2B]">{formatINR(buffer)}</strong>.
            </p>
          </div>

          <div className="space-y-3.5 pt-1">
            <div>
              <label className="block text-xs font-semibold text-[#102C2B] mb-1">
                Event Description
              </label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl border border-[#E8DDC4] bg-[#FCF9F1] text-xs sm:text-sm text-[#102C2B] focus:outline-hidden focus:border-[#D9B45B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#102C2B] mb-1">
                Shock Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={eventAmount}
                onChange={(e) => setEventAmount(Math.max(0, Number(e.target.value)))}
                className="w-full h-10 px-3.5 rounded-xl border border-[#E8DDC4] bg-[#FCF9F1] text-xs sm:text-sm font-bold text-[#102C2B] focus:outline-hidden focus:border-[#D9B45B]"
              />
            </div>

            <div>
              <span className="block text-xs font-semibold text-[#102C2B] mb-1.5">
                Quick Scenario Presets
              </span>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setEventName(p.event);
                      setEventAmount(p.amount);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      eventAmount === p.amount && eventName === p.event
                        ? 'bg-[#064E49] text-white shadow-xs'
                        : 'bg-[#FCF9F1] border border-[#E8DDC4] text-[#68746D] hover:border-[#D9B45B] hover:text-[#102C2B]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#102C2B] mb-1">
                Impacted Milestone Goal
              </label>
              {state.goals.length === 0 ? (
                <div className="p-3 rounded-xl bg-[#FCF8EE] border border-[#E8DDC4] text-xs text-[#68746D]">
                  No goals created yet. Head to Goal Optimizer to add a target milestone.
                </div>
              ) : (
                <select
                  value={selectedGoalId}
                  onChange={(e) => setSelectedGoalId(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-[#E8DDC4] bg-[#FCF9F1] text-xs sm:text-sm font-semibold text-[#102C2B] focus:outline-hidden focus:border-[#D9B45B]"
                >
                  {state.goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} (Current: {formatINR(g.current)})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Domino Chain Visualizer */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-[#FBF6E9] border border-[#E8DDC4] shadow-sm space-y-5">
          <div>
            <h2 className="text-lg font-bold text-[#102C2B]">Consequence Chain</h2>
            <p className="text-xs text-[#68746D] mt-0.5">
              Visualizing the domino reaction: Unplanned Outflow → Buffer Depletion → Milestone Delay.
            </p>
          </div>

          {/* 3 Step Domino Chain */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center py-2">
            {/* Step 1: Trigger Event */}
            <div className="sm:col-span-2 p-4 rounded-2xl bg-[#FCF8EE] border border-[#F0E7D2] text-center space-y-1">
              <div className="w-10 h-10 mx-auto rounded-full bg-[#D94343]/15 text-[#D94343] flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              <div className="text-xs text-[#68746D] font-medium truncate">{eventName}</div>
              <div className="text-lg font-black text-[#D94343]">{formatINR(eventAmount)}</div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center text-[#D9B45B]">
              <ArrowRight className="w-6 h-6 rotate-90 sm:rotate-0" />
            </div>

            {/* Step 2: Buffer Depletion */}
            <div className="sm:col-span-2 p-4 rounded-2xl bg-[#FCF8EE] border border-[#F0E7D2] text-center space-y-1">
              <div className="w-10 h-10 mx-auto rounded-full bg-[#A9822F]/15 text-[#A9822F] flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="text-xs text-[#68746D] font-medium">Reserve Buffer Remaining</div>
              <div
                className={`text-lg font-black ${
                  reserveDeficit > 0 ? 'text-[#D94343]' : 'text-[#A9822F]'
                }`}
              >
                {formatINR(safeRemaining)}
              </div>
              {reserveDeficit > 0 && (
                <div className="text-[10px] text-[#D94343] font-bold">
                  Deficit: -{formatINR(reserveDeficit)}
                </div>
              )}
            </div>
          </div>

          {/* Goal Delay Alert Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FFF5F2] to-[#FDE8E3] border border-[#F3CFC6] space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-[#D94343]">
              <Target className="w-4 h-4" />
              <span>
                {selectedGoal ? `${selectedGoal.name} delayed by ~${monthsDelay} month(s)` : `Savings delayed by ~${monthsDelay} month(s)`}
              </span>
            </div>
            <p className="text-xs text-[#5D3A33] leading-relaxed">
              An unplanned <strong>{formatINR(eventAmount)}</strong> outflow shifts your liquid safety buffer from{' '}
              <strong>{formatINR(buffer)}</strong> to <strong>{formatINR(safeRemaining)}</strong>.{' '}
              {reserveDeficit > 0 ? (
                <span className="text-[#D94343] font-semibold">
                  This breaches your safety floor by {formatINR(reserveDeficit)} below the{' '}
                  {formatINR(minimumReserve)} threshold.{' '}
                </span>
              ) : (
                <span>You safely remain above the {formatINR(minimumReserve)} threshold.{' '}</span>
              )}
              {selectedGoal ? (
                <span>
                  Replenishing this deficit postpones <strong>{selectedGoal.name}</strong> by{' '}
                  <strong>{monthsDelay} month{monthsDelay === 1 ? '' : 's'}</strong>.
                </span>
              ) : (
                <span>Add goals in Goal Optimizer to track exact project timelines.</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Alternative Mitigation Scenarios */}
      <div className="p-6 rounded-3xl bg-[#FBF6E9] border border-[#E8DDC4] shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#102C2B]">Alternative Mitigation Scenarios</h2>
          <p className="text-xs text-[#68746D] mt-0.5">
            Practical options to soften or neutralize the shock without breaking safety reserves.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* Option 1: Emergency Fund */}
          <div className="p-4 rounded-2xl bg-[#FCF8EE] border border-[#F0E7D2] flex flex-col justify-between space-y-3">
            <div>
              <div className="text-xs font-bold text-[#064E49] uppercase tracking-wider">
                Option 1: Emergency Fund
              </div>
              <p className="text-xs text-[#68746D] mt-1.5 leading-snug">
                {efGoal
                  ? `Utilize your dedicated emergency fund of ${formatINR(efGoal.current)}.`
                  : 'Establish a dedicated Emergency Fund goal to absorb unexpected outflows.'}
              </p>
            </div>
            <div
              className={`text-xs font-bold pt-2 border-t border-[#E8DDC4] ${
                efGoal && efCovered ? 'text-[#2E7655]' : 'text-[#D94343]'
              }`}
            >
              {efGoal
                ? efCovered
                  ? `Leaves ${formatINR(efRemaining)} in emergency fund. Goals intact!`
                  : `Short by ${formatINR(eventAmount - efGoal.current)}`
                : 'No emergency fund set'}
            </div>
          </div>

          {/* Option 2: 3-Month EMI */}
          <div className="p-4 rounded-2xl bg-[#FCF8EE] border border-[#F0E7D2] flex flex-col justify-between space-y-3">
            <div>
              <div className="text-xs font-bold text-[#064E49] uppercase tracking-wider">
                Option 2: 3-Month No-Cost Split
              </div>
              <p className="text-xs text-[#68746D] mt-1.5 leading-snug">
                Distribute over 3 monthly installments of {formatINR(emiMonthly)} instead of a single shock.
              </p>
            </div>
            <div
              className={`text-xs font-bold pt-2 border-t border-[#E8DDC4] ${
                emiBufferRemaining >= 0 ? 'text-[#2E7655]' : 'text-[#D94343]'
              }`}
            >
              {emiBufferRemaining >= 0
                ? `Buffer retains ${formatINR(emiBufferRemaining)} safety`
                : 'Buffer breached'}
            </div>
          </div>

          {/* Option 3: Trim Wants by 20% */}
          <div className="p-4 rounded-2xl bg-[#FCF8EE] border border-[#F0E7D2] flex flex-col justify-between space-y-3">
            <div>
              <div className="text-xs font-bold text-[#064E49] uppercase tracking-wider">
                Option 3: Trim Discretionary 20%
              </div>
              <p className="text-xs text-[#68746D] mt-1.5 leading-snug">
                Cut dining & discretionary expenses by {formatINR(wantsCut)}/mo temporarily until recovered.
              </p>
            </div>
            <div className="text-xs font-bold text-[#2E7655] pt-2 border-t border-[#E8DDC4]">
              Fully recovered in ~{weeksToRecover} week{weeksToRecover === 1 ? '' : 's'}
            </div>
          </div>

          {/* Option 4: One-Off Side Gig */}
          <div className="p-4 rounded-2xl bg-[#FCF8EE] border border-[#F0E7D2] flex flex-col justify-between space-y-3">
            <div>
              <div className="text-xs font-bold text-[#064E49] uppercase tracking-wider">
                Option 4: Freelance / Side Gig
              </div>
              <p className="text-xs text-[#68746D] mt-1.5 leading-snug">
                Generate a one-off weekend project payout of ₹3,000 to absorb the brunt.
              </p>
            </div>
            <div className="text-xs font-bold text-[#7662DF] pt-2 border-t border-[#E8DDC4]">
              Reduces delay to {gigDelayMonths} month{gigDelayMonths === 1 ? '' : 's'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
