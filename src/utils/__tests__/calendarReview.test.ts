import { describe, it, expect } from 'vitest';
import {
  dailyBaseline,
  heatLevel,
  buildCalendarMonth,
  weekendVsWeekday,
  topItems,
  weekdayTotals,
  loggingStreak,
} from '../calendarReview';
import { Transaction } from '../../types/finance';

const tx = (date: string, amount: number, item = 'x'): Transaction => ({
  id: date + amount + item, date, item, category: '生活', amount, month: date.slice(0, 7),
});
const today = new Date(2026, 9, 9, 20); // Fri 2026-10-09

describe('dailyBaseline', () => {
  it('averages the previous 3 months that have data over their calendar days', () => {
    const list = [tx('2026-09-10', 3000), tx('2026-08-10', 3100), tx('2026-10-01', 999)];
    expect(dailyBaseline(list, '2026-10', today)).toBe(Math.round(6100 / (30 + 31)));
  });
  it('falls back to the month itself when there is no history', () => {
    expect(dailyBaseline([tx('2026-10-01', 900)], '2026-10', today)).toBe(100); // 900 over 9 elapsed days
  });
});

describe('heatLevel', () => {
  it('is relative to the baseline', () => {
    expect([0, 100, 400, 500, 800, 1000].map(a => heatLevel(a, 450))).toEqual([0, 1, 2, 3, 4, 5]);
  });
});

describe('buildCalendarMonth', () => {
  const { leading, days } = buildCalendarMonth(
    [tx('2026-10-04 12:00:00', 1120), tx('2026-10-04 18:00:00', 80), tx('2026-10-05', 100)],
    '2026-10', 450, today
  );
  it('lays out the month with leading blanks', () => {
    expect(leading).toBe(4); // 2026-10-01 is a Thursday
    expect(days).toHaveLength(31);
  });
  it('sums each day and flags today and the future', () => {
    expect(days[3]).toMatchObject({ day: 4, weekday: 0, amount: 1200, count: 2, level: 5, isFuture: false }); // Sunday
    expect(days[8].isToday).toBe(true);
    expect(days[9].isFuture).toBe(true);
  });
  it('averages weekend vs weekday over elapsed days only', () => {
    // elapsed 1–9: weekend days are 3 (Sat) and 4 (Sun) → (0 + 1200) / 2; the other 7 days → 100 / 7
    expect(weekendVsWeekday(days)).toEqual({ weekend: 600, weekday: Math.round(100 / 7) });
  });
});

describe('topItems', () => {
  it('ranks by count, then total, merging names that differ only by case or spaces', () => {
    const list = [
      tx('2026-09-01', 80, '早餐'), tx('2026-09-02', 70, '早餐'),
      tx('2026-09-02', 85, '全家'), tx('2026-09-03', 60, ' 全家 '),
      tx('2026-09-03', 390, 'Netflix'), tx('2026-09-04', 1, 'netflix'), tx('2026-09-05', 20, 'netflix'),
    ];
    expect(topItems(list, '2026-09', 3)).toEqual([
      { item: 'Netflix', count: 3, total: 411 },
      { item: '早餐', count: 2, total: 150 },
      { item: '全家', count: 2, total: 145 },
    ]);
  });
});

describe('weekdayTotals', () => {
  it('buckets spending by weekday, Sunday first', () => {
    // 2026-10-04 is a Sunday, 2026-10-05 a Monday
    expect(weekdayTotals([tx('2026-10-04', 100), tx('2026-10-05', 30)], '2026-10')).toEqual([100, 30, 0, 0, 0, 0, 0]);
  });
});

describe('loggingStreak', () => {
  const list = [tx('2026-10-05', 1), tx('2026-10-07', 1), tx('2026-10-08', 1)];
  it('counts back from yesterday when nothing is logged yet today', () => {
    expect(loggingStreak(list, today)).toEqual({ streak: 2, loggedToday: false });
  });
  it('includes today once something is logged', () => {
    expect(loggingStreak([...list, tx('2026-10-09 08:00:00', 1)], today)).toEqual({ streak: 3, loggedToday: true });
  });
});
