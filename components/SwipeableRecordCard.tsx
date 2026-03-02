
import React from 'react';
import { Tag, Clock } from 'lucide-react';
import { Expense, Income } from '../types';

interface SwipeableRecordCardProps {
  record: Expense | Income;
  onClick: (record: any) => void;
  onUpdate: (record: any) => void;
  isIncome?: boolean;
}

const SwipeableRecordCard: React.FC<SwipeableRecordCardProps> = ({ record, onClick, isIncome = false }) => {
  return (
    <div 
      onClick={() => onClick(record)}
      className={`bg-white rounded-2xl p-3 flex justify-between items-center mb-2 border-2 transition-all active:scale-[0.98] cursor-pointer ${
        isIncome ? 'border-emerald-500 bg-emerald-50/30' : 'border-stone-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)]'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <div className={`px-1.5 py-0.5 rounded-md border text-[7px] font-bold uppercase tracking-tighter ${
            isIncome ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : 'bg-stone-100 border-stone-200 text-stone-600'
          }`}>
            {record.category}
          </div>
          {'duration' in record && record.duration > 1 && (
            <div className="flex items-center gap-0.5 text-[7px] font-bold text-blue-500">
              <Clock size={8} /> {record.duration}d
            </div>
          )}
        </div>
        <h4 className="font-bold text-stone-900 text-sm leading-tight truncate">{record.description}</h4>
      </div>
      <div className="text-right ml-3">
        <span className={`text-lg font-cartoon ${isIncome ? 'text-emerald-600' : 'text-stone-900'}`}>
          {isIncome ? '+' : ''}¥{record.amount.toFixed(0)}
        </span>
      </div>
    </div>
  );
};

export default SwipeableRecordCard;
