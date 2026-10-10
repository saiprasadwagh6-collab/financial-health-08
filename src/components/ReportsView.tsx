import React, { useState, useEffect } from 'react';
import { Download, Calendar, Filter, UploadCloud } from 'lucide-react';
import { Transaction } from '../types';
import { formatINR, formatSignedINR, formatDate, formatPercent } from '../utils/formatters';

interface ReportsViewProps {
  transactions: Transaction[];
  categories: string[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ transactions, categories }) => {
  // Determine date bounds dynamically from real transactions
  const dates = transactions.map((t) => t.date).filter(Boolean).sort();
  const initialFrom = dates.length > 0 ? dates[0] : new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const initialTo = dates.length > 0 ? dates[dates.length - 1] : new Date().toISOString().split('T')[0];

  const [fromDate, setFromDate] = useState(initialFrom);
  const [toDate, setToDate] = useState(initialTo);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Update bounds when new transactions are loaded
  useEffect(() => {
    if (dates.length > 0) {
      setFromDate(dates[0]);
      setToDate(dates[dates.length - 1]);
    }
  }, [transactions.length]);

  // Filter transactions
  const filtered = transactions.filter((t) => {
    if (t.date < fromDate || t.date > toDate) return false;
    if (selectedCategory !== 'All' && t.category !== selectedCategory) return false;
    return true;
  });

  const totalIncome = filtered
    .filter((t) => t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);

  const totalExpenses = filtered
    .filter((t) => t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Spending by Category
  const categoryExpenses: Record<string, number> = {};
  filtered
    .filter((t) => t.amount < 0)
    .forEach((t) => {
      categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + Math.abs(t.amount);
    });

  const catEntries = Object.entries(categoryExpenses).sort((a, b) => b[1] - a[1]);
  const maxCatVal = catEntries[0] ? catEntries[0][1] : 1;

  // Real CSV Export
  const handleExportCSV = () => {
    if (filtered.length === 0) return;
    const headers = ['Date', 'Merchant', 'Description', 'Category', 'Type', 'Amount (INR)', 'Payment Method'];
    const rows = filtered.map((t) => [
      t.date,
      `"${t.merchant.replace(/"/g, '""')}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      t.category,
      t.amount < 0 ? 'Expense' : 'Income',
      t.amount,
      t.method,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Statement_Report_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Filter Toolbar */}
      <div className="p-6 rounded-3xl bg-[#FBF6E9] border border-[#E8DDC4] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#68746D]">From</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-10 px-3 rounded-xl border border-[#E8DDC4] bg-[#FCF9F1] text-xs sm:text-sm font-semibold text-[#102C2B]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#68746D]">To</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-10 px-3 rounded-xl border border-[#E8DDC4] bg-[#FCF9F1] text-xs sm:text-sm font-semibold text-[#102C2B]"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-10 px-3 rounded-xl border border-[#E8DDC4] bg-[#FCF9F1] text-xs sm:text-sm font-semibold text-[#102C2B]"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={filtered.length === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#064E49] disabled:bg-[#92968D] text-white text-xs sm:text-sm font-bold hover:bg-[#176B62] transition shadow-xs"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV ({filtered.length})</span>
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#FCF8EE] border border-[#E8DDC4] text-center space-y-2">
          <div className="font-bold text-base text-[#102C2B]">No Statements Uploaded</div>
          <p className="text-xs text-[#68746D] max-w-sm mx-auto">
            Upload your real-time bank statement in the Transactions tab to generate period reports, category summaries, and downloadable ledger CSVs.
          </p>
        </div>
      ) : (
        <>
          {/* Aggregated Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#E7F0DE] to-[#DCE9D2] border border-[#CFE0C4]">
              <span className="text-xs font-semibold text-[#68746D]">Total Period Income</span>
              <div className="text-xl sm:text-2xl font-black text-[#2E7655] mt-1">
                {formatINR(totalIncome)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FCEAE5] to-[#F8DDD6] border border-[#F3CFC6]">
              <span className="text-xs font-semibold text-[#68746D]">Total Period Expenses</span>
              <div className="text-xl sm:text-2xl font-black text-[#D94343] mt-1">
                {formatINR(totalExpenses)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FCF1D2] to-[#F8E8BE] border border-[#EFDDAB]">
              <span className="text-xs font-semibold text-[#68746D]">Net Savings Surplus</span>
              <div
                className={`text-xl sm:text-2xl font-black mt-1 ${
                  netSavings >= 0 ? 'text-[#2E7655]' : 'text-[#D94343]'
                }`}
              >
                {formatSignedINR(netSavings)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#EEEAFB] to-[#E5DEF8] border border-[#D9D0F3]">
              <span className="text-xs font-semibold text-[#68746D]">Savings Rate</span>
              <div className="text-xl sm:text-2xl font-black text-[#7662DF] mt-1">
                {formatPercent(savingsRate)}
              </div>
              <span className="text-[11px] text-[#68746D]">{filtered.length} transactions</span>
            </div>
          </div>

          {/* 2-Column Section: Category Bars & Filtered Ledger */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Spending by Category Bars */}
            <div className="p-6 rounded-3xl bg-[#FBF6E9] border border-[#E8DDC4] shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-[#102C2B]">Spending by Category</h2>
              <div className="space-y-3 pt-1">
                {catEntries.length === 0 ? (
                  <p className="text-xs text-[#68746D] py-6 text-center">
                    No expense entries in this date range.
                  </p>
                ) : (
                  catEntries.map(([cat, amt]) => {
                    const pct = totalExpenses > 0 ? Math.round((amt / totalExpenses) * 100) : 0;
                    const barWidth = (amt / maxCatVal) * 100;

                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-[#102C2B]">
                          <span>{cat}</span>
                          <span>
                            {formatINR(amt)} · {pct}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#EFE6D2] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#064E49] to-[#176B62]"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Filtered Ledger */}
            <div className="p-6 rounded-3xl bg-[#FBF6E9] border border-[#E8DDC4] shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-[#102C2B]">Transactions in Period</h2>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F5ECD9] text-[#68746D] sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Merchant</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Amount</th>
                      <th className="py-2.5 px-3 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DDC4]/40 bg-[#FCF8EE]">
                    {filtered.map((t) => (
                      <tr key={t.id} className="hover:bg-white/80 transition">
                        <td className="py-2 px-3 font-semibold text-[#102C2B]">{t.merchant}</td>
                        <td
                          className={`py-2 px-3 text-right font-bold ${
                            t.amount < 0 ? 'text-[#D94343]' : 'text-[#2E7655]'
                          }`}
                        >
                          {formatSignedINR(t.amount)}
                        </td>
                        <td className="py-2 px-3 text-[#68746D]">{formatDate(t.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
