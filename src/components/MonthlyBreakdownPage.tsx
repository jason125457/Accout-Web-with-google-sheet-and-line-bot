import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { Transaction } from '../types/finance';
import { TransactionList } from './TransactionList';
import { compareTransactionDates } from '../utils/dateUtils';

interface MonthlyBreakdownPageProps {
  transactions: Transaction[];
  onDeleteRecord?: (id: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  '生活': '#0d9488',
  '雜支': '#64748b',
  '娛樂': '#f59e0b',
  '家用': '#2563eb',
  '社交': '#ec4899',
  '未分類': '#94a3b8',
  '交通': '#8b5cf6',
};
const FALLBACK_COLORS = ['#0d9488', '#2563eb', '#f59e0b', '#ec4899', '#64748b', '#8b5cf6', '#f97316'];

interface MonthData {
  month: string;
  total: number;
  byCategory: Record<string, number>;
  topCategories: { name: string; amount: number }[];
}

export const MonthlyBreakdownPage: React.FC<MonthlyBreakdownPageProps> = ({ transactions, onDeleteRecord }) => {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  // Build per-month data
  const monthDataList: MonthData[] = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    transactions.forEach(t => {
      if (!t.month) return;
      if (!map[t.month]) map[t.month] = {};
      map[t.month][t.category] = (map[t.month][t.category] || 0) + t.amount;
    });
    return Object.entries(map)
      .map(([month, byCategory]) => {
        const total = Object.values(byCategory).reduce((a, b) => a + b, 0);
        const topCategories = Object.entries(byCategory)
          .map(([name, amount]) => ({ name, amount }))
          .sort((a, b) => b.amount - a.amount);
        return { month, total, byCategory, topCategories };
      })
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions]);

  // All unique categories across all months (sorted by total desc)
  const allCategories = useMemo(() => {
    const totals: Record<string, number> = {};
    transactions.forEach(t => {
      totals[t.category] = (totals[t.category] || 0) + t.amount;
    });
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);
  }, [transactions]);

  // Stacked bar chart data
  const chartData = useMemo(() => {
    return monthDataList.map(md => ({
      month: md.month,
      total: md.total,
      ...md.byCategory,
    }));
  }, [monthDataList]);

  // Transactions for selected month
  const selectedTxns = useMemo(() => {
    if (!selectedMonth) return [];
    return transactions.filter(t => t.month === selectedMonth)
      .sort((a, b) => compareTransactionDates(a.date, b.date, false));
  }, [transactions, selectedMonth]);

  const formatNTD = (v: number) => `NT$ ${v.toLocaleString()}`;
  const formatMonthLabel = (m: string) => /^\d{4}-\d{2}$/.test(m)
    ? `${m.slice(0, 4)}/${m.slice(5, 7)}`
    : m;

  if (transactions.length === 0) {
    return (
      <div className="py-20 text-center text-slate-400 text-sm">
        尚無記帳資料，請先連線 Google 試算表或手動新增。
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6 min-w-0">
      {/* ── Stacked Bar Chart ── */}
      <div className="fintech-card p-4 sm:p-6 min-w-0 overflow-hidden">
        <div className="flex items-center space-x-2.5 mb-5 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-700 flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 tracking-tight truncate">每月花費類別分佈</h2>
            <p className="text-xs text-slate-400 truncate">點擊月份長條 → 查看當月明細</p>
          </div>
        </div>

        {/* Category Legend */}
        <div className="flex flex-wrap gap-2 mb-4">
          {allCategories.map((cat, i) => {
            const color = CATEGORY_COLORS[cat] || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
            return (
              <div key={cat} className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span>{cat}</span>
              </div>
            );
          })}
        </div>

        <div className="h-64 sm:h-72 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 12, left: -10, bottom: 0 }}
              onClick={(data) => {
                if (data?.activePayload?.[0]) {
                  const m = data.activePayload[0].payload.month as string;
                  setSelectedMonth(prev => prev === m ? null : m);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                tickFormatter={formatMonthLabel}
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                dy={6}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const total = payload.reduce((acc, p) => acc + ((p.value as number) || 0), 0);
                    return (
                      <div className="backdrop-blur-md bg-slate-900/92 text-white p-3 rounded-2xl shadow-xl border border-white/10 text-xs min-w-[160px]">
                        <p className="font-bold text-slate-300 mb-2">{formatMonthLabel(label)}</p>
                        <p className="text-teal-300 font-extrabold tabular-nums mb-2">
                          合計 {formatNTD(Math.round(total))}
                        </p>
                        {[...payload].reverse().map(p => (
                          <div key={p.name} className="flex justify-between gap-3 mt-0.5">
                            <span style={{ color: p.fill as string }}>{p.name}</span>
                            <span className="tabular-nums font-semibold">
                              {formatNTD(Math.round(p.value as number))}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {allCategories.map((cat, i) => {
                const color = CATEGORY_COLORS[cat] || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
                return (
                  <Bar
                    key={cat}
                    dataKey={cat}
                    stackId="a"
                    fill={color}
                    radius={i === allCategories.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {selectedMonth && (
          <p className="text-xs text-center text-teal-700 font-semibold mt-2 bg-teal-50 py-1.5 rounded-xl">
            已選取 {formatMonthLabel(selectedMonth)} · 捲動至下方查看明細
          </p>
        )}
      </div>

      {/* ── Month Cards Grid ── */}
      <div>
        <h2 className="text-sm font-bold text-slate-700 mb-3 px-1">各月份詳細摘要</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...monthDataList].reverse().map((md) => {
            const isSelected = selectedMonth === md.month;
            return (
              <button
                key={md.month}
                onClick={() => setSelectedMonth(prev => prev === md.month ? null : md.month)}
                className={`fintech-card p-4 text-left transition-all active:scale-[0.98] ${
                  isSelected
                    ? 'ring-2 ring-teal-500 ring-offset-1'
                    : 'hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {md.month.slice(0, 4)} 年 {md.month.slice(5, 7)} 月
                    </span>
                    <p className="text-xl font-extrabold text-slate-900 tabular-nums mt-0.5">
                      NT$ {Math.round(md.total).toLocaleString()}
                    </p>
                  </div>
                  {isSelected
                    ? <ChevronUp className="w-4 h-4 text-teal-600 shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  }
                </div>

                {/* Top 3 categories */}
                <div className="space-y-1.5">
                  {md.topCategories.slice(0, 3).map((cat, i) => {
                    const color = CATEGORY_COLORS[cat.name] || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
                    const pct = md.total > 0 ? (cat.amount / md.total) * 100 : 0;
                    return (
                      <div key={cat.name} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-slate-700 truncate">{cat.name}</span>
                            <span className="font-bold text-slate-900 tabular-nums ml-2 shrink-0">
                              NT$ {Math.round(cat.amount).toLocaleString()}
                            </span>
                          </div>
                          <div className="h-1 bg-slate-100 rounded-full mt-0.5 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, backgroundColor: color }}
                            />
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium tabular-nums shrink-0 w-8 text-right">
                          {Math.round(pct)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Selected Month Transaction List ── */}
      {selectedMonth && selectedTxns.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-slate-700 mb-3 px-1">
            {selectedMonth.slice(0, 4)} 年 {selectedMonth.slice(5, 7)} 月 · 詳細記帳明細
          </h2>
          <TransactionList transactions={selectedTxns} onDeleteRecord={onDeleteRecord} />
        </div>
      )}
    </div>
  );
};
