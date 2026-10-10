import { Transaction, Goal, UserSettings, UserAccount, FinancialHealth, InsightItem } from '../types';
import { formatINR } from './formatters';

export interface DerivedFinancials {
  availableBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  reserveBuffer: number;
  health: FinancialHealth;
  forecastSevenDay: number[];
  balanceSparkline: number[];
  incomeSparkline: number[];
  insights: InsightItem[];
}

// Categorization helper for 50/30/20 benchmark
const NEEDS_CATEGORIES = new Set(['Housing', 'Utilities', 'Health', 'Education', 'Transport']);
const WANTS_CATEGORIES = new Set(['Food', 'Shopping', 'Entertainment']);

export function calculateRealFinancials(
  account: UserAccount,
  transactions: Transaction[],
  goals: Goal[],
  settings: UserSettings,
  userSpecifiedContribution: number
): DerivedFinancials {
  const netFromTransactions = transactions.reduce((sum, t) => sum + t.amount, 0);

  // Available balance = Starting bank balance + Net transaction change
  // This guarantees the balance does not turn negative simply because a statement only had expenses!
  const openingBal = account.openingBalance || 0;
  const availableBalance = openingBal + netFromTransactions;

  // 1. Inflow and Outflow analysis
  const txByMonth = new Map<string, { income: number; expense: number; txs: Transaction[] }>();
  for (const t of transactions) {
    const monthKey = t.date ? t.date.slice(0, 7) : 'Unknown';
    if (!txByMonth.has(monthKey)) {
      txByMonth.set(monthKey, { income: 0, expense: 0, txs: [] });
    }
    const entry = txByMonth.get(monthKey)!;
    entry.txs.push(t);
    if (t.amount > 0) entry.income += t.amount;
    else entry.expense += Math.abs(t.amount);
  }

  const sortedMonths = Array.from(txByMonth.keys()).sort();
  const latestMonthKey = sortedMonths[sortedMonths.length - 1];
  const latestMonthData = txByMonth.get(latestMonthKey);

  let recordedIncome = latestMonthData ? latestMonthData.income : transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const recordedExpenses = latestMonthData ? latestMonthData.expense : transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  // If user provided a declared monthly salary, factor it in if statement doesn't have an explicit salary entry
  const monthlySalary = account.monthlySalary || 0;
  const monthlyIncome = Math.max(recordedIncome, monthlySalary);
  const monthlyExpenses = recordedExpenses;

  // 2. Liquid Safety Reserve Buffer
  const reserveBuffer = Math.max(0, availableBalance - settings.minimumReserve);

  // 3. Spending Split (Needs vs Wants vs Savings)
  let needsSum = 0;
  let wantsSum = 0;
  for (const t of transactions) {
    if (t.amount < 0) {
      const absAmt = Math.abs(t.amount);
      if (NEEDS_CATEGORIES.has(t.category)) {
        needsSum += absAmt;
      } else if (WANTS_CATEGORIES.has(t.category)) {
        wantsSum += absAmt;
      } else {
        needsSum += absAmt * 0.5;
        wantsSum += absAmt * 0.5;
      }
    }
  }

  const totalSpend = needsSum + wantsSum;
  const netSurplus = Math.max(0, monthlyIncome - monthlyExpenses);

  let needsPct = 0;
  let wantsPct = 0;
  let savingsPct = 0;

  if (monthlyIncome > 0) {
    needsPct = Math.round((needsSum / monthlyIncome) * 100);
    wantsPct = Math.round((wantsSum / monthlyIncome) * 100);
    savingsPct = Math.max(0, Math.round((netSurplus / monthlyIncome) * 100));

    const sumPcts = needsPct + wantsPct + savingsPct;
    if (sumPcts > 100 && sumPcts > 0) {
      needsPct = Math.round((needsPct / sumPcts) * 100);
      wantsPct = Math.round((wantsPct / sumPcts) * 100);
      savingsPct = Math.max(0, 100 - needsPct - wantsPct);
    }
  } else if (totalSpend > 0) {
    needsPct = Math.round((needsSum / totalSpend) * 100);
    wantsPct = 100 - needsPct;
    savingsPct = 0;
  }

  // 4. Composite Financial Health Score (0 - 100)
  let score = 50;
  if (availableBalance > 0 || monthlyIncome > 0) {
    if (savingsPct >= 20) score += 20;
    else if (savingsPct >= 10) score += 10;
    else if (monthlyIncome > 0) score -= 10;

    if (needsPct <= 50 && needsPct > 0) score += 15;
    else if (needsPct > 65) score -= 15;

    if (availableBalance >= settings.minimumReserve * 2) score += 15;
    else if (availableBalance >= settings.minimumReserve) score += 8;
    else if (availableBalance < settings.minimumReserve) score -= 20;
  } else {
    score = 0;
  }

  score = Math.min(100, Math.max(0, score));

  let label = 'Awaiting Data';
  if (score >= 80) label = 'Excellent';
  else if (score >= 68) label = 'Good';
  else if (score >= 40) label = 'Fair';
  else if (score > 0) label = 'At Risk';

  const health: FinancialHealth = {
    score,
    label,
    split: [
      { key: 'Needs', value: needsPct, color: '#064E49' },
      { key: 'Wants', value: wantsPct, color: '#D9B45B' },
      { key: 'Savings', value: savingsPct, color: '#2E7655' },
    ],
    factors: [
      {
        name: 'Needs & Essentials Ratio',
        score: Math.min(100, Math.max(0, 100 - Math.abs(needsPct - 50) * 2)),
        note: `${needsPct}% of your net income is dedicated to essentials (benchmark: 50%).`,
      },
      {
        name: 'Reserve Buffer Adequacy',
        score: availableBalance >= settings.minimumReserve ? 88 : availableBalance > 0 ? 40 : 0,
        note: `Current balance (${formatINR(availableBalance)}) holds ${formatINR(reserveBuffer)} above the ${formatINR(settings.minimumReserve)} safety floor.`,
      },
      {
        name: 'Consistent Savings Habit',
        score: Math.min(100, Math.round((savingsPct / 20) * 85)),
        note: `${savingsPct}% estimated savings rate based on monthly inflows vs outflows.`,
      },
      {
        name: 'Domino Vulnerability Index',
        score: reserveBuffer > 10000 ? 90 : reserveBuffer > 2000 ? 65 : 35,
        note: `Can absorb an unexpected shock of up to ${formatINR(reserveBuffer)} without breaching safety reserves.`,
      },
    ],
  };

  // 5. 7-Day Forecast starting from live available balance, factoring in salary credit date
  const dailyBurn = monthlyExpenses > 0 ? Math.round(monthlyExpenses / 30) : 0;
  const today = new Date();
  const salaryDay = account.salaryCreditDay || 1;

  const forecastSevenDay: number[] = [];
  let runningBal = availableBalance;

  for (let i = 0; i < 7; i++) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + i);

    // If future date matches salary credit date, add salary inflow!
    if (account.monthlySalary > 0 && futureDate.getDate() === salaryDay) {
      runningBal += account.monthlySalary;
    } else {
      runningBal = Math.max(0, runningBal - dailyBurn);
    }
    forecastSevenDay.push(runningBal);
  }

  // 6. Sparklines
  const sortedTx = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
  let running = openingBal;
  const balancePoints: number[] = [openingBal];
  for (let i = 0; i < sortedTx.length; i++) {
    running += sortedTx[i].amount;
    if (i % Math.max(1, Math.floor(sortedTx.length / 8)) === 0 || i === sortedTx.length - 1) {
      balancePoints.push(running);
    }
  }
  const balanceSparkline = balancePoints.length >= 2 ? balancePoints : [availableBalance, availableBalance];

  const incomeTx = sortedTx.filter(t => t.amount > 0);
  const incomeSparkline = incomeTx.length >= 2 ? incomeTx.map(t => t.amount) : [monthlyIncome, monthlyIncome];

  // 7. Dynamic Insights generated directly from actual user data
  const insights: InsightItem[] = [];

  const categoryTotals: Record<string, number> = {};
  for (const t of transactions) {
    if (t.amount < 0) {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Math.abs(t.amount);
    }
  }
  const topCat = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
  if (topCat) {
    const topPct = monthlyExpenses > 0 ? Math.round((topCat[1] / monthlyExpenses) * 100) : 0;
    insights.push({
      id: 'ins-top-expense',
      title: `${topCat[0]} Spending Concentration`,
      tone: topPct > 35 ? 'warning' : 'info',
      evidence: `${formatINR(topCat[1])} spent on ${topCat[0]} (${topPct}% of all recorded outflows)`,
      explanation: `${topCat[0]} represents your highest expenditure category. Monitoring this category will yield the highest savings leverage.`,
      page: 'transactions',
      linkLabel: 'Inspect Transactions',
    });
  }

  if (availableBalance >= settings.minimumReserve) {
    insights.push({
      id: 'ins-reserve-safe',
      title: 'Safety Reserve Intact',
      tone: 'success',
      evidence: `${formatINR(reserveBuffer)} buffer above ${formatINR(settings.minimumReserve)} safety floor`,
      explanation: 'Your account balance currently exceeds your minimum reserve threshold, protecting you against typical household emergencies.',
      page: 'cashflow',
      linkLabel: 'View Cash Flow',
    });
  } else if (availableBalance > 0) {
    insights.push({
      id: 'ins-reserve-warning',
      title: 'Safety Floor Breach Warning',
      tone: 'danger',
      evidence: `Balance of ${formatINR(availableBalance)} is below the ${formatINR(settings.minimumReserve)} floor`,
      explanation: `Your liquid cash has dipped ${formatINR(settings.minimumReserve - availableBalance)} below your chosen reserve threshold. Consider delaying non-essential discretionary purchases.`,
      page: 'domino',
      linkLabel: 'Simulate Domino',
    });
  }

  if (account.monthlySalary > 0) {
    insights.push({
      id: 'ins-salary-schedule',
      title: 'Salary Inflow Scheduled',
      tone: 'info',
      evidence: `${formatINR(account.monthlySalary)} expected on the ${salaryDay}${salaryDay === 1 ? 'st' : salaryDay === 2 ? 'nd' : salaryDay === 3 ? 'rd' : 'th'} of each month`,
      explanation: 'Your cash flow projections automatically model your expected monthly salary credit, keeping your forward simulation accurate.',
      page: 'cashflow',
      linkLabel: 'Review Cash Flow',
    });
  }

  if (goals.length > 0) {
    const activeGoal = goals[0];
    const pct = Math.round((activeGoal.current / activeGoal.target) * 100);
    insights.push({
      id: 'ins-goal-progress',
      title: `${activeGoal.name} Progress`,
      tone: pct >= 50 ? 'success' : 'info',
      evidence: `${formatINR(activeGoal.current)} saved of ${formatINR(activeGoal.target)} (${pct}% funded)`,
      explanation: `Goal is currently ${pct}% funded. Regular monthly allocation will steadily bridge the remaining deficit.`,
      page: 'goals',
      linkLabel: 'Goal Optimizer',
    });
  }

  return {
    availableBalance,
    monthlyIncome,
    monthlyExpenses,
    reserveBuffer,
    health,
    forecastSevenDay,
    balanceSparkline,
    incomeSparkline,
    insights,
  };
}
