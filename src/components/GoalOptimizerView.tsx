import React, { useState } from 'react';
import {
  Target,
  Plus,
  Shield,
  Laptop,
  Plane,
  Car,
  Pencil,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react';
import { Goal } from '../types';
import { formatINR } from '../utils/formatters';

interface GoalOptimizerViewProps {
  goals: Goal[];
  goalContribution: number;
  onUpdateContribution: (amount: number) => void;
  onAddGoal: (goal: Omit<Goal, 'id'>) => void;
  onUpdateGoal: (goal: Goal) => void;
  onDeleteGoal: (id: string) => void;
  onQuickDeposit: (goalId: string, amount: number) => void;
}

export const GoalOptimizerView: React.FC<GoalOptimizerViewProps> = ({
  goals,
  goalContribution,
  onUpdateContribution,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onQuickDeposit,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [current, setCurrent] = useState('');
  const [target, setTarget] = useState('');
  const [icon, setIcon] = useState('target');
  const [error, setError] = useState('');

  const openAddModal = () => {
    setEditingGoal(null);
    setName('');
    setCurrent('0');
    setTarget('');
    setIcon('target');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (g: Goal) => {
    setEditingGoal(g);
    setName(g.name);
    setCurrent(String(g.current));
    setTarget(String(g.target));
    setIcon(g.icon);
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a goal name.');
      return;
    }
    const targetNum = parseFloat(target);
    if (!targetNum || targetNum <= 0) {
      setError('Target must be greater than ₹0.');
      return;
    }
    const currentNum = parseFloat(current) || 0;
    if (currentNum > targetNum) {
      setError('Saved amount cannot exceed target.');
      return;
    }

    if (editingGoal) {
      onUpdateGoal({
        ...editingGoal,
        name: name.trim(),
        current: Math.round(currentNum),
        target: Math.round(targetNum),
        icon,
      });
    } else {
      onAddGoal({
        name: name.trim(),
        current: Math.round(currentNum),
        target: Math.round(targetNum),
        icon,
      });
    }

    setIsModalOpen(false);
  };

  // Optimized Allocation Math
  const remainingList = goals.map((g) => Math.max(0, g.target - g.current));
  const totalRemaining = remainingList.reduce((s, r) => s + r, 0);

  const allocationPlan = goals.map((g, i) => {
    const rem = remainingList[i];
    const alloc = totalRemaining > 0 ? (rem / totalRemaining) * goalContribution : 0;
    const months = rem === 0 ? 0 : alloc > 0 ? Math.ceil(rem / alloc) : Infinity;
    return {
      goal: g,
      remaining: rem,
      allocation: Math.round(alloc),
      months,
      onTrack: months <= 24,
    };
  });

  const getGoalIcon = (iconName: string) => {
    switch (iconName) {
      case 'shield':
        return <Shield className="w-5 h-5 text-[#A9822F]" />;
      case 'laptop':
        return <Laptop className="w-5 h-5 text-[#1C4E86]" />;
      case 'plane':
        return <Plane className="w-5 h-5 text-[#7662DF]" />;
      case 'car':
        return <Car className="w-5 h-5 text-[#2E7655]" />;
      default:
        return <Target className="w-5 h-5 text-[#2E7655]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Configuration Toolbar */}
      <div className="p-6 rounded-3xl bg-[#FBF6E9] border border-[#E8DDC4] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[#102C2B]">Goal Savings Engine</h2>
          <p className="text-xs text-[#68746D]">
            Set your total monthly budget dedicated to milestones. The optimizer allocates funds by deficit gravity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-[#102C2B] whitespace-nowrap">
              Monthly Savings:
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#68746D]">
                ₹
              </span>
              <input
                type="number"
                step="500"
                min="0"
                value={goalContribution}
                onChange={(e) => onUpdateContribution(Math.max(0, Number(e.target.value)))}
                className="w-28 sm:w-32 h-10 pl-7 pr-3 rounded-xl border border-[#E8DDC4] bg-[#FCF9F1] text-sm font-bold text-[#102C2B] focus:outline-hidden focus:border-[#D9B45B]"
              />
            </div>
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#064E49] text-white text-xs sm:text-sm font-bold hover:bg-[#176B62] transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Goal</span>
          </button>
        </div>
      </div>

      {/* Goals Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {goals.map((g) => {
          const pct = Math.min(100, Math.round((g.current / g.target) * 100));
          const rem = Math.max(0, g.target - g.current);
          const isDone = rem === 0;

          return (
            <div
              key={g.id}
              className="p-5 rounded-3xl bg-[#FBF6E9] border border-[#E8DDC4] shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-white border border-[#E8DDC4]">
                    {getGoalIcon(g.icon)}
                  </div>
                  <span className="text-sm font-black text-[#102C2B]">{pct}%</span>
                </div>

                <div className="mt-3">
                  <h3 className="font-bold text-base text-[#102C2B] truncate">{g.name}</h3>
                  <div className="text-xs text-[#68746D] mt-0.5">
                    {formatINR(g.current)} of {formatINR(g.target)}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-[#E9E1CC] overflow-hidden mt-3">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#2E7655] to-[#4A9670] transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="text-[11px] text-[#68746D] mt-2 font-medium">
                  {isDone ? (
                    <span className="text-[#2E7655] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Fully Funded!
                    </span>
                  ) : (
                    <span>{formatINR(rem)} deficit remaining</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#E8DDC4]/60">
                <button
                  onClick={() => openEditModal(g)}
                  className="flex-1 py-1.5 px-2.5 rounded-xl border border-[#E8DDC4] bg-white text-xs font-bold text-[#102C2B] hover:bg-[#F5ECD9] transition flex items-center justify-center gap-1"
                >
                  <Pencil className="w-3.5 h-3.5 text-[#68746D]" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => onQuickDeposit(g.id, 1000)}
                  disabled={isDone}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-[#064E49] disabled:bg-[#92968D] text-white text-xs font-bold hover:bg-[#176B62] transition flex items-center justify-center gap-1 shadow-xs"
                  title="Deposit ₹1,000 from current balance"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+₹1,000</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Optimized Allocation Table */}
      <div className="p-6 rounded-3xl bg-[#FBF6E9] border border-[#E8DDC4] shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#102C2B]">Optimized Allocation Schedule</h2>
          <p className="text-xs text-[#68746D] mt-0.5">
            Mathematical proportional split of your {formatINR(goalContribution)}/mo savings based on
            remaining funding gap.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#E8DDC4]/60">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#F5ECD9] text-[#68746D] border-b border-[#E8DDC4]/60">
              <tr>
                <th className="py-3 px-4 font-semibold">Goal Milestone</th>
                <th className="py-3 px-4 font-semibold text-right">Remaining Deficit</th>
                <th className="py-3 px-4 font-semibold text-right">Monthly Allocation</th>
                <th className="py-3 px-4 font-semibold text-right">Est. Completion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DDC4]/40 bg-[#FCF8EE]">
              {allocationPlan.map((p) => (
                <tr key={p.goal.id} className="hover:bg-white/80 transition">
                  <td className="py-3 px-4 font-bold text-[#102C2B]">{p.goal.name}</td>
                  <td className="py-3 px-4 text-right font-medium text-[#68746D]">
                    {formatINR(p.remaining)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-[#2E7655]">
                    {formatINR(p.allocation)}/mo
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-[#064E49]">
                    {p.remaining === 0
                      ? 'Completed'
                      : Number.isFinite(p.months)
                      ? `${p.months} month${p.months === 1 ? '' : 's'}`
                      : 'No allocation'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#FCF9F1] border border-[#E8DDC4] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DDC4]">
              <h3 className="font-bold text-lg text-[#102C2B]">
                {editingGoal ? 'Edit Milestone Goal' : 'Add New Milestone Goal'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-black/5"
              >
                <X className="w-5 h-5 text-[#68746D]" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-[#D94343]/10 border border-[#D94343]/30 text-xs text-[#D94343] font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-[#102C2B] mb-1">Goal Name</label>
                <input
                  type="text"
                  placeholder="e.g. Europe Vacation, New Laptop"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-[#E8DDC4] bg-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#102C2B] mb-1">Saved So Far (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={current}
                    onChange={(e) => setCurrent(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-[#E8DDC4] bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#102C2B] mb-1">Target Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 50000"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-[#E8DDC4] bg-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#102C2B] mb-1">Icon Representation</label>
                <select
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-[#E8DDC4] bg-white font-semibold"
                >
                  <option value="target">Bullseye Target</option>
                  <option value="shield">Emergency Shield</option>
                  <option value="laptop">Laptop / Workstation</option>
                  <option value="plane">Travel Flight</option>
                  <option value="car">Vehicle / Bike</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#E8DDC4]">
                {editingGoal ? (
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteGoal(editingGoal.id);
                      setIsModalOpen(false);
                    }}
                    className="text-xs font-bold text-[#D94343] hover:underline"
                  >
                    Delete Goal
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[#68746D] hover:bg-black/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#064E49] text-white text-xs sm:text-sm font-bold hover:bg-[#176B62] transition"
                  >
                    Save Goal
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
