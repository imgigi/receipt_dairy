
export enum ExpenseType {
  FIXED = 'FIXED',
  FLEXIBLE = 'FLEXIBLE'
}

export enum RecordType {
  EXPENSE = 'EXPENSE',
  INCOME = 'INCOME'
}

export interface Income {
  id: string;
  amount: number;
  description: string;
  date: string; // ISO Date YYYY-MM-DD
  category: string; // Labels/Tags
  timestamp: number;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string; // ISO Date string YYYY-MM-DD
  type: ExpenseType;
  category: string;
  duration: number; // In days. Default is 1.
  isArchived?: boolean; 
  timestamp: number;
}

export interface IncomeItem {
  id: string;
  description: string;
  amount: number;
  date: string;
}

export interface RecurringFixedItem {
  id: string;
  name: string;
  amount: number;
  dayOfMonth: number;
}

export interface BudgetSettings {
  totalBudget: number; 
  savingsGoal: number; 
  fixedBudget: number; 
  monthStartDay: number; 
  budgetStartDate: string | null;
  settlementTime: string; // HH:mm format, e.g., "22:00"

  categories: {
    fixed: string[];
    flexible: string[];
    income: string[];
  };

  recurringFixed?: RecurringFixedItem[];
  actualIncomes?: IncomeItem[];
}

export type HomeView = 'DAY' | 'WEEK' | 'MONTH' | 'CALENDAR';
