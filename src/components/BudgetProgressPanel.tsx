import React, { useMemo } from 'react';
import { ShoppingBag, Coffee, Car, Film, Sparkles, Quote } from 'lucide-react';
import { Transaction, MonthlySummary, TransactionCategory, CategoryBudgets } from '../types/finance';
import { calculateSixMonthAverage, resolveCategoryBudgets } from '../utils/financeCalculations';
import { STANDARD_CATEGORIES } from '../constants/categories';
import { parseFlexibleDate } from '../utils/dateUtils';

interface BudgetProgressPanelProps {
  transactions: Transaction[];
  monthlySummaries: MonthlySummary[];
  selectedMonth: string;
  budgets: CategoryBudgets;
}

const CATEGORY_META: Record<
  string,
  { icon: React.FC<{ className?: string }>; color: string; barColor: string }
> = {
  '生活': { icon: ShoppingBag, color: 'text-teal-600 bg-teal-50', barColor: 'bg-teal-600' },
  '家用': { icon: Coffee, color: 'text-blue-600 bg-blue-50', barColor: 'bg-blue-600' },
  '社交': { icon: Coffee, color: 'text-pink-600 bg-pink-50', barColor: 'bg-pink-600' },
  '娛樂': { icon: Film, color: 'text-amber-600 bg-amber-50', barColor: 'bg-amber-500' },
  '雜支': { icon: Car, color: 'text-slate-600 bg-slate-100', barColor: 'bg-slate-500' },
};

export const BudgetProgressPanel: React.FC<BudgetProgressPanelProps> = ({
  transactions,
  monthlySummaries,
  selectedMonth,
  budgets,
}) => {
  // Determine reference month for budget progress (if 'all', default to latest active month)
  const targetMonth = useMemo(() => {
    if (selectedMonth) return selectedMonth;
    const allMonths = [...new Set(transactions.map((t) => t.month).filter(Boolean))].sort();
    return allMonths[allMonths.length - 1] || '';
  }, [transactions, selectedMonth]);

  const targetMonthTxns = useMemo(() => {
    return transactions.filter((t) => t.month === targetMonth);
  }, [transactions, targetMonth]);

  // Compute category totals for the target month
  const categoryTotals = useMemo(() => {
    const map: Record<TransactionCategory, number> = {
      '生活': 0,
      '家用': 0,
      '社交': 0,
      '娛樂': 0,
      '雜支': 0,
    };
    targetMonthTxns.forEach((t) => {
      map[t.category] += t.amount;
    });
    return map;
  }, [targetMonthTxns]);

  // Six month average baseline
  const sixMonthAvg = useMemo(() => {
    return calculateSixMonthAverage(monthlySummaries, targetMonth);
  }, [monthlySummaries, targetMonth]);

  const categoryBudgets = useMemo(
    () => resolveCategoryBudgets(budgets, sixMonthAvg),
    [budgets, sixMonthAvg]
  );
  const customCount = STANDARD_CATEGORIES.filter(cat => categoryBudgets[cat].isCustom).length;
  const budgetBadge = customCount === STANDARD_CATEGORIES.length
    ? '自訂預算'
    : customCount > 0 ? '部分自訂' : '參考值 · 尚未設定預算';

  // Weekend vs Weekday insight calculation for target month
  const weekendInsight = useMemo(() => {
    let weekendTotal = 0;
    let weekdayTotal = 0;
    targetMonthTxns.forEach((t) => {
      const day = parseFlexibleDate(t.date)?.getDay();
      if (day === 0 || day === 6) {
        weekendTotal += t.amount;
      } else {
        weekdayTotal += t.amount;
      }
    });
    const total = weekendTotal + weekdayTotal;
    if (total === 0) return null;
    const weekendPct = Math.round((weekendTotal / total) * 100);
    return { weekendPct, weekendTotal, weekdayTotal };
  }, [targetMonthTxns]);

  const monthDisplay = targetMonth ? `${targetMonth.slice(0, 4)}年${parseInt(targetMonth.slice(5), 10)}月` : '當月';

  return (
    <div className="space-y-4 sm:space-y-5 min-w-0">
      {/* 1. 預算進度卡 (White Fintech Card) */}
      <div className="fintech-card p-4 sm:p-6 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">類別支出進度</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
              {budgetBadge}
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-500 font-medium">
            {monthDisplay}
          </span>
        </div>

        {/* Progress Bars List */}
        <div className="space-y-4">
          {STANDARD_CATEGORIES.map((cat) => {
            const spent = categoryTotals[cat];
            const meta = CATEGORY_META[cat] || CATEGORY_META['生活'];
            const Icon = meta.icon;
            const { amount: budget, isCustom } = categoryBudgets[cat];
            const rawPct = Math.round((spent / budget) * 100);
            const barPct = Math.min(rawPct, 100);
            const isOver = spent > budget;

            return (
              <div key={cat} className="space-y-1.5 min-w-0">
                <div className="flex items-center justify-between text-xs min-w-0 gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <div className={`w-6 h-6 rounded-lg ${meta.color} flex items-center justify-center shrink-0`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-slate-800">{cat}</span>
                    {!isCustom && customCount > 0 && (
                      <span className="text-[10px] font-semibold text-slate-400">參考</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 tabular-nums shrink-0">
                    <span className="text-slate-500 text-[10px] sm:text-[11px] font-medium">
                      NT$ {Math.round(spent).toLocaleString()} / {budget.toLocaleString()}
                    </span>
                    <span
                      className={`text-[10px] sm:text-[11px] font-extrabold min-w-[28px] sm:min-w-[32px] text-right ${
                        isOver ? 'text-rose-600' : 'text-slate-700'
                      }`}
                    >
                      {isOver ? `超支 ${rawPct}%` : `${rawPct}%`}
                    </span>
                  </div>
                </div>

                {/* Progress capsule */}
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOver ? 'bg-rose-500' : meta.barColor
                    }`}
                    style={{ width: `${barPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. 深色靈感金句 & 生活洞察卡片 */}
      <div className="fintech-card-dark p-4 sm:p-6 relative overflow-hidden flex flex-col justify-between min-w-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-emerald-400">
            <Quote className="w-5 h-5 opacity-80" />
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
              理財思維
            </span>
          </div>

          <p className="text-sm sm:text-base font-semibold text-slate-100 leading-relaxed tracking-wide">
            「財務自由不是擁有更多，而是更懂得管理與選擇。」
          </p>

          {weekendInsight && (
            <div className="pt-2 text-xs text-slate-400 leading-relaxed border-t border-white/10">
              <p className="flex items-center gap-1.5 text-emerald-300 font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {monthDisplay}週末支出佔 <strong>{weekendInsight.weekendPct}%</strong>
                  {weekendInsight.weekendPct > 35 ? '（假日聚餐社交偏多）' : '（平日飲食日常為主）'}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Decorative Golden Line */}
        <div className="mt-4 pt-2">
          <div className="w-8 h-1 rounded-full bg-gradient-to-r from-gold to-emerald-400" />
        </div>
      </div>
    </div>
  );
};
