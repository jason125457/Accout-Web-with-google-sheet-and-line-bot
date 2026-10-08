import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  LabelList,
  TooltipProps,
} from 'recharts';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, X } from 'lucide-react';
import { Transaction, TransactionCategory } from '../types/finance';
import { TransactionList } from './TransactionList';
import { compareTransactionDates } from '../utils/dateUtils';
import { palette, categoryColor } from '../theme/tokens';
import { STANDARD_CATEGORIES } from '../constants/categories';
import { categoryIcon } from '../constants/categoryIcons';
import {
  buildMonthCategoryRows,
  averageCompletedMonths,
  MonthCategoryRow,
} from '../utils/financeCalculations';

interface MonthlyBreakdownPageProps {
  transactions: Transaction[];
}

type Range = '6' | '12' | 'all';
const RANGES: { key: Range; label: string }[] = [
  { key: '6', label: '近 6 月' },
  { key: '12', label: '近 12 月' },
  { key: 'all', label: '全部' },
];

const fmt = (n: number) => `NT$ ${Math.round(n).toLocaleString()}`;
const fmtCompact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `${Math.round(n)}`);
const monthShort = (m: string) => `${parseInt(m.slice(5), 10)}月`;
const monthLong = (m: string) => `${m.slice(0, 4)} 年 ${parseInt(m.slice(5), 10)} 月`;
const pctChange = (value: number, base: number) => (base > 0 ? Math.round(((value - base) / base) * 100) : null);

/** Signed change pill: up = spent more (rose), down = spent less (emerald). Icon + text, never color alone. */
const DeltaPill: React.FC<{ pct: number | null; suffix?: string }> = ({ pct, suffix = '較平均' }) => {
  if (pct === null) return null;
  const flat = Math.abs(pct) < 3;
  const Icon = flat ? Minus : pct > 0 ? TrendingUp : TrendingDown;
  const tone = flat
    ? 'bg-slate-50 text-ink-muted border-line'
    : pct > 0
      ? 'bg-rose-50 text-rose-700 border-rose-200/60'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border text-[10px] font-bold tabular-nums whitespace-nowrap ${tone}`}>
      <Icon className="w-3 h-3" aria-hidden="true" />
      {suffix} {flat ? '持平' : `${pct > 0 ? '+' : ''}${pct}%`}
    </span>
  );
};

const StatTile: React.FC<{ label: string; value: string; hint?: string }> = ({ label, value, hint }) => (
  <div className="fintech-card p-3.5 sm:p-4 min-w-0">
    <p className="text-[11px] font-bold text-ink-muted">{label}</p>
    <p className="mt-1 text-lg sm:text-2xl font-extrabold text-ink tracking-tight tabular-nums truncate">{value}</p>
    {hint && <p className="mt-0.5 text-[11px] text-ink-subtle font-medium truncate">{hint}</p>}
  </div>
);

interface ChartRow extends Record<string, string | number | boolean> {
  month: string;
  total: number;
  isInProgress: boolean;
}

const CompositionTooltip: React.FC<
  TooltipProps<number, string> & { avg: number; isolated: TransactionCategory | null }
> = ({ active, payload, avg, isolated }) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as ChartRow;
  const shown = isolated ? (row[isolated] as number) : row.total;
  const delta = row.isInProgress ? null : pctChange(shown, avg);
  // List categories top-to-bottom, matching the stack the reader is looking at.
  const cats = (isolated ? [isolated] : [...STANDARD_CATEGORIES].reverse()).filter(c => (row[c] as number) > 0);
  return (
    <div className="bg-surface border border-line rounded-xl shadow-lg px-3 py-2.5 text-xs min-w-[190px] space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-bold text-ink">{monthLong(row.month)}</p>
        {row.isInProgress && <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">進行中</span>}
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-ink-muted font-medium">{isolated ? `${isolated}支出` : '合計'}</span>
        <span className="text-sm font-extrabold text-ink tabular-nums">{fmt(shown)}</span>
      </div>
      {delta !== null && <DeltaPill pct={delta} />}
      <div className="border-t border-line pt-1.5 space-y-1">
        {cats.map(c => {
          const v = row[c] as number;
          return (
            <div key={c} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-ink-muted font-medium">
                <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: categoryColor(c) }} aria-hidden="true" />
                {c}
              </span>
              <span className="tabular-nums text-ink font-semibold">
                {fmt(v)}
                {!isolated && row.total > 0 && (
                  <span className="ml-1.5 text-ink-subtle font-medium">{Math.round((v / row.total) * 100)}%</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-ink-subtle">點擊長條查看當月明細</p>
    </div>
  );
};

/** One small chart per category so each can be compared across months from a shared baseline. */
const CategoryTrendCard: React.FC<{
  category: TransactionCategory;
  rows: MonthCategoryRow[];
  active: boolean;
  onSelect: () => void;
}> = ({ category, rows, active, onSelect }) => {
  const color = categoryColor(category);
  const Icon = categoryIcon(category);
  const avg = averageCompletedMonths(rows, category);
  const lastDone = [...rows].reverse().find(r => !r.isInProgress);
  const lastValue = lastDone ? lastDone.byCategory[category] : 0;
  const data = rows.map(r => ({ month: r.month, value: r.byCategory[category], isInProgress: r.isInProgress }));

  return (
    <button
      onClick={onSelect}
      aria-pressed={active}
      className={`fintech-card p-3.5 text-left min-w-0 transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        active ? 'ring-2 ring-offset-1' : ''
      }`}
      style={active ? ({ '--tw-ring-color': color } as React.CSSProperties) : undefined}
    >
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <span className="flex items-center gap-1.5 text-sm font-extrabold text-ink whitespace-nowrap">
          <span className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}1A`, color }}>
            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
          {category}
        </span>
        {lastDone && <DeltaPill pct={pctChange(lastValue, avg)} suffix={monthShort(lastDone.month)} />}
      </div>
      <p className="mt-2 text-[11px] text-ink-muted font-medium">
        月平均 <span className="font-extrabold text-ink tabular-nums">{fmt(avg)}</span>
      </p>
      <div className="h-14 mt-1 -mx-1" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 2, bottom: 0, left: 2 }}>
            <ReferenceLine y={avg} stroke={palette.inkSubtle} strokeDasharray="3 3" />
            <Bar dataKey="value" radius={[3, 3, 0, 0]} isAnimationActive={false}>
              {data.map(d => (
                <Cell key={d.month} fill={color} fillOpacity={d.isInProgress ? 0.35 : 1} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between text-[10px] text-ink-subtle font-medium mt-0.5">
        <span>{data[0] && monthShort(data[0].month)}</span>
        <span>{data.length > 0 && monthShort(data[data.length - 1].month)}</span>
      </div>
    </button>
  );
};

export const MonthlyBreakdownPage: React.FC<MonthlyBreakdownPageProps> = ({ transactions }) => {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [range, setRange] = useState<Range>('12');
  const [isolated, setIsolated] = useState<TransactionCategory | null>(null);
  const selectedDetailRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<HTMLDivElement | null>(null);

  const allRows = useMemo(() => buildMonthCategoryRows(transactions), [transactions]);
  const rows = useMemo(
    () => (range === 'all' ? allRows : allRows.slice(-Number(range))),
    [allRows, range]
  );

  const avgTotal = averageCompletedMonths(rows);
  const avgShown = isolated ? averageCompletedMonths(rows, isolated) : avgTotal;
  const periodTotal = rows.reduce((sum, r) => sum + r.total, 0);
  const completed = rows.filter(r => !r.isInProgress);
  const highest = completed.reduce<MonthCategoryRow | null>((m, r) => (!m || r.total > m.total ? r : m), null);
  const lowest = completed.reduce<MonthCategoryRow | null>((m, r) => (!m || r.total < m.total ? r : m), null);

  const chartData: ChartRow[] = rows.map(r => ({
    month: r.month,
    total: r.total,
    isInProgress: r.isInProgress,
    ...r.byCategory,
  }));
  const stackedCats: TransactionCategory[] = isolated ? [isolated] : [...STANDARD_CATEGORIES];
  const topCat = stackedCats[stackedCats.length - 1];

  const selectedTxns = useMemo(() => {
    if (!selectedMonth) return [];
    return transactions
      .filter(t => t.month === selectedMonth)
      .sort((a, b) => compareTransactionDates(a.date, b.date, false));
  }, [transactions, selectedMonth]);

  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!selectedMonth) return;
    const timer = window.setTimeout(() => {
      selectedDetailRef.current?.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [selectedMonth]);

  const toggleIsolate = (cat: TransactionCategory, scroll = false) => {
    setIsolated(prev => (prev === cat ? null : cat));
    if (scroll) chartRef.current?.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
  };

  if (transactions.length === 0) {
    return (
      <div className="py-20 text-center text-ink-subtle text-sm">
        尚無記帳資料，請先連線 Google 試算表，或透過 LINE 記一筆。
      </div>
    );
  }

  const rangeLabel = rows.length > 0 ? `${monthLong(rows[0].month)} – ${monthLong(rows[rows.length - 1].month)}` : '';

  return (
    <div className="space-y-5 sm:space-y-6 min-w-0">
      {/* ── Header + range ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-ink tracking-tight">每月花費分析</h2>
          <p className="text-xs text-ink-muted mt-0.5">{rangeLabel}</p>
        </div>
        <div className="inline-flex p-1 rounded-xl bg-surface border border-line self-start sm:self-auto" role="tablist" aria-label="分析期間">
          {RANGES.map(r => (
            <button
              key={r.key}
              role="tab"
              aria-selected={range === r.key}
              onClick={() => setRange(r.key)}
              className={`min-h-9 px-3 rounded-lg text-xs font-bold transition-colors ${
                range === r.key ? 'bg-night text-white' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Summary tiles ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatTile label="期間總支出" value={fmt(periodTotal)} hint={`${rows.length} 個月`} />
        <StatTile label="月平均" value={fmt(avgTotal)} hint="不含進行中的月份" />
        <StatTile label="最高月份" value={highest ? fmt(highest.total) : '—'} hint={highest ? monthLong(highest.month) : undefined} />
        <StatTile label="最低月份" value={lowest ? fmt(lowest.total) : '—'} hint={lowest ? monthLong(lowest.month) : undefined} />
      </div>

      {/* ── Composition chart ── */}
      <section ref={chartRef} className="fintech-card p-4 sm:p-6 min-w-0 scroll-mt-4" aria-label="每月支出組成">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h3 className="text-base font-extrabold text-ink tracking-tight">
              {isolated ? `每月${isolated}支出` : '每月支出組成'}
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              {isolated ? '只看單一類別，從同一基準比較各月' : '點選下方類別可單獨比較；點擊長條查看當月明細'}
            </p>
          </div>
          {isolated && (
            <button
              onClick={() => setIsolated(null)}
              className="inline-flex items-center gap-1 self-start min-h-9 px-3 rounded-xl border border-line text-xs font-bold text-ink-muted hover:text-ink"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
              顯示全部類別
            </button>
          )}
        </div>

        {/* Interactive legend: identity is carried by label + swatch, and doubles as the isolate control */}
        <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="類別篩選">
          {STANDARD_CATEGORIES.map(cat => {
            const on = !isolated || isolated === cat;
            return (
              <button
                key={cat}
                onClick={() => toggleIsolate(cat)}
                aria-pressed={isolated === cat}
                className={`inline-flex items-center gap-1.5 min-h-8 px-2.5 rounded-full border text-xs font-bold transition-opacity ${
                  isolated === cat ? 'border-ink/20 bg-slate-50 text-ink' : 'border-line text-ink-muted'
                } ${on ? '' : 'opacity-45'}`}
              >
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: categoryColor(cat) }} aria-hidden="true" />
                {cat}
              </button>
            );
          })}
        </div>

        {avgShown > 0 && (
          <p className="flex items-center gap-1.5 text-[11px] text-ink-muted font-medium mb-1">
            <svg width="18" height="6" aria-hidden="true" className="shrink-0">
              <line x1="1" y1="3" x2="17" y2="3" stroke={palette.goldDeep} strokeWidth="1.5" strokeDasharray="5 3" />
            </svg>
            {isolated ? `${isolated}月平均` : '月平均'}
            <span className="font-extrabold text-ink tabular-nums">{fmt(avgShown)}</span>
            <span className="text-ink-subtle">（不含進行中月份）</span>
          </p>
        )}

        <div className="h-64 sm:h-80 w-full min-w-0 -ml-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 22, right: 8, left: 0, bottom: 0 }}
              barCategoryGap="22%"
              onClick={(data) => {
                const m = data?.activePayload?.[0]?.payload?.month as string | undefined;
                if (m) setSelectedMonth(prev => (prev === m ? null : m));
              }}
              style={{ cursor: 'pointer' }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={palette.grid} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={{ stroke: palette.axis }}
                interval="preserveStartEnd"
                tick={({ x, y, payload }: { x: number; y: number; payload: { value: string } }) => {
                  const row = rows.find(r => r.month === payload.value);
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <text dy={14} textAnchor="middle" fontSize={11} fontWeight={600} fill={palette.inkMuted}>
                        {monthShort(payload.value)}
                      </text>
                      {row?.isInProgress && (
                        <text dy={27} textAnchor="middle" fontSize={9} fontWeight={700} fill={palette.goldDeep}>
                          進行中
                        </text>
                      )}
                    </g>
                  );
                }}
                height={34}
              />
              <YAxis
                tick={{ fontSize: 10, fill: palette.inkSubtle }}
                tickLine={false}
                axisLine={false}
                tickFormatter={fmtCompact}
                width={38}
              />
              <Tooltip
                cursor={{ fill: palette.hover }}
                content={<CompositionTooltip avg={avgShown} isolated={isolated} />}
              />
              {avgShown > 0 && (
                <ReferenceLine
                  y={avgShown}
                  stroke={palette.goldDeep}
                  strokeDasharray="5 4"
                  strokeWidth={1.5}
                />
              )}
              {stackedCats.map(cat => (
                <Bar
                  key={cat}
                  dataKey={cat}
                  stackId="month"
                  fill={categoryColor(cat)}
                  stroke={palette.surface}
                  strokeWidth={stackedCats.length > 1 ? 2 : 0}
                  radius={cat === topCat ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  isAnimationActive={false}
                >
                  {chartData.map(d => {
                    const dimmed = selectedMonth !== null && selectedMonth !== d.month;
                    return (
                      <Cell
                        key={d.month}
                        fillOpacity={d.isInProgress ? 0.45 : dimmed ? 0.35 : 1}
                      />
                    );
                  })}
                  {cat === topCat && (
                    <LabelList
                      dataKey={isolated ?? 'total'}
                      position="top"
                      offset={6}
                      formatter={(v: number) => (v > 0 ? fmtCompact(v) : '')}
                      style={{ fontSize: 10, fontWeight: 700, fill: palette.ink }}
                    />
                  )}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {selectedMonth && (
          <p className="text-xs text-center text-primary-strong font-semibold mt-3 bg-teal-50 py-1.5 rounded-xl">
            已選取 {monthLong(selectedMonth)} · 已展開當月明細
          </p>
        )}
      </section>

      {/* ── Category small multiples ── */}
      <section aria-label="各類別趨勢">
        <div className="flex items-baseline justify-between mb-3 px-1">
          <h3 className="text-sm font-extrabold text-ink">各類別趨勢</h3>
          <p className="text-[11px] text-ink-subtle">虛線為月平均 · 點選可在上方單獨比較</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {STANDARD_CATEGORIES.map(cat => (
            <CategoryTrendCard
              key={cat}
              category={cat}
              rows={rows}
              active={isolated === cat}
              onSelect={() => toggleIsolate(cat, true)}
            />
          ))}
        </div>
      </section>

      {/* ── Month cards ── */}
      <section aria-label="各月份摘要">
        <h3 className="text-sm font-extrabold text-ink mb-3 px-1">各月份摘要</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...rows].reverse().map(row => {
            const isSelected = selectedMonth === row.month;
            const detailsId = `month-details-${row.month}`;
            const top = STANDARD_CATEGORIES
              .map(c => ({ name: c, amount: row.byCategory[c] }))
              .filter(c => c.amount > 0)
              .sort((a, b) => b.amount - a.amount)
              .slice(0, 3);
            return (
              <React.Fragment key={row.month}>
                <button
                  onClick={() => setSelectedMonth(prev => (prev === row.month ? null : row.month))}
                  aria-expanded={isSelected}
                  aria-controls={detailsId}
                  className={`fintech-card p-4 text-left transition-all active:scale-[0.98] ${
                    isSelected ? 'ring-2 ring-primary ring-offset-1' : 'hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="min-w-0">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-ink-subtle">
                        {monthLong(row.month)}
                        {row.isInProgress && (
                          <span className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">進行中</span>
                        )}
                      </span>
                      <p className="text-xl font-extrabold text-ink tabular-nums tracking-tight mt-0.5">{fmt(row.total)}</p>
                      {!row.isInProgress && <div className="mt-1"><DeltaPill pct={pctChange(row.total, avgTotal)} /></div>}
                    </div>
                    {isSelected
                      ? <ChevronUp className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                      : <ChevronDown className="w-4 h-4 text-ink-subtle shrink-0" aria-hidden="true" />}
                  </div>

                  <div className="space-y-1.5">
                    {top.map(cat => {
                      const color = categoryColor(cat.name);
                      const pct = row.total > 0 ? (cat.amount / row.total) * 100 : 0;
                      return (
                        <div key={cat.name} className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: color }} aria-hidden="true" />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between text-xs">
                              <span className="font-medium text-ink-muted truncate">{cat.name}</span>
                              <span className="font-bold text-ink tabular-nums ml-2 shrink-0">{fmt(cat.amount)}</span>
                            </div>
                            <div className="h-1 bg-slate-100 rounded-full mt-0.5 overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                            </div>
                          </div>
                          <span className="text-[10px] text-ink-subtle font-medium tabular-nums shrink-0 w-8 text-right">
                            {Math.round(pct)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </button>
                {isSelected && selectedTxns.length > 0 && (
                  <div id={detailsId} ref={selectedDetailRef} className="col-span-full scroll-mt-4">
                    <h3 className="text-sm font-extrabold text-ink mb-3 px-1">{monthLong(row.month)} · 詳細記帳明細</h3>
                    <TransactionList transactions={selectedTxns} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </section>
    </div>
  );
};
