import { MonthlySummary, Transaction } from '../types/finance';

/**
 * Returns current month string in "YYYY-MM" format based on local user time.
 */
export function getCurrentMonthString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
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
