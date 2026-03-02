
import React, { useMemo, useState } from 'react';
import { Expense, Income, BudgetSettings, ExpenseType } from '../types';
import SwipeableRecordCard from './SwipeableRecordCard';
import { TrendingDown, TrendingUp, Filter, Calendar } from 'lucide-react';

interface DetailedRecordsViewProps {
  expenses: Expense[];
  incomes: Income[];
  settings: BudgetSettings;
  onEditExpense: (e: Expense) => void;
  onEditIncome: (i: Income) => void;
}

const DetailedRecordsView: React.FC<DetailedRecordsViewProps> = ({ expenses, incomes, settings, onEditExpense, onEditIncome }) => {
  const [activeTab, setActiveTab] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');

  const stats = useMemo(() => {
    const now = new Date();
    const startDay = settings.monthStartDay || 1;
    let startDate = new Date(now.getFullYear(), now.getMonth(), startDay);
    if (startDate > now) startDate = new Date(now.getFullYear(), now.getMonth() - 1, startDay);
    
    const cycleExpenses = expenses.filter(e => new Date(e.date) >= startDate);
    const cycleIncomes = incomes.filter(i => new Date(i.date) >= startDate);

    const totalExpense = cycleExpenses.reduce((s, e) => s + e.amount, 0);
    const totalIncome = cycleIncomes.reduce((s, i) => s + i.amount, 0);

    // Group by date
    const groupedExpenses: Record<string, Expense[]> = {};
    cycleExpenses.forEach(e => {
      if (!groupedExpenses[e.date]) groupedExpenses[e.date] = [];
      groupedExpenses[e.date].push(e);
    });
    Object.values(groupedExpenses).forEach(group => group.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));

    const groupedIncomes: Record<string, Income[]> = {};
    cycleIncomes.forEach(i => {
      if (!groupedIncomes[i.date]) groupedIncomes[i.date] = [];
      groupedIncomes[i.date].push(i);
    });
    Object.values(groupedIncomes).forEach(group => group.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));

    return {
      totalExpense,
      totalIncome,
      groupedExpenses: Object.entries(groupedExpenses).sort((a, b) => b[0].localeCompare(a[0])),
      groupedIncomes: Object.entries(groupedIncomes).sort((a, b) => b[0].localeCompare(a[0])),
      startDate
    };
  }, [expenses, incomes, settings]);

  return (
    <div className="space-y-6 pb-20">
      {/* 统计概览卡片 */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => setActiveTab('EXPENSE')}
          className={`p-6 rounded-[2.5rem] border-4 transition-all text-left relative overflow-hidden ${
            activeTab === 'EXPENSE' ? 'bg-stone-900 border-stone-900 text-white shadow-xl scale-[1.02]' : 'bg-white border-stone-100 text-stone-400'
          }`}
        >
          <TrendingDown size={20} className={activeTab === 'EXPENSE' ? 'text-amber-400' : 'text-stone-200'} />
          <p className="text-[10px] font-bold uppercase tracking-widest mt-4 mb-1">总支出</p>
          <p className="text-2xl font-cartoon">¥{stats.totalExpense.toFixed(0)}</p>
          {activeTab === 'EXPENSE' && <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white/5 rounded-full"></div>}
        </button>

        <button 
          onClick={() => setActiveTab('INCOME')}
          className={`p-6 rounded-[2.5rem] border-4 transition-all text-left relative overflow-hidden ${
            activeTab === 'INCOME' ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl scale-[1.02]' : 'bg-white border-stone-100 text-stone-400'
          }`}
        >
          <TrendingUp size={20} className={activeTab === 'INCOME' ? 'text-emerald-200' : 'text-stone-200'} />
          <p className="text-[10px] font-bold uppercase tracking-widest mt-4 mb-1">总收入</p>
          <p className="text-2xl font-cartoon">¥{stats.totalIncome.toFixed(0)}</p>
          {activeTab === 'INCOME' && <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white/5 rounded-full"></div>}
        </button>
      </div>

      {/* 列表部分 */}
      <div className="space-y-8">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
            <Calendar size={14} /> {stats.startDate.toISOString().split('T')[0].slice(0, 7)} 账期明细
          </h3>
          <div className="p-2 bg-white rounded-xl border-2 border-stone-100">
            <Filter size={14} className="text-stone-300" />
          </div>
        </div>

        {activeTab === 'EXPENSE' ? (
          <div className="space-y-8">
            {stats.groupedExpenses.length === 0 ? (
              <div className="py-20 text-center border-4 border-dashed border-stone-100 rounded-[3rem]">
                <p className="text-stone-300 font-bold">本账期暂无支出记录</p>
              </div>
            ) : (
              stats.groupedExpenses.map(([date, items]) => (
                <div key={date} className="space-y-3">
                  <div className="flex items-center gap-3 px-2">
                    <div className="h-[2px] flex-1 bg-stone-100"></div>
                    <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">{date}</span>
                    <div className="h-[2px] flex-1 bg-stone-100"></div>
                  </div>
                  {items.map(item => (
                    <SwipeableRecordCard 
                      key={item.id} 
                      record={item} 
                      onClick={onEditExpense} 
                      onUpdate={() => {}} 
                    />
                  ))}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {stats.groupedIncomes.length === 0 ? (
              <div className="py-20 text-center border-4 border-dashed border-stone-100 rounded-[3rem]">
                <p className="text-stone-300 font-bold">本账期暂无收入记录</p>
              </div>
            ) : (
              stats.groupedIncomes.map(([date, items]) => (
                <div key={date} className="space-y-3">
                  <div className="flex items-center gap-3 px-2">
                    <div className="h-[2px] flex-1 bg-stone-100"></div>
                    <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">{date}</span>
                    <div className="h-[2px] flex-1 bg-stone-100"></div>
                  </div>
                  {items.map(item => (
                    <SwipeableRecordCard 
                      key={item.id} 
                      record={item} 
                      isIncome
                      onClick={onEditIncome} 
                      onUpdate={() => {}} 
                    />
                  ))}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailedRecordsView;
