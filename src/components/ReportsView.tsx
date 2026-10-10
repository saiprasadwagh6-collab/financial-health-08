import React, { useState, useMemo } from 'react';
import {
  Download,
  Calendar,
  Filter,
  Search,
  PieChart,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  FileText,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Percent,
  Clock,
  ArrowUpDown,
  FileDown,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Transaction, UserAccount, Goal } from '../types';
import { formatINR, formatSignedINR, formatDate, formatPercent } from '../utils/formatters';
import { generateReportPDF } from '../utils/pdfExport';

interface ReportsViewProps {
  transactions: Transaction[];
  categories: string[];
  account?: UserAccount;
  goals?: Goal[];
}

type ReportType =
  | 'statement'
  | 'categories'
  | 'methods'
  | 'velocity'
  | 'tax'
  | 'trends';

type DatePreset = 'all' | 'this_month' | 'last_month' | 'last_3_months' | 'custom';

export const ReportsView: React.FC<ReportsViewProps> = ({
  transactions,
  categories,
  account,
  goals = [],
}) => {
  // 1. Calculate transaction bounds
  const sortedDates = useMemo(() => {
    return transactions
      .map((t) => t.date)
      .filter(Boolean)
      .sort();
  }, [transactions]);

  const earliestDate = sortedDates[0] || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
  const latestDate = sortedDates[sortedDates.length - 1] || new Date().toISOString().split('T')[0];

  // Current date helpers
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed

  const firstDayThisMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
  const lastDayThisMonth = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];

  const firstDayLastMonth = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0];
  const lastDayLastMonth = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];

  const threeMonthsAgo = new Date(currentYear, currentMonth - 2, 1).toISOString().split('T')[0];

  // State
  const [activeReport, setActiveReport] = useState<ReportType>('statement');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [fromDate, setFromDate] = useState(earliestDate);
  const [toDate, setToDate] = useState(latestDate);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfDownloaded, setPdfDownloaded] = useState<boolean>(false);

  // Apply date preset changes
  const handleSelectPreset = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset === 'all') {
      setFromDate(earliestDate);
      setToDate(latestDate);
    } else if (preset === 'this_month') {
      setFromDate(firstDayThisMonth);
      setToDate(lastDayThisMonth);
    } else if (preset === 'last_month') {
      setFromDate(firstDayLastMonth);
      setToDate(lastDayLastMonth);
    } else if (preset === 'last_3_months') {
      setFromDate(threeMonthsAgo);
      setToDate(latestDate);
    }
  };

  // Filtered transactions for the selected date range & category
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (fromDate && t.date < fromDate) return false;
      if (toDate && t.date > toDate) return false;
      if (selectedCategory !== 'All' && t.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesMerchant = t.merchant.toLowerCase().includes(query);
        const matchesDesc = t.description.toLowerCase().includes(query);
        const matchesCategory = t.category.toLowerCase().includes(query);
        const matchesMethod = t.method.toLowerCase().includes(query);
        if (!matchesMerchant && !matchesDesc && !matchesCategory && !matchesMethod) {
          return false;
        }
      }
      return true;
    });
  }, [transactions, fromDate, toDate, selectedCategory, searchQuery]);

  // Sort transactions
  const sortedFilteredTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      if (sortOrder === 'date-desc') return b.date.localeCompare(a.date);
      if (sortOrder === 'date-asc') return a.date.localeCompare(b.date);
      if (sortOrder === 'amount-desc') return Math.abs(b.amount) - Math.abs(a.amount);
      if (sortOrder === 'amount-asc') return Math.abs(a.amount) - Math.abs(b.amount);
      return 0;
    });
  }, [filteredTransactions, sortOrder]);

  // Core Financial Aggregates
  const totalIncome = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const totalExpenses = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [filteredTransactions]);

  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Category breakdown
  const categorySummary = useMemo(() => {
    const expensesByCategory: Record<string, { total: number; count: number }> = {};
    filteredTransactions
      .filter((t) => t.amount < 0)
      .forEach((t) => {
        if (!expensesByCategory[t.category]) {
          expensesByCategory[t.category] = { total: 0, count: 0 };
        }
        expensesByCategory[t.category].total += Math.abs(t.amount);
        expensesByCategory[t.category].count += 1;
      });

    return Object.entries(expensesByCategory)
      .map(([cat, data]) => ({
        category: cat,
        amount: data.total,
        count: data.count,
        percent: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0,
        avg: data.count > 0 ? data.total / data.count : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, totalExpenses]);

  // 50/30/20 Rule Bucketing:
  // Needs: Housing, Utilities, Groceries, Transport, Health, Education
  // Wants: Food/Dining out, Shopping, Entertainment, Personal Care, Other
  // Savings: Investment, explicit savings
  const rule503020 = useMemo(() => {
    let needsTotal = 0;
    let wantsTotal = 0;
    let investmentTotal = 0;

    filteredTransactions
      .filter((t) => t.amount < 0)
      .forEach((t) => {
        const cat = t.category.toLowerCase();
        const amt = Math.abs(t.amount);
        if (
          cat.includes('hous') ||
          cat.includes('rent') ||
          cat.includes('util') ||
          cat.includes('grocer') ||
          cat.includes('transp') ||
          cat.includes('fuel') ||
          cat.includes('health') ||
          cat.includes('med') ||
          cat.includes('edu')
        ) {
          needsTotal += amt;
        } else if (cat.includes('invest') || cat.includes('mutual') || cat.includes('stock')) {
          investmentTotal += amt;
        } else {
          wantsTotal += amt;
        }
      });

    // Also include net cash saved as actual savings
    const combinedSavings = Math.max(0, netSavings) + investmentTotal;
    const denominator = totalIncome > 0 ? totalIncome : (needsTotal + wantsTotal + combinedSavings);

    const needsPct = denominator > 0 ? (needsTotal / denominator) * 100 : 0;
    const wantsPct = denominator > 0 ? (wantsTotal / denominator) * 100 : 0;
    const savingsPct = denominator > 0 ? (combinedSavings / denominator) * 100 : 0;

    return {
      needs: { amount: needsTotal, percent: Math.round(needsPct), target: 50 },
      wants: { amount: wantsTotal, percent: Math.round(wantsPct), target: 30 },
      savings: { amount: combinedSavings, percent: Math.round(savingsPct), target: 20 },
    };
  }, [filteredTransactions, totalIncome, netSavings]);

  // Payment Method Analysis
  const paymentMethodSummary = useMemo(() => {
    const methods: Record<string, { total: number; count: number; incomeTotal: number; expenseTotal: number }> = {};
    filteredTransactions.forEach((t) => {
      const method = t.method || 'Other';
      if (!methods[method]) {
        methods[method] = { total: 0, count: 0, incomeTotal: 0, expenseTotal: 0 };
      }
      methods[method].count += 1;
      methods[method].total += Math.abs(t.amount);
      if (t.amount > 0) {
        methods[method].incomeTotal += t.amount;
      } else {
        methods[method].expenseTotal += Math.abs(t.amount);
      }
    });

    return Object.entries(methods)
      .map(([method, data]) => ({
        method,
        count: data.count,
        total: data.total,
        expenseTotal: data.expenseTotal,
        percentOfExpenses: totalExpenses > 0 ? (data.expenseTotal / totalExpenses) * 100 : 0,
        avgTicket: data.count > 0 ? data.total / data.count : 0,
      }))
      .sort((a, b) => b.expenseTotal - a.expenseTotal);
  }, [filteredTransactions, totalExpenses]);

  // Credit Card Risk Assessment
  const creditCardSpend = paymentMethodSummary.find((m) =>
    m.method.toLowerCase().includes('credit')
  )?.expenseTotal || 0;

  const creditCardBurdenPct = totalIncome > 0 ? (creditCardSpend / totalIncome) * 100 : 0;

  // Velocity & Daily Burn Rate Analysis
  const velocitySummary = useMemo(() => {
    const expenseTx = filteredTransactions.filter((t) => t.amount < 0);
    const dayMap: Record<string, number> = {};
    const dayOfWeekSpend = [0, 0, 0, 0, 0, 0, 0]; // Sun to Sat
    const dayOfWeekCount = [0, 0, 0, 0, 0, 0, 0];

    expenseTx.forEach((t) => {
      const amt = Math.abs(t.amount);
      dayMap[t.date] = (dayMap[t.date] || 0) + amt;
      const d = new Date(t.date);
      const dayIndex = isNaN(d.getDay()) ? 0 : d.getDay();
      dayOfWeekSpend[dayIndex] += amt;
      dayOfWeekCount[dayIndex] += 1;
    });

    // Unique active days
    const activeDaysCount = Object.keys(dayMap).length || 1;
    const avgDailyBurn = totalExpenses / Math.max(1, activeDaysCount);

    // Weekday vs Weekend
    const weekdayTotal = dayOfWeekSpend[1] + dayOfWeekSpend[2] + dayOfWeekSpend[3] + dayOfWeekSpend[4] + dayOfWeekSpend[5];
    const weekendTotal = dayOfWeekSpend[0] + dayOfWeekSpend[6];
    const weekdayTxCount = dayOfWeekCount[1] + dayOfWeekCount[2] + dayOfWeekCount[3] + dayOfWeekCount[4] + dayOfWeekCount[5] || 1;
    const weekendTxCount = dayOfWeekCount[0] + dayOfWeekCount[6] || 1;

    const avgWeekdaySpend = weekdayTotal / weekdayTxCount;
    const avgWeekendSpend = weekendTotal / weekendTxCount;

    // Largest single expense (Budget spike)
    const sortedExpenses = [...expenseTx].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    const topSpikes = sortedExpenses.slice(0, 5);

    return {
      activeDaysCount,
      avgDailyBurn,
      projected30DayOutflow: avgDailyBurn * 30,
      weekdayTotal,
      weekendTotal,
      avgWeekdaySpend,
      avgWeekendSpend,
      weekendHeavy: avgWeekendSpend > avgWeekdaySpend * 1.25,
      topSpikes,
    };
  }, [filteredTransactions, totalExpenses]);

  // Tax & High-Value Transactions (>= ₹10,000 & Deductibles)
  const taxHighValueSummary = useMemo(() => {
    const highValueThreshold = 10000;
    const highValueList = filteredTransactions.filter(
      (t) => Math.abs(t.amount) >= highValueThreshold
    );

    const taxDeductibleCandidates = filteredTransactions.filter((t) => {
      const cat = t.category.toLowerCase();
      const desc = (t.description + ' ' + t.merchant).toLowerCase();
      return (
        cat.includes('invest') ||
        cat.includes('health') ||
        cat.includes('med') ||
        cat.includes('insur') ||
        cat.includes('edu') ||
        cat.includes('hous') ||
        cat.includes('rent') ||
        desc.includes('lic') ||
        desc.includes('elss') ||
        desc.includes('provident') ||
        desc.includes('ppf') ||
        desc.includes('nps') ||
        desc.includes('premium') ||
        desc.includes('tuition')
      );
    });

    const totalHighValueAmount = highValueList.reduce((s, t) => s + Math.abs(t.amount), 0);
    const totalDeductiblesAmount = taxDeductibleCandidates.reduce((s, t) => s + Math.abs(t.amount), 0);

    return {
      highValueList,
      taxDeductibleCandidates,
      totalHighValueAmount,
      totalDeductiblesAmount,
    };
  }, [filteredTransactions]);

  // Month-over-Month Historical Trajectory
  const monthlyTrajectory = useMemo(() => {
    const monthMap: Record<string, { income: number; expense: number; count: number }> = {};

    transactions.forEach((t) => {
      const monthKey = t.date ? t.date.slice(0, 7) : 'Unknown';
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { income: 0, expense: 0, count: 0 };
      }
      monthMap[monthKey].count += 1;
      if (t.amount > 0) {
        monthMap[monthKey].income += t.amount;
      } else {
        monthMap[monthKey].expense += Math.abs(t.amount);
      }
    });

    const months = Object.keys(monthMap).sort();
    return months.map((m) => {
      const data = monthMap[m];
      const net = data.income - data.expense;
      const rate = data.income > 0 ? (net / data.income) * 100 : 0;

      let monthName = m;
      try {
        const [year, month] = m.split('-');
        const dateObj = new Date(Number(year), Number(month) - 1, 1);
        monthName = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } catch {
        // fallback
      }

      return {
        monthKey: m,
        monthName,
        income: data.income,
        expense: data.expense,
        net,
        rate: Math.round(rate),
        count: data.count,
      };
    });
  }, [transactions]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;
    const headers = [
      'Date',
      'Merchant',
      'Description',
      'Category',
      'Type',
      'Amount (INR)',
      'Payment Method',
    ];
    const rows = filteredTransactions.map((t) => [
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
    link.setAttribute('download', `ArthDrishti_${activeReport}_Report_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Status badge calculation
  const statusBadge = useMemo(() => {
    if (netSavings > 15000) {
      return {
        label: 'Healthy Surplus (+)',
        sub: 'You are retaining more than ₹15,000 cash surplus. Strong wealth creation pace.',
      };
    }
    if (netSavings >= 0) {
      return {
        label: 'Balanced Cash Flow',
        sub: 'Living within your earnings with positive surplus. Consider optimizing your monthly savings.',
      };
    }
    return {
      label: 'Deficit Alert (-)',
      sub: 'Expenses exceed income in this period. Review high-burn categories to plug money leaks.',
    };
  }, [netSavings]);

  // Direct PDF Download trigger
  const handleDownloadPDF = () => {
    if (filteredTransactions.length === 0) return;
    try {
      setIsGeneratingPdf(true);
      generateReportPDF({
        activeReport,
        fromDate,
        toDate,
        transactions: sortedFilteredTransactions,
        totalIncome,
        totalExpenses,
        netSavings,
        savingsRate,
        account,
        statusBadge,
        rule503020,
        paymentMethodSummary,
        velocitySummary,
        taxHighValueSummary,
        monthlyMoMSummary: monthlyTrajectory,
      });
      setPdfDownloaded(true);
      setTimeout(() => setPdfDownloaded(false), 3000);
    } catch (err) {
      console.error('Error generating PDF report:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header with Executive Orientation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-linear-to-r from-[#064E49] via-[#085C56] to-[#012B26] text-[#F7F2E6] shadow-xl border border-[#D9B45B]/30">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#D9B45B]" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Financial Reports & Statement Hub
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#F7F2E6]/80 max-w-2xl leading-relaxed">
            Simple, honest summaries of your money. Understand your profits, spending leaks, card debt, and savings habits in plain English.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#D9B45B]" />
            <span>{showGuide ? 'Hide Guide' : 'Explain Reports'}</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf || filteredTransactions.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-semibold text-white transition cursor-pointer disabled:opacity-50 shadow-xs"
            title="Download comprehensive PDF report directly to your device"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 text-[#D9B45B] animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : pdfDownloaded ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#70E000]" />
                <span className="text-[#E2FED8]">Downloaded PDF!</span>
              </>
            ) : (
              <>
                <FileDown className="w-3.5 h-3.5 text-[#D9B45B]" />
                <span>Download PDF</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportCSV}
            disabled={filteredTransactions.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-[#ECCB78] via-[#D9B45B] to-[#C79F48] text-[#012B26] text-xs font-bold hover:brightness-110 disabled:opacity-50 transition shadow-md cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV ({filteredTransactions.length})</span>
          </button>
        </div>
      </div>

      {/* Explainer Accordion (Plain English Financial Guide) */}
      {showGuide && (
        <div className="p-5 rounded-2xl bg-[#FCF8EE] border border-[#E8DDC4] shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-[#102C2B]">
            <Sparkles className="w-4 h-4 text-[#C99E3D]" />
            <span>How to Read Your Financial Reports (In Simple Terms)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-[#4E5952] leading-relaxed">
            <div className="p-3 rounded-xl bg-white/80 border border-[#E8DDC4]/60 space-y-1">
              <span className="font-bold text-[#102C2B] block">1. Income Statement (P&L)</span>
              <p>
                Tells you if you made a <strong>profit</strong> or a <strong>loss</strong>. If your Inflow is higher than Outflow, you kept cash for future wealth.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/80 border border-[#E8DDC4]/60 space-y-1">
              <span className="font-bold text-[#102C2B] block">2. The 50 / 30 / 20 Rule</span>
              <p>
                The gold standard: <strong>50%</strong> for essential needs (rent, groceries), <strong>30%</strong> for personal wants, and <strong>20%+</strong> for savings and investments.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/80 border border-[#E8DDC4]/60 space-y-1">
              <span className="font-bold text-[#102C2B] block">3. Card & Burn Velocity</span>
              <p>
                Credit cards make spending feel painless. Keep credit card spending under <strong>35% of income</strong> so you never pay 40%+ annual interest charges.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Primary Report Selector Navigation (The 6 Essential Reports) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {[
          {
            id: 'statement',
            label: '1. Cash Flow & P&L',
            desc: 'Income vs Spending',
            icon: <Receipt className="w-4 h-4" />,
          },
          {
            id: 'categories',
            label: '2. 50/30/20 Budget',
            desc: 'Where money went',
            icon: <PieChart className="w-4 h-4" />,
          },
          {
            id: 'methods',
            label: '3. Payment Modes',
            desc: 'UPI & Card debt risk',
            icon: <CreditCard className="w-4 h-4" />,
          },
          {
            id: 'velocity',
            label: '4. Daily Burn Rate',
            desc: 'Spending speed',
            icon: <Zap className="w-4 h-4" />,
          },
          {
            id: 'tax',
            label: '5. Tax & Big Tickets',
            desc: '₹10k+ & Deductibles',
            icon: <ShieldCheck className="w-4 h-4" />,
          },
          {
            id: 'trends',
            label: '6. Monthly Growth',
            desc: 'Month-on-Month trend',
            icon: <TrendingUp className="w-4 h-4" />,
          },
        ].map((item) => {
          const isActive = activeReport === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveReport(item.id as ReportType)}
              className={`p-3 rounded-2xl text-left transition-all border flex flex-col justify-between cursor-pointer ${
                isActive
                  ? 'bg-linear-to-b from-[#064E49] to-[#033732] text-white border-[#D9B45B] shadow-md -translate-y-0.5'
                  : 'bg-[#FCF9F1] hover:bg-white text-[#102C2B] border-[#E8DDC4]'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className={isActive ? 'text-[#D9B45B]' : 'text-[#064E49]'}>
                  {item.icon}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D9B45B]" />
                )}
              </div>
              <div>
                <div className="text-xs font-bold leading-tight">{item.label}</div>
                <div
                  className={`text-[10px] leading-tight mt-0.5 ${
                    isActive ? 'text-[#D9B45B]' : 'text-[#68746D]'
                  }`}
                >
                  {item.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Date & Range Filter Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#FCF8EE] border border-[#E8DDC4] shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Quick Date Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-[#68746D] mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Period:
          </span>
          {[
            { id: 'all', label: 'All Time' },
            { id: 'this_month', label: 'This Month' },
            { id: 'last_month', label: 'Last Month' },
            { id: 'last_3_months', label: 'Last 3 Months' },
            { id: 'custom', label: 'Custom' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset.id as DatePreset)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                datePreset === preset.id
                  ? 'bg-[#064E49] text-white shadow-xs'
                  : 'bg-white/80 hover:bg-white text-[#102C2B] border border-[#E8DDC4]'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Custom Date Pickers & Category Filter */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-[#68746D]">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setDatePreset('custom');
              }}
              className="h-8 px-2.5 rounded-lg border border-[#E8DDC4] bg-white text-xs font-semibold text-[#102C2B]"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-[#68746D]">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setDatePreset('custom');
              }}
              className="h-8 px-2.5 rounded-lg border border-[#E8DDC4] bg-white text-xs font-semibold text-[#102C2B]"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-[#68746D]" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-8 px-2.5 rounded-lg border border-[#E8DDC4] bg-white text-xs font-semibold text-[#102C2B]"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* At-a-Glance Executive Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Inflow */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#EBF5EE] to-[#DCEDE2] border border-[#CDE3D5] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#2D6A4F]">
              Total Inflow (Income)
            </span>
            <ArrowDownRight className="w-4 h-4 text-[#2D6A4F]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#1B4332] mt-1">
            {formatINR(totalIncome)}
          </div>
          <div className="text-[11px] text-[#2D6A4F] mt-0.5">
            Money received & credited
          </div>
        </div>

        {/* Total Outflow */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FDF0ED] to-[#FCE3DD] border border-[#F6D0C7] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#C0392B]">
              Total Outflow (Spent)
            </span>
            <ArrowUpRight className="w-4 h-4 text-[#C0392B]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#A93226] mt-1">
            {formatINR(totalExpenses)}
          </div>
          <div className="text-[11px] text-[#C0392B] mt-0.5">
            Total expenses & purchases
          </div>
        </div>

        {/* Net Savings Surplus */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FCF7E5] to-[#F7ECD0] border border-[#EDDCB3] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A67C1E]">
              Net Savings Surplus
            </span>
            <Wallet className="w-4 h-4 text-[#A67C1E]" />
          </div>
          <div
            className={`text-xl sm:text-2xl font-black mt-1 ${
              netSavings >= 0 ? 'text-[#2D6A4F]' : 'text-[#C0392B]'
            }`}
          >
            {formatSignedINR(netSavings)}
          </div>
          <div className="text-[11px] text-[#7A6126] mt-0.5">
            {netSavings >= 0 ? 'Positive cash surplus retained' : 'Deficit / overspent this period'}
          </div>
        </div>

        {/* Savings Rate */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#EFEAFC] to-[#E2DAF7] border border-[#D1C6F0] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5E48B8]">
              Savings Rate
            </span>
            <Percent className="w-4 h-4 text-[#5E48B8]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#4B379C] mt-1">
            {formatPercent(savingsRate)}
          </div>
          <div className="text-[11px] text-[#5E48B8] mt-0.5">
            {savingsRate >= 20 ? 'Healthy (Benchmark: 20%+)' : 'Below 20% savings target'}
          </div>
        </div>
      </div>

      {/* Main Active Report Body */}
      {transactions.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#FCF8EE] border border-[#E8DDC4] text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#064E49]/10 text-[#064E49] flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h2 className="font-bold text-lg text-[#102C2B]">No Statements Uploaded Yet</h2>
          <p className="text-xs text-[#68746D] max-w-md mx-auto leading-relaxed">
            Import your bank statement in the Transactions tab to automatically generate complete P&L statements, 50/30/20 budget audits, payment method breakdowns, and tax ledgers.
          </p>
        </div>
      ) : (
        <>
          {/* ============================================================== */}
          {/* REPORT 1: CASH FLOW & STATEMENT (P&L)                          */}
          {/* ============================================================== */}
          {activeReport === 'statement' && (
            <div className="space-y-6">
              {/* Statement Summary Card */}
              <div className="p-6 rounded-3xl bg-[#FCF9F1] border border-[#E8DDC4] shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E8DDC4]/60">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-[#102C2B]">
                      Income & Expense Statement (Cash Flow P&L)
                    </h2>
                    <p className="text-xs text-[#68746D] mt-0.5">
                      Period: {formatDate(fromDate)} to {formatDate(toDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#68746D]">Efficiency:</span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#EBF5EE] text-[#1B4332] border border-[#CDE3D5]">
                      {totalIncome > 0
                        ? `Retaining ₹${Math.max(0, Math.round((netSavings / totalIncome) * 100))} per ₹100 earned`
                        : 'No Inflow Recorded'}
                    </span>
                  </div>
                </div>

                {/* Visual Cash Flow Comparison Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-[#1B4332]">Inflow: {formatINR(totalIncome)} (100%)</span>
                    <span className="text-[#A93226]">
                      Outflow: {formatINR(totalExpenses)} ({totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 100}%)
                    </span>
                  </div>
                  <div className="w-full h-4 rounded-full bg-[#FCE3DD] overflow-hidden flex">
                    <div
                      className="h-full bg-gradient-to-r from-[#2D6A4F] to-[#40916C] transition-all"
                      style={{
                        width: `${Math.min(100, totalIncome > 0 ? (totalIncome / (totalIncome + totalExpenses)) * 100 : 50)}%`,
                      }}
                      title="Total Inflow"
                    />
                    <div
                      className="h-full bg-gradient-to-r from-[#D94343] to-[#E63946] transition-all"
                      style={{
                        width: `${Math.min(100, totalIncome > 0 ? (totalExpenses / (totalIncome + totalExpenses)) * 100 : 50)}%`,
                      }}
                      title="Total Outflow"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-[#68746D]">
                    <span>Green: Cash Coming In</span>
                    <span>Red: Cash Going Out</span>
                  </div>
                </div>

                {/* Statement Line-Item Ledger Table */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Inflow Summary */}
                  <div className="p-4 rounded-2xl bg-[#EBF5EE]/50 border border-[#CDE3D5] space-y-3">
                    <div className="flex items-center justify-between font-bold text-xs text-[#1B4332]">
                      <span>Inflow Sources</span>
                      <span>{formatINR(totalIncome)}</span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      {filteredTransactions
                        .filter((t) => t.amount > 0)
                        .slice(0, 6)
                        .map((t) => (
                          <div key={t.id} className="flex justify-between text-[#2D6A4F]">
                            <span className="truncate pr-2 font-medium">{t.merchant}</span>
                            <span className="font-bold shrink-0">{formatINR(t.amount)}</span>
                          </div>
                        ))}
                      {filteredTransactions.filter((t) => t.amount > 0).length === 0 && (
                        <div className="text-xs text-[#68746D] py-2 text-center">No income transactions in range.</div>
                      )}
                    </div>
                  </div>

                  {/* Outflow Summary */}
                  <div className="p-4 rounded-2xl bg-[#FDF0ED]/50 border border-[#F6D0C7] space-y-3">
                    <div className="flex items-center justify-between font-bold text-xs text-[#A93226]">
                      <span>Top Expense Areas</span>
                      <span>{formatINR(totalExpenses)}</span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      {categorySummary.slice(0, 6).map((c) => (
                        <div key={c.category} className="flex justify-between text-[#A93226]">
                          <span className="truncate pr-2 font-medium">
                            {c.category} ({c.count} txns)
                          </span>
                          <span className="font-bold shrink-0">{formatINR(c.amount)}</span>
                        </div>
                      ))}
                      {categorySummary.length === 0 && (
                        <div className="text-xs text-[#68746D] py-2 text-center">No expense entries in range.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Human Takeaway */}
                <div className="p-4 rounded-2xl bg-[#FCF8EE] border border-[#E8DDC4] flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#064E49] shrink-0 mt-0.5" />
                  <div className="text-xs text-[#4E5952] leading-relaxed">
                    <strong className="text-[#102C2B] block mb-0.5">Plain English Verdict:</strong>
                    {netSavings >= 0 ? (
                      <>
                        You lived within your means during this period. After paying all expenses totaling {formatINR(totalExpenses)}, you still kept a healthy surplus of {formatINR(netSavings)} (a {formatPercent(savingsRate)} savings rate).
                      </>
                    ) : (
                      <>
                        You experienced a cash deficit of {formatINR(Math.abs(netSavings))}. Your expenses outpaced your income by {formatPercent(Math.abs(savingsRate))}. Review the Category Breakdown tab to spot the biggest budget leaks.
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* REPORT 2: CATEGORY SPENDING & 50/30/20 BUDGET AUDIT            */}
          {/* ============================================================== */}
          {activeReport === 'categories' && (
            <div className="space-y-6">
              {/* 50/30/20 Rule Benchmark Box */}
              <div className="p-6 rounded-3xl bg-[#FCF9F1] border border-[#E8DDC4] shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-[#102C2B]">
                      50 / 30 / 20 Budget Rule Audit
                    </h2>
                    <p className="text-xs text-[#68746D] mt-0.5">
                      The universal benchmark to ensure you don't overspend on lifestyle wants.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  {/* Needs */}
                  <div className="p-4 rounded-2xl bg-white border border-[#E8DDC4] space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-[#102C2B]">
                      <span>Essential Needs (Rent, Bills, Food)</span>
                      <span className="text-[#064E49]">{rule503020.needs.percent}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#EFE6D2] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#064E49]"
                        style={{ width: `${Math.min(100, rule503020.needs.percent)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-[#68746D]">
                      <span>Target: ~50%</span>
                      <span className="font-semibold">{formatINR(rule503020.needs.amount)}</span>
                    </div>
                  </div>

                  {/* Wants */}
                  <div className="p-4 rounded-2xl bg-white border border-[#E8DDC4] space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-[#102C2B]">
                      <span>Discretionary Wants (Shopping, Dining)</span>
                      <span className="text-[#C99E3D]">{rule503020.wants.percent}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#EFE6D2] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#C99E3D]"
                        style={{ width: `${Math.min(100, rule503020.wants.percent)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-[#68746D]">
                      <span>Target: ~30%</span>
                      <span className="font-semibold">{formatINR(rule503020.wants.amount)}</span>
                    </div>
                  </div>

                  {/* Savings */}
                  <div className="p-4 rounded-2xl bg-white border border-[#E8DDC4] space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-[#102C2B]">
                      <span>Savings & Investments</span>
                      <span className="text-[#2D6A4F]">{rule503020.savings.percent}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#EFE6D2] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#2D6A4F]"
                        style={{ width: `${Math.min(100, rule503020.savings.percent)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-[#68746D]">
                      <span>Target: 20%+</span>
                      <span className="font-semibold">{formatINR(rule503020.savings.amount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Full Category Breakdown Table & Bars */}
              <div className="p-6 rounded-3xl bg-[#FCF9F1] border border-[#E8DDC4] shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-[#102C2B]">All Categories Ranked by Outflow</h3>
                <div className="space-y-3">
                  {categorySummary.map((c) => (
                    <div key={c.category} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-[#102C2B]">
                        <span className="flex items-center gap-2">
                          <span>{c.category}</span>
                          <span className="text-[11px] text-[#68746D] font-normal">
                            ({c.count} transactions · Avg {formatINR(c.avg)})
                          </span>
                        </span>
                        <span>
                          {formatINR(c.amount)} · <span className="font-bold text-[#064E49]">{Math.round(c.percent)}%</span>
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#EFE6D2] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#064E49] to-[#176B62]"
                          style={{ width: `${Math.min(100, c.percent)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* REPORT 3: PAYMENT METHODS & CREDIT CARD RISK                   */}
          {/* ============================================================== */}
          {activeReport === 'methods' && (
            <div className="space-y-6">
              {/* Payment Risk Alert Card */}
              <div className="p-6 rounded-3xl bg-[#FCF9F1] border border-[#E8DDC4] shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-[#102C2B]">
                      Payment Methods & Credit Card Risk Audit
                    </h2>
                    <p className="text-xs text-[#68746D] mt-0.5">
                      Detect over-reliance on credit cards and micro-leakages across UPI.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#68746D]">Credit Card Burden:</span>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        creditCardBurdenPct > 40
                          ? 'bg-[#FDF0ED] text-[#A93226] border border-[#F6D0C7]'
                          : 'bg-[#EBF5EE] text-[#1B4332] border border-[#CDE3D5]'
                      }`}
                    >
                      {formatPercent(creditCardBurdenPct)} of Income
                    </span>
                  </div>
                </div>

                {/* Method Breakdown Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                  {paymentMethodSummary.map((m) => (
                    <div
                      key={m.method}
                      className="p-4 rounded-2xl bg-white border border-[#E8DDC4] space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-[#102C2B]">
                        <span>{m.method}</span>
                        <CreditCard className="w-3.5 h-3.5 text-[#064E49]" />
                      </div>
                      <div className="text-lg font-black text-[#102C2B]">{formatINR(m.expenseTotal)}</div>
                      <div className="text-[11px] text-[#68746D] space-y-0.5">
                        <div>{m.count} transactions recorded</div>
                        <div>Avg spend: {formatINR(m.avgTicket)}</div>
                        <div className="font-semibold text-[#064E49]">
                          {Math.round(m.percentOfExpenses)}% of all expenses
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Takeaway Advice */}
                <div className="p-4 rounded-2xl bg-[#FCF8EE] border border-[#E8DDC4] text-xs text-[#4E5952] leading-relaxed">
                  <strong className="text-[#102C2B] block mb-1">
                    Smart Tip for Credit Cards & UPI:
                  </strong>
                  {creditCardBurdenPct > 35 ? (
                    <span className="text-[#A93226]">
                      ⚠️ Warning: Your credit card spending represents {formatPercent(creditCardBurdenPct)} of your earnings. Ensure you have sufficient liquid funds to pay the entire bill on the due date to avoid high interest charges.
                    </span>
                  ) : (
                    <span className="text-[#1B4332]">
                      ✅ Healthy: Your credit card spending is well controlled ({formatPercent(creditCardBurdenPct)} of income). Continue utilizing reward points while paying the full statement balance every billing cycle.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* REPORT 4: DAILY BURN RATE & VELOCITY                           */}
          {/* ============================================================== */}
          {activeReport === 'velocity' && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-[#FCF9F1] border border-[#E8DDC4] shadow-sm space-y-5">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#102C2B]">
                    Daily Burn Rate & Spending Velocity
                  </h2>
                  <p className="text-xs text-[#68746D] mt-0.5">
                    How quickly your wallet empties each day and when spending peaks occur.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Daily Burn Metric */}
                  <div className="p-4 rounded-2xl bg-[#EBF5EE] border border-[#CDE3D5]">
                    <span className="text-xs font-bold text-[#2D6A4F]">Average Daily Burn</span>
                    <div className="text-2xl font-black text-[#1B4332] mt-1">
                      {formatINR(velocitySummary.avgDailyBurn)}
                      <span className="text-xs font-medium text-[#2D6A4F]"> / day</span>
                    </div>
                    <div className="text-[11px] text-[#2D6A4F] mt-1">
                      Calculated across {velocitySummary.activeDaysCount} spending days
                    </div>
                  </div>

                  {/* 30-Day Projection */}
                  <div className="p-4 rounded-2xl bg-[#FCF7E5] border border-[#EDDCB3]">
                    <span className="text-xs font-bold text-[#A67C1E]">Projected Monthly Outflow</span>
                    <div className="text-2xl font-black text-[#7A6126] mt-1">
                      {formatINR(velocitySummary.projected30DayOutflow)}
                    </div>
                    <div className="text-[11px] text-[#7A6126] mt-1">
                      If you maintain your current daily spending pace
                    </div>
                  </div>

                  {/* Weekend vs Weekday */}
                  <div className="p-4 rounded-2xl bg-[#EFEAFC] border border-[#D1C6F0]">
                    <span className="text-xs font-bold text-[#5E48B8]">Weekend vs Weekday</span>
                    <div className="text-sm font-bold text-[#4B379C] mt-2 space-y-1">
                      <div className="flex justify-between">
                        <span>Weekend Avg:</span>
                        <span>{formatINR(velocitySummary.avgWeekendSpend)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Weekday Avg:</span>
                        <span>{formatINR(velocitySummary.avgWeekdaySpend)}</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-[#5E48B8] mt-1">
                      {velocitySummary.weekendHeavy ? '⚠️ Spending spikes on weekends' : 'Balanced throughout the week'}
                    </div>
                  </div>
                </div>

                {/* Top 5 Budget Spikes */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold text-[#102C2B] uppercase tracking-wider">
                    Largest Single Outflows (Budget Spikes)
                  </h3>
                  <div className="divide-y divide-[#E8DDC4]/60 bg-white rounded-2xl border border-[#E8DDC4] overflow-hidden">
                    {velocitySummary.topSpikes.map((t, idx) => (
                      <div key={t.id} className="p-3 flex items-center justify-between text-xs hover:bg-[#FCF9F1]">
                        <div className="flex items-center gap-3">
                          <span className="w-5 h-5 rounded-full bg-[#FCE3DD] text-[#C0392B] font-bold flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="font-bold text-[#102C2B]">{t.merchant}</div>
                            <div className="text-[11px] text-[#68746D]">
                              {t.category} · {formatDate(t.date)}
                            </div>
                          </div>
                        </div>
                        <div className="font-black text-[#A93226]">{formatINR(Math.abs(t.amount))}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* REPORT 5: TAX & HIGH-VALUE TRANSACTION LEDGER (₹10,000+)       */}
          {/* ============================================================== */}
          {activeReport === 'tax' && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-[#FCF9F1] border border-[#E8DDC4] shadow-sm space-y-5">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#102C2B]">
                    Tax & High-Value Transaction Ledger
                  </h2>
                  <p className="text-xs text-[#68746D] mt-0.5">
                    Critical transactions for tax deductions, ITR audit readiness, and high-value reconciliation.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[#EBF5EE] border border-[#CDE3D5]">
                    <span className="text-xs font-bold text-[#2D6A4F]">
                      High-Value Transactions (≥ ₹10,000)
                    </span>
                    <div className="text-2xl font-black text-[#1B4332] mt-1">
                      {formatINR(taxHighValueSummary.totalHighValueAmount)}
                    </div>
                    <div className="text-[11px] text-[#2D6A4F] mt-1">
                      {taxHighValueSummary.highValueList.length} major transactions
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FCF7E5] border border-[#EDDCB3]">
                    <span className="text-xs font-bold text-[#A67C1E]">
                      Potential Tax Deductibles (80C / Health / Rent)
                    </span>
                    <div className="text-2xl font-black text-[#7A6126] mt-1">
                      {formatINR(taxHighValueSummary.totalDeductiblesAmount)}
                    </div>
                    <div className="text-[11px] text-[#7A6126] mt-1">
                      {taxHighValueSummary.taxDeductibleCandidates.length} potential tax-saving records
                    </div>
                  </div>
                </div>

                {/* Ledger of High-Value items */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-[#102C2B] uppercase tracking-wider">
                    High-Value Transactions (≥ ₹10,000)
                  </h3>
                  <div className="overflow-x-auto rounded-2xl border border-[#E8DDC4] bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F5ECD9] text-[#68746D]">
                        <tr>
                          <th className="py-2.5 px-3 font-semibold">Date</th>
                          <th className="py-2.5 px-3 font-semibold">Merchant / Memo</th>
                          <th className="py-2.5 px-3 font-semibold">Category</th>
                          <th className="py-2.5 px-3 font-semibold">Method</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8DDC4]/40">
                        {taxHighValueSummary.highValueList.map((t) => (
                          <tr key={t.id} className="hover:bg-[#FCF9F1]">
                            <td className="py-2.5 px-3 text-[#68746D]">{formatDate(t.date)}</td>
                            <td className="py-2.5 px-3 font-bold text-[#102C2B]">{t.merchant}</td>
                            <td className="py-2.5 px-3 text-[#68746D]">{t.category}</td>
                            <td className="py-2.5 px-3 text-[#68746D]">{t.method}</td>
                            <td
                              className={`py-2.5 px-3 text-right font-black ${
                                t.amount < 0 ? 'text-[#C0392B]' : 'text-[#2D6A4F]'
                              }`}
                            >
                              {formatSignedINR(t.amount)}
                            </td>
                          </tr>
                        ))}
                        {taxHighValueSummary.highValueList.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-xs text-[#68746D]">
                              No transactions above ₹10,000 found in this date range.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* REPORT 6: MONTH-OVER-MONTH HISTORICAL TRAJECTORY               */}
          {/* ============================================================== */}
          {activeReport === 'trends' && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-[#FCF9F1] border border-[#E8DDC4] shadow-sm space-y-5">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#102C2B]">
                    Month-over-Month Historical Trajectory
                  </h2>
                  <p className="text-xs text-[#68746D] mt-0.5">
                    See your savings rate progression and net surplus growth across all recorded months.
                  </p>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-[#E8DDC4] bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F5ECD9] text-[#68746D]">
                      <tr>
                        <th className="py-3 px-3 font-semibold">Month</th>
                        <th className="py-3 px-3 font-semibold text-right">Inflow (Income)</th>
                        <th className="py-3 px-3 font-semibold text-right">Outflow (Spent)</th>
                        <th className="py-3 px-3 font-semibold text-right">Net Savings</th>
                        <th className="py-3 px-3 font-semibold text-right">Savings Rate</th>
                        <th className="py-3 px-3 font-semibold text-center">Health Verdict</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8DDC4]/40">
                      {monthlyTrajectory.map((m) => (
                        <tr key={m.monthKey} className="hover:bg-[#FCF9F1]">
                          <td className="py-3 px-3 font-bold text-[#102C2B]">{m.monthName}</td>
                          <td className="py-3 px-3 text-right font-semibold text-[#2D6A4F]">
                            {formatINR(m.income)}
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-[#C0392B]">
                            {formatINR(m.expense)}
                          </td>
                          <td
                            className={`py-3 px-3 text-right font-bold ${
                              m.net >= 0 ? 'text-[#2D6A4F]' : 'text-[#C0392B]'
                            }`}
                          >
                            {formatSignedINR(m.net)}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-[#064E49]">
                            {m.rate}%
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                m.rate >= 20
                                  ? 'bg-[#EBF5EE] text-[#1B4332]'
                                  : m.net >= 0
                                  ? 'bg-[#FCF7E5] text-[#7A6126]'
                                  : 'bg-[#FDF0ED] text-[#A93226]'
                              }`}
                            >
                              {m.rate >= 20 ? 'Optimal' : m.net >= 0 ? 'Moderate' : 'Deficit'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SEARCHABLE PERIOD LEDGER (All Transactions with Live Filter)    */}
          {/* ============================================================== */}
          <div className="p-6 rounded-3xl bg-[#FCF9F1] border border-[#E8DDC4] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#102C2B]">
                  Detailed Transaction Ledger ({sortedFilteredTransactions.length})
                </h3>
                <p className="text-xs text-[#68746D]">
                  Every transaction included in this report.
                </p>
              </div>

              {/* Search & Sort Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#68746D] absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search merchant, memo..."
                    className="h-8 pl-8 pr-3 rounded-lg border border-[#E8DDC4] bg-white text-xs text-[#102C2B] w-48 sm:w-56"
                  />
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <ArrowUpDown className="w-3.5 h-3.5 text-[#68746D]" />
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as any)}
                    className="h-8 px-2 rounded-lg border border-[#E8DDC4] bg-white text-xs text-[#102C2B]"
                  >
                    <option value="date-desc">Newest First</option>
                    <option value="date-asc">Oldest First</option>
                    <option value="amount-desc">Highest Amount</option>
                    <option value="amount-asc">Lowest Amount</option>
                  </select>
                </div>

                <button
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPdf || sortedFilteredTransactions.length === 0}
                  className="h-8 px-2.5 rounded-lg border border-[#E8DDC4] bg-white hover:bg-[#F5ECD9] text-xs font-semibold text-[#064E49] flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  title="Download PDF statement"
                >
                  <FileDown className="w-3.5 h-3.5 text-[#064E49]" />
                  <span>PDF</span>
                </button>

                <button
                  onClick={handleExportCSV}
                  disabled={sortedFilteredTransactions.length === 0}
                  className="h-8 px-2.5 rounded-lg border border-[#E8DDC4] bg-white hover:bg-[#F5ECD9] text-xs font-semibold text-[#064E49] flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  title="Export CSV spreadsheet"
                >
                  <Download className="w-3.5 h-3.5 text-[#064E49]" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-96 rounded-2xl border border-[#E8DDC4] bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5ECD9] text-[#68746D] sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Date</th>
                    <th className="py-2.5 px-3 font-semibold">Merchant / Details</th>
                    <th className="py-2.5 px-3 font-semibold">Category</th>
                    <th className="py-2.5 px-3 font-semibold">Method</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8DDC4]/40">
                  {sortedFilteredTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-[#FCF9F1] transition">
                      <td className="py-2.5 px-3 text-[#68746D] whitespace-nowrap">{formatDate(t.date)}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-[#102C2B]">{t.merchant}</div>
                        {t.description && t.description !== t.merchant && (
                          <div className="text-[11px] text-[#68746D] truncate max-w-xs">{t.description}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-[#68746D] whitespace-nowrap">{t.category}</td>
                      <td className="py-2.5 px-3 text-[#68746D] whitespace-nowrap">{t.method}</td>
                      <td
                        className={`py-2.5 px-3 text-right font-black whitespace-nowrap ${
                          t.amount < 0 ? 'text-[#C0392B]' : 'text-[#2D6A4F]'
                        }`}
                      >
                        {formatSignedINR(t.amount)}
                      </td>
                    </tr>
                  ))}
                  {sortedFilteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-[#68746D]">
                        No matching transactions found with the active filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
