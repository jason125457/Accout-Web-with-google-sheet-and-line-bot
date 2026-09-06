import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Coffee,
  Car,
  Film,
  Sparkles,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowUpDown,
  Flame
} from 'lucide-react';
import { Transaction } from '../types/finance';

interface TransactionListProps {
  transactions: Transaction[];
  onDeleteRecord?: (id: string) => void;
  selectedMonth?: string;
  onClearMonth?: () => void;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  sortBy?: string;
  onSortChange?: (sort: string) => void;
  onlyBigExpenses?: boolean;
  onToggleBigExpenses?: () => void;
}

const CATEGORY_ICONS: Record<
  string,
  { icon: React.FC<{ className?: string }>; bg: string; text: string; pillBg: string; pillText: string }
> = {
  '生活': { icon: ShoppingBag, bg: 'bg-teal-50', text: 'text-teal-600', pillBg: 'bg-teal-50', pillText: 'text-teal-700' },
  '家用': { icon: Coffee, bg: 'bg-blue-50', text: 'text-blue-600', pillBg: 'bg-blue-50', pillText: 'text-blue-700' },
  '社交': { icon: Coffee, bg: 'bg-pink-50', text: 'text-pink-600', pillBg: 'bg-pink-50', pillText: 'text-pink-700' },
  '娛樂': { icon: Film, bg: 'bg-amber-50', text: 'text-amber-600', pillBg: 'bg-amber-50', pillText: 'text-amber-700' },
  '雜支': { icon: Car, bg: 'bg-slate-100', text: 'text-slate-600', pillBg: 'bg-slate-100', pillText: 'text-slate-700' },
};

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onDeleteRecord,
  selectedMonth = 'all',
  onClearMonth,
  selectedCategory = 'all',
  onCategoryChange,
  searchQuery = '',
  onSearchChange,
  sortBy = 'date-desc',
  onSortChange,
  onlyBigExpenses = false,
  onToggleBigExpenses,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Whenever filters change (e.g. chart month clicked), reset to first page
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedCategory, onlyBigExpenses, searchQuery, sortBy]);

  const totalPages = Math.ceil(transactions.length / pageSize) || 1;
  const currentSafePage = Math.min(currentPage, totalPages);
  const startIndex = (currentSafePage - 1) * pageSize;
  const currentRecords = transactions.slice(startIndex, startIndex + pageSize);

  return (
    <div className="fintech-card p-4 sm:p-6 flex flex-col justify-between min-w-0 overflow-hidden">
      {/* 1. Header & Controls Bar */}
      <div className="flex flex-col gap-3 pb-4 border-b border-slate-100 min-w-0">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2 shrink-0">
              <span>近期交易明細</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 tabular-nums">
                {transactions.length} 筆
              </span>
            </h3>

            {/* Active Month Filter Pill with Reset Button */}
            {selectedMonth && selectedMonth !== 'all' && (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-xs font-bold animate-fade-in shrink-0">
                <span>📅 {selectedMonth}</span>
                {onClearMonth && (
                  <button
                    onClick={onClearMonth}
                    className="hover:text-teal-950 font-black ml-0.5 leading-none"
                    title="清除月份篩選，顯示全部"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            {/* Active Category Filter Pill */}
            {selectedCategory && selectedCategory !== 'all' && (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold animate-fade-in shrink-0">
                <span>類別：{selectedCategory}</span>
                {onCategoryChange && (
                  <button
                    onClick={() => onCategoryChange('all')}
                    className="hover:text-indigo-950 font-black ml-0.5 leading-none"
                    title="清除類別篩選"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Big Expense Filter Button */}
          {onToggleBigExpenses && (
            <button
              onClick={onToggleBigExpenses}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
                onlyBigExpenses
                  ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80'
              }`}
              title="僅顯示單筆 ≥ NT$ 1,000 的大額開銷"
            >
              <Flame className={`w-3.5 h-3.5 ${onlyBigExpenses ? 'text-white' : 'text-amber-500'}`} />
              <span>大額 (≥$1k)</span>
            </button>
          )}
        </div>

        {/* Filter Controls Row (Search + Category + Sorting) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full min-w-0">
          {/* Keyword Search */}
          {onSearchChange && (
            <div className="relative w-full sm:flex-1 min-w-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="搜尋項目名稱或金額..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-slate-300 transition-all"
              />
            </div>
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Category Dropdown */}
            {onCategoryChange && (
              <select
                value={selectedCategory}
                onChange={(e) => {
                  onCategoryChange(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1 sm:flex-none px-2.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 transition-colors truncate"
              >
                <option value="all">全部類別</option>
                <option value="生活">生活</option>
                <option value="家用">家用</option>
                <option value="社交">社交</option>
                <option value="娛樂">娛樂</option>
                <option value="雜支">雜支</option>
              </select>
            )}

            {/* Sort Dropdown (時間前後 / 金額大小) */}
            {onSortChange && (
              <div className="relative flex-1 sm:flex-none min-w-0">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    onSortChange(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 transition-colors truncate"
                >
                  <option value="date-desc">時間：新至舊</option>
                  <option value="date-asc">時間：舊至新</option>
                  <option value="amount-desc">金額：高至低</option>
                  <option value="amount-asc">金額：低至高</option>
                </select>
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Transactions List */}
      <div className="divide-y divide-slate-100 my-2">
        {currentRecords.length > 0 ? (
          currentRecords.map((t) => {
            const meta = CATEGORY_ICONS[t.category] || CATEGORY_ICONS['生活'];
            const Icon = meta.icon;
            const isBig = t.amount >= 1000;

            return (
              <div
                key={t.id}
                className="py-3.5 px-2 hover:bg-slate-50/70 rounded-2xl flex items-center justify-between gap-3 transition-colors group"
              >
                {/* Left: Icon + Item details */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl ${meta.bg} ${meta.text} flex items-center justify-center shrink-0 shadow-sm`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800 truncate">
                        {t.item}
                      </span>
                      {t.isCustom && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 font-bold border border-teal-200/60 flex items-center gap-0.5 shrink-0">
                          <Sparkles className="w-2.5 h-2.5" />
                          手動
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium mt-0.5 flex items-center gap-1.5">
                      <span>{t.date}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Category tag + Amount + Delete button */}
                <div className="flex items-center gap-3 shrink-0">
                  {/* Category capsule */}
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${meta.pillBg} ${meta.pillText} hidden sm:inline-block`}
                  >
                    {t.category}
                  </span>

                  {/* Amount */}
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {isBig && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                          大額
                        </span>
                      )}
                      <span className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight tabular-nums">
                        -NT$ {Math.round(t.amount).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Custom record delete action */}
                  {t.isCustom && onDeleteRecord && (
                    <button
                      onClick={() => onDeleteRecord(t.id)}
                      className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="刪除手動記帳"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center text-xs text-slate-400 font-medium space-y-2">
            <p>查無相符的記帳明細</p>
            {(selectedMonth !== 'all' || selectedCategory !== 'all' || onlyBigExpenses || searchQuery) && (
              <button
                onClick={() => {
                  onClearMonth?.();
                  onCategoryChange?.('all');
                  onSearchChange?.('');
                  if (onlyBigExpenses) onToggleBigExpenses?.();
                }}
                className="text-teal-600 hover:text-teal-700 font-bold underline cursor-pointer"
              >
                清除所有篩選條件
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. Footer Pagination */}
      {totalPages > 1 && (
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="text-[11px] font-medium">
            第 {currentSafePage} / {totalPages} 頁
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentSafePage === 1}
              className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentSafePage === totalPages}
              className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
