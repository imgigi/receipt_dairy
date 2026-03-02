
import React, { useState, useEffect } from 'react';
import { BudgetSettings, IncomeItem, Expense, ExpenseType, RecurringFixedItem } from '../types';
import { Save, X, Plus, Trash2, Wallet, Calculator, CreditCard, PiggyBank, Target, ChevronDown } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface BudgetManagerProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: BudgetSettings;
  expenses: Expense[];
  onSave: (settings: BudgetSettings) => void;
}

const BudgetManager: React.FC<BudgetManagerProps> = ({ isOpen, onClose, currentSettings, expenses, onSave }) => {
  const [formData, setFormData] = useState<BudgetSettings>(currentSettings);
  const [newFixedName, setNewFixedName] = useState('');
  const [newFixedAmount, setNewFixedAmount] = useState('');
  const [showFixedTags, setShowFixedTags] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({ ...currentSettings });
      setNewFixedName(currentSettings.categories.fixed[0] || '房租');
    }
  }, [currentSettings, isOpen]);

  if (!isOpen) return null;

  const handleChange = (key: keyof BudgetSettings, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, [key]: numValue }));
  };

  const addFixedItem = () => {
    if (!newFixedName || !newFixedAmount) return;
    const amount = parseFloat(newFixedAmount);
    if (isNaN(amount) || amount <= 0) return;
    const newItem: RecurringFixedItem = { id: uuidv4(), name: newFixedName, amount, dayOfMonth: 1 };
    setFormData(prev => {
        const list = [...(prev.recurringFixed || []), newItem];
        return { ...prev, recurringFixed: list, fixedBudget: list.reduce((s, i) => s + i.amount, 0) };
    });
    setNewFixedAmount('');
  };

  const removeFixedItem = (id: string) => {
    setFormData(prev => {
        const list = (prev.recurringFixed || []).filter(item => item.id !== id);
        return { ...prev, recurringFixed: list, fixedBudget: list.reduce((s, i) => s + i.amount, 0) };
    });
  };

  const flexiblePool = formData.totalBudget - formData.fixedBudget - formData.savingsGoal;
  const daysInMonth = 30;
  const estDaily = flexiblePool / daysInMonth;
  
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border-4 border-stone-900">
        
        <div className="p-6 border-b-4 border-double border-stone-200 flex justify-between items-center bg-stone-50">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-cartoon text-stone-900 tracking-tighter">月度财务规划</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full transition-colors"><X size={24} className="text-stone-500" /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          
          <section className="space-y-6">
            <h3 className="text-xs font-bold uppercase text-stone-400 flex items-center gap-2">基础参数设置</h3>
            
            <div className="space-y-4">
                <div className="bg-stone-50 p-6 rounded-3xl border-2 border-stone-200">
                   <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-bold text-stone-700">月总预算 (收入)</label>
                      <span className="text-[10px] text-stone-400 font-bold uppercase">Income</span>
                   </div>
                   <div className="relative">
                      <span className="absolute left-0 bottom-2 text-4xl font-cartoon text-stone-400">¥</span>
                      <input type="number" value={formData.totalBudget || ''} onChange={(e) => handleChange('totalBudget', e.target.value)} className="w-full pl-8 py-2 bg-transparent text-5xl font-cartoon outline-none" placeholder="0" />
                   </div>
                </div>

                <div className="bg-stone-50 p-6 rounded-3xl border-2 border-stone-200">
                    <label className="block text-sm font-bold text-stone-700 mb-4">固定支出明细</label>
                    <div className="space-y-3 mb-6">
                        {(formData.recurringFixed || []).map(item => (
                            <div key={item.id} className="flex justify-between items-center bg-white p-4 rounded-2xl border-2 border-stone-100 shadow-sm">
                                <span className="font-bold text-stone-700 text-sm">{item.name}</span>
                                <div className="flex items-center gap-3">
                                    <span className="font-cartoon text-lg text-stone-900">¥{item.amount}</span>
                                    <button onClick={() => removeFixedItem(item.id)} className="text-stone-300 hover:text-red-500"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="space-y-3">
                        <div className="relative">
                            <button 
                                onClick={() => setShowFixedTags(!showFixedTags)}
                                className="w-full bg-white border-2 border-stone-200 rounded-2xl px-4 py-3 text-sm font-bold text-left flex justify-between items-center"
                            >
                                <span>{newFixedName || '选择项目'}</span>
                                <ChevronDown size={16} className={`transition-transform ${showFixedTags ? 'rotate-180' : ''}`} />
                            </button>
                            {showFixedTags && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-4 border-stone-900 rounded-2xl shadow-xl p-2 z-50 flex flex-wrap gap-2 max-h-40 overflow-y-auto no-scrollbar">
                                    {formData.categories.fixed.map(tag => (
                                        <button 
                                            key={tag}
                                            onClick={() => { setNewFixedName(tag); setShowFixedTags(false); }}
                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border-2 transition-all ${newFixedName === tag ? 'bg-stone-900 text-white border-stone-900' : 'bg-stone-50 text-stone-600 border-stone-200'}`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                    <button 
                                        onClick={() => {
                                            const name = prompt('输入新固定支出标签:');
                                            if (name) {
                                                const updated = [...formData.categories.fixed, name];
                                                setFormData(prev => ({ ...prev, categories: { ...prev.categories, fixed: updated } }));
                                                setNewFixedName(name);
                                                setShowFixedTags(false);
                                            }
                                        }}
                                        className="px-3 py-1.5 rounded-xl text-[10px] font-bold border-2 border-dashed border-stone-300 text-stone-400"
                                    >
                                        + 新增
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-cartoon">¥</span>
                                <input 
                                    className="w-full bg-white border-2 border-stone-200 rounded-2xl pl-8 pr-4 py-3 text-sm outline-none focus:border-stone-900" 
                                    placeholder="金额" 
                                    type="number" 
                                    value={newFixedAmount} 
                                    onChange={e => setNewFixedAmount(e.target.value)} 
                                />
                            </div>
                            <button 
                                onClick={addFixedItem} 
                                disabled={!newFixedName || !newFixedAmount} 
                                className="bg-stone-900 text-white rounded-2xl px-6 flex items-center justify-center hover:bg-stone-700 disabled:opacity-30 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] active:translate-y-1 active:shadow-none transition-all"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-stone-50 p-6 rounded-3xl border-2 border-stone-200">
                    <label className="block text-sm font-bold text-stone-700 mb-2">存钱小目标</label>
                    <div className="relative">
                        <span className="absolute left-0 bottom-1 text-2xl font-cartoon text-stone-400">¥</span>
                        <input type="number" value={formData.savingsGoal || ''} onChange={(e) => handleChange('savingsGoal', e.target.value)} className="w-full pl-6 py-1 bg-transparent text-3xl font-cartoon outline-none" placeholder="0" />
                    </div>
                </div>

                <div className="p-6 bg-stone-900 text-stone-50 rounded-[2.5rem] text-center border-4 border-amber-400">
                   <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1">每日可分配灵活资金</p>
                   <p className="text-5xl font-cartoon">¥{estDaily.toFixed(0)}</p>
                </div>
            </div>
          </section>
        </div>

        <div className="p-8 border-t-4 border-stone-200 bg-white">
          <button onClick={() => onSave(formData)} className="w-full bg-stone-900 text-white py-4 rounded-3xl font-bold text-lg flex items-center justify-center gap-3 shadow-[0_6px_0_0_#44403c] active:translate-y-[4px] active:shadow-[0_2px_0_0_#44403c] transition-all">
            <Save size={24} /> 保存并开始记账
          </button>
        </div>
      </div>
    </div>
  );
};

export default BudgetManager;
