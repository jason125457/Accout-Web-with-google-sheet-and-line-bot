import React from 'react';
import { TrendingUp, TrendingDown, Minus, CalendarClock } from 'lucide-react';
import { Transaction, MonthlySummary } from '../types/finance';
import { calculateSixMonthAverage } from '../utils/financeCalculations';

interface BurnRateCardProps {
  transactions: Transaction[];
  monthlySummaries: MonthlySummary[];
}

export const BurnRateCard: React.FC<BurnRateCardProps> = ({ transactions, monthlySummaries }) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed
  const daysPassed = today.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthProgress = daysPassed / daysInMonth;
  const currentMonthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  // Check if current month has data; fall back to latest available month
  const allMonths = [...new Set(transactions.map(t => t.month))].sort();
  const latestAvailableMonth = allMonths[allMonths.length - 1] ?? currentMonthStr;
  const isCurrentMonth = latestAvailableMonth === currentMonthStr;

  // Transactions for the reference month (current or latest)
  const refMonthTxns = transactions.filter(t => t.month === (isCurrentMonth ? currentMonthStr : latestAvailableMonth));
  const refMonthTotal = refMonthTxns.reduce((acc, t) => acc + t.amount, 0);

  // For current month: use today's date; for historical month: use full 30 days
  const refDaysPassed = isCurrentMonth ? daysPassed : new Date(
    parseInt(latestAvailableMonth.slice(0, 4)),
    parseInt(latestAvailableMonth.slice(5, 7)),
    0
  ).getDate();

  const dailyBurnRate = refDaysPassed > 0 ? refMonthTotal / refDaysPassed : 0;
  const projectedTotal = isCurrentMonth
    ? Math.round(dailyBurnRate * daysInMonth)
    : refMonthTotal; // historical: show actual total

  // 6-month average for comparison
  const avgMonthly = calculateSixMonthAverage(monthlySummaries, currentMonthStr);

  const compareBase = isCurrentMonth ? projectedTotal : refMonthTotal;
  const projectedVsAvg = avgMonthly > 0 ? ((compareBase - avgMonthly) / avgMonthly) * 100 : 0;
  const isOverBudget = projectedVsAvg > 10;
  const isUnderBudget = projectedVsAvg < -10;

  const progressPct = Math.round(monthProgress * 100);

  // Label helper
  const refLabel = isCurrentMonth
    ? `本月已過 ${progressPct}%（第 ${daysPassed} 天）`
    : `資料截至 ${latestAvailableMonth.slice(0, 4)} 年 ${latestAvailableMonth.slice(5, 7)} 月`;

  return (
    <div className="fintech-card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <CalendarClock className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">本月消費進度</h3>
            <p className="text-xs text-slate-400">即時燒錢速度 × 月底預估</p>
          </div>
        </div>
        {!isCurrentMonth && (
          <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200">
            📌 參考上月（本月尚無資料）
          </span>
        )}
      </div>

      {/* Month Progress Bar */}
      <div className="mb-5">
        <div className="flex justify-between text-xs font-medium text-slate-500 mb-1.5">
          <span>{refLabel}</span>
          {isCurrentMonth && <span>剩 {daysInMonth - daysPassed} 天</span>}
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: isCurrentMonth ? `${progressPct}%` : '100%',
              background: 'linear-gradient(90deg, #6366f1, #0d9488)'
            }}
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        {/* Daily burn rate */}
        <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200/60">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">日均花費</p>
          <p className="text-base font-extrabold text-slate-900 tabular-nums">
            NT$ {Math.round(dailyBurnRate).toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">元 / 天</p>
        </div>

        {/* Projected total */}
        <div className={`rounded-2xl p-3 border ${
          isOverBudget
            ? 'bg-rose-50/80 border-rose-200/60'
            : isUnderBudget
            ? 'bg-emerald-50/80 border-emerald-200/60'
            : 'bg-slate-50/80 border-slate-200/60'
        }`}>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            {isCurrentMonth ? '月底預估' : '當月實際'}
          </p>
          <p className={`text-base font-extrabold tabular-nums ${
            isOverBudget ? 'text-rose-600' : isUnderBudget ? 'text-emerald-600' : 'text-slate-900'
          }`}>
            NT$ {projectedTotal.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {isCurrentMonth ? '預估總計' : '完整月份'}
          </p>
        </div>

        {/* vs 6-month avg */}
        <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-200/60">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">vs 半年均</p>
          <div className="flex items-center gap-1">
            {isOverBudget ? (
              <TrendingUp className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            ) : isUnderBudget ? (
              <TrendingDown className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            ) : (
              <Minus className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
            <p className={`text-base font-extrabold tabular-nums ${
              isOverBudget ? 'text-rose-600' : isUnderBudget ? 'text-emerald-600' : 'text-slate-600'
            }`}>
              {projectedVsAvg > 0 ? '+' : ''}{Math.round(projectedVsAvg)}%
            </p>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {isOverBudget ? '超出均值，留意' : isUnderBudget ? '低於均值，節省中' : '與均值相近'}
          </p>
        </div>
      </div>
    </div>
  );
};
