import React, { useState } from 'react';
import { Landmark, Wallet, Calendar, Shield, Check, X, Sparkles } from 'lucide-react';
import { UserAccount, UserSettings } from '../types';
import { formatINR } from '../utils/formatters';

interface AccountSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: UserAccount;
  settings: UserSettings;
  onSave: (updatedAccount: Partial<UserAccount>, updatedSettings?: Partial<UserSettings>) => void;
}

export const AccountSetupModal: React.FC<AccountSetupModalProps> = ({
  isOpen,
  onClose,
  account,
  settings,
  onSave,
}) => {
  const [openingBalance, setOpeningBalance] = useState<string>(
    account.openingBalance > 0 ? String(account.openingBalance) : ''
  );
  const [monthlySalary, setMonthlySalary] = useState<string>(
    account.monthlySalary > 0 ? String(account.monthlySalary) : ''
  );
  const [salaryCreditDay, setSalaryCreditDay] = useState<number>(account.salaryCreditDay || 1);
  const [primaryBank, setPrimaryBank] = useState<string>(account.primaryBank || '');
  const [minimumReserve, setMinimumReserve] = useState<string>(
    settings.minimumReserve > 0 ? String(settings.minimumReserve) : '5000'
  );
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const balNum = parseFloat(openingBalance);
    if (isNaN(balNum) || balNum < 0) {
      setError('Please enter a valid current bank balance (0 or greater).');
      return;
    }

    const salNum = parseFloat(monthlySalary) || 0;
    const resNum = parseFloat(minimumReserve) || 5000;

    onSave(
      {
        openingBalance: Math.round(balNum),
        monthlySalary: Math.round(salNum),
        salaryCreditDay,
        primaryBank: primaryBank.trim(),
        isSetupCompleted: true,
      },
      {
        minimumReserve: Math.round(resNum),
      }
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-[#FCF9F1] border border-[#E8DDC4] rounded-3xl shadow-2xl p-6 sm:p-7 max-h-[92vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E8DDC4]">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-[#064E49] text-[#F3D58A] shadow-md">
              <Landmark className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-[#102C2B]">Account Baseline & Balance Setup</h2>
              <p className="text-xs text-[#68746D]">
                Configure your real-time bank balance and regular salary schedule
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 text-[#68746D]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-[#D94343]/10 border border-[#D94343]/30 text-xs font-semibold text-[#D94343]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {/* Question 1: Current Real Bank Balance */}
          <div className="p-4 rounded-2xl bg-[#FFF9EF] border border-[#D9B45B] space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-[#064E49] flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#A9822F]" />
                <span>What is your current actual Bank Balance? *</span>
              </label>
              <span className="text-[11px] font-bold text-[#2E7655]">Base Ledger Balance</span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-base text-[#102C2B]">
                ₹
              </span>
              <input
                type="number"
                step="1"
                min="0"
                required
                placeholder="e.g. 50000"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className="w-full h-12 pl-9 pr-3.5 rounded-xl border border-[#D9B45B] bg-white font-black text-base text-[#102C2B] focus:outline-hidden focus:ring-2 focus:ring-[#064E49]/20"
              />
            </div>
            <p className="text-[11px] text-[#68746D] leading-relaxed">
              ✦ Entering your actual balance prevents your balance from turning negative when importing statements that only contain debit expenses. All imported debits and credits will update this baseline.
            </p>
          </div>

          {/* Question 2 & 3: Monthly Salary & Credit Day */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-[#102C2B] mb-1">
                Typical Monthly Salary / Inflow (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#68746D]">
                  ₹
                </span>
                <input
                  type="number"
                  step="500"
                  min="0"
                  placeholder="e.g. 45000"
                  value={monthlySalary}
                  onChange={(e) => setMonthlySalary(e.target.value)}
                  className="w-full h-10 pl-7 pr-3 rounded-xl border border-[#E8DDC4] bg-white font-bold"
                />
              </div>
              <span className="text-[10px] text-[#68746D] block mt-0.5">
                Expected recurring monthly take-home
              </span>
            </div>

            <div>
              <label className="block font-semibold text-[#102C2B] mb-1">
                Salary Credit Day of Month
              </label>
              <select
                value={salaryCreditDay}
                onChange={(e) => setSalaryCreditDay(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl border border-[#E8DDC4] bg-white font-bold"
              >
                {[1, 2, 3, 4, 5, 7, 10, 15, 20, 25, 28, 30, 31].map((d) => (
                  <option key={d} value={d}>
                    {d}{d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'} of each month
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-[#68746D] block mt-0.5">
                Automatically credited into cash flow forecast
              </span>
            </div>
          </div>

          {/* Question 4: Primary Bank & Reserve Floor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-[#102C2B] mb-1">Primary Bank Name</label>
              <input
                type="text"
                placeholder="e.g. HDFC Bank, SBI, ICICI"
                value={primaryBank}
                onChange={(e) => setPrimaryBank(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-[#E8DDC4] bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#102C2B] mb-1">
                Minimum Reserve Floor to Protect (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#68746D]">
                  ₹
                </span>
                <input
                  type="number"
                  step="500"
                  min="0"
                  placeholder="5000"
                  value={minimumReserve}
                  onChange={(e) => setMinimumReserve(e.target.value)}
                  className="w-full h-10 pl-7 pr-3 rounded-xl border border-[#E8DDC4] bg-white font-bold"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8DDC4]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[#68746D] hover:bg-black/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#064E49] text-white text-xs sm:text-sm font-bold hover:bg-[#176B62] transition shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save Financial Baseline</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
