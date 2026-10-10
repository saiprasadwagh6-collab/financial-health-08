export type PageId =
  | 'overview'
  | 'transactions'
  | 'health'
  | 'cashflow'
  | 'domino'
  | 'goals'
  | 'simulator'
  | 'insights'
  | 'reports'
  | 'settings';

export interface Transaction {
  id: string;
  merchant: string;
  description: string;
  amount: number; // positive for income, negative for expense
  category: string;
  date: string; // YYYY-MM-DD
  method: string;
}

export interface Goal {
  id: string;
  name: string;
  current: number;
  target: number;
  icon: string;
  tone?: string;
  targetDate?: string;
}

export interface HealthSplitItem {
  key: 'Needs' | 'Wants' | 'Savings';
  value: number; // percentage
  color: string;
}

export interface HealthFactor {
  name: string;
  score: number;
  note: string;
}

export interface FinancialHealth {
  score: number;
  label: string;
  split: HealthSplitItem[];
  factors: HealthFactor[];
}

export interface UpcomingBill {
  id: string;
  name: string;
  amount: number;
  due: string; // YYYY-MM-DD
  category: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  page: PageId;
  unread: boolean;
}

export interface InsightItem {
  id: string;
  title: string;
  tone: 'warning' | 'info' | 'danger' | 'success';
  evidence: string;
  explanation: string;
  page: PageId;
  linkLabel: string;
}

export interface UserAccount {
  name: string;
  email: string;
  availableBalance: number;
  openingBalance: number;
  monthlySalary: number;
  salaryCreditDay: number;
  primaryBank: string;
  isSetupCompleted: boolean;
  lastMonthBalance: number;
  reserveBuffer: number;
  monthlyGoalContribution: number;
  monthlyExpenses: number;
  rent: number;
}

export interface UserSettings {
  minimumReserve: number;
  forecastDays: number;
  notifications: {
    lowBalance: boolean;
    goalMilestones: boolean;
    weeklyDigest: boolean;
    dominoAlerts: boolean;
  };
}

export interface AppState {
  account: UserAccount;
  settings: UserSettings;
  categories: string[];
  transactions: Transaction[];
  goals: Goal[];
  health: FinancialHealth;
  forecast: {
    startDate: string;
    sevenDay: number[];
  };
  sparklines: {
    balance: number[];
    income: number[];
  };
  insights: InsightItem[];
  notifications: NotificationItem[];
  upcomingBills: UpcomingBill[];
  goalContribution: number;
}
