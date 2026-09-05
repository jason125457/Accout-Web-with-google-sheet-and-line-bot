import React, { useMemo } from 'react';
import { Lightbulb } from 'lucide-react';
import { Transaction, MonthlySummary } from '../types/finance';
import { calculateSixMonthAverage } from '../utils/financeCalculations';

interface InsightsPanelProps {
  transactions: Transaction[];
  monthlySummaries: MonthlySummary[];
}

interface Insight {
  emoji: string;
  text: string;
  color: 'teal' | 'amber' | 'rose' | 'indigo' | 'slate';
}

function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr).getDay(); // 0=Sun, 6=Sat
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ transactions, monthlySummaries }) => {
  const insights = useMemo((): Insight[] => {
    if (transactions.length === 0) return [];
    const results: Insight[] = [];

    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const allMonths = [...new Set(transactions.map(t => t.month).filter(Boolean))].sort();
    const isOngoing = allMonths.includes(currentMonthStr);
    const effectiveMonth = isOngoing ? currentMonthStr : (allMonths[allMonths.length - 1] ?? currentMonthStr);

    const [effYear, effMonth] = effectiveMonth.split('-').map(Number);
    const prevDate = new Date(effYear, effMonth - 2, 1);
    const effectivePrevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = isOngoing ? '本月' : `${parseInt(effectiveMonth.slice(5, 7))} 月`;

    const currentTxns = transactions.filter(t => t.month === effectiveMonth);
    const lastTxns = transactions.filter(t => t.month === effectivePrevMonth);

    // ── Insight 1: Category MoM change ──────────────────────────
    if (currentTxns.length > 0 && lastTxns.length > 0) {
      const currentByCategory: Record<string, number> = {};
      currentTxns.forEach(t => { currentByCategory[t.category] = (currentByCategory[t.category] || 0) + t.amount; });
      const lastByCategory: Record<string, number> = {};
      lastTxns.forEach(t => { lastByCategory[t.category] = (lastByCategory[t.category] || 0) + t.amount; });

      // Find biggest MoM increase
      let biggestIncreaseCat = '';
      let biggestIncreasePct = 0;
      Object.entries(currentByCategory).forEach(([cat, amt]) => {
        const prev = lastByCategory[cat] || 0;
        if (prev > 0) {
          const pct = ((amt - prev) / prev) * 100;
          if (pct > biggestIncreasePct) { biggestIncreasePct = pct; biggestIncreaseCat = cat; }
        }
      });
      if (biggestIncreaseCat && biggestIncreasePct > 20) {
        const amt = Math.round(currentByCategory[biggestIncreaseCat]).toLocaleString();
        results.push({
          emoji: '📈',
          text: `${monthLabel}「${biggestIncreaseCat}」支出 NT$${amt}，較前期增加 ${Math.round(biggestIncreasePct)}%，可留意一下。`,
          color: 'amber'
        });
      }

      // Find biggest MoM decrease (saving)
      let biggestDecreaseCat = '';
      let biggestDecreasePct = 0;
      Object.entries(lastByCategory).forEach(([cat, prev]) => {
        const curr = currentByCategory[cat] || 0;
        if (prev > 0 && curr > 0) {
          const pct = ((prev - curr) / prev) * 100;
          if (pct > biggestDecreasePct) { biggestDecreasePct = pct; biggestDecreaseCat = cat; }
        }
      });
      if (biggestDecreaseCat && biggestDecreasePct > 20) {
        results.push({
          emoji: '💚',
          text: `${monthLabel}「${biggestDecreaseCat}」支出較前期節省了 ${Math.round(biggestDecreasePct)}%，控制得不錯！`,
          color: 'teal'
        });
      }
    }

    // ── Insight 2: Weekend vs weekday spending ──────────────────
    const recentTxns = transactions.filter(t => {
      const d = new Date(t.date);
      const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      return d >= threeMonthsAgo;
    });

    if (recentTxns.length >= 10) {
      const weekendTotal = recentTxns.filter(t => { const d = getDayOfWeek(t.date); return d === 0 || d === 6; })
        .reduce((acc, t) => acc + t.amount, 0);
      const weekdayTotal = recentTxns.filter(t => { const d = getDayOfWeek(t.date); return d >= 1 && d <= 5; })
        .reduce((acc, t) => acc + t.amount, 0);

      const weekendDays = recentTxns
        .filter(t => { const d = getDayOfWeek(t.date); return d === 0 || d === 6; }).length;
      const weekdayDays = recentTxns
        .filter(t => { const d = getDayOfWeek(t.date); return d >= 1 && d <= 5; }).length;

      if (weekendDays > 0 && weekdayDays > 0) {
        const weekendAvg = weekendTotal / weekendDays;
        const weekdayAvg = weekdayTotal / weekdayDays;
        const ratio = weekendAvg / weekdayAvg;

        if (ratio > 1.5) {
          results.push({
            emoji: '🎉',
            text: `週末平均花費是平日的 ${ratio.toFixed(1)} 倍！週末的休閒消費佔大宗，注意假日荷包。`,
            color: 'indigo'
          });
        } else if (ratio < 0.7) {
          results.push({
            emoji: '💼',
            text: `平日花費比週末多 ${((1 / ratio - 1) * 100).toFixed(0)}%，看來通勤與工作日開銷才是大頭。`,
            color: 'indigo'
          });
        }
      }

      // Most expensive day of week
      const dayTotals: number[] = [0, 0, 0, 0, 0, 0, 0];
      const dayNames = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
      recentTxns.forEach(t => { dayTotals[getDayOfWeek(t.date)] += t.amount; });
      const maxDayIdx = dayTotals.indexOf(Math.max(...dayTotals));
      if (dayTotals[maxDayIdx] > 0) {
        results.push({
          emoji: '📅',
          text: `近 3 個月中，「${dayNames[maxDayIdx]}」是你花最多錢的一天，累積消費 NT$${Math.round(dayTotals[maxDayIdx]).toLocaleString()}。`,
          color: 'slate'
        });
      }
    }

    // ── Insight 3: Burn rate vs average ─────────────────────────
    if (currentTxns.length > 0 && monthlySummaries.length >= 2) {
      const daysPassed = today.getDate();
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      const currentTotal = currentTxns.reduce((acc, t) => acc + t.amount, 0);
      const projectedTotal = isOngoing ? (currentTotal / daysPassed) * daysInMonth : currentTotal;

      const avgMonthly = calculateSixMonthAverage(monthlySummaries, currentMonthStr);

      if (avgMonthly > 0) {
        const pct = ((projectedTotal - avgMonthly) / avgMonthly) * 100;
        if (pct > 15) {
          results.push({
            emoji: '⚠️',
            text: isOngoing
              ? `依目前燒錢速度，本月預估花費 NT$${Math.round(projectedTotal).toLocaleString()}，超出半年均值 ${Math.round(pct)}%，請留意預算。`
              : `${monthLabel}支出 NT$${Math.round(currentTotal).toLocaleString()}，超出半年均值 ${Math.round(pct)}%。`,
            color: 'rose'
          });
        } else if (pct < -15) {
          results.push({
            emoji: '🎯',
            text: isOngoing
              ? `本月花費軌道很健康！預估結算 NT$${Math.round(projectedTotal).toLocaleString()}，低於半年均值 ${Math.round(Math.abs(pct))}%。`
              : `${monthLabel}支出控制得宜！低於半年均值 ${Math.round(Math.abs(pct))}%。`,
            color: 'teal'
          });
        }
      }
    }

    // ── Insight 4: Largest single category this month ───────────
    if (currentTxns.length > 0) {
      const catMap: Record<string, number> = {};
      const total = currentTxns.reduce((acc, t) => {
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
        return acc + t.amount;
      }, 0);
      const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
      if (topCat && total > 0) {
        const pct = Math.round((topCat[1] / total) * 100);
        if (pct >= 35) {
          results.push({
            emoji: '🏆',
            text: `${monthLabel}最大開銷類別是「${topCat[0]}」，佔總支出 ${pct}%（NT$${Math.round(topCat[1]).toLocaleString()}）。`,
            color: 'indigo'
          });
        }
      }
    }

    return results.slice(0, 4); // max 4 insights
  }, [transactions, monthlySummaries]);

  if (insights.length === 0) return null;

  const colorMap = {
    teal:   'bg-teal-50/80 border-teal-200/60 text-teal-800',
    amber:  'bg-amber-50/80 border-amber-200/60 text-amber-900',
    rose:   'bg-rose-50/80 border-rose-200/60 text-rose-900',
    indigo: 'bg-indigo-50/80 border-indigo-200/60 text-indigo-900',
    slate:  'bg-slate-50/80 border-slate-200/60 text-slate-800',
  };

  return (
    <div className="fintech-card p-5 sm:p-6">
      <div className="flex items-center space-x-2.5 mb-4">
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <Lightbulb className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">消費生活洞察</h3>
          <p className="text-xs text-slate-400">由你的記帳數據自動分析，不需 AI</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {insights.map((ins, i) => (
          <div key={i} className={`rounded-2xl px-4 py-3 border text-xs font-medium leading-relaxed ${colorMap[ins.color]}`}>
            <span className="mr-1.5 text-sm">{ins.emoji}</span>
            {ins.text}
          </div>
        ))}
      </div>
    </div>
  );
};
