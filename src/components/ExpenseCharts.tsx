import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Activity, PieChart as PieIcon, BarChart2, TrendingUp, Sparkles } from 'lucide-react';
import { MonthlySummary, Transaction } from '../types/finance';
import { calculateSixMonthAverage } from '../utils/financeCalculations';

interface ExpenseChartsProps {
  monthlySummaries: MonthlySummary[];
  transactions: Transaction[];
  selectedMonth: string;
  selectedCategory?: string;
  onCategoryClick?: (category: string) => void;
  onMonthClick?: (month: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  '生活': '#0d9488', // Emerald Teal
  '雜支': '#64748b', // Slate
  '娛樂': '#f59e0b', // Amber
  '家用': '#2563eb', // Royal Blue
  '社交': '#ec4899', // Hot Pink
  '未分類': '#94a3b8'
};

const FALLBACK_COLORS = ['#0d9488', '#2563eb', '#f59e0b', '#ec4899', '#64748b', '#8b5cf6'];

export const ExpenseCharts: React.FC<ExpenseChartsProps> = ({
  monthlySummaries,
  transactions,
  selectedMonth,
  selectedCategory,
  onCategoryClick,
  onMonthClick,
}) => {
  const [trendRange, setTrendRange] = useState<'recent6' | 'all'>('recent6');
  const [chartMode, setChartMode] = useState<'bar' | 'area'>('bar');

  const sortedSummaries = useMemo(() => {
    return [...monthlySummaries].sort((a, b) => a.month.localeCompare(b.month));
  }, [monthlySummaries]);

  const trendData = useMemo(() => {
    return trendRange === 'recent6' ? sortedSummaries.slice(-6) : sortedSummaries;
  }, [sortedSummaries, trendRange]);

  const avgExpense = useMemo(() => {
    return calculateSixMonthAverage(sortedSummaries);
  }, [sortedSummaries]);

  const maxMonth = useMemo(() => {
    if (trendData.length === 0) return null;
    return trendData.reduce((prev, curr) => (curr.totalExpense > prev.totalExpense ? curr : prev), trendData[0]);
  }, [trendData]);

  // Determine latest/current month in dataset
  const latestMonth = useMemo(() => {
    return sortedSummaries.length > 0 ? sortedSummaries[sortedSummaries.length - 1].month : '';
  }, [sortedSummaries]);

  // Donut category data
  const filteredTransactions = useMemo(() => {
    return selectedMonth === 'all'
      ? transactions
      : transactions.filter(t => t.month === selectedMonth);
  }, [transactions, selectedMonth]);

  const { categoryData, totalCategoryExpense } = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    let total = 0;

    filteredTransactions.forEach(t => {
      const cat = t.category || '雜支';
      categoryMap[cat] = (categoryMap[cat] || 0) + t.amount;
      total += t.amount;
    });

    const data = Object.entries(categoryMap)
      .map(([name, value]) => ({
        name,
        value: Math.round(value),
        percentage: total > 0 ? ((value / total) * 100).toFixed(1) : '0'
      }))
      .sort((a, b) => b.value - a.value);

    return { categoryData: data, totalCategoryExpense: total };
  }, [filteredTransactions]);

  const formatNTD = (num: number) => `NT$ ${Math.round(num).toLocaleString()}`;

  const formatMonthLabel = (m: string) => {
    if (/^\d{4}-\d{2}$/.test(m)) {
      const monthNum = parseInt(m.slice(5, 7));
      return trendRange === 'all' ? `${m.slice(2, 4)}/${monthNum}月` : `${monthNum}月`;
    }
    return m;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ── 1. 月度支出趨勢與比較 (佔 2 欄) ── */}
      <div className="lg:col-span-2 fintech-card p-6 flex flex-col justify-between">
        <div>
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-700 flex items-center justify-center shadow-sm">
                <Activity className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-slate-900 tracking-tight">月度支出走勢</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {chartMode === 'bar' ? '柱狀分佈' : '平滑趨勢'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">對比半年基準日常開銷 · 點擊月份可篩選明細</p>
              </div>
            </div>

            {/* Controls: Mode Switcher & Range Switcher */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Chart Mode Switcher */}
              <div className="flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/60">
                <button
                  onClick={() => setChartMode('bar')}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    chartMode === 'bar'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="切換為現代金融柱狀圖"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>柱狀</span>
                </button>
                <button
                  onClick={() => setChartMode('area')}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    chartMode === 'area'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="切換為平滑面積曲線圖"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>趨勢</span>
                </button>
              </div>

              {/* Range Switcher */}
              <div className="flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/60">
                <button
                  onClick={() => setTrendRange('recent6')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    trendRange === 'recent6'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  近 6 個月
                </button>
                <button
                  onClick={() => setTrendRange('all')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    trendRange === 'all'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  歷史全期 ({sortedSummaries.length}月)
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar (Fintech style executive metrics) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-4">
            <div className="bg-slate-50/90 rounded-xl px-3 py-2 border border-slate-200/50 flex flex-col justify-center">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">近半年基準線</span>
              <span className="text-sm font-extrabold text-slate-800 tabular-nums">
                {avgExpense > 0 ? formatNTD(avgExpense) : '--'}
              </span>
            </div>
            <div className="bg-slate-50/90 rounded-xl px-3 py-2 border border-slate-200/50 flex flex-col justify-center">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">期間最高月份</span>
              <span className="text-sm font-extrabold text-slate-800 tabular-nums truncate">
                {maxMonth ? `${formatMonthLabel(maxMonth.month)} (${formatNTD(maxMonth.totalExpense)})` : '--'}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-teal-50/80 rounded-xl px-3 py-2 border border-teal-200/60 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                當前篩選狀態
              </span>
              <span className="text-sm font-extrabold text-teal-900 truncate">
                {selectedMonth === 'all' ? '全部月份總覽' : `${selectedMonth} 專屬視角`}
              </span>
            </div>
          </div>

          {/* Chart Display Area */}
          <div className="h-64 sm:h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === 'bar' ? (
                /* ── Mode 1: Fintech Rounded Pillar Bar Chart ── */
                <BarChart
                  data={trendData}
                  margin={{ top: 18, right: 16, left: -10, bottom: 8 }}
                  onClick={(data) => {
                    if (onMonthClick && data?.activePayload?.[0]) {
                      onMonthClick(data.activePayload[0].payload.month as string);
                    }
                  }}
                  style={{ cursor: onMonthClick ? 'pointer' : 'default' }}
                >
                  <defs>
                    <linearGradient id="barDefaultGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0d9488" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#0f766e" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="barActiveGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#4338ca" stopOpacity={0.8} />
                    </linearGradient>
                    <linearGradient id="barInProgressGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.85} />
                      <stop offset="100%" stopColor="#0d9488" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                    dy={6}
                    tickFormatter={formatMonthLabel}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
                    tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                    width={42}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(241, 245, 249, 0.65)', radius: 8 }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const val = payload[0].value as number;
                        const mStr = label as string;
                        const isLatest = mStr === latestMonth;
                        const diff = avgExpense > 0 ? val - avgExpense : 0;
                        return (
                          <div className="backdrop-blur-md bg-slate-900/95 text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/10 text-xs min-w-[170px]">
                            <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-white/10">
                              <span className="font-bold text-slate-300">
                                {mStr.slice(0, 4)} 年 {parseInt(mStr.slice(5, 7))} 月
                              </span>
                              {isLatest && (
                                <span className="text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded font-bold">
                                  進行中
                                </span>
                              )}
                            </div>
                            <p className="text-xl font-black text-teal-300 tabular-nums mb-2">
                              {formatNTD(val)}
                            </p>
                            {avgExpense > 0 && (
                              <div className="text-[11px] space-y-0.5 pt-1 border-t border-white/10">
                                <div className="flex justify-between text-slate-400">
                                  <span>半年基準線：</span>
                                  <span className="tabular-nums">{formatNTD(avgExpense)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">基準差異：</span>
                                  <span className={`font-bold tabular-nums ${diff >= 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    {diff >= 0 ? `+${formatNTD(diff)}` : formatNTD(diff)}
                                  </span>
                                </div>
                              </div>
                            )}
                            {onMonthClick && (
                              <p className="text-[10px] text-teal-400 mt-2 font-medium text-center bg-white/5 py-1 rounded-lg">
                                👆 點擊鎖定該月明細
                              </p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {avgExpense > 0 && (
                    <ReferenceLine
                      y={avgExpense}
                      stroke="#64748b"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{
                        value: `半年均 ${formatNTD(avgExpense)}`,
                        position: 'insideTopRight',
                        fill: '#64748b',
                        fontSize: 10,
                        fontWeight: 700
                      }}
                    />
                  )}
                  <Bar
                    dataKey="totalExpense"
                    radius={[8, 8, 2, 2]}
                    maxBarSize={48}
                  >
                    {trendData.map((entry) => {
                      const isSelected = selectedMonth === entry.month;
                      const isLatest = entry.month === latestMonth;
                      return (
                        <Cell
                          key={entry.month}
                          fill={
                            isSelected
                              ? 'url(#barActiveGradient)'
                              : isLatest
                              ? 'url(#barInProgressGradient)'
                              : 'url(#barDefaultGradient)'
                          }
                          stroke={isSelected ? '#4338ca' : isLatest ? '#0d9488' : 'none'}
                          strokeWidth={isSelected ? 2 : 1}
                          strokeDasharray={isLatest && !isSelected ? '3 3' : 'none'}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              ) : (
                /* ── Mode 2: Sleek Fintech Area Curve ── */
                <AreaChart
                  data={trendData}
                  margin={{ top: 18, right: 16, left: -10, bottom: 8 }}
                  onClick={(data) => {
                    if (onMonthClick && data?.activePayload?.[0]) {
                      onMonthClick(data.activePayload[0].payload.month as string);
                    }
                  }}
                  style={{ cursor: onMonthClick ? 'pointer' : 'default' }}
                >
                  <defs>
                    <linearGradient id="areaFintechGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0d9488" stopOpacity={0.28} />
                      <stop offset="90%" stopColor="#0d9488" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                    dy={6}
                    tickFormatter={formatMonthLabel}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }}
                    tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                    width={42}
                  />
                  <Tooltip
                    cursor={{ stroke: '#94a3b8', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const val = payload[0].value as number;
                        const mStr = label as string;
                        const diff = avgExpense > 0 ? val - avgExpense : 0;
                        return (
                          <div className="backdrop-blur-md bg-slate-900/95 text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/10 text-xs min-w-[170px]">
                            <p className="font-bold text-slate-300 mb-1 pb-1 border-b border-white/10">
                              {mStr.slice(0, 4)} 年 {parseInt(mStr.slice(5, 7))} 月
                            </p>
                            <p className="text-xl font-black text-teal-300 tabular-nums mb-2">
                              {formatNTD(val)}
                            </p>
                            {avgExpense > 0 && (
                              <div className="text-[11px] space-y-0.5 pt-1 border-t border-white/10">
                                <div className="flex justify-between text-slate-400">
                                  <span>半年基準線：</span>
                                  <span className="tabular-nums">{formatNTD(avgExpense)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">基準差異：</span>
                                  <span className={`font-bold tabular-nums ${diff >= 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    {diff >= 0 ? `+${formatNTD(diff)}` : formatNTD(diff)}
                                  </span>
                                </div>
                              </div>
                            )}
                            {onMonthClick && (
                              <p className="text-[10px] text-teal-400 mt-2 font-medium text-center bg-white/5 py-1 rounded-lg">
                                👆 點擊鎖定該月明細
                              </p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {avgExpense > 0 && (
                    <ReferenceLine
                      y={avgExpense}
                      stroke="#64748b"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{
                        value: `半年均 ${formatNTD(avgExpense)}`,
                        position: 'insideTopRight',
                        fill: '#64748b',
                        fontSize: 10,
                        fontWeight: 700
                      }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="totalExpense"
                    stroke="#0d9488"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#areaFintechGradient)"
                    dot={{ r: 4, fill: '#ffffff', stroke: '#0d9488', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#0d9488', stroke: '#ffffff', strokeWidth: 2.5 }}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Legend / Status Footer */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100 gap-2">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-teal-600 inline-block" />
              <span className="font-medium text-slate-700">歷史完整月份</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-teal-400 border border-dashed border-teal-700 inline-block" />
              <span className="font-medium text-slate-700">當前進行中</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-slate-400 inline-block" />
              <span>半年基準線 ({formatNTD(avgExpense)})</span>
            </div>
            {onMonthClick && (
              <span className="text-teal-700 font-bold hidden sm:inline">點擊圖形可直接切換月份視角</span>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. 消費類別分佈 Donut Card (佔 1 欄) ── */}
      <div className="fintech-card p-6 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-700 flex items-center justify-center shadow-sm">
                <PieIcon className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">消費類別分佈</h2>
                <p className="text-xs text-slate-400">
                  {selectedMonth === 'all' ? '歷史累積消費比例' : `${selectedMonth} 消費佔比`}
                </p>
              </div>
            </div>
          </div>

          {/* Donut Chart with Center Metric */}
          <div className="relative w-full mt-3" style={{ height: '200px' }}>
            {categoryData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={2}
                      stroke="#ffffff"
                      style={{ cursor: onCategoryClick ? 'pointer' : 'default' }}
                      onClick={(entry) => {
                        if (onCategoryClick) onCategoryClick(entry.name as string);
                      }}
                    >
                      {categoryData.map((entry, index) => {
                        const color = CATEGORY_COLORS[entry.name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
                        const isActive = selectedCategory && selectedCategory !== 'all' && selectedCategory === entry.name;
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={color}
                            opacity={selectedCategory && selectedCategory !== 'all' && !isActive ? 0.35 : 1}
                            stroke={isActive ? '#0f172a' : '#ffffff'}
                            strokeWidth={isActive ? 3 : 2}
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="backdrop-blur-md bg-slate-900/95 text-white px-3.5 py-2.5 rounded-xl shadow-xl border border-white/10 text-xs">
                              <p className="font-semibold text-slate-300">{data.name}</p>
                              <p className="font-bold text-teal-300 tabular-nums">
                                {formatNTD(data.value)} ({data.percentage}%)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Center Content in Donut Hole */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">合計支出</span>
                  <span className="text-xl font-black text-slate-900 tracking-tight tabular-nums">
                    {totalCategoryExpense >= 100000
                      ? `$${(totalCategoryExpense / 1000).toFixed(1)}k`
                      : `$${Math.round(totalCategoryExpense).toLocaleString()}`}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {categoryData.length} 個消費類別
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">
                當前月份無記帳資料
              </div>
            )}
          </div>

          {/* Legend Table */}
          {onCategoryClick && (
            <p className="text-[10px] text-teal-600 font-semibold mt-3 mb-1">
              點擊分類 → 快速篩選明細
            </p>
          )}
          <div className="space-y-1.5 mt-2 max-h-36 overflow-y-auto pr-1">
            {categoryData.map((item, index) => {
              const color = CATEGORY_COLORS[item.name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
              const isActive = selectedCategory && selectedCategory !== 'all' && selectedCategory === item.name;
              return (
                <div
                  key={item.name}
                  onClick={() => onCategoryClick && onCategoryClick(item.name)}
                  className={`flex items-center justify-between text-xs py-1.5 px-2 rounded-xl transition-all ${
                    onCategoryClick ? 'cursor-pointer hover:bg-slate-100' : ''
                  } ${isActive ? 'bg-slate-900/5 ring-1 ring-slate-300' : ''}`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: color }} />
                    <span className={`font-medium ${isActive ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 tabular-nums">{formatNTD(item.value)}</span>
                    <span className="text-[11px] text-slate-400 tabular-nums font-medium w-9 text-right">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Summary */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>總計金額</span>
          <span className="font-extrabold text-slate-900 tabular-nums">
            {formatNTD(totalCategoryExpense)}
          </span>
        </div>
      </div>
    </div>
  );
};
