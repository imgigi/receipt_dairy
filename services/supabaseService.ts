

/**
 * ==========================================
 *  SUPABASE DATABASE SETUP INSTRUCTIONS
 * ==========================================
 * 
 * Please run the following SQL in your Supabase SQL Editor to create the required tables:
 * 
 * -- 1. Budgets Table
 * create table if not exists budgets (
 *   user_id uuid primary key references auth.users(id),
 *   total_budget numeric default 0,
 *   fixed_month_budget numeric default 0,
 *   target_saving numeric default 0,
 *   month_start_day integer default 1,
 *   created_at timestamptz default now()
 * );
 * 
 * -- 2. Categories Table
 * create table if not exists categories (
 *   id uuid primary key default gen_random_uuid(),
 *   user_id uuid references auth.users(id),
 *   name text not null,
 *   created_at timestamptz default now()
 * );
 * 
 * -- 3. Expenses Table
 * create table if not exists expenses (
 *   id uuid primary key default gen_random_uuid(),
 *   user_id uuid references auth.users(id),
 *   category_id uuid references categories(id),
 *   amount numeric not null,
 *   start_date date not null,
 *   duration_days integer default 1,
 *   created_at timestamptz default now()
 * );
 * 
 * -- 4. Backpack Table (For Long-term items)
 * create table if not exists backpack (
 *   id uuid primary key default gen_random_uuid(),
 *   expense_id uuid references expenses(id) unique,
 *   user_id uuid references auth.users(id),
 *   name text,
 *   amount numeric,
 *   duration_days integer,
 *   start_date date,
 *   status text default 'active',
 *   created_at timestamptz default now()
 * );
 * 
 * -- 5. RLS Policies (Optional but Recommended)
 * alter table budgets enable row level security;
 * create policy "Users can only access their own budget" on budgets for all using (auth.uid() = user_id);
 * 
 * alter table categories enable row level security;
 * create policy "Users can only access their own categories" on categories for all using (auth.uid() = user_id);
 * 
 * alter table expenses enable row level security;
 * create policy "Users can only access their own expenses" on expenses for all using (auth.uid() = user_id);
 * 
 * alter table backpack enable row level security;
 * create policy "Users can only access their own backpack" on backpack for all using (auth.uid() = user_id);
 */

import { supabase } from './supabaseClient';
import { Expense, BudgetSettings, ExpenseType } from '../types';
import { DEFAULT_SETTINGS } from '../constants';

// --- Types for DB Rows ---
interface DBBudget {
  id: string;
  total_budget: number;
  fixed_month_budget: number;
  target_saving: number;
  month_start_day: number;
  created_at: string;
}

interface DBCategory {
  id: string;
  name: string;
}

// --- Local Cache for Category Classification ---
// The DB doesn't distinguish Fixed vs Flexible categories, so we store this pref locally
const CATEGORY_PREF_KEY = 'zenbudget_category_prefs';

const getCategoryPrefs = () => {
    try {
        const stored = localStorage.getItem(CATEGORY_PREF_KEY);
        // Fixed: Ensure the returned object contains 'income' to match BudgetSettings['categories'] type
        return stored ? JSON.parse(stored) : { 
          fixed: DEFAULT_SETTINGS.categories.fixed, 
          flexible: DEFAULT_SETTINGS.categories.flexible,
          income: DEFAULT_SETTINGS.categories.income 
        };
    } catch {
        return { 
          fixed: DEFAULT_SETTINGS.categories.fixed, 
          flexible: DEFAULT_SETTINGS.categories.flexible,
          income: DEFAULT_SETTINGS.categories.income 
        };
    }
};

const saveCategoryPrefs = (fixed: string[], flexible: string[], income: string[]) => {
    // Added income parameter to ensure all category lists are saved
    localStorage.setItem(CATEGORY_PREF_KEY, JSON.stringify({ fixed, flexible, income }));
};

// --- Service Methods ---

export const fetchInitialData = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  try {
      // 1. Fetch Budget Settings
      let settings: BudgetSettings = { ...DEFAULT_SETTINGS };
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (budgetError) {
          console.error("Supabase Error (Budgets):", budgetError);
          // If table doesn't exist, we might want to alert the user, but for now we fallback
      }

      if (budgetData) {
        const b = budgetData as DBBudget;
        settings.totalBudget = b.total_budget || 0;
        settings.fixedBudget = b.fixed_month_budget || 0;
        settings.savingsGoal = b.target_saving || 0;
        settings.monthStartDay = b.month_start_day || 1;
        settings.budgetStartDate = b.created_at ? b.created_at.split('T')[0] : new Date().toISOString().split('T')[0];
      } else {
        // Only try to create if we didn't get an error (implies empty row, not missing table)
        if (!budgetError) {
             await saveBudgetSettings(settings);
        }
      }

      // 2. Fetch Categories
      const { data: catData, error: catError } = await supabase.from('categories').select('*');
      if (catError) console.error("Supabase Error (Categories):", catError);
      
      const dbCategories = (catData as DBCategory[]) || [];
      
      // Merge DB categories with local prefs
      const localPrefs = getCategoryPrefs();
      const allDbCatNames = dbCategories.map(c => c.name);
      
      const fixedCats = localPrefs.fixed.filter(c => allDbCatNames.includes(c) || true); 
      const flexCats = localPrefs.flexible.filter(c => allDbCatNames.includes(c) || true);
      const incomeCats = localPrefs.income || DEFAULT_SETTINGS.categories.income;
      
      allDbCatNames.forEach(name => {
          if (!fixedCats.includes(name) && !flexCats.includes(name) && !incomeCats.includes(name)) {
              flexCats.push(name);
          }
      });

      settings.categories = { fixed: fixedCats, flexible: flexCats, income: incomeCats };

      // 3. Fetch Expenses
      const { data: expenseData, error: expError } = await supabase
        .from('expenses')
        .select(`
          id,
          amount,
          start_date,
          duration_days,
          created_at,
          category:categories(name),
          backpack(name, status)
        `)
        .eq('user_id', user.id);

      if (expError) console.error('Error fetching expenses:', expError);

      const expenses: Expense[] = (expenseData || []).map((row: any) => {
        const categoryName = row.category?.name || 'Uncategorized';
        
        // Determine Description: Use Backpack name if available, else Category name
        const backpackItem = row.backpack && row.backpack[0];
        const description = backpackItem?.name || categoryName;
        
        const type = settings.categories.fixed.includes(categoryName) ? ExpenseType.FIXED : ExpenseType.FLEXIBLE;

        return {
          id: row.id,
          amount: row.amount,
          description: description,
          date: row.start_date,
          type: type,
          category: categoryName,
          duration: row.duration_days,
          isArchived: backpackItem?.status === 'archived',
          timestamp: new Date(row.created_at).getTime()
        };
      });

      return { settings, expenses };
  } catch (err) {
      console.error("FATAL DATA FETCH ERROR:", err);
      return { settings: DEFAULT_SETTINGS, expenses: [] };
  }
};

export const saveBudgetSettings = async (settings: BudgetSettings) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Pass all category lists to ensure they are persisted
  saveCategoryPrefs(settings.categories.fixed, settings.categories.flexible, settings.categories.income);

  const { error } = await supabase
    .from('budgets')
    .upsert({
       user_id: user.id,
       total_budget: settings.totalBudget,
       fixed_month_budget: settings.fixedBudget,
       target_saving: settings.savingsGoal,
       month_start_day: settings.monthStartDay
    }, { onConflict: 'user_id' }); 

  if (error) console.error('Error saving budget:', error);
};

// Helper to get or create category ID
const ensureCategoryId = async (userId: string, categoryName: string): Promise<string | null> => {
    // Check if exists
    const { data } = await supabase
        .from('categories')
        .select('id')
        .eq('name', categoryName)
        .eq('user_id', userId)
        .maybeSingle();
    
    if (data) return data.id;

    // Create
    const { data: newData, error } = await supabase
        .from('categories')
        .insert({ user_id: userId, name: categoryName })
        .select('id')
        .single();
    
    if (error) {
        console.error('Error creating category:', error);
        return null;
    }
    return newData.id;
};

export const saveExpense = async (expense: Expense) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const categoryId = await ensureCategoryId(user.id, expense.category);
  if (!categoryId) return null;

  // 1. Upsert Expense
  const expensePayload = {
      id: expense.id, 
      user_id: user.id,
      category_id: categoryId,
      amount: expense.amount,
      start_date: expense.date,
      duration_days: expense.duration
  };

  const { error: expError } = await supabase
     .from('expenses')
     .upsert(expensePayload);

  if (expError) {
      console.error('Error saving expense:', expError);
      throw expError;
  }

  // 2. Handle Backpack (If duration > 1, sync to backpack table)
  if (expense.duration > 1) {
      const { error: bpError } = await supabase
          .from('backpack')
          .upsert({
              expense_id: expense.id, // Link to expense
              user_id: user.id,
              name: expense.description,
              amount: expense.amount,
              duration_days: expense.duration,
              start_date: expense.date,
              status: expense.isArchived ? 'archived' : 'active'
          }, { onConflict: 'expense_id' }); 
      
      if (bpError) console.error('Backpack save error:', bpError);
  }
};

export const deleteExpense = async (expenseId: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
    if (error) throw error;
};
