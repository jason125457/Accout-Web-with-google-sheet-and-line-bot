import React, { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { Transaction, MonthlySummary, CategoryBudgets } from '../types/finance';
import { STANDARD_CATEGORIES } from '../constants/categories';
import {
  calculateSixMonthAverage,
  getCurrentMonthString,
  resolveCategoryBudgets,
} from '../utils/financeCalculations';
import { compareTransactionDates } from '../utils/dateUtils';
import { categoryColor } from '../theme/tokens';

interface MonthOverviewCardProps {
  transactions: Transaction[];
  monthlySummaries: MonthlySummary[];
  selectedMonth: string;
  budgets: CategoryBudgets;
  onViewAll: () => void;
}

const RECENT_COUNT = 5;

/**
 * Mobile-first summary: the three things checked most often on a phone —
 * how much was spent, how much budget is left, and the latest records.
 */
export const MonthOverviewCard: React.FC<MonthOverviewCardProps> = ({
  transactions,
  monthlySummaries,
  selectedMonth,
  budgets,
  onViewAll,
}) => {
  const monthTxns = useMemo(
    () => transactions.filter(t => t.month === selectedMonth),
    [transactions, selectedMonth]
  );

  const spent = monthTxns.reduce((sum, t) => sum + t.amount, 0);

  const { totalBudget, isCustom } = useMemo(() => {
    const resolved = resolveCategoryBudgets(budgets, calculateSixMonthAverage(monthlySummaries, selectedMonth));
    return {
      totalBudget: STANDARD_CATEGORIES.reduce((sum, cat) => sum + resolved[cat].amount, 0),
      isCustom: STANDARD_CATEGORIES.some(cat => resolved[cat].isCustom),
    };
  }, [budgets, monthlySummaries, selectedMonth]);

  const remaining = totalBudget - spent;
  const isOver = remaining < 0;
  const usedPct = totalBudget > 0 ? Math.round((spent / totalBudget) * 100) : 0;

  // Daily allowance only makes sense for the month in progress.
  const isCurrentMonth = selectedMonth === getCurrentMonthString();
  const today = new Date();
  const daysLeft = isCurrentMonth
    ? new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate() + 1
    : 0;
  const dailyAllowance = daysLeft > 0 && !isOver ? Math.floor(remaining / daysLeft) : 0;

  const recent = useMemo(
    () => [...monthTxns].sort((a, b) => compareTransactionDates(a.date, b.date, false)).slice(0, RECENT_COUNT),
    [monthTxns]
  );

  const monthLabel = selectedMonth ? `${parseInt(selectedMonth.slice(5), 10)} 月` : '本月';
  const fmt = (n: number) => Math.round(n).toLocaleString();

  return (
    <section className="fintech-card p-4 space-y-4 min-w-0" aria-label={`${monthLabel}概況`}>
      {/* Spent + remaining */}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-ink-muted">{isCurrentMonth ? '本月已花' : `${monthLabel}總支出`}</p>
          <p className="mt-1 flex items-baseline gap-1">
            <span className="text-sm font-bold text-ink-subtle">NT$</span>
            <span className="text-3xl font-extrabold text-ink tracking-tight tabular-nums">{fmt(spent)}</span>
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs font-bold text-ink-muted">{isOver ? '已超支' : '預算剩餘'}</p>
          <p className={`mt-1 text-lg font-extrabold tracking-tight tabular-nums ${isOver ? 'text-rose-600' : 'text-primary-strong'}`}>
            NT$ {fmt(Math.abs(remaining))}
          </p>
        </div>
      </div>

      {/* Budget progress */}
      <div className="space-y-1.5">
        <div
          className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.min(usedPct, 100)}
          aria-label={`已使用預算 ${usedPct}%`}
        >
          <div
            className={`h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none ${
              isOver ? 'bg-rose-500' : usedPct > 85 ? 'bg-amber-500' : 'bg-primary'
            }`}
            style={{ width: `${Math.min(usedPct, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] font-semibold text-ink-muted tabular-nums">
          <span>
            已用 {usedPct}% · {isCustom ? '預算' : '參考預算'} NT$ {fmt(totalBudget)}
          </span>
          {dailyAllowance > 0 && <span>每天可花 NT$ {fmt(dailyAllowance)}</span>}
        </div>
      </div>

      {/* Recent records */}
      <div className="border-t border-line pt-3">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-extrabold text-ink">最近記帳</h3>
          <button
            onClick={onViewAll}
            className="min-h-11 -my-2 px-2 flex items-center gap-0.5 text-xs font-bold text-primary-strong"
          >
            查看全部
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        {recent.length === 0 ? (
          <p className="py-3 text-xs text-ink-muted">這個月還沒有紀錄。在 LINE 傳「午餐 120」就能記一筆。</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map(t => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 min-w-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: categoryColor(t.category) }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink truncate">{t.item}</p>
                    <p className="text-[11px] text-ink-subtle font-medium">
                      {t.date.slice(5, 10).replace('-', '/')} · {t.category}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-extrabold text-ink tabular-nums shrink-0">NT$ {fmt(t.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
