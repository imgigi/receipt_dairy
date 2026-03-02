
import { Expense, Income, BudgetSettings } from '../types';
import { DEFAULT_SETTINGS } from '../constants';

const STORAGE_KEYS = {
  EXPENSES: 'zenbudget_expenses_v4',
  INCOMES: 'zenbudget_incomes_v4',
  SETTINGS: 'zenbudget_settings_v4',
};

export const localStore = {
  set(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  get<T>(key: string): T | null {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }
};

export const getExpenses = async (): Promise<Expense[]> => {
  return localStore.get<Expense[]>(STORAGE_KEYS.EXPENSES) || [];
};

export const saveExpenses = async (expenses: Expense[]) => {
  localStore.set(STORAGE_KEYS.EXPENSES, expenses);
};

export const getIncomes = async (): Promise<Income[]> => {
  return localStore.get<Income[]>(STORAGE_KEYS.INCOMES) || [];
};

export const saveIncomes = async (incomes: Income[]) => {
  localStore.set(STORAGE_KEYS.INCOMES, incomes);
};

export const getSettings = async (): Promise<BudgetSettings> => {
  const settings = localStore.get<BudgetSettings>(STORAGE_KEYS.SETTINGS);
  if (!settings) return DEFAULT_SETTINGS;
  return { 
    ...DEFAULT_SETTINGS,
    ...settings,
    categories: { ...DEFAULT_SETTINGS.categories, ...settings.categories }
  };
};

export const saveSettings = async (settings: BudgetSettings) => {
  localStore.set(STORAGE_KEYS.SETTINGS, settings);
};
