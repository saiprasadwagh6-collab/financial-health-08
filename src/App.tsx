import React, { useState, useEffect, useMemo } from 'react';
import { AppState, PageId, Transaction, Goal, UserSettings, UserAccount } from './types';
import { INITIAL_DATA } from './data/initialData';
import { calculateRealFinancials } from './utils/financialCalculations';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewView } from './components/OverviewView';
import { TransactionsView } from './components/TransactionsView';
import { FinancialHealthView } from './components/FinancialHealthView';
import { CashFlowView } from './components/CashFlowView';
import { DominoView } from './components/DominoView';
import { GoalOptimizerView } from './components/GoalOptimizerView';
import { FutureSimulatorView } from './components/FutureSimulatorView';
import { InsightsView } from './components/InsightsView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { StatementImportModal } from './components/StatementImportModal';
import { AccountSetupModal } from './components/AccountSetupModal';
import { LoginView } from './components/LoginView';

const STORAGE_KEY = 'arthdrishti_user_realtime_v5';

export default function App() {
  const [rawState, setRawState] = useState<AppState>(() => {
    // Purge any legacy demo data from localStorage
    try {
      localStorage.removeItem('arthdrishti_realtime_ledger_v3');
      localStorage.removeItem('arthdrishti_realtime_ledger_v4');
      localStorage.removeItem('arthdrishti_state_v1');
      localStorage.removeItem('ffs-state-v1');
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.transactions && parsed.transactions.some((t: any) => t.merchant === 'Tech Mahindra Ltd')) {
          return INITIAL_DATA;
        }
        return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_DATA;
  });

  const [currentPage, setCurrentPage] = useState<PageId>('overview');
  const [transactionCategoryFilter, setTransactionCategoryFilter] = useState<string>('All');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isAuthMode, setIsAuthMode] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAccountSetupModalOpen, setIsAccountSetupModalOpen] = useState(false);
  const [selectedTxForDetail, setSelectedTxForDetail] = useState<Transaction | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleNavigate = (page: PageId, categoryFilter?: string) => {
    if (categoryFilter) {
      setTransactionCategoryFilter(categoryFilter);
    }
    setCurrentPage(page);
  };

  // Automatically open the Bank Balance setup dialog on first launch if not configured yet
  useEffect(() => {
    if (!rawState.account.isSetupCompleted && rawState.transactions.length === 0 && rawState.account.openingBalance === 0) {
      setIsAccountSetupModalOpen(true);
    }
  }, []);

  // Dynamically compute all derived financial figures from starting balance + real transactions
  const state: AppState = useMemo(() => {
    const derived = calculateRealFinancials(
      rawState.account,
      rawState.transactions,
      rawState.goals,
      rawState.settings,
      rawState.goalContribution
    );

    return {
      ...rawState,
      account: {
        ...rawState.account,
        availableBalance: derived.availableBalance,
        monthlyExpenses: derived.monthlyExpenses,
        monthlyIncome: derived.monthlyIncome,
        reserveBuffer: derived.reserveBuffer,
      },
      health: derived.health,
      forecast: {
        startDate: new Date().toISOString().split('T')[0],
        sevenDay: derived.forecastSevenDay,
      },
      sparklines: {
        balance: derived.balanceSparkline,
        income: derived.incomeSparkline,
      },
      insights: derived.insights,
    };
  }, [rawState]);

  // Persist raw state to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rawState));
    } catch {
      // storage unavailable
    }
  }, [rawState]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Save Account Baseline (Opening balance, salary, bank)
  const handleSaveAccountSetup = (
    updatedAccount: Partial<UserAccount>,
    updatedSettings?: Partial<UserSettings>
  ) => {
    setRawState((prev) => ({
      ...prev,
      account: {
        ...prev.account,
        ...updatedAccount,
      },
      settings: {
        ...prev.settings,
        ...(updatedSettings || {}),
      },
    }));
    showToast('Bank baseline & salary schedule updated!');
  };

  // Add Transaction
  const handleAddTransaction = (newTxData: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...newTxData,
      id: `real-tx-${Date.now()}`,
    };

    setRawState((prev) => ({
      ...prev,
      transactions: [newTx, ...prev.transactions],
    }));

    showToast(`${newTx.amount < 0 ? 'Expense' : 'Income'} of ₹${Math.abs(newTx.amount).toLocaleString()} added.`);
  };

  // Delete Transaction
  const handleDeleteTransaction = (id: string) => {
    setRawState((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
    showToast('Transaction removed from ledger.');
  };

  // Bulk update transactions with AI categories
  const handleBulkUpdateTransactions = (updatedTxs: Transaction[]) => {
    setRawState((prev) => ({
      ...prev,
      transactions: updatedTxs,
    }));
    showToast(`Categorized ${updatedTxs.length} transactions with AI!`);
  };

  // Confirm Import of Real Statement
  const handleConfirmImport = (newTxs: Transaction[]) => {
    setRawState((prev) => ({
      ...prev,
      transactions: [...newTxs, ...prev.transactions],
    }));
    showToast(`Successfully imported ${newTxs.length} transactions from statement!`);
  };

  // Goals
  const handleAddGoal = (newGoalData: Omit<Goal, 'id'>) => {
    const newGoal: Goal = {
      ...newGoalData,
      id: `goal-${Date.now()}`,
    };
    setRawState((prev) => ({
      ...prev,
      goals: [...prev.goals, newGoal],
    }));
    showToast(`Milestone goal "${newGoal.name}" established!`);
  };

  const handleUpdateGoal = (updatedGoal: Goal) => {
    setRawState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === updatedGoal.id ? updatedGoal : g)),
    }));
    showToast(`Milestone "${updatedGoal.name}" updated.`);
  };

  const handleDeleteGoal = (id: string) => {
    setRawState((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== id),
    }));
    showToast('Milestone goal removed.');
  };

  const handleQuickDeposit = (goalId: string, amount: number) => {
    setRawState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) =>
        g.id === goalId ? { ...g, current: Math.min(g.target, g.current + amount) } : g
      ),
    }));
    showToast(`Added ₹${amount.toLocaleString()} toward goal.`);
  };

  const handleUpdateContribution = (amount: number) => {
    setRawState((prev) => ({
      ...prev,
      goalContribution: amount,
    }));
  };

  // Settings
  const handleSaveSettings = (newSettings: UserSettings) => {
    setRawState((prev) => ({
      ...prev,
      settings: newSettings,
    }));
    showToast('Configuration updated.');
  };

  const handleResetDemoData = () => {
    setRawState(INITIAL_DATA);
    localStorage.removeItem(STORAGE_KEY);
    setIsAccountSetupModalOpen(true);
    showToast('Cleared all data. Ready for your actual bank balance.');
  };

  const totalMonthlyIncome = state.transactions
    .filter((t) => t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);

  const pageHeadings: Record<PageId, [string, string]> = {
    overview: ['Financial Overview', 'Predict the risk. Balance your life. Secure your future.'],
    transactions: ['Transactions Ledger', 'Every rupee in and out — real-time and filterable.'],
    health: ['Financial Health Diagnostic', 'Live 50/30/20 benchmark and liquidity analysis.'],
    cashflow: ['Forward Cash Flow', 'Projected daily balance trajectory factoring actual salary & burn rate.'],
    domino: ['Financial Domino Simulator', 'Simulate unexpected shocks and see how they ripple through savings and goals.'],
    goals: ['Goal Optimizer', 'Fund what matters in optimal mathematical priority.'],
    simulator: ['Future Life Simulator', 'Interactive what-if scenario testing without risking real money.'],
    insights: ['AI Financial Diagnostics', 'Automated pattern recognitions and spending elasticity observations.'],
    reports: ['Financial Reports & CSV Export', 'Summaries, category breakdowns, and exportable ledger files.'],
    settings: ['Platform Settings', 'Configure bank balance baseline, salary schedule, and minimum reserve floors.'],
  };

  if (isAuthMode) {
    return (
      <LoginView
        onSuccessfulLogin={(name) => {
          if (name) {
            setRawState((prev) => ({
              ...prev,
              account: { ...prev.account, name },
            }));
          }
          setIsAuthMode(false);
          showToast(`Welcome, ${name || 'User'}!`);
        }}
      />
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden p-2 sm:p-3 lg:p-4 flex flex-col justify-between box-border bg-[#EEE4CD]">
      {/* Main Shell Card */}
      <div className="w-full max-w-[1760px] mx-auto h-full rounded-3xl md:rounded-[36px] bg-gradient-to-b from-[#FCF9F1] to-[#F7F2E6] border border-[#E8DDC4] shadow-2xl p-3 sm:p-5 lg:p-6 flex flex-col md:flex-row gap-4 lg:gap-6 relative overflow-hidden box-border">
        {/* Sidebar - Locked static on the left palette */}
        <Sidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          userName={state.account.name}
          isMobileOpen={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
          onLogout={() => setIsAuthMode(true)}
        />

        {/* Content Area - Right side with fixed header and scrollable views */}
        <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
          <div className="shrink-0 pb-3 sm:pb-4">
            <Header
              pageTitle={pageHeadings[currentPage][0]}
              pageSubtitle={pageHeadings[currentPage][1]}
              onOpenMobileNav={() => setIsMobileNavOpen(true)}
              notifications={state.notifications}
              onSelectNotification={(n) => {
                handleNavigate(n.page);
              }}
              onMarkAllRead={() => {
                setRawState((prev) => ({
                  ...prev,
                  notifications: prev.notifications.map((item) => ({ ...item, unread: false })),
                }));
              }}
              transactions={state.transactions}
              goals={state.goals}
              insights={state.insights}
              onNavigate={handleNavigate}
              onSelectTransaction={(t) => {
                setSelectedTxForDetail(t);
                handleNavigate('transactions');
              }}
              onSelectGoal={(g) => {
                handleNavigate('goals');
              }}
              isAuthMode={isAuthMode}
              onToggleAuthMode={() => setIsAuthMode(true)}
              onOpenAccountSetup={() => setIsAccountSetupModalOpen(true)}
            />
          </div>

          {/* Tab Views - ONLY this right area is scrollable! */}
          <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden pr-1 pb-4">
            {currentPage === 'overview' && (
              <OverviewView
                state={state}
                onNavigate={handleNavigate}
                onSelectTransaction={(t) => {
                  setSelectedTxForDetail(t);
                  handleNavigate('transactions');
                }}
                onSelectGoal={(g) => {
                  handleNavigate('goals');
                }}
                onOpenImportModal={() => setIsImportModalOpen(true)}
                onOpenAccountSetup={() => setIsAccountSetupModalOpen(true)}
              />
            )}

            {currentPage === 'transactions' && (
              <TransactionsView
                transactions={state.transactions}
                categories={state.categories}
                selectedCategory={transactionCategoryFilter}
                onSelectCategory={setTransactionCategoryFilter}
                onAddTransaction={handleAddTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                onBulkUpdateTransactions={handleBulkUpdateTransactions}
                onOpenImportModal={() => setIsImportModalOpen(true)}
                selectedTxForDetail={selectedTxForDetail}
                onSelectTxForDetail={setSelectedTxForDetail}
              />
            )}

            {currentPage === 'health' && (
              <FinancialHealthView
                health={state.health}
                monthlyIncome={totalMonthlyIncome > 0 ? totalMonthlyIncome : state.account.monthlySalary}
              />
            )}

            {currentPage === 'cashflow' && <CashFlowView state={state} />}

            {currentPage === 'domino' && <DominoView state={state} />}

            {currentPage === 'goals' && (
              <GoalOptimizerView
                goals={state.goals}
                goalContribution={state.goalContribution}
                onUpdateContribution={handleUpdateContribution}
                onAddGoal={handleAddGoal}
                onUpdateGoal={handleUpdateGoal}
                onDeleteGoal={handleDeleteGoal}
                onQuickDeposit={handleQuickDeposit}
              />
            )}

            {currentPage === 'simulator' && (
              <FutureSimulatorView
                state={state}
                onSaveIncomeBaseline={(income) => {
                  handleSaveAccountSetup({ monthlySalary: income, monthlyIncome: income });
                }}
              />
            )}

            {currentPage === 'insights' && (
              <InsightsView
                insights={state.insights}
                onNavigate={handleNavigate}
                onOpenImportModal={() => setIsImportModalOpen(true)}
              />
            )}

            {currentPage === 'reports' && (
              <ReportsView
                transactions={state.transactions}
                categories={state.categories}
              />
            )}

            {currentPage === 'settings' && (
              <SettingsView
                settings={state.settings}
                account={state.account}
                onSaveSettings={handleSaveSettings}
                onSaveAccount={handleSaveAccountSetup}
                onResetDemoData={handleResetDemoData}
              />
            )}
          </main>
        </div>
      </div>

      {/* Real Statement Import Dialog */}
      <StatementImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onConfirmImport={handleConfirmImport}
        categories={state.categories}
      />

      {/* Account Baseline & Bank Balance Setup Dialog */}
      <AccountSetupModal
        isOpen={isAccountSetupModalOpen}
        onClose={() => setIsAccountSetupModalOpen(false)}
        account={state.account}
        settings={state.settings}
        onSave={handleSaveAccountSetup}
      />

      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-[#064E49] text-[#FAF4E7] font-semibold text-xs sm:text-sm border border-[#D9B45B] shadow-2xl animate-fade-in flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
