import React, { useState } from 'react';
import {
  Plus,
  UploadCloud,
  Search,
  Filter,
  Trash2,
  X,
  CreditCard,
  Utensils,
  ArrowUp,
  ShoppingCart,
  GraduationCap,
  Car,
  Home,
  Zap,
  Heart,
  Film,
} from 'lucide-react';
import { Transaction } from '../types';
import { formatINR, formatSignedINR, formatDate } from '../utils/formatters';

interface TransactionsViewProps {
  transactions: Transaction[];
  categories: string[];
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  onDeleteTransaction: (id: string) => void;
  onOpenImportModal: () => void;
  selectedTxForDetail: Transaction | null;
  onSelectTxForDetail: (tx: Transaction | null) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  categories,
  onAddTransaction,
  onDeleteTransaction,
  onOpenImportModal,
  selectedTxForDetail,
  onSelectTxForDetail,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState<'all' | 'expense' | 'income'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState('UPI');
  const [formError, setFormError] = useState('');

  // Filtering
  const filtered = transactions.filter((t) => {
    if (selectedCategory !== 'All' && t.category !== selectedCategory) return false;
    if (selectedType === 'income' && t.amount <= 0) return false;
    if (selectedType === 'expense' && t.amount >= 0) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const match =
        t.merchant.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const totalIncome = filtered
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filtered
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const netFlow = totalIncome - totalExpense;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant.trim()) {
      setFormError('Please enter a merchant or payer name.');
      return;
    }
    const numAmt = parseFloat(amount);
    if (!numAmt || numAmt <= 0) {
      setFormError('Please enter a valid amount greater than ₹0.');
      return;
    }

    const finalAmount = type === 'income' ? numAmt : -numAmt;
    onAddTransaction({
      merchant: merchant.trim(),
      description: description.trim() || merchant.trim(),
      amount: finalAmount,
      category: type === 'income' ? 'Income' : category,
      date,
      method,
    });

    // Reset
    setMerchant('');
    setAmount('');
    setDescription('');
    setFormError('');
    setIsAddModalOpen(false);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Food':
        return <Utensils className="w-3.5 h-3.5 text-[#D94343]" />;
      case 'Income':
        return <ArrowUp className="w-3.5 h-3.5 text-[#2E7655]" />;
      case 'Shopping':
        return <ShoppingCart className="w-3.5 h-3.5 text-[#2E7655]" />;
      case 'Education':
        return <GraduationCap className="w-3.5 h-3.5 text-[#1F3F8A]" />;
      case 'Transport':
        return <Car className="w-3.5 h-3.5 text-[#A9822F]" />;
      case 'Housing':
        return <Home className="w-3.5 h-3.5 text-[#24543E]" />;
      case 'Utilities':
        return <Zap className="w-3.5 h-3.5 text-[#A35E1E]" />;
      case 'Health':
        return <Heart className="w-3.5 h-3.5 text-[#B23A3A]" />;
      case 'Entertainment':
        return <Film className="w-3.5 h-3.5 text-[#5B3FA8]" />;
      default:
        return <CreditCard className="w-3.5 h-3.5 text-[#68746D]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#E7F0DE] to-[#DCE9D2] border border-[#CFE0C4]">
          <span className="text-xs font-semibold text-[#68746D]">Total Income</span>
          <div className="text-xl sm:text-2xl font-black text-[#2E7655] mt-1">
            {formatINR(totalIncome)}
          </div>
          <span className="text-[11px] text-[#68746D]">Filtered view</span>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FCEAE5] to-[#F8DDD6] border border-[#F3CFC6]">
          <span className="text-xs font-semibold text-[#68746D]">Total Expenses</span>
          <div className="text-xl sm:text-2xl font-black text-[#D94343] mt-1">
            {formatINR(totalExpense)}
          </div>
          <span className="text-[11px] text-[#68746D]">Filtered view</span>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FCF1D2] to-[#F8E8BE] border border-[#EFDDAB]">
          <span className="text-xs font-semibold text-[#68746D]">Net Flow</span>
          <div
            className={`text-xl sm:text-2xl font-black mt-1 ${
              netFlow >= 0 ? 'text-[#2E7655]' : 'text-[#D94343]'
            }`}
          >
            {formatSignedINR(netFlow)}
          </div>
          <span className="text-[11px] text-[#68746D]">
            {netFlow >= 0 ? 'Surplus' : 'Deficit'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#EEEAFB] to-[#E5DEF8] border border-[#D9D0F3]">
          <span className="text-xs font-semibold text-[#68746D]">Transactions</span>
          <div className="text-xl sm:text-2xl font-black text-[#7662DF] mt-1">
            {filtered.length}
          </div>
          <span className="text-[11px] text-[#68746D]">of {transactions.length} total</span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="p-6 rounded-3xl bg-[#FBF6E9] border border-[#E8DDC4] shadow-sm space-y-4">
        {/* Actions & Filters Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {/* Import Statement Button */}
            <button
              onClick={onOpenImportModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#D9B45B] bg-[#FFF9EF] text-xs sm:text-sm font-bold text-[#064E49] hover:bg-[#F3D58A]/30 transition shadow-xs"
            >
              <UploadCloud className="w-4 h-4 text-[#A9822F]" />
              <span>Import Statement</span>
            </button>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#68746D]" />
              <input
                type="search"
                placeholder="Search merchant or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-[#E8DDC4] bg-[#FCF9F1] text-xs sm:text-sm text-[#102C2B] focus:outline-hidden focus:border-[#D9B45B]"
              />
            </div>

            {/* Type selector */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="h-10 px-3 rounded-xl border border-[#E8DDC4] bg-[#FCF9F1] text-xs sm:text-sm font-semibold text-[#102C2B] focus:outline-hidden focus:border-[#D9B45B]"
            >
              <option value="all">All Types</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
            </select>
          </div>

          {/* Add Transaction Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#064E49] text-white text-xs sm:text-sm font-bold hover:bg-[#176B62] transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>

        {/* Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1">
          {['All', ...categories].map((c) => {
            const active = selectedCategory === c;
            return (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  active
                    ? 'bg-[#064E49] text-white shadow-xs'
                    : 'bg-[#FCF9F1] border border-[#E8DDC4] text-[#68746D] hover:border-[#D9B45B] hover:text-[#102C2B]'
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto rounded-2xl border border-[#E8DDC4]/60">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#F5ECD9] text-[#68746D] border-b border-[#E8DDC4]/60">
              <tr>
                <th className="py-3 px-4 font-semibold">Merchant / Description</th>
                <th className="py-3 px-4 font-semibold text-right">Amount</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold hidden md:table-cell">Method</th>
                <th className="py-3 px-4 font-semibold text-center w-16">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DDC4]/40 bg-[#FCF8EE]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#68746D]">
                    No transactions match your active filters.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-white/80 transition cursor-pointer group"
                    onClick={() => onSelectTxForDetail(t)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <span className="p-2 rounded-xl bg-white border border-[#E8DDC4] shrink-0">
                          {getCategoryIcon(t.category)}
                        </span>
                        <div>
                          <div className="font-bold text-[#102C2B] group-hover:text-[#064E49] transition">
                            {t.merchant}
                          </div>
                          <div className="text-[11px] text-[#68746D]">{t.description}</div>
                        </div>
                      </div>
                    </td>
                    <td
                      className={`py-3.5 px-4 text-right font-bold text-sm sm:text-base whitespace-nowrap ${
                        t.amount < 0 ? 'text-[#D94343]' : 'text-[#2E7655]'
                      }`}
                    >
                      {formatSignedINR(t.amount)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FAF4E7] border border-[#E8DDC4] text-[#102C2B]">
                        {t.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#68746D] whitespace-nowrap">
                      {formatDate(t.date)}
                    </td>
                    <td className="py-3.5 px-4 text-[#68746D] hidden md:table-cell whitespace-nowrap">
                      {t.method}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTransaction(t.id);
                        }}
                        className="p-1.5 rounded-lg text-[#92968D] hover:text-[#D94343] hover:bg-[#D94343]/10 transition"
                        title="Delete transaction"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#FCF9F1] border border-[#E8DDC4] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DDC4]">
              <h3 className="font-bold text-lg text-[#102C2B]">Add New Transaction</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-black/5"
              >
                <X className="w-5 h-5 text-[#68746D]" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-[#D94343]/10 border border-[#D94343]/30 text-xs text-[#D94343] font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#102C2B] mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-xl border border-[#E8DDC4] bg-white font-semibold"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#102C2B] mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    placeholder="e.g. 850"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#E8DDC4] bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#102C2B] mb-1">
                  Merchant / Entity
                </label>
                <input
                  type="text"
                  placeholder="e.g. Starbucks, Client payout"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E8DDC4] bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#102C2B] mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Coffee with team"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E8DDC4] bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {type === 'expense' && (
                  <div>
                    <label className="block font-semibold text-[#102C2B] mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-[#E8DDC4] bg-white"
                    >
                      {categories
                        .filter((c) => c !== 'Income')
                        .map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
                <div className={type === 'income' ? 'col-span-2' : ''}>
                  <label className="block font-semibold text-[#102C2B] mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-[#E8DDC4] bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#102C2B] mb-1">Payment Method</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E8DDC4] bg-white"
                >
                  <option value="UPI">UPI (Google Pay / PhonePe)</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E8DDC4]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[#68746D] hover:bg-black/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#064E49] text-white text-xs sm:text-sm font-bold hover:bg-[#176B62] transition"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Detail Modal */}
      {selectedTxForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#FCF9F1] border border-[#E8DDC4] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DDC4]">
              <h3 className="font-bold text-lg text-[#102C2B]">Transaction Details</h3>
              <button
                onClick={() => onSelectTxForDetail(null)}
                className="p-1 rounded-lg hover:bg-black/5"
              >
                <X className="w-5 h-5 text-[#68746D]" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-center py-2">
                <span
                  className={`text-3xl font-black ${
                    selectedTxForDetail.amount < 0 ? 'text-[#D94343]' : 'text-[#2E7655]'
                  }`}
                >
                  {formatSignedINR(selectedTxForDetail.amount)}
                </span>
                <div className="text-sm font-bold text-[#102C2B] mt-1">
                  {selectedTxForDetail.merchant}
                </div>
                <div className="text-xs text-[#68746D]">{selectedTxForDetail.description}</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#F5ECD9]/50 border border-[#E8DDC4] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#68746D]">Category</span>
                  <span className="font-bold text-[#102C2B]">{selectedTxForDetail.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#68746D]">Date</span>
                  <span className="font-bold text-[#102C2B]">
                    {formatDate(selectedTxForDetail.date)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#68746D]">Payment Method</span>
                  <span className="font-bold text-[#102C2B]">{selectedTxForDetail.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#68746D]">Transaction ID</span>
                  <span className="font-mono text-[#68746D]">{selectedTxForDetail.id}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#E8DDC4]">
              <button
                onClick={() => {
                  onDeleteTransaction(selectedTxForDetail.id);
                  onSelectTxForDetail(null);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[#D94343] hover:bg-[#D94343]/10 transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>

              <button
                onClick={() => onSelectTxForDetail(null)}
                className="px-5 py-2 rounded-xl bg-[#064E49] text-white text-xs font-bold hover:bg-[#176B62] transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
