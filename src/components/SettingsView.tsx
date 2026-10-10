import React, { useState } from 'react';
import { UserSettings, UserAccount } from '../types';
import { formatINR } from '../utils/formatters';
import { Landmark, Wallet } from 'lucide-react';

interface SettingsViewProps {
  settings: UserSettings;
  account: UserAccount;
  onSaveSettings: (settings: UserSettings) => void;
  onSaveAccount: (account: Partial<UserAccount>) => void;
  onResetDemoData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  account,
  onSaveSettings,
  onSaveAccount,
  onResetDemoData,
}) => {
  const [openingBalance, setOpeningBalance] = useState(account.openingBalance || 0);
  const [monthlySalary, setMonthlySalary] = useState(account.monthlySalary || 0);
  const [salaryCreditDay, setSalaryCreditDay] = useState(account.salaryCreditDay || 1);
  const [primaryBank, setPrimaryBank] = useState(account.primaryBank || '');

  const [reserve, setReserve] = useState(settings.minimumReserve);
  const [forecastDays, setForecastDays] = useState(settings.forecastDays);
  const [notifications, setNotifications] = useState(settings.notifications);
  const [savedMessage, setSavedMessage] = useState(false);

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      minimumReserve: reserve,
      forecastDays,
      notifications,
    });
    onSaveAccount({
      openingBalance: Math.max(0, Number(openingBalance)),
      monthlySalary: Math.max(0, Number(monthlySalary)),
      salaryCreditDay: Number(salaryCreditDay),
      primaryBank: primaryBank.trim(),
      isSetupCompleted: true,
    });
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2400);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Bank Balance & Salary Baseline */}
        <div className="p-6 rounded-3xl bg-[#FBF6E9] border border-[#E8DDC4] shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-[#064E49]">
            <Landmark className="w-5 h-5 text-[#A9822F]" />
            <h2 className="text-lg font-bold text-[#102C2B]">Bank Balance & Salary Schedule</h2>
          </div>
          <p className="text-xs text-[#68746D]">
            Updatable baseline so your balance accurately represents your actual bank account.
          </p>

          <div className="space-y-3.5 pt-1">
            <div>
              <label className="block text-xs font-semibold text-[#102C2B] mb-1">
                Current / Opening Bank Balance (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#68746D]">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(Number(e.target.value))}
                  className="w-full h-10 pl-7 pr-3.5 rounded-xl border border-[#D9B45B] bg-[#FCF9F1] text-xs sm:text-sm font-bold text-[#102C2B]"
                />
              </div>
              <p className="text-[11px] text-[#68746D] mt-1">
                Your live available balance is calculated as: Baseline ({formatINR(openingBalance)}) + Net Transaction changes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#102C2B] mb-1">
                  Monthly Salary (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={monthlySalary}
                  onChange={(e) => setMonthlySalary(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-[#E8DDC4] bg-[#FCF9F1] text-xs sm:text-sm font-bold text-[#102C2B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102C2B] mb-1">
                  Salary Credit Day
                </label>
                <select
                  value={salaryCreditDay}
                  onChange={(e) => setSalaryCreditDay(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-[#E8DDC4] bg-[#FCF9F1] text-xs sm:text-sm font-bold text-[#102C2B]"
                >
                  {[1, 2, 3, 4, 5, 7, 10, 15, 20, 25, 28, 30, 31].map((d) => (
                    <option key={d} value={d}>
                      {d}{d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'} of month
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#102C2B] mb-1">
                Primary Bank Name
              </label>
              <input
                type="text"
                placeholder="e.g. HDFC Bank, SBI, ICICI"
                value={primaryBank}
                onChange={(e) => setPrimaryBank(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl border border-[#E8DDC4] bg-[#FCF9F1] text-xs sm:text-sm text-[#102C2B]"
              />
            </div>
          </div>
        </div>

        {/* Forecast & Reserve Thresholds */}
        <div className="p-6 rounded-3xl bg-[#FBF6E9] border border-[#E8DDC4] shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-[#102C2B]">Forecast & Reserve Thresholds</h2>

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#102C2B] mb-1">
                Minimum Reserve Safety Floor (₹)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={reserve}
                onChange={(e) => setReserve(Math.max(0, Number(e.target.value)))}
                className="w-full h-10 px-3.5 rounded-xl border border-[#E8DDC4] bg-[#FCF9F1] text-xs sm:text-sm font-bold text-[#102C2B]"
              />
              <p className="text-[11px] text-[#68746D] mt-1">
                When cash forecast dips beneath this safety floor, warning indicators trigger.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#102C2B] mb-1">
                Default Forecast Horizon
              </label>
              <select
                value={forecastDays}
                onChange={(e) => setForecastDays(Number(e.target.value))}
                className="w-full h-10 px-3.5 rounded-xl border border-[#E8DDC4] bg-[#FCF9F1] text-xs sm:text-sm font-semibold text-[#102C2B]"
              >
                <option value={7}>7 Days</option>
                <option value={30}>30 Days</option>
                <option value={60}>60 Days</option>
                <option value={90}>90 Days</option>
              </select>
            </div>

            {/* Notification Toggles */}
            <div className="pt-2 space-y-2">
              <span className="block text-xs font-bold text-[#102C2B]">Alert Channels</span>
              {[
                { key: 'lowBalance' as const, title: 'Balance & Liquidity Warnings' },
                { key: 'goalMilestones' as const, title: 'Goal Milestones (25%, 50%, 75%, 100%)' },
                { key: 'dominoAlerts' as const, title: 'Domino Risk Alerts' },
              ].map((n) => (
                <label
                  key={n.key}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#FCF8EE] border border-[#F0E7D2] cursor-pointer hover:bg-white text-xs font-semibold text-[#102C2B]"
                >
                  <span>{n.title}</span>
                  <input
                    type="checkbox"
                    checked={notifications[n.key]}
                    onChange={() => handleToggle(n.key)}
                    className="w-4 h-4 text-[#064E49] rounded-md focus:ring-[#064E49]"
                  />
                </label>
              ))}
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#064E49] text-white text-xs sm:text-sm font-bold hover:bg-[#176B62] transition shadow-xs"
              >
                Save All Settings & Balance
              </button>
              {savedMessage && (
                <span className="ml-3 text-xs font-bold text-[#2E7655]">
                  Settings saved successfully!
                </span>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#FFF5F2] to-[#FDE8E3] border border-[#F3CFC6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-[#D94343]">Reset & Clear All Data</h3>
          <p className="text-xs text-[#5D3A33] mt-0.5">
            Completely wipes all imported transactions, balances, and custom goals to start fresh from scratch.
          </p>
        </div>
        <button
          onClick={onResetDemoData}
          className="px-5 py-2.5 rounded-xl bg-[#D94343] text-white text-xs sm:text-sm font-bold hover:bg-[#B33535] transition shadow-xs"
        >
          Clear All & Start Fresh
        </button>
      </div>
    </div>
  );
};
