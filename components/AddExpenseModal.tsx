import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Expense, ExpenseType, BudgetSettings } from '../types';
import { EXPENSE_LABELS } from '../constants';
import { Check, X, CalendarClock, Trash2, Repeat, Plus, Settings, ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Expense) => void;
  onDelete?: (id: string) => void;
  settings: BudgetSettings;
  onUpdateSettings?: (settings: BudgetSettings) => void;
  expenseToEdit?: Expense | null;
}

type DurationUnit = 'DAYS' | 'MONTHS';

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
  settings, 
  onUpdateSettings,
  expenseToEdit 
}) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ExpenseType>(ExpenseType.FLEXIBLE);
  const [category, setCategory] = useState('');
  
  // Duration state
  const [duration, setDuration] = useState<number>(1); 
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('DAYS');
  const [isLongTerm, setIsLongTerm] = useState(false);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // --- Category Management State ---
  const [isManageMode, setIsManageMode] = useState(false);
  const [editingCategoryIdx, setEditingCategoryIdx] = useState<number | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize/Reset
  useEffect(() => {
    if (isOpen) {
      if (expenseToEdit) {
        setAmount(expenseToEdit.amount.toString());
        setDescription(expenseToEdit.description);
        setType(expenseToEdit.type);
        setCategory(expenseToEdit.category);
        setDate(expenseToEdit.date);
        
        const storedDays = expenseToEdit.duration;
        const isLikelyMonthly = expenseToEdit.type === ExpenseType.FIXED || (storedDays >= 28 && storedDays % 30 <= 1); 

        if (isLikelyMonthly && storedDays >= 28) {
            setDurationUnit('MONTHS');
            setDuration(parseFloat((storedDays / 30).toFixed(1))); 
        } else {
            setDurationUnit('DAYS');
            setDuration(storedDays);
        }

        setIsLongTerm(expenseToEdit.duration > 1);

      } else {
        setAmount('');
        setDescription('');
        setType(ExpenseType.FLEXIBLE);
        setDate(new Date().toISOString().split('T')[0]);
        setDuration(1); 
        setDurationUnit('MONTHS');
        setIsLongTerm(false);
        
        const defaultCats = settings.categories.flexible;
        if (defaultCats.length > 0) setCategory(defaultCats[0]);
      }
      // Reset management mode on open
      setIsManageMode(false);
      setEditingCategoryIdx(null);
    }
  }, [isOpen, expenseToEdit, settings.categories]);

  // Default selection when Type changes
  useEffect(() => {
    if (isOpen && !expenseToEdit) {
       const cats = type === ExpenseType.FIXED ? settings.categories.fixed : settings.categories.flexible;
       // Only switch if current category is invalid for new type
       if (cats.length > 0 && !cats.includes(category)) {
         setCategory(cats[0]);
       }

       if (type === ExpenseType.FIXED) {
           setIsLongTerm(true);
           setDurationUnit('MONTHS');
           setDuration(1);
       } else {
           setIsLongTerm(false);
           setDurationUnit('DAYS');
           setDuration(2);
       }
    }
  }, [type, isOpen, expenseToEdit, settings.categories]);

  const calculatedDays = useMemo(() => {
    if (!isLongTerm) return 1;
    if (durationUnit === 'DAYS') return Math.max(0.1, duration);

    if (!date) return Math.round(duration * 30);

    const [yStr, mStr, dStr] = date.split('-');
    const y = parseInt(yStr);
    const m = parseInt(mStr) - 1;
    const d = parseInt(dStr);

    const startDate = new Date(y, m, d);
    const wholeMonths = Math.floor(duration);
    const fractionalMonths = duration - wholeMonths;

    let targetDate = new Date(y, m + wholeMonths, 1);
    const daysInTargetMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
    const targetDay = Math.min(d, daysInTargetMonth);
    targetDate.setDate(targetDay);

    if (fractionalMonths > 0) {
       targetDate.setDate(targetDate.getDate() + Math.round(fractionalMonths * 30));
    }

    const diffTime = targetDate.getTime() - startDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(1, diffDays);

  }, [duration, durationUnit, date, isLongTerm]);

  // --- Category Management Logic ---
  
  const currentCategories = type === ExpenseType.FIXED ? settings.categories.fixed : settings.categories.flexible;
  const categoryKey = type === ExpenseType.FIXED ? 'fixed' : 'flexible';

  const updateCategories = (newCats: string[]) => {
      if (!onUpdateSettings) return;
      onUpdateSettings({
          ...settings,
          categories: {
              ...settings.categories,
              [categoryKey]: newCats
          }
      });
  };

  const handleLongPressStart = (catIndex: number) => {
      longPressTimerRef.current = setTimeout(() => {
          setIsManageMode(true);
          if (navigator.vibrate) navigator.vibrate(50);
      }, 600); // 600ms hold time
  };

  const handleLongPressEnd = () => {
      if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
      }
  };

  const handleAddNewCategory = () => {
      const name = prompt("请输入新分类名称:");
      if (name && name.trim()) {
          if (currentCategories.includes(name.trim())) {
              alert("分类已存在");
              return;
          }
          const newCats = [...currentCategories, name.trim()];
          updateCategories(newCats);
          setCategory(name.trim());
      }
  };

  const handleDeleteCategory = (e: React.MouseEvent, index: number) => {
      e.stopPropagation();
      const catToDelete = currentCategories[index];
      if (confirm(`确定删除分类 "${catToDelete}" 吗?`)) {
          const newCats = currentCategories.filter((_, i) => i !== index);
          updateCategories(newCats);
          // If we deleted the selected category, reset selection
          if (category === catToDelete) {
              setCategory(newCats[0] || '');
          }
          setEditingCategoryIdx(null);
      }
  };

  const handleMoveCategory = (index: number, direction: 'left' | 'right') => {
      const newCats = [...currentCategories];
      if (direction === 'left') {
          if (index === 0) return;
          [newCats[index - 1], newCats[index]] = [newCats[index], newCats[index - 1]];
      } else {
          if (index === newCats.length - 1) return;
          [newCats[index + 1], newCats[index]] = [newCats[index], newCats[index + 1]];
      }
      updateCategories(newCats);
      // Keep edit mode focus on the item that moved
      if (direction === 'left') setEditingCategoryIdx(index - 1);
      else setEditingCategoryIdx(index + 1);
  };

  const handleRenameCategory = () => {
      if (editingCategoryIdx === null) return;
      if (!editCatName.trim()) return;

      const newCats = [...currentCategories];
      // Check duplicate
      const existingIdx = newCats.indexOf(editCatName.trim());
      if (existingIdx !== -1 && existingIdx !== editingCategoryIdx) {
          alert("分类名已存在");
          return;
      }

      const oldName = newCats[editingCategoryIdx];
      newCats[editingCategoryIdx] = editCatName.trim();
      updateCategories(newCats);
      
      if (category === oldName) {
          setCategory(editCatName.trim());
      }
      setEditingCategoryIdx(null);
  };

  // --- Main Render ---

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    const expensePayload: Expense = {
      id: expenseToEdit ? expenseToEdit.id : uuidv4(),
      amount: parseFloat(amount),
      description: description || category,
      date: date,
      type,
      category,
      duration: calculatedDays,
      timestamp: expenseToEdit?.timestamp || Date.now()
    };

    onSave(expensePayload);
    onClose();
  };
  
  const handleDelete = () => {
    if (expenseToEdit && onDelete) {
      if (window.confirm('确定要删除这条记录吗？')) {
        onDelete(expenseToEdit.id);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
      <div 
        className="absolute inset-0 bg-stone-900/30 backdrop-blur-sm pointer-events-auto transition-opacity"
        onClick={onClose}
      />
      
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 pointer-events-auto transform transition-transform duration-300 ease-out animate-slide-up sm:mb-8 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-stone-900 rounded-full"></div>
            <h3 className="text-xl font-serif font-medium text-stone-900">
              {expenseToEdit ? '编辑支出' : '记一笔'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {expenseToEdit && onDelete && (
              <button onClick={handleDelete} className="p-2 hover:bg-red-50 text-red-400 hover:text-red-500 rounded-full transition-colors">
                <Trash2 size={20} />
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full">
              <X className="text-stone-400" size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto no-scrollbar pb-2">
          
          {/* Amount */}
          <div className="relative py-2">
             <span className="absolute left-0 top-1/2 -translate-y-1/2 text-4xl font-serif text-stone-900">¥</span>
             <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                autoFocus={!expenseToEdit}
                className="w-full pl-10 py-2 text-6xl font-serif text-stone-900 placeholder-stone-200 border-none focus:ring-0 outline-none bg-transparent"
             />
          </div>

          {/* Type Switcher */}
          <div className="flex p-1 bg-stone-100 rounded-xl">
             <button
                type="button"
                onClick={() => {
                    setType(ExpenseType.FLEXIBLE);
                    setIsManageMode(false);
                }}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  type === ExpenseType.FLEXIBLE
                    ? 'bg-white text-stone-900 shadow-sm' 
                    : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                {EXPENSE_LABELS[ExpenseType.FLEXIBLE]}
              </button>
              <button
                type="button"
                onClick={() => {
                    setType(ExpenseType.FIXED);
                    setIsManageMode(false);
                }}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  type === ExpenseType.FIXED
                    ? 'bg-white text-stone-900 shadow-sm' 
                    : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                {EXPENSE_LABELS[ExpenseType.FIXED]}
              </button>
          </div>

          {/* Category Pills & Management */}
          <div>
            <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-medium text-stone-400 uppercase">
                    {isManageMode ? '管理模式 (点击编辑，长按退出)' : '分类 (长按可管理)'}
                </label>
                {isManageMode && (
                    <button 
                        type="button" 
                        onClick={() => {
                            setIsManageMode(false);
                            setEditingCategoryIdx(null);
                        }} 
                        className="text-[10px] bg-stone-900 text-white px-2 py-1 rounded"
                    >
                        完成
                    </button>
                )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {currentCategories.map((cat, idx) => (
                <div key={idx} className="relative group">
                    {editingCategoryIdx === idx ? (
                        // --- EDIT POPUP FOR SINGLE CATEGORY ---
                        <div className="absolute z-10 bottom-full mb-2 left-1/2 -translate-x-1/2 bg-stone-800 text-white p-2 rounded-xl shadow-xl flex flex-col gap-2 min-w-[160px] animate-fade-in">
                            {/* Rename Input */}
                            <div className="flex items-center gap-1 border-b border-stone-600 pb-1">
                                <input 
                                    value={editCatName}
                                    onChange={(e) => setEditCatName(e.target.value)}
                                    className="bg-transparent text-white text-xs outline-none w-full"
                                    autoFocus
                                />
                                <button type="button" onClick={handleRenameCategory} className="text-emerald-400 p-1">
                                    <Save size={14} />
                                </button>
                            </div>
                            {/* Actions */}
                            <div className="flex justify-between items-center pt-1">
                                <div className="flex gap-1">
                                    <button 
                                        type="button"
                                        onClick={() => handleMoveCategory(idx, 'left')} 
                                        disabled={idx === 0}
                                        className="p-1.5 bg-stone-700 rounded hover:bg-stone-600 disabled:opacity-30"
                                    >
                                        <ArrowLeft size={12} />
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => handleMoveCategory(idx, 'right')} 
                                        disabled={idx === currentCategories.length - 1}
                                        className="p-1.5 bg-stone-700 rounded hover:bg-stone-600 disabled:opacity-30"
                                    >
                                        <ArrowRight size={12} />
                                    </button>
                                </div>
                                <button 
                                    type="button"
                                    onClick={(e) => handleDeleteCategory(e, idx)}
                                    className="p-1.5 bg-red-500/20 text-red-300 rounded hover:bg-red-500/30"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                            {/* Close */}
                            <button 
                                type="button"
                                onClick={() => setEditingCategoryIdx(null)}
                                className="absolute -top-2 -right-2 bg-white text-stone-900 rounded-full p-0.5 shadow-sm"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ) : null}

                    <button
                        type="button"
                        // Press handlers
                        onMouseDown={() => handleLongPressStart(idx)}
                        onMouseUp={handleLongPressEnd}
                        onMouseLeave={handleLongPressEnd}
                        onTouchStart={() => handleLongPressStart(idx)}
                        onTouchEnd={handleLongPressEnd}
                        
                        onClick={() => {
                            if (isManageMode) {
                                setEditingCategoryIdx(idx);
                                setEditCatName(cat);
                            } else {
                                setCategory(cat);
                            }
                        }}
                        className={`px-4 py-2 rounded-full text-sm border transition-all relative ${
                            category === cat && !isManageMode
                            ? 'bg-stone-900 text-white border-stone-900' 
                            : isManageMode 
                                ? 'bg-stone-100 text-stone-900 border-dashed border-stone-300 animate-pulse' // Visual cue for edit mode
                                : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'
                        }`}
                    >
                        {cat}
                        {isManageMode && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white"></div>
                        )}
                    </button>
                </div>
              ))}
              
              {/* Add Button */}
              <button
                type="button"
                onClick={handleAddNewCategory}
                className="w-10 h-10 rounded-full border border-stone-200 border-dashed flex items-center justify-center text-stone-400 hover:text-stone-900 hover:border-stone-900 transition-colors"
                title="添加新分类"
              >
                <Plus size={18} />
              </button>
            </div>
            
            {/* Hint text if list is empty */}
            {currentCategories.length === 0 && (
                 <p className="text-xs text-stone-300 mt-2">点击 + 号添加分类</p>
            )}
          </div>
          
          {/* Description */}
          <input
             type="text"
             value={description}
             onChange={(e) => setDescription(e.target.value)}
             placeholder="添加备注..."
             className="w-full p-4 bg-stone-50 border border-stone-100 rounded-xl text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900"
           />

          {/* Date Picker */}
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-100 flex items-center justify-between">
             <span className="text-sm font-medium text-stone-500">日期</span>
             <input 
               type="date"
               value={date}
               onChange={(e) => setDate(e.target.value)}
               className="bg-transparent text-stone-900 font-medium text-right focus:outline-none"
             />
          </div>

          {/* Duration / Validity */}
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-100 transition-all duration-300">
             <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsLongTerm(!isLongTerm)}>
                <div className="flex items-center gap-2 text-stone-700">
                   <CalendarClock size={18} />
                   <span className="font-medium text-sm">长期使用 / 保质期</span>
                </div>
                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isLongTerm ? 'bg-stone-900' : 'bg-stone-200'}`}>
                   <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isLongTerm ? 'translate-x-4' : ''}`} />
                </div>
             </div>
             
             {isLongTerm && (
               <div className="mt-4 animate-fade-in border-t border-stone-200 pt-4">
                  <div className="flex items-center gap-3">
                     <span className="text-sm text-stone-500 whitespace-nowrap">分摊时长:</span>
                     
                     <div className="flex-1 flex items-center gap-2">
                        <input 
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={duration}
                          onChange={(e) => setDuration(parseFloat(e.target.value) || 0)}
                          className="flex-1 p-2 bg-white border border-stone-200 rounded-lg text-center font-medium focus:ring-2 focus:ring-stone-900 outline-none"
                        />
                        
                        {/* Unit Toggle */}
                        <div className="flex bg-stone-200 rounded-lg p-1">
                            <button
                                type="button" 
                                onClick={() => setDurationUnit('DAYS')}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${durationUnit === 'DAYS' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500'}`}
                            >
                                天
                            </button>
                            <button
                                type="button" 
                                onClick={() => setDurationUnit('MONTHS')}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${durationUnit === 'MONTHS' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500'}`}
                            >
                                月
                            </button>
                        </div>
                     </div>
                  </div>
                  
                  <p className="text-xs text-stone-400 mt-3 flex items-start gap-1.5">
                     <Repeat size={12} className="mt-0.5 shrink-0"/>
                     <span>
                        {durationUnit === 'MONTHS' 
                           ? `总金额将在 ${duration} 个月 (${calculatedDays}天) 内分摊到每日预算。`
                           : `总金额将在 ${calculatedDays} 天内分摊到每日预算。`
                        }
                        <br/>物品将显示在“背包”中。
                     </span>
                  </p>
               </div>
             )}
          </div>

          <button
            type="submit"
            disabled={!amount}
            className="w-full bg-stone-900 disabled:bg-stone-300 text-white py-4 rounded-xl font-medium text-lg flex items-center justify-center gap-2 shadow-xl hover:bg-stone-800 transition-all active:scale-[0.98]"
          >
            <Check size={20} />
            {expenseToEdit ? '保存修改' : '完成'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;