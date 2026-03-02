
import { ExpenseType, BudgetSettings } from './types';

export const DEFAULT_SETTINGS: BudgetSettings = {
  totalBudget: 0,
  savingsGoal: 0,
  fixedBudget: 0,
  monthStartDay: 1,
  budgetStartDate: null,
  settlementTime: "22:00",
  categories: {
    fixed: ["房租", "订阅", "保险", "网络", "话费"],
    flexible: ["餐饮", "居家", "交通", "购物", "娱乐", "护肤", "学习"],
    income: ["工资", "兼职", "奖金", "理财", "红包", "其他"]
  }
};

export const EXPENSE_LABELS: Record<ExpenseType, string> = {
  [ExpenseType.FIXED]: '固定支出',
  [ExpenseType.FLEXIBLE]: '灵活支出',
};
