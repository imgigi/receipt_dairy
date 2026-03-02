
import React, { useState, useMemo } from 'react';
import { Expense, Income } from '../types';
import { Package, Wallet, Tag, X, ArrowUpDown } from 'lucide-react';

interface BackpackProps {
  expenses: Expense[];
  onExpenseClick: (e: Expense) => void;
}

const Backpack: React.FC<BackpackProps> = ({ expenses, onExpenseClick }) => {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<'DATE' | 'DURATION'>('DATE');

  const groupedItems = useMemo<Record<string, Expense[]>>(() => {
    const groups: Record<string, Expense[]> = {};
    expenses.filter(e => e.duration > 1).forEach(e => {
      if (!groups[e.category]) groups[e.category] = [];
      groups[e.category].push(e);
    });
    return groups;
  }, [expenses]);

  if (selectedGroup) {
      const itemsInGroup = [...(groupedItems[selectedGroup] || [])];
      if (sortMode === 'DATE') itemsInGroup.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      else itemsInGroup.sort((a,b) => b.duration - a.duration);

      return (
        <div className="space-y-6 pt-4 animate-fade-in">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <button onClick={() => setSelectedGroup(null)} className="p-2 bg-stone-900 text-white rounded-full"><X size={20}/></button>
                 <h2 className="text-2xl font-cartoon text-stone-900">{selectedGroup}</h2>
              </div>
              <button onClick={() => setSortMode(sortMode === 'DATE' ? 'DURATION' : 'DATE')} className="text-[10px] font-bold text-stone-400 bg-white border-4 border-stone-900 px-3 py-1 rounded-xl flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                 <ArrowUpDown size={10}/> {sortMode === 'DATE' ? '日期排序' : '时长排序'}
              </button>
           </div>
           <div className="space-y-4">
              {itemsInGroup.map(item => (
                  <div key={item.id} onClick={() => onExpenseClick(item)} className="bg-white p-5 rounded-[2rem] border-4 border-stone-900 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.1)] flex justify-between items-center cursor-pointer active:scale-95 transition-transform">
                     <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-stone-400 mb-1">{item.date}</p>
                        <h4 className="font-bold text-stone-900 truncate">{item.description}</h4>
                        <p className="text-[10px] font-bold text-blue-500 mt-1 uppercase tracking-tighter">分摊中: {item.duration}天</p>
                     </div>
                     <div className="text-right ml-4">
                        <span className="text-2xl font-cartoon">¥{item.amount}</span>
                     </div>
                  </div>
              ))}
           </div>
        </div>
      );
  }

  return (
    <div className="space-y-6 pt-4">
      <div className="grid grid-cols-2 gap-4 animate-fade-in">
        {Object.keys(groupedItems).length === 0 ? (
          <div className="col-span-2 text-center py-24 text-stone-300"><Package size={64} className="mx-auto mb-4 opacity-10" /><p className="font-bold">行囊空空如也</p></div>
        ) : (Object.entries(groupedItems) as [string, Expense[]][]).map(([label, items]) => (
          <div key={label} onClick={() => setSelectedGroup(label)} className="relative group cursor-pointer active:scale-95 transition-transform mt-2">
             {/* 堆叠样式优化 */}
             {items.length > 1 && <div className="absolute inset-0 bg-stone-200 translate-x-2 translate-y-2 rounded-[2.5rem] border-4 border-stone-900 -z-10"></div>}
             
             <div className="bg-white p-6 rounded-[2.5rem] border-4 border-stone-900 shadow-sm flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center text-xl mb-3 shadow-inner">🏷️</div>
                <h3 className="font-cartoon text-stone-900 text-lg">{label}</h3>
                <p className="text-[10px] font-bold text-stone-400 mt-1 uppercase tracking-tighter">{items.length} 个物品</p>
                <div className="mt-4 pt-4 border-t-2 border-dashed border-stone-100 w-full">
                   <p className="text-xl font-cartoon">¥{items.reduce((s, x) => s + x.amount, 0).toFixed(0)}</p>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Backpack;
