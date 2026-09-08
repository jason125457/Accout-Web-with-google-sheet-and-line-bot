import React, { useState } from 'react';
import { X, PlusCircle } from 'lucide-react';
import { Transaction, TransactionCategory } from '../types/finance';
import { STANDARD_CATEGORIES } from '../constants/categories';

interface AddRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRecord: (record: Transaction) => void;
}

export const AddRecordModal: React.FC<AddRecordModalProps> = ({
  isOpen,
  onClose,
  onAddRecord
}) => {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [item, setItem] = useState('');
  const [category, setCategory] = useState<TransactionCategory>('生活');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (!item.trim()) {
      setError('請輸入項目說明（例如：午餐、捷運）');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('請輸入大於 0 的有效金額');
      return;
    }

    const month = date.slice(0, 7);
    const newRecord: Transaction = {
      id: `manual-${Date.now()}`,
      date,
      item: item.trim(),
      category,
      amount: parsedAmount,
      month,
      isCustom: true
    };

    onAddRecord(newRecord);
    // Reset form
    setItem('');
    setAmount('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-[calc(1rem+env(safe-area-inset-bottom,0px))] bg-slate-900/50 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 relative my-auto">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">快速記一筆</h3>
            <p className="text-xs text-slate-500">補登或手動新增一筆消費紀錄</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {/* 時間 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              消費時間 (日期)
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800"
            />
          </div>

          {/* 類別選擇 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              消費類別
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {STANDARD_CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    category === cat
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 項目說明 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              項目說明
            </label>
            <input
              type="text"
              value={item}
              onChange={(e) => setItem(e.target.value)}
              placeholder="例如：晚餐水餃、藥局口罩"
              required
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 placeholder:text-slate-400"
            />
          </div>

          {/* 金額 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              消費金額 (NT$)
            </label>
            <input
              type="number"
              min="1"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="請輸入金額"
              required
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 placeholder:text-slate-400 font-semibold"
            />
          </div>

          {/* Error notice */}
          {error && (
            <p className="text-xs text-rose-600 font-medium bg-rose-50 p-2.5 rounded-lg border border-rose-200">
              {error}
            </p>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-all"
            >
              新增紀錄
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
