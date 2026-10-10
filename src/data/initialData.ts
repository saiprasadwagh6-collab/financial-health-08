import { AppState } from '../types';

export const INITIAL_DATA: AppState = {
  account: {
    name: 'User',
    email: '',
    availableBalance: 0,
    openingBalance: 0,
    monthlySalary: 0,
    salaryCreditDay: 1,
    primaryBank: '',
    isSetupCompleted: false,
    lastMonthBalance: 0,
    reserveBuffer: 0,
    monthlyGoalContribution: 0,
    monthlyExpenses: 0,
    rent: 0,
  },
  settings: {
    minimumReserve: 5000,
    forecastDays: 7,
    notifications: {
      lowBalance: true,
      goalMilestones: true,
      weeklyDigest: false,
      dominoAlerts: true,
    },
  },
  categories: [
    'Food',
    'Income',
    'Shopping',
    'Education',
    'Transport',
    'Housing',
    'Utilities',
    'Health',
    'Entertainment',
  ],
  transactions: [],
  goals: [],
  health: {
    score: 0,
    label: 'Awaiting Data',
    split: [
      { key: 'Needs', value: 0, color: '#064E49' },
      { key: 'Wants', value: 0, color: '#D9B45B' },
      { key: 'Savings', value: 0, color: '#2E7655' },
    ],
    factors: [
      {
        name: 'Needs & Essentials Ratio',
        score: 0,
        note: 'Import or record transactions to evaluate your essentials ratio.',
      },
      {
        name: 'Reserve Buffer Adequacy',
        score: 0,
        note: 'Calculated once opening balance or statements are added.',
      },
      {
        name: 'Consistent Savings Habit',
        score: 0,
        note: 'Measures income saved versus discretionary spending.',
      },
      {
        name: 'Domino Vulnerability Index',
        score: 0,
        note: 'Tests resilience against single unplanned financial shocks.',
      },
    ],
  },
  forecast: {
    startDate: new Date().toISOString().split('T')[0],
    sevenDay: [0, 0, 0, 0, 0, 0, 0],
  },
  sparklines: {
    balance: [0, 0, 0, 0, 0, 0],
    income: [0, 0, 0, 0, 0, 0],
  },
  insights: [],
  notifications: [],
  upcomingBills: [],
  goalContribution: 0,
};
