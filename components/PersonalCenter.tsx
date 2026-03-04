
import React, { useState } from 'react';
import { BudgetSettings } from '../types';
import { Save, Calendar, ArrowRight, User, Wallet, Target, Settings, Tag, Plus, Trash2, Edit2, Clock } from 'lucide-react';

interface PersonalCenterProps {
  settings: BudgetSettings;
  onSave: (settings: BudgetSettings) => void;
  onOpenBudgetManager: () => void;
}

const PersonalCenter: React.FC<PersonalCenterProps> = ({ settings, onSave, onOpenBudgetManager }) => {
  const [formData, setFormData] = useState<BudgetSettings>(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState<'flexible' | 'fixed' | 'income'>('flexible');

  const handleChange = (key: keyof BudgetSettings, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    const updated = { ...formData };
    if (!updated.budgetStartDate) updated.budgetStartDate = new Date().toISOString().split('T')[0];
    onSave(updated);
    setHasChanges(false);
  };

  const addCategory = () => {
    const name = prompt('请输入新标签名称:');
    if (!name || name.trim() === '') return;
    const list = [...formData.categories[activeCategoryTab]];
    if (list.includes(name)) return alert('名称已存在');
    list.push(name);
    handleChange('categories', { ...formData.categories, [activeCategoryTab]: list });
  };

  const deleteCategory = (index: number) => {
    const cat = formData.categories[activeCategoryTab][index];
    if (window.confirm(`确认删除标签 "${cat}" 吗？已有该标签的账目将显示为无标签。`)) {
      const list = formData.categories[activeCategoryTab].filter((_, i) => i !== index);
      handleChange('categories', { ...formData.categories, [activeCategoryTab]: list });
    }
  };

  const renameCategory = (index: number) => {
    const oldName = formData.categories[activeCategoryTab][index];
    const newName = prompt('重命名标签:', oldName);
    if (!newName || newName.trim() === '' || newName === oldName) return;
    const list = [...formData.categories[activeCategoryTab]];
    list[index] = newName;
    handleChange('categories', { ...formData.categories, [activeCategoryTab]: list });
  };

  const setSettlementTime = () => {
    const time = prompt('设置每日结算提醒时间 (HH:mm):', formData.settlementTime);
    if (time && /^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) {
      handleChange('settlementTime', time);
    } else if (time) {
      alert('格式错误，请使用 22:00 格式');
    }
  };

  const days = Array.from({ length: 28 }, (_, i) => i + 1);

  return (
    <div className="pt-4 pb-32 space-y-8 animate-fade-in">
      <div>
         <h2 className="text-3xl font-cartoon text-stone-900">个人设置</h2>
         <p className="text-xs font-bold text-stone-400 mt-1">管理你的月度计划与标签</p>
      </div>

      <section 
        onClick={onOpenBudgetManager}
        className="bg-stone-900 text-white p-6 rounded-[2rem] shadow-xl cursor-pointer active:scale-95 transition-transform border-2 border-amber-400 relative overflow-hidden"
      >
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <h3 className="text-amber-400 text-[10px] font-bold uppercase tracking-widest">月度计划</h3>
            <div className="flex items-baseline gap-2 mt-2">
               <span className="text-3xl font-cartoon">¥{settings.savingsGoal.toLocaleString()}</span>
               <span className="text-[10px] text-stone-400 font-bold">/ 存钱目标</span>
            </div>
          </div>
          <div className="bg-amber-400 text-stone-900 p-2 rounded-xl shadow-lg">
             <ArrowRight size={18} />
          </div>
        </div>
      </section>


      <section className="bg-white p-6 rounded-[2rem] border-4 border-stone-900 shadow-sm space-y-4">
         <div className="flex items-center gap-2 text-stone-900 font-bold"><Clock size={20} /><h3>提醒设置</h3></div>
         <div onClick={setSettlementTime} className="flex justify-between items-center bg-stone-100 p-4 rounded-xl cursor-pointer hover:bg-stone-200 transition-all">
            <span className="text-sm font-bold text-stone-700">小票自动生成时间</span>
            <span className="font-cartoon text-xl">{formData.settlementTime}</span>
         </div>
         <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-stone-500">结算起始日</span>
            <select 
              value={formData.monthStartDay}
              onChange={(e) => handleChange('monthStartDay', parseInt(e.target.value))}
              className="bg-stone-100 border-2 border-stone-200 py-2 px-4 rounded-xl text-stone-900 font-bold focus:outline-none focus:border-stone-900"
            >
              {days.map(d => <option key={d} value={d}>每月 {d} 日</option>)}
            </select>
         </div>
      </section>

      <button onClick={handleSave} disabled={!hasChanges} className={`w-full py-4 rounded-3xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${hasChanges ? 'bg-stone-900 text-white shadow-xl active:scale-95' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`}>
         {hasChanges ? '保存修改' : '已保存'}
      </button>
    </div>
  );
};

export default PersonalCenter;
