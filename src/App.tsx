import React, { useState, useEffect, useMemo, useRef, Suspense, lazy } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopGreetingBar } from './components/TopGreetingBar';
import { MetricCards } from './components/MetricCards';
import { MonthOverviewCard } from './components/MonthOverviewCard';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { MonthCumulativeChart } from './components/MonthCumulativeChart';
import { ExpenseCharts } from './components/ExpenseCharts';
import { TransactionList } from './components/TransactionList';
import { BudgetProgressPanel } from './components/BudgetProgressPanel';
import { SyncModal } from './components/SyncModal';
import { Transaction, MonthlySummary, GasConfig, FilterState, DataSource, CategoryBudgets, IrregularExpense } from './types/finance';
import { fetchFromGas, normalizeMonthString } from './utils/gasApi';
import { DEMO_TRANSACTIONS, DEMO_SUMMARIES, DEMO_IRREGULAR } from './utils/demoData';
import { calculateDynamicMonthlySummaries, getCurrentMonthString } from './utils/financeCalculations';
import { compareTransactionDates } from './utils/dateUtils';
import {
  getGasConfig,
  saveGasConfig,
  saveCachedData,
  getCachedData
} from './utils/storage';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

const MonthlyBreakdownPage = lazy(() =>
  import('./components/MonthlyBreakdownPage').then(m => ({ default: m.MonthlyBreakdownPage }))
);

export const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlySummaries, setMonthlySummaries] = useState<MonthlySummary[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudgets>({});
  const [irregular, setIrregular] = useState<IrregularExpense[]>([]);
  const [gasConfig, setGasConfig] = useState<GasConfig>(getGasConfig());
  const [dataSource, setDataSource] = useState<DataSource>('demo');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'warn' | 'error'; text: string } | null>(null);

  // Tab navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'monthly'>('dashboard');

  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Filters & Sorting state
  const [filters, setFilters] = useState<FilterState>({
    selectedMonth: '',
    selectedCategory: 'all',
    searchQuery: '',
    onlyBigExpenses: false,
    sortBy: 'date-desc'
  });

  // Drill-down handlers (from chart clicks)
  const handleCategoryDrillDown = (category: string) => {
    setFilters(prev => ({
      ...prev,
      selectedCategory: prev.selectedCategory === category ? 'all' : category
    }));
  };

  const handleMonthDrillDown = (month: string) => {
    setFilters(prev => ({
      ...prev,
      selectedMonth: prev.selectedMonth === month ? '' : month
    }));
  };

  // Toast notification helper
  const toastTimerRef = useRef<any>(null);
  const showToast = (type: 'success' | 'warn' | 'error', text: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage({ type, text });
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 4000);
  };

  const selectDefaultMonth = (details: Transaction[], summaries: MonthlySummary[]) => {
    const months = new Set<string>();
    details.forEach(item => item.month && months.add(item.month));
    summaries.forEach(item => item.month && months.add(item.month));
    const sortedMonths = Array.from(months).sort((a, b) => b.localeCompare(a));
    if (sortedMonths.length === 0) return;
    setFilters(prev => {
      if (sortedMonths.includes(prev.selectedMonth)) return prev;
      const currentMonth = getCurrentMonthString();
      return {
        ...prev,
        selectedMonth: sortedMonths.includes(currentMonth) ? currentMonth : sortedMonths[0],
      };
    });
  };

  // Load demo data
  const loadDemoData = () => {
    const details = [...DEMO_TRANSACTIONS];
    setTransactions(details);
    setMonthlySummaries(DEMO_SUMMARIES);
    setBudgets({});
    setIrregular(DEMO_IRREGULAR);
    selectDefaultMonth(details, DEMO_SUMMARIES);
    setDataSource('demo');
  };

  // Applies a successful GAS response to state, cache and config. Returns the sync time string.
  const applyCloudData = (
    details: Transaction[],
    summary: MonthlySummary[],
    newBudgets: CategoryBudgets,
    newIrregular: IrregularExpense[],
    config: GasConfig
  ): string => {
    setTransactions(details);
    setMonthlySummaries(summary);
    selectDefaultMonth(details, summary);
    setDataSource('cloud');
    setSyncError(null);
    setBudgets(newBudgets);
    setIrregular(newIrregular);
    saveCachedData({ details, summary, budgets: newBudgets, irregular: newIrregular });
    const nowStr = new Date().toLocaleString('zh-TW');
    const updatedConfig = { ...config, lastSyncTime: nowStr, lastSyncAt: new Date().toISOString() };
    setGasConfig(updatedConfig);
    saveGasConfig(updatedConfig);
    return nowStr;
  };

  // Initial load: render cached data immediately, then refresh from GAS in the background.
  useEffect(() => {
    const initData = async () => {
      const savedConfig = getGasConfig();
      const cache = getCachedData();
      const hasCache = !!cache && cache.details.length > 0;

      if (hasCache) {
        const cleanDetails = cache.details.map(t => ({
          ...t,
          month: normalizeMonthString(t.month) || (t.date?.slice(0, 7) ?? '')
        }));
        const cleanSummary = cache.summary.map(s => ({
          ...s,
          month: normalizeMonthString(s.month)
        })).filter(s => /^\d{4}-\d{2}$/.test(s.month));
        const details = cleanDetails;
        setTransactions(details);
        setMonthlySummaries(cleanSummary);
        setBudgets(cache.budgets ?? {});
        setIrregular(cache.irregular ?? []);
        selectDefaultMonth(details, cleanSummary);
        setDataSource('cache');
        setIsLoading(false);
      }

      if (!savedConfig.webAppUrl) {
        if (!hasCache) loadDemoData();
        setIsLoading(false);
        return;
      }

      setIsSyncing(true);
      const res = await fetchFromGas(savedConfig.webAppUrl, savedConfig.secretToken);
      setIsSyncing(false);

      if (res.success && res.details && res.summary) {
        applyCloudData(res.details, res.summary, res.budgets ?? {}, res.irregular ?? [], savedConfig);
      } else {
        const message = res.message || '無法連線 Google 試算表。';
        if (!hasCache) {
          loadDemoData();
          setDataSource('error');
        }
        setSyncError(message);
      }
      setIsLoading(false);
    };

    initData();
  }, []);

  // Handle Manual Refresh / Sync
  const handleRefresh = async () => {
    if (!gasConfig.webAppUrl) {
      setIsSyncModalOpen(true);
      return;
    }

    setIsSyncing(true);
    const res = await fetchFromGas(gasConfig.webAppUrl, gasConfig.secretToken);
    setIsSyncing(false);

    if (res.success && res.details && res.summary) {
      const nowStr = applyCloudData(res.details, res.summary, res.budgets ?? {}, res.irregular ?? [], gasConfig);
      showToast('success', `同步成功！已由 Google 雲端更新至最新資料 (${nowStr})。`);
    } else {
      const message = res.message || '連線 Google 失敗，請確認 Apps Script 部署。';
      setSyncError(message);
      setDataSource(dataSource === 'demo' ? 'error' : 'cache');
      showToast('error', message);
    }
  };

  // Save new GAS Config from Modal
  const handleSaveGasConfig = async (newConfig: GasConfig): Promise<boolean> => {
    setIsSyncing(true);
    const res = await fetchFromGas(newConfig.webAppUrl, newConfig.secretToken);
    setIsSyncing(false);

    if (res.success && res.details && res.summary) {
      applyCloudData(res.details, res.summary, res.budgets ?? {}, res.irregular ?? [], newConfig);
      showToast('success', 'Google 試算表連線成功！已載入最新雲端資料。');
      return true;
    } else {
      showToast('error', res.message || '連線失敗，請檢查網址與 Token。');
      return false;
    }
  };

  // Reset to demo mode
  const handleResetToLocal = () => {
    const emptyConfig: GasConfig = { webAppUrl: '', secretToken: '', lastSyncTime: '' };
    setGasConfig(emptyConfig);
    saveGasConfig(emptyConfig);
    loadDemoData();
    setSyncError(null);
    showToast('warn', '已中斷 Google 連線，切換回 Demo 示範模式。');
  };

  // Available months for filter dropdown
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    transactions.forEach(t => {
      const m = normalizeMonthString(t.month) || t.date?.slice(0, 7);
      if (m && /^\d{4}-\d{2}$/.test(m)) monthSet.add(m);
    });
    monthlySummaries.forEach(s => {
      const m = normalizeMonthString(s.month);
      if (m && /^\d{4}-\d{2}$/.test(m)) monthSet.add(m);
    });
    return Array.from(monthSet).sort((a, b) => b.localeCompare(a));
  }, [transactions, monthlySummaries]);

  // The dashboard always has one explicit analysis month. Trend range is controlled separately.
  useEffect(() => {
    if (availableMonths.length === 0) return;
    setFilters(prev => {
      if (!prev.selectedMonth || availableMonths.includes(prev.selectedMonth)) return prev;
      const currentMonth = getCurrentMonthString();
      const fallbackMonth = availableMonths.includes(currentMonth) ? currentMonth : availableMonths[0];
      return { ...prev, selectedMonth: fallbackMonth };
    });
  }, [availableMonths]);

  // Filtered transactions for list view (supporting keyword, category, big expenses, and sorting)
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (filters.selectedMonth && t.month !== filters.selectedMonth) {
        return false;
      }
      if (filters.selectedCategory !== 'all' && t.category !== filters.selectedCategory) {
        return false;
      }
      if (filters.onlyBigExpenses && t.amount < 1000) {
        return false;
      }
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.trim().toLowerCase();
        const matchItem = t.item.toLowerCase().includes(query);
        const matchCategory = t.category.toLowerCase().includes(query);
        const matchAmount = String(t.amount).includes(query);
        if (!matchItem && !matchCategory && !matchAmount) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      switch (filters.sortBy) {
        case 'date-asc':
          return compareTransactionDates(a.date, b.date, true);
        case 'amount-desc':
          return b.amount - a.amount;
        case 'amount-asc':
          return a.amount - b.amount;
        case 'date-desc':
        default:
          return compareTransactionDates(a.date, b.date, false);
      }
    });
  }, [transactions, filters]);

  // Dynamic monthly summaries
  const dynamicMonthlySummaries = useMemo(() => {
    return calculateDynamicMonthlySummaries(transactions, monthlySummaries);
  }, [transactions, monthlySummaries]);

  return (
    <div className="min-h-screen bg-canvas text-slate-900 flex overflow-x-hidden w-full max-w-[100vw] relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-[max(1.25rem,calc(env(safe-area-inset-top,0px)+0.75rem))] right-3.5 sm:right-5 z-50 animate-bounce-short max-w-[90vw]">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center space-x-2 text-xs font-semibold ${
              toastMessage.type === 'success'
                ? 'bg-teal-900 text-teal-50 border-teal-700'
                : toastMessage.type === 'warn'
                ? 'bg-amber-900 text-amber-50 border-amber-700'
                : 'bg-rose-900 text-rose-50 border-rose-700'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span className="truncate">{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        dataSource={dataSource}
        isSyncing={isSyncing}
        onRefresh={handleRefresh}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        lastSyncTime={gasConfig.lastSyncTime}
        lastSyncAt={gasConfig.lastSyncAt}
        syncError={syncError}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. Right Main Content Area */}
      <div className="flex-1 min-w-0 w-full lg:pl-64 flex flex-col min-h-screen overflow-x-hidden">
        <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 pt-[max(3rem,env(safe-area-inset-top,0px))] pb-6 sm:py-6 space-y-4 sm:space-y-6 min-w-0 overflow-x-hidden">
          {/* Top Greeting & Month Selector */}
          <TopGreetingBar
            selectedMonth={filters.selectedMonth}
            availableMonths={availableMonths}
            onSelectMonth={(m) => setFilters(prev => ({ ...prev, selectedMonth: m }))}
            onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
            isSyncing={isSyncing}
            onRefresh={handleRefresh}
            showMonthSelector={activeTab === 'dashboard'}
            dataSource={dataSource}
            lastSyncAt={gasConfig.lastSyncAt}
            lastSyncTime={gasConfig.lastSyncTime}
            syncError={syncError}
          />

          {isLoading ? (
            <DashboardSkeleton />
          ) : activeTab === 'dashboard' ? (
            <>
              {/* Demo Mode Alert Banner */}
              {dataSource === 'demo' && (
                <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start sm:items-center space-x-2.5 text-violet-900">
                    <Info className="w-4 h-4 mt-0.5 sm:mt-0 shrink-0" aria-hidden="true" />
                    <p>
                      <strong className="font-bold">Demo 示範模式：</strong>
                      目前顯示的是擬真範例資料。請在左側點擊「雲端連線設定」綁定您的 Google 試算表，即可查看最新記帳資料。
                    </p>
                  </div>
                  <button
                    onClick={() => setIsSyncModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow-sm shrink-0 transition-colors whitespace-nowrap self-start sm:self-auto"
                  >
                    連線 Google 試算表
                  </button>
                </div>
              )}

              {((dataSource === 'cache' && syncError) || dataSource === 'error') && (
                <div className={`rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border ${
                  dataSource === 'cache'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`} role="status">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                    <div>
                      <p className="font-bold">
                        {dataSource === 'cache' ? '目前顯示上次同步資料' : 'Google 試算表連線失敗'}
                      </p>
                      <p className="mt-0.5 opacity-80">
                        {syncError || '資料可能不是最新，請重新同步。'}
                        {gasConfig.lastSyncTime ? ` 上次成功同步：${gasConfig.lastSyncTime}` : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRefresh}
                    disabled={isSyncing}
                    className="min-h-11 sm:min-h-0 px-3.5 py-2 rounded-xl font-bold bg-white/80 hover:bg-white border border-current/10 shrink-0 disabled:opacity-50"
                  >
                    {isSyncing ? '重新連線中…' : '重新同步'}
                  </button>
                </div>
              )}

              {/* 手機首屏：本月已花 / 預算剩餘 / 最近記帳 */}
              <div className="sm:hidden">
                <MonthOverviewCard
                  transactions={transactions}
                  monthlySummaries={dynamicMonthlySummaries}
                  selectedMonth={filters.selectedMonth}
                  budgets={budgets}
                  onViewAll={() => document.getElementById('transactions')?.scrollIntoView({
                    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
                    block: 'start',
                  })}
                />
              </div>

              {/* Row 1: 4 大核心 KPI 指標卡 (3 淺 + 1 深反差卡) */}
              <MetricCards
                monthlySummaries={dynamicMonthlySummaries}
                transactions={transactions}
                selectedMonth={filters.selectedMonth}
              />

              {/* Row 2: 中層雙圖表佈局 (月度收支走勢 7 欄 : 分類甜甜圈 + 垂直佔比 5 欄) */}
              <ExpenseCharts
                monthlySummaries={dynamicMonthlySummaries}
                transactions={transactions}
                selectedMonth={filters.selectedMonth}
                selectedCategory={filters.selectedCategory}
                onCategoryClick={handleCategoryDrillDown}
                onMonthClick={handleMonthDrillDown}
              />

              {/* 本月每日累計支出走勢（對照上月同期與預算進度） */}
              <MonthCumulativeChart
                transactions={transactions}
                monthlySummaries={dynamicMonthlySummaries}
                selectedMonth={filters.selectedMonth}
                budgets={budgets}
              />

              {/* Row 3: 下層雙分欄佈局 (近期交易 7 欄 : 預算進度與生活洞察 5 欄) */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6 min-w-0">
                {/* 左側 7 欄：近期交易明細清單 (支援時間/金額排序、大額過濾、關鍵字搜尋) */}
                <div id="transactions" className="xl:col-span-7 min-w-0 scroll-mt-4">
                  <TransactionList
                    transactions={filteredTransactions}
                    selectedMonth={filters.selectedMonth}
                    onClearMonth={() => setFilters(prev => ({ ...prev, selectedMonth: '' }))}
                    selectedCategory={filters.selectedCategory}
                    onCategoryChange={(cat) => setFilters(prev => ({ ...prev, selectedCategory: cat }))}
                    searchQuery={filters.searchQuery}
                    onSearchChange={(q) => setFilters(prev => ({ ...prev, searchQuery: q }))}
                    sortBy={filters.sortBy}
                    onSortChange={(sort) => setFilters(prev => ({ ...prev, sortBy: sort as any }))}
                    onlyBigExpenses={filters.onlyBigExpenses}
                    onToggleBigExpenses={() => setFilters(prev => ({ ...prev, onlyBigExpenses: !prev.onlyBigExpenses }))}
                  />
                </div>

                {/* 右側 5 欄：類別預算進度條 + 深色生活洞察金句卡 */}
                <div className="xl:col-span-5 min-w-0">
                  <BudgetProgressPanel
                    transactions={transactions}
                    monthlySummaries={dynamicMonthlySummaries}
                    selectedMonth={filters.selectedMonth}
                    budgets={budgets}
                  />
                </div>
              </div>
            </>
          ) : (
            /* ── 每月花費分析獨立分頁 ── */
            <Suspense fallback={<div className="py-32 text-center text-sm text-slate-400">載入中…</div>}>
              <MonthlyBreakdownPage
                transactions={transactions}
                irregular={irregular}
              />
            </Suspense>
          )}
        </main>

        {/* Minimal Footer with iOS Safe Area */}
        <footer className="border-t border-line bg-white/60 py-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] text-center text-xs text-slate-400">
          <p>個人財務管理儀表板 · LINE Bot + Google Sheets + React & Tailwind</p>
        </footer>
      </div>

      {/* Modals */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        config={gasConfig}
        onSave={handleSaveGasConfig}
        onResetToLocal={handleResetToLocal}
      />
    </div>
  );
};
