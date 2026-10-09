import { Transaction } from '../types/finance';
import { getPreviousMonth } from './financeCalculations';

// Helpers for the calendar heatmap page and the monthly review page.

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const daysIn = (month: string) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m, 0).getDate();
};

/**
 * Typical spending per day: total of the previous 3 months that have data, divided by their
 * number of calendar days. Falls back to this month's own average per elapsed day.
 */
export function dailyBaseline(transactions: Transaction[], month: string, today: Date = new Date()): number {
  const prior: string[] = [];
  let m = month;
  for (let i = 0; i < 3; i++) {
    m = getPreviousMonth(m);
    prior.push(m);
  }
  const withData = prior.filter(pm => transactions.some(t => t.month === pm));
  if (withData.length > 0) {
    const total = transactions.filter(t => withData.includes(t.month)).reduce((s, t) => s + t.amount, 0);
    const days = withData.reduce((s, pm) => s + daysIn(pm), 0);
    return Math.round(total / days);
  }
  const isCurrent = month === ymd(today).slice(0, 7);
  const elapsed = isCurrent ? today.getDate() : daysIn(month);
  const own = transactions.filter(t => t.month === month).reduce((s, t) => s + t.amount, 0);
  return elapsed > 0 ? Math.round(own / elapsed) : 0;
}

/** Heat level 0–5 from spending relative to a typical day, so only days that are high *for you* stand out. */
export function heatLevel(amount: number, baseline: number): number {
  if (amount <= 0) return 0;
  if (baseline <= 0) return 3;
  const r = amount / baseline;
  return r < 0.5 ? 1 : r < 0.9 ? 2 : r < 1.3 ? 3 : r < 2 ? 4 : 5;
}

export interface CalendarDay {
  day: number;
  date: string;      // YYYY-MM-DD
  weekday: number;   // 0 = Sunday
  amount: number;
  count: number;
  level: number;     // 0 = nothing spent, 1–5 = relative to the baseline
  ratio: number;     // amount / baseline
  isFuture: boolean;
  isToday: boolean;
}

export function buildCalendarMonth(
  transactions: Transaction[],
  month: string,
  baseline: number,
  today: Date = new Date()
): { leading: number; days: CalendarDay[] } {
  const [y, mo] = month.split('-').map(Number);
  if (!y || !mo) return { leading: 0, days: [] };
  const todayStr = ymd(today);
  const byDay = new Map<number, { amount: number; count: number }>();
  transactions.forEach(t => {
    if (t.month !== month) return;
    const d = parseInt(t.date.slice(8, 10), 10);
    if (isNaN(d)) return;
    const cur = byDay.get(d) ?? { amount: 0, count: 0 };
    byDay.set(d, { amount: cur.amount + t.amount, count: cur.count + 1 });
  });
  const days: CalendarDay[] = [];
  for (let d = 1; d <= daysIn(month); d++) {
    const date = `${month}-${String(d).padStart(2, '0')}`;
    const { amount, count } = byDay.get(d) ?? { amount: 0, count: 0 };
    days.push({
      day: d,
      date,
      weekday: new Date(y, mo - 1, d).getDay(),
      amount,
      count,
      level: heatLevel(amount, baseline),
      ratio: baseline > 0 ? amount / baseline : 0,
      isFuture: date > todayStr,
      isToday: date === todayStr,
    });
  }
  return { leading: new Date(y, mo - 1, 1).getDay(), days };
}

/** Average spend per elapsed weekend day vs weekday in a calendar month. */
export function weekendVsWeekday(days: CalendarDay[]) {
  const past = days.filter(d => !d.isFuture);
  const avg = (list: CalendarDay[]) =>
    list.length ? Math.round(list.reduce((s, d) => s + d.amount, 0) / list.length) : 0;
  return {
    weekend: avg(past.filter(d => d.weekday === 0 || d.weekday === 6)),
    weekday: avg(past.filter(d => d.weekday !== 0 && d.weekday !== 6)),
  };
}

/** Most frequently logged items in a month (same name ignoring case and spaces), ties by total. */
export function topItems(transactions: Transaction[], month: string, n = 5) {
  const map = new Map<string, { item: string; count: number; total: number }>();
  transactions.forEach(t => {
    if (t.month !== month) return;
    const key = t.item.trim().toLowerCase().replace(/\s+/g, '');
    const cur = map.get(key) ?? { item: t.item.trim(), count: 0, total: 0 };
    map.set(key, { ...cur, count: cur.count + 1, total: cur.total + t.amount });
  });
  return [...map.values()].sort((a, b) => b.count - a.count || b.total - a.total).slice(0, n);
}

/** Spending per weekday (index 0 = Sunday) within a month. */
export function weekdayTotals(transactions: Transaction[], month: string): number[] {
  const totals = [0, 0, 0, 0, 0, 0, 0];
  const [y, mo] = month.split('-').map(Number);
  transactions.forEach(t => {
    if (t.month !== month) return;
    const d = parseInt(t.date.slice(8, 10), 10);
    if (!isNaN(d)) totals[new Date(y, mo - 1, d).getDay()] += t.amount;
  });
  return totals;
}

/**
 * Consecutive days with at least one record, counting back from today — or from yesterday when
 * nothing is logged yet today, so the streak isn't shown as broken before the day is over.
 */
export function loggingStreak(transactions: Transaction[], today: Date = new Date()) {
  const days = new Set(transactions.map(t => t.date.slice(0, 10)));
  const loggedToday = days.has(ymd(today));
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!loggedToday) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(ymd(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { streak, loggedToday };
}
