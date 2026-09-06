import React from 'react';
import { Menu, Calendar, RefreshCw } from 'lucide-react';

interface TopGreetingBarProps {
  selectedMonth: string;
  availableMonths: string[];
  onSelectMonth: (month: string) => void;
  onOpenMobileSidebar: () => void;
  isSyncing: boolean;
  onRefresh: () => void;
}

export const TopGreetingBar: React.FC<TopGreetingBarProps> = ({
  selectedMonth,
  availableMonths,
  onSelectMonth,
  onOpenMobileSidebar,
  isSyncing,
  onRefresh,
}) => {
  // Determine greeting based on current hour
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? '早安' : currentHour < 18 ? '午安' : '晚安';
  const emoji = currentHour < 12 ? '☕' : currentHour < 18 ? '☀️' : '🌙';

  const formatMonthLabel = (m: string) => {
    if (m === 'all') return '全部歷史月份';
    const [y, mo] = m.split('-');
    return `${y} 年 ${parseInt(mo, 10)} 月`;
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-2 w-full min-w-0">
      {/* Left: Greeting & Subtitle */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-2xl bg-white border border-[#ECE7DE] text-slate-700 hover:bg-[#F5F2EB] shadow-sm transition-colors shrink-0"
          aria-label="打開導覽選單"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight truncate">
              {greeting}，理財達人 {emoji}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium truncate">
            今天是管理財務的好日子 · 即時掌握收支節奏
          </p>
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto shrink-0">
        {/* Month Selector Pill */}
        <div className="relative flex-1 sm:flex-initial min-w-0">
          <div className="flex items-center justify-between gap-2 bg-white border border-[#ECE7DE] rounded-2xl px-3 py-2 text-xs font-bold text-slate-800 shadow-sm hover:border-slate-300 transition-colors w-full">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedMonth}
                onChange={(e) => onSelectMonth(e.target.value)}
                className="bg-transparent appearance-none pr-4 outline-none cursor-pointer font-bold text-slate-800 text-xs w-full truncate"
              >
                <option value="all">全部歷史月份</option>
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {formatMonthLabel(m)}
                  </option>
                ))}
              </select>
            </div>
            <span className="pointer-events-none text-[10px] text-slate-400 shrink-0">
              ▼
            </span>
          </div>
        </div>

        {/* Sync button */}
        <button
          onClick={onRefresh}
          disabled={isSyncing}
          className="px-3 py-2 rounded-2xl bg-white border border-[#ECE7DE] hover:bg-slate-50 text-slate-700 shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5 text-xs font-semibold shrink-0"
          title="重新同步 Google 試算表"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
          <span>同步</span>
        </button>
      </div>
    </div>
  );
};
