
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Expense, Income, RecordType, ExpenseType, BudgetSettings } from '../types';
import { X, Tag, Clock, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface AddRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveExpense: (e: Expense) => void;
  onSaveIncome: (i: Income) => void;
  onDelete?: (id: string, type: RecordType) => void;
  settings: BudgetSettings;
  recordToEdit?: Expense | Income | null;
  initialType?: RecordType;
}

const AddRecordModal: React.FC<AddRecordModalProps> = ({ 
  isOpen, onClose, onSaveExpense, onSaveIncome, onDelete, settings, recordToEdit, initialType = RecordType.EXPENSE 
}) => {
  const [quickInput, setQuickInput] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [recordType, setRecordType] = useState<RecordType>(initialType);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState<number>(1);
  const [durationUnit, setDurationUnit] = useState<'DAY' | 'MONTH'>('DAY');
  const [description, setDescription] = useState('');
  const [expenseType, setExpenseType] = useState<ExpenseType>(ExpenseType.FLEXIBLE);
  
  const [showDetails, setShowDetails] = useState(false);
  const [showTagBubble, setShowTagBubble] = useState(false);
  const [tagFilter, setTagFilter] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const savedLinesCountRef = useRef(0);

  useEffect(() => {
    if (isOpen) {
      savedLinesCountRef.current = 0;
      if (recordToEdit) {
        setAmount(recordToEdit.amount.toString());
        setDate(recordToEdit.date);
        setCategory(recordToEdit.category);
        setDescription(recordToEdit.description);
        const isExpense = 'type' in recordToEdit;
        setRecordType(isExpense ? RecordType.EXPENSE : RecordType.INCOME);
        if (isExpense) {
            setExpenseType((recordToEdit as Expense).type);
            const d = (recordToEdit as Expense).duration;
            if (d >= 28) { setDurationUnit('MONTH'); setDuration(Math.round(d/30)); } 
            else { setDurationUnit('DAY'); setDuration(d); }
        }
        setShowDetails(true);
      } else {
        setQuickInput('');
        setAmount('');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
        setRecordType(initialType);
        setCategory(initialType === RecordType.EXPENSE ? settings.categories.flexible[0] : settings.categories.income[0]);
        setDuration(1);
        setDurationUnit('DAY');
        setShowDetails(false); // 默认不显示详情
      }
    }
  }, [isOpen, recordToEdit, initialType, settings.categories]);

  // 智能解析逻辑：名称(非数字@) 金额(数字) [@标签(非数字)] [时长(数字)]
  const parseLineSmart = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return null;

    // 增强版正则：1.名称 2.金额 3.标签 4.时长
    // 允许名称包含非数字字符，金额为数字，标签以@开头，时长为末尾数字
    const regex = /^([^\d@\s]+)(\d+(?:\.\d+)?)?(?:@([^\d\s]+))?(\d+)?$/;
    const match = trimmed.match(regex);

    if (match && match[2]) { // 必须有金额才算匹配成功
      return {
        description: match[1] || '',
        amount: match[2] || '',
        category: match[3] || '',
        duration: match[4] ? parseInt(match[4]) : 1
      };
    }

    // 回退到空格解析逻辑
    const parts = trimmed.split(/\s+/).filter(p => p.length > 0);
    if (parts.length < 2 && !/^\d+/.test(parts[0])) return null;

    let pAmount = '';
    let pCategory = '';
    let pDescParts: string[] = [];
    let pDuration = 1;

    parts.forEach(part => {
      if (part.startsWith('@')) {
        pCategory = part.slice(1);
      } else if (/^\d+(\.\d+)?$/.test(part)) {
        if (!pAmount) pAmount = part;
        else pDuration = parseInt(part) || 1;
      } else {
        pDescParts.push(part);
      }
    });

    return { amount: pAmount, category: pCategory, description: pDescParts.join(' '), duration: pDuration };
  };

  // 处理输入变化，检测换行符进行实时保存
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setQuickInput(value);
    if (status) setStatus(null);
    
    // 统计当前包含换行符的完整行数
    const lines = value.split('\n');
    const completedLinesCount = value.endsWith('\n') ? lines.length - 1 : lines.length - 1;
    
    // 如果有新完成的行，且尚未被保存
    if (completedLinesCount > savedLinesCountRef.current) {
      for (let i = savedLinesCountRef.current; i < completedLinesCount; i++) {
        const lineToSave = lines[i].trim();
        if (lineToSave) {
          const parsed = parseLineSmart(lineToSave);
          if (parsed && parsed.amount) {
            saveParsedRecord(parsed);
          }
        }
      }
      savedLinesCountRef.current = completedLinesCount;
    }
  };

  // 统一的保存逻辑
  const saveParsedRecord = (parsed: any) => {
    const finalAmount = parseFloat(parsed.amount);
    const finalCategory = parsed.category || (recordType === RecordType.INCOME ? settings.categories.income[0] : settings.categories.flexible[0]);
    const finalDesc = parsed.description || finalCategory;
    
    try {
      if (recordType === RecordType.EXPENSE) {
        onSaveExpense({ 
          id: uuidv4(), 
          amount: finalAmount, 
          description: finalDesc, 
          date, 
          type: settings.categories.fixed.includes(finalCategory) ? ExpenseType.FIXED : ExpenseType.FLEXIBLE, 
          category: finalCategory, 
          duration: parsed.duration || 1,
          timestamp: Date.now()
        });
      } else {
        onSaveIncome({ 
          id: uuidv4(), 
          amount: finalAmount, 
          description: finalDesc, 
          date, 
          category: finalCategory,
          timestamp: Date.now()
        });
      }
      setStatus({ type: 'success', message: `已记录: ${finalDesc} ¥${finalAmount}` });
    } catch (err) {
      setStatus({ type: 'error', message: '记录失败' });
    }
  };

  const currentCategories = useMemo(() => {
    if (recordType === RecordType.INCOME) return settings.categories.income;
    return expenseType === ExpenseType.FIXED ? settings.categories.fixed : settings.categories.flexible;
  }, [recordType, expenseType, settings.categories]);

  const selectTag = (tag: string) => {
    if (recordToEdit) { setCategory(tag); setShowTagBubble(false); return; }
    const lines = quickInput.split('\n');
    const lastLine = lines[lines.length - 1];
    const parts = lastLine.split(/\s+/);
    let replaced = false;
    for (let i = parts.length - 1; i >= 0; i--) {
        if (parts[i].startsWith('@') || parts[i] === '') { parts[i] = `@${tag}`; replaced = true; break; }
    }
    if (!replaced) parts.push(`@${tag}`);
    lines[lines.length - 1] = parts.join(' ') + ' ';
    setQuickInput(lines.join('\n'));
    setShowTagBubble(false);
    setCategory(tag);
    inputRef.current?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (recordToEdit) {
      if (!amount) return;
      const finalDuration = durationUnit === 'MONTH' ? duration * 30 : duration;
      const ts = recordToEdit.timestamp || Date.now();
      if (recordType === RecordType.EXPENSE) {
        onSaveExpense({ ...recordToEdit, amount: parseFloat(amount), description: description || category, date, type: expenseType, category: category || currentCategories[0], duration: finalDuration, timestamp: ts } as Expense);
      } else {
        onSaveIncome({ ...recordToEdit, amount: parseFloat(amount), description: description || category, date, category: category || currentCategories[0], timestamp: ts } as Income);
      }
      onClose();
    } else {
      // 处理尚未通过换行保存的剩余行（通常是最后一行）
      const lines = quickInput.split('\n');
      for (let i = savedLinesCountRef.current; i < lines.length; i++) {
        const lineToSave = lines[i].trim();
        if (lineToSave) {
          const parsed = parseLineSmart(lineToSave);
          if (parsed && parsed.amount) {
            saveParsedRecord(parsed);
          }
        }
      }
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-[3rem] rounded-t-[3rem] p-8 shadow-2xl animate-slide-up border-t-4 sm:border-4 border-stone-900 max-h-[95vh] overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${recordType === RecordType.EXPENSE ? 'bg-stone-900 text-white' : 'bg-emerald-600 text-white'}`}>
              <Zap size={20} />
            </div>
            <h3 className="text-2xl font-cartoon text-stone-900">{recordToEdit ? '修改记录' : '极速补账'}</h3>
          </div>
          <button onClick={onClose} className="p-2 text-stone-400 hover:bg-stone-100 rounded-full transition-colors"><X size={28}/></button>
        </div>

        {showTagBubble && (
            <div className="absolute top-8 left-8 right-8 bg-white border-4 border-stone-900 rounded-2xl shadow-xl p-2 z-[130] flex flex-wrap gap-2 animate-bounce-in max-h-[150px] overflow-y-auto no-scrollbar">
                {currentCategories.filter(t => t.includes(tagFilter)).map(t => (
                    <button key={t} type="button" onClick={() => selectTag(t)} className="px-3 py-1.5 bg-amber-400 text-stone-900 text-[10px] font-bold rounded-lg border-2 border-stone-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px]">{t}</button>
                ))}
                {tagFilter && !currentCategories.includes(tagFilter) && (
                    <button type="button" onClick={() => selectTag(tagFilter)} className="px-3 py-1.5 bg-stone-900 text-white text-[10px] font-bold rounded-lg border-2 border-stone-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px]">创建: {tagFilter}</button>
                )}
            </div>
        )}

        <div className="mb-6 relative">
            {status && (
                <div className={`absolute -top-10 left-0 right-0 py-2 px-4 rounded-xl text-[10px] font-bold animate-fade-in text-center ${status.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                    {status.message}
                </div>
            )}
            
            {!recordToEdit && (
                <div className="space-y-4">
                    <div className="flex p-1 bg-stone-100 rounded-2xl">
                        <button type="button" onClick={() => setRecordType(RecordType.EXPENSE)} className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${recordType === RecordType.EXPENSE ? 'bg-stone-900 text-white shadow-md' : 'text-stone-400'}`}>记支出</button>
                        <button type="button" onClick={() => setRecordType(RecordType.INCOME)} className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${recordType === RecordType.INCOME ? 'bg-emerald-600 text-white shadow-md' : 'text-stone-400'}`}>记收入</button>
                    </div>
                    <div className="relative">
                       <textarea 
                         ref={inputRef} value={quickInput} onChange={handleInputChange}
                         placeholder="输入: 【名称】【金额】@【标签】【时长】&#10;例如: 咖啡28@餐饮3&#10;换行即保存当前行"
                         className="w-full bg-stone-50 rounded-[2rem] p-6 text-lg font-bold min-h-[160px] outline-none border-4 border-stone-100 focus:border-stone-900 transition-all no-scrollbar shadow-inner"
                       />
                    </div>
                    <div className="flex justify-between items-center px-2">
                       <p className="text-[10px] font-bold text-stone-400">智能识别: <span className="text-stone-600">【名称】+【金额】+@【标签】+【时长】</span></p>
                       <button type="button" onClick={() => setShowDetails(!showDetails)} className="text-[10px] font-bold text-amber-500 underline">
                         {showDetails ? '精简模式' : '更多选项'}
                       </button>
                    </div>
                </div>
            )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {showDetails && (
            <div className="space-y-4 animate-fade-in border-t-2 border-dashed border-stone-100 pt-4">
              <div className="relative border-b-4 border-stone-900 pb-2">
                <span className="absolute left-0 bottom-2 text-4xl font-cartoon text-stone-400">¥</span>
                <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full pl-10 text-5xl font-cartoon text-stone-900 outline-none bg-transparent" placeholder="0.00" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1 relative">
                    <label className="text-[8px] font-bold text-stone-400 uppercase">标签</label>
                    <button type="button" onClick={() => setShowTagBubble(!showTagBubble)} className="w-full bg-amber-400 text-stone-900 px-3 py-1.5 rounded-xl text-[10px] font-bold border-2 border-stone-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] truncate text-left">
                       {category || "未分类"}
                    </button>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[8px] font-bold text-stone-400 uppercase">日期</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-stone-100 p-1.5 rounded-xl text-[10px] font-bold outline-none" />
                 </div>
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-bold text-stone-400 uppercase">名称</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="名称..." className="w-full bg-stone-100 p-3 rounded-xl text-xs font-bold outline-none" />
              </div>
              {recordType === RecordType.EXPENSE && (
                <div className="space-y-2 bg-stone-50 p-4 rounded-2xl border-2 border-dashed border-stone-200">
                  <div className="flex items-center gap-2 text-stone-400"><Clock size={12}/><span className="text-[11px] font-bold">分摊时长</span></div>
                  <div className="flex gap-2">
                     <input type="number" min="1" value={duration} onChange={e => setDuration(parseInt(e.target.value) || 1)} className="w-20 bg-white border-2 border-stone-200 rounded-xl text-center font-bold text-sm outline-none" />
                     <div className="flex-1 flex bg-stone-200 p-1 rounded-xl">
                        <button type="button" onClick={() => setDurationUnit('DAY')} className={`flex-1 py-1 rounded-lg text-[10px] font-bold ${durationUnit === 'DAY' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400'}`}>天</button>
                        <button type="button" onClick={() => setDurationUnit('MONTH')} className={`flex-1 py-1 rounded-lg text-[10px] font-bold ${durationUnit === 'MONTH' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400'}`}>月</button>
                     </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <button type="submit" className="w-full bg-stone-900 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-[0_6px_0_0_#44403c] active:translate-y-[4px] active:shadow-[0_2px_0_0_#44403c] transition-all">
             {recordToEdit ? '确认修改' : '确认记录'}
          </button>
          {recordToEdit && onDelete && (
             <button type="button" onClick={() => onDelete(recordToEdit.id, recordType)} className="w-full text-red-500 font-bold text-xs py-2 hover:underline">删除本条记录</button>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddRecordModal;
