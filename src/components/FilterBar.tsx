import React from 'react';
import { Search, ArrowUpDown, Flame, X, SlidersHorizontal, ShieldOff } from 'lucide-react';
import { FilterState, SortOption } from '../types/finance';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  availableMonths: string[];
  totalFilteredCount: number;
  totalFilteredAmount: number;
}

const CATEGORIES = ['全部', '生活', '雜支', '娛樂', '家用', '社交'];
const LARGE_THRESHOLD = 5000;

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  availableMonths,
  totalFilteredCount,
  totalFilteredAmount
}) => {
  const isFiltered =
    filters.selectedMonth !== 'all' ||
    filters.selectedCategory !== 'all' ||
    filters.searchQuery !== '' ||
    filters.onlyBigExpenses ||
    filters.excludeLargeThreshold !== null;

  const handleReset = () => {
    onFilterChange({
      selectedMonth: 'all',
      selectedCategory: 'all',
      searchQuery: '',
      onlyBigExpenses: false,
      excludeLargeThreshold: null,
      sortBy: 'date-desc'
    });
  };

  return (
    <div className="fintech-card p-5 sm:p-6 space-y-4">
      {/* Top Search & Filter row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input with inner icon */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            placeholder="搜尋項目名稱（例如：粥、看醫生、捷運、保險）..."
            className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-slate-50/80 border border-slate-200/90 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange({ searchQuery: '' })}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dropdowns & Big expense switch */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-50/80 border border-slate-200/90 rounded-2xl px-3.5 py-2 text-xs font-semibold text-slate-700">
            <span className="text-slate-400 font-normal">月份</span>
            <select
              value={filters.selectedMonth}
              onChange={(e) => onFilterChange({ selectedMonth: e.target.value })}
              className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              <option value="all">全部歷史月份</option>
              {availableMonths.map((m) => {
                // Format "2026-08" → "2026 年 08 月"
                const label = /^\d{4}-\d{2}$/.test(m)
                  ? `${m.slice(0, 4)} 年 ${m.slice(5, 7)} 月`
                  : m;
                return (
                  <option key={m} value={m}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center space-x-1.5 bg-slate-50/80 border border-slate-200/90 rounded-2xl px-3.5 py-2 text-xs font-semibold text-slate-700">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ sortBy: e.target.value as SortOption })}
              className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              <option value="date-desc">時間：新至舊</option>
              <option value="date-asc">時間：舊至新</option>
              <option value="amount-desc">金額：高至低</option>
              <option value="amount-asc">金額：低至高</option>
            </select>
          </div>

          {/* Big Expense Toggle */}
          <button
            onClick={() => onFilterChange({ onlyBigExpenses: !filters.onlyBigExpenses })}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold border transition-all active:scale-95 ${
              filters.onlyBigExpenses
                ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20'
                : 'bg-slate-50/80 text-slate-700 border-slate-200/90 hover:bg-slate-100'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${filters.onlyBigExpenses ? 'text-white' : 'text-amber-500'}`} />
            <span>大額 (≥ 1k)</span>
          </button>

          {/* Exclude Large Expenses Toggle */}
          <button
            onClick={() => onFilterChange({
              excludeLargeThreshold: filters.excludeLargeThreshold === null ? LARGE_THRESHOLD : null
            })}
            title={`排除單筆 ≥ NT$${LARGE_THRESHOLD.toLocaleString()} 的非常規大額支出，讓圖表只反映日常消費`}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold border transition-all active:scale-95 ${
              filters.excludeLargeThreshold !== null
                ? 'bg-slate-800 text-white border-slate-900 shadow-md shadow-slate-500/20'
                : 'bg-slate-50/80 text-slate-700 border-slate-200/90 hover:bg-slate-100'
            }`}
          >
            <ShieldOff className={`w-3.5 h-3.5 ${filters.excludeLargeThreshold !== null ? 'text-white' : 'text-slate-500'}`} />
            <span>日常模式</span>
          </button>
        </div>
      </div>

      {/* Category Pills & Results Counter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3.5 border-t border-slate-100">
        {/* Category Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1 shrink-0">
            <SlidersHorizontal className="w-3 h-3" />
            類別
          </span>
          {CATEGORIES.map((cat) => {
            const isSelected = (cat === '全部' && filters.selectedCategory === 'all') || filters.selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => onFilterChange({ selectedCategory: cat === '全部' ? 'all' : cat })}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Counter and Clear Filter */}
        <div className="flex items-center space-x-3 text-xs text-slate-500 self-end sm:self-auto shrink-0">
          <span>
            共 <strong className="text-slate-900 font-bold tabular-nums">{totalFilteredCount}</strong> 筆 · 
            總計 <strong className="text-teal-700 font-extrabold tabular-nums ml-1">NT$ {Math.round(totalFilteredAmount).toLocaleString()}</strong>
          </span>
          {isFiltered && (
            <button
              onClick={handleReset}
              className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded-full transition-colors"
            >
              <X className="w-3 h-3" />
              重設
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
