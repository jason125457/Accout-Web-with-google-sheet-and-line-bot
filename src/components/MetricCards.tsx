import React from 'react';
import { ArrowDownRight, ArrowUpRight, Calendar, ArrowRightLeft, Sparkles, TrendingUp } from 'lucide-react';
import { MonthlySummary, Transaction } from '../types/finance';
import { calculateSixMonthAverage } from '../utils/financeCalculations';

interface MetricCardsProps {
  monthlySummaries: MonthlySummary[];
  transactions: Transaction[];
  selectedMonth: string;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  monthlySummaries,
  transactions,
  selectedMonth
}) => {
  const sortedSummaries = [...monthlySummaries].sort((a, b) => a.month.localeCompare(b.month));

  const latestSummary = sortedSummaries[sortedSummaries.length - 1];
  const activeMonth = selectedMonth !== 'all' ? selectedMonth : (latestSummary?.month || '');

  const currentSummary = sortedSummaries.find(s => s.month === activeMonth);
  const currentMonthTransactions = transactions.filter(t => t.month === activeMonth);
  const calculatedCurrentMonthTotal = currentMonthTransactions.reduce((sum, t) => sum + t.amount, 0);
  const currentTotal = currentMonthTransactions.length > 0 ? calculatedCurrentMonthTotal : (currentSummary?.totalExpense || 0);

  const currentIndex = sortedSummaries.findIndex(s => s.month === activeMonth);
  const prevSummary = currentIndex > 0 ? sortedSummaries[currentIndex - 1] : null;
  const prevTotal = prevSummary?.totalExpense || 0;

  let momChangePercent: number | null = null;
  if (prevTotal > 0 && currentTotal > 0) {
    momChangePercent = Math.round(((currentTotal - prevTotal) / prevTotal) * 100);
  }

  const sixMonthAvg = calculateSixMonthAverage(sortedSummaries);

  const targetTransactions = selectedMonth === 'all'
    ? transactions
    : transactions.filter(t => t.month === selectedMonth);
    
  const maxExpense = targetTransactions.reduce((max, t) => (t.amount > max.amount ? t : max), {
    amount: 0,
    item: '無',
    category: ''
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* 1. 當月/指定月支出 */}
      <div className="fintech-card p-6 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {selectedMonth !== 'all' ? `${selectedMonth} 月度總支出` : `${activeMonth} 當月總支出`}
          </span>
          <div className="w-7 h-7 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center">
            <Calendar className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div className="flex items-baseline">
            <span className="text-sm font-semibold text-slate-400 mr-1.5">NT$</span>
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight tabular-nums">
              {Math.round(currentTotal).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">較前期變動</span>
          {momChangePercent !== null ? (
            <span
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold border ${
                momChangePercent <= 0
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                  : 'bg-rose-50 text-rose-700 border-rose-200/60'
              }`}
            >
              {momChangePercent <= 0 ? (
                <>
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>{Math.abs(momChangePercent)}% 節約</span>
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>+{momChangePercent}% 增加</span>
                </>
              )}
            </span>
          ) : (
            <span className="text-slate-400">尚無對比</span>
          )}
        </div>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-400" />
      </div>

      {/* 2. 前期月度花費 */}
      <div className="fintech-card p-6">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            前期月份支出
          </span>
          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline">
          <span className="text-sm font-semibold text-slate-400 mr-1.5">NT$</span>
          <span className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight tabular-nums">
            {Math.round(prevTotal).toLocaleString()}
          </span>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>前期基準月份</span>
          <span className="font-semibold text-slate-700 font-mono">
            {prevSummary ? prevSummary.month : '—'}
          </span>
        </div>
      </div>

      {/* 3. 半年月平均 */}
      <div className="fintech-card p-6">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            半年平均月支出
          </span>
          <div className="w-7 h-7 rounded-full bg-cyan-50 text-cyan-700 flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline">
          <span className="text-sm font-semibold text-slate-400 mr-1.5">NT$</span>
          <span className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight tabular-nums">
            {sixMonthAvg.toLocaleString()}
          </span>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>日常開銷水平線</span>
          <span className="font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/50">
            6 個月平均
          </span>
        </div>
      </div>

      {/* 4. 最高單筆開銷 */}
      <div className="fintech-card p-6">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {selectedMonth === 'all' ? '歷史最高單筆開銷' : `${selectedMonth} 最高單筆`}
          </span>
          <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline">
          <span className="text-sm font-semibold text-slate-400 mr-1.5">NT$</span>
          <span className="text-3xl sm:text-4xl font-extrabold text-amber-600 tracking-tight tabular-nums">
            {Math.round(maxExpense.amount).toLocaleString()}
          </span>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 truncate max-w-[150px]" title={maxExpense.item}>
            {maxExpense.item !== '無' ? maxExpense.item : '無紀錄'}
          </span>
          {maxExpense.category && (
            <span className="font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full text-[10px]">
              {maxExpense.category}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
