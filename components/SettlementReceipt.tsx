
import React, { useState, useRef } from 'react';
import { Expense, Income, BudgetSettings } from '../types';
import { X, Check, ChevronDown, ChevronUp, Zap, Download } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { toPng } from 'html-to-image';
import download from 'downloadjs';

interface SettlementReceiptProps {
  date: string;
  expenses: Expense[];
  incomes: Income[];
  savings: number;
  monthlySavings: number;
  isOpen: boolean;
  onClose: () => void;
  onEditExpense: (e: Expense) => void;
  onEditIncome: (i: Income) => void;
  onAddExpense: (e: Expense) => void;
  onAddIncome: (i: Income) => void;
  settings: BudgetSettings;
}

const SettlementReceipt: React.FC<SettlementReceiptProps> = ({ 
  date, expenses, incomes, savings, monthlySavings, isOpen, onClose, onEditExpense, onEditIncome, onAddExpense, settings 
}) => {
  const [bulkInput, setBulkInput] = useState('');
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);

  const handleDownload = async () => {
    if (!receiptRef.current) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(receiptRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          width: '100%',
          height: 'auto'
        }
      });
      download(dataUrl, `小票日记-${date}.png`);
    } catch (err) {
      console.error('Download failed', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleBulkSubmit = () => {
    if (!bulkInput.trim()) return;
    const lines = bulkInput.split('\n').filter(l => l.trim().length > 0);
    lines.forEach(line => {
      const parts = line.split(/\s+/).filter(p => p.length > 0);
      let amount = 0, category = settings.categories.flexible[0], description = '', duration = 1;
      parts.forEach(part => {
        if (part.startsWith('@')) category = part.slice(1);
        else if (/^\d+(\.\d+)?$/.test(part)) { if (amount === 0) amount = parseFloat(part); else duration = parseInt(part); }
        else description += (description ? ' ' : '') + part;
      });
      if (amount > 0) {
        onAddExpense({ id: uuidv4(), amount, description: description || category, category, date, duration, type: 'FLEXIBLE' as any, timestamp: Date.now() });
      }
    });
    setBulkInput('');
    setIsBulkOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-[70%] max-w-[360px] animate-slide-down">
        <div ref={receiptRef} className="bg-white p-4 pb-6 shadow-2xl border-2 border-stone-200">
          <div className="text-center border-b-2 border-dashed border-stone-200 pb-3 mb-4">
            <p className="text-[10px] font-mono text-stone-400">{date}</p>
          </div>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar">
            {/* 省钱信息 - 缩小模块 */}
            <div className="bg-stone-50 p-3 rounded-2xl border-2 border-stone-900 flex flex-col items-center relative shadow-sm">
               <div className="bg-white border border-stone-900 px-2 py-0.5 rounded-full text-[7px] font-bold text-stone-900 mb-1.5">
                  今日已省
               </div>
               <h3 className="text-xl font-cartoon text-stone-900">¥{savings.toFixed(0)}</h3>
               <div className="w-full h-px border-t border-dashed border-stone-300 my-2"></div>
               <div className="flex justify-between w-full text-[7px] font-bold text-stone-400">
                  <span>本月累计节省</span>
                  <span className="text-stone-900">¥{monthlySavings.toFixed(0)}</span>
               </div>
            </div>

            {/* 极速录入 */}
            <div className="space-y-2">
              <button onClick={() => setIsBulkOpen(!isBulkOpen)} className="w-full flex items-center justify-center gap-2 bg-stone-50 py-1.5 rounded-xl text-[8px] font-bold text-stone-400 border border-dashed border-stone-300 active:bg-stone-100">
                <Zap size={10} className="text-amber-500"/> {isBulkOpen ? '收起录入' : '极速补账'}
              </button>
              {isBulkOpen && (
                <div className="space-y-2 animate-fade-in">
                  <textarea value={bulkInput} onChange={e => setBulkInput(e.target.value)} placeholder="名称 金额 @标签&#10;例如: 咖啡 28 @餐饮" className="w-full h-16 bg-white border border-stone-900 rounded-xl p-2 text-[10px] font-bold outline-none no-scrollbar"/>
                  <button onClick={handleBulkSubmit} className="w-full bg-stone-900 text-white py-1.5 rounded-xl text-[8px] font-bold">确认补账</button>
                </div>
              )}
            </div>

            {/* 明细列表 - 不折叠 */}
            <div className="px-1">
              <div className="flex items-center justify-between text-[8px] font-bold text-stone-400 uppercase tracking-widest mb-3 border-b border-stone-100 pb-1.5">
                  <span>项目 ({expenses.length + incomes.length})</span>
                  <span>金额</span>
              </div>
              <div className="space-y-3">
                {incomes.length > 0 && (
                  <div className="space-y-1.5">
                    {incomes.map(item => (
                      <div key={item.id} onClick={() => onEditIncome(item)} className="flex justify-between items-start group cursor-pointer font-mono">
                        <div className="flex flex-col flex-1 pr-3">
                          <div className="flex items-center gap-1">
                            <span className="text-[8px] font-bold text-emerald-600">入</span>
                            <span className="text-[8px] font-bold text-stone-900">{item.category}</span>
                          </div>
                          <span className="text-[7px] text-stone-400">{item.description}</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600">+{item.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {expenses.length > 0 && (
                  <div className="space-y-1.5">
                    {expenses.map(item => (
                      <div key={item.id} onClick={() => onEditExpense(item)} className="flex justify-between items-start group cursor-pointer font-mono">
                        <div className="flex flex-col flex-1 pr-3">
                          <div className="flex items-center gap-1">
                            <span className="text-[8px] font-bold text-stone-400">支</span>
                            <span className="text-[8px] font-bold text-stone-900">{item.category}</span>
                          </div>
                          <span className="text-[7px] text-stone-400">{item.description}</span>
                        </div>
                        <span className="text-[10px] font-bold text-stone-900">-{item.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {(expenses.length === 0 && incomes.length === 0) && (
                  <p className="text-center text-stone-300 text-[8px] py-3 italic">暂无流水记录</p>
                )}
              </div>
            </div>
          </div>

          {/* 总计 - 真实小票样式 */}
          <div className="mt-6 pt-3 border-t-2 border-dashed border-stone-200 space-y-0.5 font-mono">
             <div className="flex justify-between text-[8px] text-stone-500">
                <span>今日总收入</span>
                <span>¥{totalIncome.toFixed(2)}</span>
             </div>
             <div className="flex justify-between text-[8px] text-stone-500">
                <span>今日总支出</span>
                <span>¥{totalExpense.toFixed(2)}</span>
             </div>
             <div className="flex justify-between text-xs font-bold text-stone-900 pt-1.5 border-t border-stone-100">
                <span>今日净省</span>
                <span>¥{savings.toFixed(2)}</span>
             </div>
             <div className="text-center pt-4">
                <p className="text-[7px] text-stone-300 uppercase tracking-[0.2em]">*** 感谢使用 ***</p>
             </div>
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button 
            onClick={handleDownload} 
            disabled={isDownloading}
            className="flex-1 bg-white text-stone-900 py-3 rounded-xl shadow-xl flex items-center justify-center active:scale-95 transition-transform border-2 border-stone-900 text-[10px] font-bold gap-2"
          >
            <Download size={14} /> {isDownloading ? '生成中...' : '保存图片'}
          </button>
          <button 
            onClick={onClose} 
            className="flex-1 bg-stone-900 text-white py-3 rounded-xl shadow-xl flex items-center justify-center active:scale-95 transition-transform border-2 border-white text-[10px] font-bold gap-2"
          >
            <Check size={14} /> 确认
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettlementReceipt;
