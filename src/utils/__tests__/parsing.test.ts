import { describe, it, expect } from 'vitest';
import { parseAmount, normalizeMonthString, normalizeGasDetails, normalizeGasRecords, normalizeBudgets } from '../gasApi';
import { formatDate, formatRelativeTime, formatShortDateTime } from '../dateUtils';
import { getPreviousMonth, sumMonthUpToDay, resolveCategoryBudgets, buildCumulativeSeries, projectMonthEnd, buildMonthCategoryRows, averageCompletedMonths } from '../financeCalculations';
import { normalizeCategory } from '../../constants/categories';
import { Transaction } from '../../types/finance';

// Regression tests for the gotchas in AGENTS.md. Runs with TZ=Asia/Taipei (see vite.config.ts).

describe('parseAmount (gotcha 5: thousands separators)', () => {
  it.each([
    ['1,500', 1500],
    ['20,103', 20103],
    ['1，500', 1500],
    ['NT$ 2,000', 2000],
    ['120', 120],
    [350, 350],
    ['', 0],
    ['abc', 0],
  ])('%s -> %s', (raw, expected) => {
    expect(parseAmount(raw)).toBe(expected);
  });
});

describe('normalizeMonthString (gotcha 1: UTC month shift)', () => {
  it('converts a UTC ISO string to the Taiwan-local month', () => {
    expect(normalizeMonthString('2026-08-31T16:00:00.000Z')).toBe('2026-09');
  });
  it('converts Excel serial dates', () => {
    expect(normalizeMonthString('46266')).toBe('2026-09');
  });
  it('pads YYYY/M', () => {
    expect(normalizeMonthString('2026/9')).toBe('2026-09');
  });
  it('returns empty for junk', () => {
    expect(normalizeMonthString('')).toBe('');
    expect(normalizeMonthString(null)).toBe('');
  });
});

describe('formatDate', () => {
  it('parses Chinese 上午/下午 display values', () => {
    expect(formatDate('2026/5/9 下午 8:46:31')).toBe('2026-05-09 20:46:31');
    expect(formatDate('2026/5/9 上午 12:05:00')).toBe('2026-05-09 00:05:00');
  });
  it('keeps date-only values date-only', () => {
    expect(formatDate('2026/5/9')).toBe('2026-05-09');
  });
});

describe('normalizeCategory (gotcha 2)', () => {
  it('maps legacy 生存 to 生活 and unknown to 雜支', () => {
    expect(normalizeCategory('生存')).toBe('生活');
    expect(normalizeCategory('交通')).toBe('雜支');
    expect(normalizeCategory('???')).toBe('雜支');
    expect(normalizeCategory('娛樂')).toBe('娛樂');
  });
});

describe('normalizeGasDetails (legacy v1 display-value rows)', () => {
  it('parses a header + rows matrix with formatted amounts', () => {
    const rows = [
      ['時間', '項目', '類別', '金額', '月份'],
      ['2026/9/1 上午 12:30:00', '房租', '家用', '15,000', '2026-09'],
      ['2026/9/2 下午 1:00:00', '便當', '生存', '120', '2026-09'],
    ];
    const tx = normalizeGasDetails(rows);
    expect(tx).toHaveLength(2);
    expect(tx.find(t => t.item === '房租')?.amount).toBe(15000);
    expect(tx.find(t => t.item === '便當')?.category).toBe('生活');
  });
});

describe('normalizeGasRecords (v2 backend)', () => {
  it('keeps row ids and numeric amounts', () => {
    const tx = normalizeGasRecords([
      { id: 'r2', date: '2026-10-01 12:00:00', item: '午餐', category: '生活', amount: 120, month: '2026-10' },
      { id: 'r3', date: '2026-10-02 09:00:00', item: '', category: '生活', amount: 50, month: '2026-10' },
    ]);
    expect(tx).toEqual([
      { id: 'r2', date: '2026-10-01 12:00:00', item: '午餐', category: '生活', amount: 120, month: '2026-10' },
    ]);
  });
});

describe('month-over-month helpers', () => {
  it('getPreviousMonth crosses year boundaries', () => {
    expect(getPreviousMonth('2026-01')).toBe('2025-12');
    expect(getPreviousMonth('2026-10')).toBe('2026-09');
  });

  it('sumMonthUpToDay only counts the same day range', () => {
    const tx = (date: string, amount: number): Transaction => ({
      id: date, date, item: 'x', category: '生活', amount, month: date.slice(0, 7),
    });
    const list = [tx('2026-09-01', 100), tx('2026-09-06 23:59:00', 50), tx('2026-09-07', 1000), tx('2026-10-01', 7)];
    expect(sumMonthUpToDay(list, '2026-09', 6)).toBe(150);
  });
});

describe('budgets', () => {
  it('normalizeBudgets keeps valid categories with positive amounts', () => {
    expect(normalizeBudgets({ '生活': '12,000', '家用': 0, '旅遊': 500, '娛樂': 3000 }))
      .toEqual({ '生活': 12000, '娛樂': 3000 });
    expect(normalizeBudgets(undefined)).toEqual({});
  });

  it('resolveCategoryBudgets prefers custom values and falls back to the reference split', () => {
    const r = resolveCategoryBudgets({ '生活': 9000 }, 10000);
    expect(r['生活']).toEqual({ amount: 9000, isCustom: true });
    expect(r['家用']).toEqual({ amount: 2500, isCustom: false });
  });
});

describe('formatRelativeTime', () => {
  const now = new Date('2026-10-07T12:00:00+08:00');
  it.each([
    ['2026-10-07T11:59:40+08:00', '剛剛'],
    ['2026-10-07T11:55:00+08:00', '5 分鐘前'],
    ['2026-10-07T09:00:00+08:00', '3 小時前'],
    ['2026-10-05T12:00:00+08:00', '2 天前'],
    [undefined, ''],
    ['not a date', ''],
  ])('%s -> %s', (iso, expected) => {
    expect(formatRelativeTime(iso, now)).toBe(expected);
  });
});

describe('buildCumulativeSeries', () => {
  const tx = (date: string, amount: number): Transaction => ({
    id: date + amount, date, item: 'x', category: '生活', amount, month: date.slice(0, 7),
  });
  const list = [tx('2026-10-01 12:00:00', 100), tx('2026-10-03 09:00:00', 50), tx('2026-09-02', 70), tx('2026-09-30', 10)];

  it('stops the current month at today and compares with last month', () => {
    const s = buildCumulativeSeries(list, '2026-10', 3100, new Date(2026, 9, 3, 20));
    expect(s).toHaveLength(31);
    expect(s[0]).toEqual({ day: 1, daily: 100, cumulative: 100, lastMonth: 0, pace: 100, projection: null });
    expect(s[2]).toMatchObject({ day: 3, cumulative: 150, lastMonth: 70 });
    expect(s[3]).toMatchObject({ day: 4, daily: null, cumulative: null });
    expect(s[30]).toMatchObject({ day: 31, lastMonth: 80, pace: 3100 }); // September has no 31st: hold its total
    expect(s.every(p => p.projection === null)).toBe(true); // only 3 days in: too early to project
  });

  it('projects from today to the same month-end figure the 月底推估 card shows', () => {
    const s = buildCumulativeSeries(list, '2026-10', 3100, new Date(2026, 9, 10, 20));
    const { projected } = projectMonthEnd(150, 10, 31);
    expect(s[8].projection).toBeNull();
    expect(s[9].projection).toBe(150);          // starts at today's actual total
    expect(s[30].projection).toBe(projected);   // ends at the shared estimate
  });

  it('fills every day for a past month', () => {
    const s = buildCumulativeSeries(list, '2026-09', 0, new Date(2026, 9, 3));
    expect(s[29]).toMatchObject({ day: 30, cumulative: 80 });
  });
});

describe('formatShortDateTime', () => {
  it.each([
    ['2026-10-07 12:05:33', '10/07 12:05'],
    ['2026-10-07', '10/07'],
    ['2026-10-07 00:00:00', '10/07'],
    ['2026/5/9 下午 8:46:31', '05/09 20:46'],
    ['not a date', 'not a date'],
  ])('%s -> %s', (raw, expected) => {
    expect(formatShortDateTime(raw)).toBe(expected);
  });
});

describe('monthly category rows', () => {
  const tx = (month: string, category: Transaction['category'], amount: number): Transaction => ({
    id: month + category + amount, date: `${month}-05`, item: 'x', category, amount, month,
  });
  const list = [tx('2026-09', '生活', 300), tx('2026-09', '家用', 700), tx('2026-08', '生活', 500), tx('2026-10', '娛樂', 50), tx('bad', '生活', 1)];

  it('groups by month in order, fills every category and flags the current month', () => {
    const rows = buildMonthCategoryRows(list, '2026-10');
    expect(rows.map(r => r.month)).toEqual(['2026-08', '2026-09', '2026-10']);
    expect(rows[1]).toMatchObject({ total: 1000, isInProgress: false });
    expect(rows[1].byCategory).toEqual({ '生活': 300, '家用': 700, '社交': 0, '娛樂': 0, '雜支': 0 });
    expect(rows[2].isInProgress).toBe(true);
  });

  it('averages completed months only', () => {
    const rows = buildMonthCategoryRows(list, '2026-10');
    expect(averageCompletedMonths(rows)).toBe(750);           // (500 + 1000) / 2, October excluded
    expect(averageCompletedMonths(rows, '生活')).toBe(400);   // (500 + 300) / 2
  });
});
