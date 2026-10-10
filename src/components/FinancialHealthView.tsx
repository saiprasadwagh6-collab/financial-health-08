import React from 'react';
import { FinancialHealth } from '../types';
import { formatINR } from '../utils/formatters';

interface FinancialHealthViewProps {
  health: FinancialHealth;
  monthlyIncome: number;
}

export const FinancialHealthView: React.FC<FinancialHealthViewProps> = ({
  health,
  monthlyIncome,
}) => {
  const benchmarkGuide: Record<string, number> = {
    Needs: 50,
    Wants: 30,
    Savings: 20,
  };

  return (
    <div className="space-y-6">
      {/* 2-column top grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Health Score Card */}
        <div className="p-6 rounded-3xl bg-[#FBF6E9] border border-[#E8DDC4] shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#102C2B]">Overall Health Score</h2>
            <p className="text-xs text-[#68746D] mt-0.5">
              Holistic financial wellness rating combining reserve liquidity, debt load, and budget distribution.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-8 py-6 my-auto">
            {/* Donut Graphic */}
            <div className="relative w-44 h-44 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#EFE6D2"
                  strokeWidth="14"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#064E49"
                  strokeWidth="14"
                  strokeDasharray={`${(health.score / 100) * 238.7} 238.7`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-black text-[#102C2B] leading-none">
                  {health.score}
                </span>
                <span className="text-xs font-bold text-[#68746D] mt-0.5">/ 100</span>
                <span className="text-xs font-bold text-[#2E7655] uppercase mt-1">
                  {health.label}
                </span>
              </div>
            </div>

            {/* Split Breakdown */}
            <div className="flex-1 space-y-3 w-full">
              {health.split.map((s) => (
                <div key={s.key} className="space-y-1">
                  <div className="flex justify-between items-baseline text-xs font-bold text-[#102C2B]">
                    <span>
                      {s.key} · {formatINR((monthlyIncome * s.value) / 100)}/mo
                    </span>
                    <span className="text-sm font-extrabold">{s.value}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#EFE6D2] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${s.value}%`, backgroundColor: s.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#E7F0DE]/60 border border-[#CFE0C4] text-xs text-[#2E7655] font-semibold">
            ✦ Your 24% savings rate exceeds the recommended 20% benchmark, providing great resistance against economic headwinds.
          </div>
        </div>

        {/* Score Factors */}
        <div className="p-6 rounded-3xl bg-[#FBF6E9] border border-[#E8DDC4] shadow-sm space-y-4">
          <div>
            <h2 className="text-xl font-bold text-[#102C2B]">Score Factors</h2>
            <p className="text-xs text-[#68746D] mt-0.5">
              The four pillar metrics that govern your financial flight trajectory.
            </p>
          </div>

          <div className="space-y-3.5">
            {health.factors.map((f, i) => (
              <div
                key={f.name}
                className="p-3.5 rounded-2xl bg-[#FCF8EE] border border-[#F0E7D2] space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs font-bold text-[#102C2B]">
                  <span>{f.name}</span>
                  <span className="text-[#064E49]">{f.score}/100</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#E9E1CC] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#064E49] to-[#2E7655]"
                    style={{ width: `${f.score}%` }}
                  />
                </div>
                <p className="text-[11px] text-[#68746D] leading-snug">{f.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 50/30/20 Benchmark Comparison */}
      <div className="p-6 rounded-3xl bg-[#FBF6E9] border border-[#E8DDC4] shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#102C2B]">
            Spending Split vs. 50/30/20 Guideline
          </h2>
          <p className="text-xs text-[#68746D] mt-0.5">
            Your actual spending distribution compared against the renowned 50/30/20 balanced budget rule.
          </p>
        </div>

        <div className="space-y-4 pt-2">
          {health.split.map((s) => {
            const benchmark = benchmarkGuide[s.key] || 30;
            return (
              <div key={s.key} className="space-y-1.5">
                <div className="flex justify-between items-baseline text-xs font-bold text-[#102C2B]">
                  <span>{s.key}</span>
                  <span className="text-xs text-[#68746D]">
                    Actual: <strong className="text-[#102C2B]">{s.value}%</strong> (Guide: {benchmark}%)
                  </span>
                </div>

                <div className="relative h-6 rounded-xl bg-[#EFE6D2] overflow-hidden p-0.5 flex items-center">
                  {/* Actual bar */}
                  <div
                    className="h-full rounded-lg transition-all duration-700"
                    style={{ width: `${s.value}%`, backgroundColor: s.color }}
                  />
                  {/* Guideline marker needle */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-[#102C2B] z-10 shadow-xs"
                    style={{ left: `${benchmark}%` }}
                    title={`Guideline: ${benchmark}%`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
