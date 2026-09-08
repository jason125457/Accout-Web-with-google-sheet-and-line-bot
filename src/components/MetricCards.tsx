import React, { useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Eye,
  EyeOff,
  CheckCircle2,
  CircleAlert,
  TrendingDown,
  Zap
} from 'lucide-react';
import { MonthlySummary, Transaction } from '../types/finance';
import { calculateSixMonthAverage } from '../utils/financeCalculations';

interface MetricCardsProps {
  monthlySummaries: MonthlySummary[];
  transactions: Transaction[];
  selectedMonth: string;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  monthlySummaries,
  transactions,
  selectedMonth,
}) => {
  const [hideAmount, setHideAmount] = useState(false);

  const sortedSummaries = [...monthlySummaries].sort((a, b) => a.month.localeCompare(b.month));
  const latestSummary = sortedSummaries[sortedSummaries.length - 1];
  const activeMonth = selectedMonth || latestSummary?.month || '';

  // Current month total
  const currentSummary = sortedSummaries.find(s => s.month === activeMonth);
  const currentMonthTransactions = transactions.filter(t => t.month === activeMonth);
  const calculatedCurrentMonthTotal = currentMonthTransactions.reduce((sum, t) => sum + t.amount, 0);
  const currentTotal = currentMonthTransactions.length > 0
    ? calculatedCurrentMonthTotal
    : (currentSummary?.totalExpense || 0);

  // Previous month for MoM
  const currentIndex = sortedSummaries.findIndex(s => s.month === activeMonth);
  const prevSummary = currentIndex > 0 ? sortedSummaries[currentIndex - 1] : null;
  const prevTotal = prevSummary?.totalExpense || 0;

  let momChangePercent: number | null = null;
  if (prevTotal > 0 && currentTotal > 0) {
    momChangePercent = Math.round(((currentTotal - prevTotal) / prevTotal) * 100);
  }

  // 6-month average benchmark
  const sixMonthAvg = calculateSixMonthAverage(sortedSummaries, activeMonth);

  // Highest single expense
  const targetTransactions = transactions.filter(t => t.month === activeMonth);

  const maxExpense = targetTransactions.reduce(
    (max, t) => (t.amount > max.amount ? t : max),
    { id: '', amount: 0, item: '無', category: '' }
  );

  // Daily burn rate and projected end of month
  const today = new Date();
  const [activeYear, activeMonthNumber] = activeMonth.split('-').map(Number);
  const daysInActiveMonth = activeYear && activeMonthNumber
    ? new Date(activeYear, activeMonthNumber, 0).getDate()
    : 30;
  const isCurrentActiveMonth = activeMonth === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const elapsedDays = isCurrentActiveMonth ? today.getDate() : daysInActiveMonth;
  const dailyBurn = Math.round(currentTotal / Math.max(elapsedDays, 1));

  const projectedTotal = isCurrentActiveMonth
    ? Math.round(dailyBurn * daysInActiveMonth)
    : currentTotal;

  const paceRatio = sixMonthAvg > 0 ? projectedTotal / sixMonthAvg : 0;
  const paceStatus = paceRatio > 1.1
    ? { label: '高於基準', tone: 'from-rose-600 via-rose-600 to-orange-600', Icon: CircleAlert }
    : paceRatio > 0.9
      ? { label: '接近基準', tone: 'from-amber-500 via-amber-600 to-orange-600', Icon: CircleAlert }
      : { label: '節奏穩定', tone: 'from-teal-600 via-teal-700 to-emerald-700', Icon: CheckCircle2 };

  const visibleSummaries = sortedSummaries.filter(s => !activeMonth || s.month <= activeMonth).slice(-6);
  const sparkTransactions = targetTransactions.slice(0, 10);

  const formatAmount = (num: number) => {
    if (hideAmount) return '••••••';
    return Math.round(num).toLocaleString();
  };

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 min-w-0">
      {/* 1. 當月總支出 (含眼睛切換與波浪 Sparkline) */}
      <div className="fintech-card p-3.5 sm:p-5 relative flex flex-col justify-between overflow-hidden group min-w-0">
        <div>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold tracking-tight flex items-center gap-1.5 text-slate-600">
              {isCurrentActiveMonth ? '本月總支出' : `${activeMonth.slice(5)} 月總支出`}
            </span>
            <button
              onClick={() => setHideAmount(prev => !prev)}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              title={hideAmount ? '顯示金額' : '隱藏金額'}
              aria-label={hideAmount ? '顯示所有金額' : '隱藏所有金額'}
            >
              {hideAmount ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="mt-2.5 flex items-baseline">
            <span className="text-sm font-bold text-slate-400 mr-1.5">NT$</span>
            <span className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
              {formatAmount(currentTotal)}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold flex-wrap">
            {momChangePercent !== null ? (
              <>
                <span
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-bold ${
                    momChangePercent <= 0
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                      : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                  }`}
                >
                  {momChangePercent <= 0 ? (
                    <>
                      <ArrowDownRight className="w-3 h-3" />
                      <span>{Math.abs(momChangePercent)}% 節省</span>
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="w-3 h-3" />
                      <span>+{momChangePercent}% 較上月</span>
                    </>
                  )}
                </span>
                <span className="text-slate-400">前期 NT$ {formatAmount(prevTotal)}</span>
              </>
            ) : (
              <span className="text-slate-400">歷史基準月</span>
            )}
          </div>
        </div>

        {/* 底部迷你 SVG 折線圖 Sparkline */}
        <div className="mt-3 pt-2">
          <svg className="w-full h-7 sm:h-8 text-teal-600/80 overflow-visible" viewBox="0 0 120 28" fill="none" aria-hidden="true">
            <path
              d="M0 20 Q 20 8, 40 18 T 80 10 T 120 12"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="120" cy="12" r="3.5" fill="#0D9488" />
          </svg>
        </div>
      </div>

      {/* 2. 半年均線卡 (含垂直迷你柱狀圖 Sparkline) */}
      <div className="fintech-card p-3.5 sm:p-5 relative flex flex-col justify-between overflow-hidden min-w-0">
        <div>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold text-slate-600">半年平均月支出</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
              基準水位
            </span>
          </div>

          <div className="mt-2.5 flex items-baseline">
            <span className="text-sm font-bold text-slate-400 mr-1.5">NT$</span>
            <span className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
              {formatAmount(sixMonthAvg)}
            </span>
          </div>

          <div className="mt-2 text-[11px] text-slate-500 font-semibold truncate">
            {currentTotal < sixMonthAvg ? (
              <span className="text-teal-700 font-bold flex items-center gap-1 truncate">
                <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">低於半年均線 NT$ {formatAmount(sixMonthAvg - currentTotal)}</span>
              </span>
            ) : (
              <span className="text-amber-700 font-bold flex items-center gap-1 truncate">
                <span className="text-xs">⚠️</span>
                <span className="truncate">高於半年均線 NT$ {formatAmount(currentTotal - sixMonthAvg)}</span>
              </span>
            )}
          </div>
        </div>

        {/* 底部垂直迷你柱狀圖 Sparkline */}
        <div className="mt-3 pt-2 flex items-end gap-1.5 h-8">
          {visibleSummaries.map((s, i) => {
            const max = Math.max(...visibleSummaries.map(x => x.totalExpense)) || 1;
            const heightPct = Math.round((s.totalExpense / max) * 100);
            const isLatest = i === visibleSummaries.length - 1;
            return (
              <div
                key={s.month}
                className={`flex-1 rounded-sm transition-all ${
                  isLatest ? 'bg-teal-600' : 'bg-teal-600/20'
                }`}
                style={{ height: `${Math.max(15, heightPct)}%` }}
                title={`${s.month}: NT$ ${Math.round(s.totalExpense).toLocaleString()}`}
              />
            );
          })}
        </div>
      </div>

      {/* 3. 最高單筆卡 */}
      <div className="fintech-card p-3.5 sm:p-5 relative flex flex-col justify-between overflow-hidden min-w-0">
        <div>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold text-slate-600">最高單筆消費</span>
            {maxExpense.category && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/50">
                {maxExpense.category}
              </span>
            )}
          </div>

          <div className="mt-2.5 flex items-baseline">
            <span className="text-sm font-bold text-slate-400 mr-1.5">NT$</span>
            <span className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight tabular-nums">
              {formatAmount(maxExpense.amount)}
            </span>
          </div>

          <div className="mt-2 text-[11px] text-slate-500 font-semibold truncate">
            {maxExpense.amount > 0 ? (
              <span className="text-slate-700 font-bold truncate block">項目：{maxExpense.item}</span>
            ) : (
              <span className="text-slate-400">目前尚無大額消費</span>
            )}
          </div>
        </div>

        {/* 底部迷你 SVG 琥珀色柱狀 Sparkline */}
        <div className="mt-3 pt-2 flex items-end gap-1.5 h-8">
          {sparkTransactions.map((transaction) => {
            const height = maxExpense.amount > 0 ? Math.max(15, (transaction.amount / maxExpense.amount) * 100) : 15;
            return (
            <div
              key={transaction.id}
              className={`flex-1 rounded-sm transition-colors ${
                transaction.id === maxExpense.id ? 'bg-amber-500' : 'bg-amber-400/25'
              }`}
              style={{ height: `${height}%` }}
            />
          )})}
        </div>
      </div>

      {/* 4. 本月結算推估 / 健康卡 (溫潤暖陽琥珀橘 Fintech 卡) */}
      <div className={`relative rounded-[24px] p-3.5 sm:p-5 flex flex-col justify-between overflow-hidden bg-gradient-to-br ${paceStatus.tone} text-white shadow-lg shadow-slate-900/15 border border-white/20 group transition-all duration-200 hover:shadow-xl min-w-0`}>
        {/* 背景裝飾微光光暈 */}
        <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-orange-700/30 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-100 flex items-center gap-1.5">
              <span>{isCurrentActiveMonth ? '月底推估結算' : '當月實際結算'}</span>
              {isCurrentActiveMonth && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
            </span>
            <div className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center backdrop-blur-sm shadow-sm">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="mt-2.5 flex items-baseline">
            <span className="text-sm font-bold text-amber-200 mr-1.5">NT$</span>
            <span className="text-xl sm:text-3xl font-extrabold text-white tracking-tight tabular-nums drop-shadow-sm">
              {formatAmount(projectedTotal)}
            </span>
          </div>

          <p className="mt-2 text-[11px] text-amber-100 font-medium leading-relaxed">
            {isCurrentActiveMonth ? '目前日均開銷：' : '實際日均開銷：'}<strong className="text-white font-bold">NT$ {dailyBurn.toLocaleString()}/天</strong>
          </p>
        </div>

        {/* 底部圓圈 Check 徽章與狀態 */}
        <div className="relative z-10 mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs">
          <span className="text-amber-100 text-[11px] font-medium">支出節奏狀態</span>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white font-bold text-xs shadow-sm">
            <paceStatus.Icon className="w-3.5 h-3.5 text-white" aria-hidden="true" />
            <span>{paceStatus.label}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
