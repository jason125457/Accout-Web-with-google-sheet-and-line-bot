import { MonthlySummary, Transaction, TransactionCategory, CategoryBudgets } from '../types/finance';
import { STANDARD_CATEGORIES } from '../constants/categories';

/**
 * Returns current month string in "YYYY-MM" format based on local user time.
 */
export function getCurrentMonthString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * "2026-01" -> "2025-12"
 */
export function getPreviousMonth(month: string): string {
  const [year, mon] = month.split('-').map(Number);
  if (!year || !mon) return '';
  const d = new Date(year, mon - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Sum of a month's transactions dated on or before `day` (1-based).
 * Used for like-for-like comparison against an in-progress month.
 */
export function sumMonthUpToDay(transactions: Transaction[], month: string, day: number): number {
  return transactions.reduce((sum, t) => {
    if (t.month !== month) return sum;
    const txDay = parseInt(t.date.slice(8, 10), 10);
    return !isNaN(txDay) && txDay <= day ? sum + t.amount : sum;
  }, 0);
}

/**
 * Dynamically aggregates transactions into MonthlySummary[] format.
 * This ensures that when filters (like "日常模式" excluding >= $5k) are applied,
 * or when manual records are added, the monthly summaries for charts and metrics
 * dynamically and immediately reflect the exact filtered sums.
 */
export function calculateDynamicMonthlySummaries(
  transactions: Transaction[],
  baseSummaries: MonthlySummary[] = []
): MonthlySummary[] {
  // If there are no transactions at all, return baseSummaries
  if (!transactions || transactions.length === 0) {
    return [...baseSummaries].sort((a, b) => a.month.localeCompare(b.month));
  }

  const monthTotals = new Map<string, number>();

  transactions.forEach(t => {
    if (!t.month || t.amount <= 0) return;
    monthTotals.set(t.month, (monthTotals.get(t.month) || 0) + t.amount);
  });

  // Ensure any historical month present in baseSummaries is also represented
  const allMonths = new Set<string>();
  monthTotals.forEach((_, m) => allMonths.add(m));
  baseSummaries.forEach(s => {
    if (s.month && /^\d{4}-\d{2}$/.test(s.month)) {
      allMonths.add(s.month);
    }
  });

  const result: MonthlySummary[] = Array.from(allMonths).map(month => ({
    month,
    totalExpense: Math.round((monthTotals.get(month) || 0) * 100) / 100
  }));

  return result.sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Calculates the standard 6-month average baseline expense.
 * Calculates the average of up to six completed months before the reference month.
 * This keeps the selected month (and any future records) out of its own comparison
 * baseline, which is essential for both ongoing and historical analysis.
 */
export function calculateSixMonthAverage(
  summaries: MonthlySummary[],
  referenceMonthStr: string = getCurrentMonthString()
): number {
  if (!summaries || summaries.length === 0) return 0;

  const sorted = [...summaries].sort((a, b) => a.month.localeCompare(b.month));
  const targetMonths = sorted
    .filter(s => s.month < referenceMonthStr)
    .slice(-6);

  if (targetMonths.length === 0) {
    const referenceSummary = sorted.find(s => s.month === referenceMonthStr);
    return referenceSummary ? Math.round(referenceSummary.totalExpense) : 0;
  }

  const sum = targetMonths.reduce((acc, cur) => acc + cur.totalExpense, 0);
  return Math.round(sum / targetMonths.length);
}

// Fallback split of the 6-month average, used only for categories without a user-set budget.
const REFERENCE_BUDGET_SHARE: Record<TransactionCategory, number> = {
  '生活': 0.45,
  '家用': 0.25,
  '社交': 0.12,
  '娛樂': 0.10,
  '雜支': 0.08,
};

export interface ResolvedBudget {
  amount: number;
  isCustom: boolean; // true = from the 「預算設定」 sheet, false = reference estimate
}

/**
 * Per-category monthly budget: the user's own value when set, otherwise a reference
 * estimate derived from the six-month average (or NT$20,000 with no history).
 */
export function resolveCategoryBudgets(
  custom: CategoryBudgets,
  sixMonthAvg: number
): Record<TransactionCategory, ResolvedBudget> {
  const base = sixMonthAvg > 0 ? sixMonthAvg : 20000;
  return Object.fromEntries(
    STANDARD_CATEGORIES.map(cat => {
      const own = custom[cat];
      return [cat, own && own > 0
        ? { amount: own, isCustom: true }
        : { amount: Math.round(base * REFERENCE_BUDGET_SHARE[cat]), isCustom: false }];
    })
  ) as Record<TransactionCategory, ResolvedBudget>;
}
