import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { ExpenseCharts } from './components/ExpenseCharts';
import { FilterBar } from './components/FilterBar';
import { TransactionList } from './components/TransactionList';
import { SyncModal } from './components/SyncModal';
import { AddRecordModal } from './components/AddRecordModal';
import { BurnRateCard } from './components/BurnRateCard';
import { InsightsPanel } from './components/InsightsPanel';
import { MonthlyBreakdownPage } from './components/MonthlyBreakdownPage';
import { Transaction, MonthlySummary, GasConfig, FilterState } from './types/finance';
import { fetchFromGas, normalizeMonthString } from './utils/gasApi';
import { DEMO_TRANSACTIONS, DEMO_SUMMARIES } from './utils/demoData';
import { calculateDynamicMonthlySummaries } from './utils/financeCalculations';
import { compareTransactionDates } from './utils/dateUtils';
import {
  getGasConfig,
  saveGasConfig,
  getCustomTransactions,
  saveCustomTransactions,
  deleteCustomTransaction,
  saveCachedData,
  getCachedData
} from './utils/storage';
import { AlertTriangle, CheckCircle2, LayoutDashboard, CalendarDays } from 'lucide-react';

export const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlySummaries, setMonthlySummaries] = useState<MonthlySummary[]>([]);
  const [gasConfig, setGasConfig] = useState<GasConfig>(getGasConfig());
  const [dataSource, setDataSource] = useState<'cloud' | 'local' | 'demo'>('demo');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'warn' | 'error'; text: string } | null>(null);

  // Tab navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'monthly'>('dashboard');

  // Modals
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    selectedMonth: 'all',
    selectedCategory: 'all',
    searchQuery: '',
    onlyBigExpenses: false,
    excludeLargeThreshold: null,
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
      selectedMonth: prev.selectedMonth === month ? 'all' : month
    }));
  };

  // Show auto-dismissing toast with timer cleanup
  const toastTimerRef = useRef<any>(null);
  const showToast = (type: 'success' | 'warn' | 'error', text: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage({ type, text });
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 4000);
  };

  // Load built-in demo data (shown before any GAS connection is configured)
  const loadDemoData = () => {
    const customRecords = getCustomTransactions();
    setTransactions([...customRecords, ...DEMO_TRANSACTIONS]);
    setMonthlySummaries(DEMO_SUMMARIES);
    setDataSource('demo');
  };

  // Initial load
  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      const savedConfig = getGasConfig();

      if (savedConfig.webAppUrl) {
        // Try fetching from Google Apps Script
        const res = await fetchFromGas(savedConfig.webAppUrl, savedConfig.secretToken);
        if (res.success && res.details && res.summary) {
          const customRecords = getCustomTransactions();
          setTransactions([...customRecords, ...res.details]);
          setMonthlySummaries(res.summary);
          setDataSource('cloud');
          saveCachedData({ details: res.details, summary: res.summary });
          showToast('success', `已連線 Google 雲端！成功載入 ${res.details.length} 筆即時資料。`);
          setIsLoading(false);
          return;
        }
      }

      // If no cloud config or cloud fetch failed, try cache → then demo data
      const cache = getCachedData();
      if (cache && cache.details.length > 0) {
        const customRecords = getCustomTransactions();
        // Re-normalize months in case the cache was stored before the normalizer fix
        const cleanDetails = cache.details.map(t => ({
          ...t,
          month: normalizeMonthString(t.month) || (t.date?.slice(0, 7) ?? '')
        }));
        const cleanSummary = cache.summary.map(s => ({
          ...s,
          month: normalizeMonthString(s.month)
        })).filter(s => /^\d{4}-\d{2}$/.test(s.month));
        setTransactions([...customRecords, ...cleanDetails]);
        setMonthlySummaries(cleanSummary);
        setDataSource('cloud'); // cached = previously synced cloud data
      } else {
        loadDemoData();
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
      const customRecords = getCustomTransactions();
      setTransactions([...customRecords, ...res.details]);
      setMonthlySummaries(res.summary);
      setDataSource('cloud');
      const nowStr = new Date().toLocaleString('zh-TW');
      const updatedConfig = { ...gasConfig, lastSyncTime: nowStr };
      setGasConfig(updatedConfig);
      saveGasConfig(updatedConfig);
      saveCachedData({ details: res.details, summary: res.summary });
      showToast('success', `同步成功！已由 Google 雲端更新至最新帳目 (${nowStr})。`);
    } else {
      showToast('error', res.message || '連線 Google 失敗，請確認 Apps Script 部署設定。');
    }
  };

  // Save new GAS Config from Modal
  const handleSaveGasConfig = async (newConfig: GasConfig): Promise<boolean> => {
    setIsSyncing(true);
    const res = await fetchFromGas(newConfig.webAppUrl, newConfig.secretToken);
    setIsSyncing(false);

    if (res.success && res.details && res.summary) {
      const customRecords = getCustomTransactions();
      setTransactions([...customRecords, ...res.details]);
      setMonthlySummaries(res.summary);
      setDataSource('cloud');
      const updated = { ...newConfig, lastSyncTime: new Date().toLocaleString('zh-TW') };
      setGasConfig(updated);
      saveGasConfig(updated);
      saveCachedData({ details: res.details, summary: res.summary });
      showToast('success', 'Google 試算表連線成功！已切換為雲端即時同步。');
      return true;
    } else {
      showToast('error', res.message || '連線失敗，請檢查網址與通關密鑰。');
      return false;
    }
  };

  // Reset to demo mode (disconnect GAS)
  const handleResetToLocal = () => {
    const emptyConfig: GasConfig = { webAppUrl: '', secretToken: '', lastSyncTime: '' };
    setGasConfig(emptyConfig);
    saveGasConfig(emptyConfig);
    loadDemoData();
    showToast('warn', '已中斷 Google 連線，切換回 Demo 示範模式。');
  };

  // Handle Add Record locally
  const handleAddRecord = (record: Transaction) => {
    const updated = [record, ...transactions];
    setTransactions(updated);
    // Persist custom records to localStorage
    const currentCustom = getCustomTransactions();
    saveCustomTransactions([record, ...currentCustom]);
    showToast('success', `已成功新增一筆消費：${record.item} (NT$ ${record.amount})`);
  };

  // Handle Delete Record locally
  const handleDeleteRecord = (id: string) => {
    const target = transactions.find(t => t.id === id);
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    deleteCustomTransaction(id);
    showToast('warn', `已刪除手動記帳：${target?.item || '該筆項目'} (NT$ ${target?.amount || 0})`);
  };

  // Extract available months for filter dropdown
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

  // Filter and Sort transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Month filter
      if (filters.selectedMonth !== 'all' && t.month !== filters.selectedMonth) {
        return false;
      }
      // Category filter
      if (filters.selectedCategory !== 'all' && t.category !== filters.selectedCategory) {
        return false;
      }
      // Big expense filter (>= 1000)
      if (filters.onlyBigExpenses && t.amount < 1000) {
        return false;
      }
      // Exclude large expenses (日常模式)
      if (filters.excludeLargeThreshold !== null && t.amount >= filters.excludeLargeThreshold) {
        return false;
      }
      // Keyword search
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

  // Transactions for charts (apply excludeLargeThreshold but NOT other filters, so charts show full month context)
  const chartTransactions = useMemo(() => {
    if (filters.excludeLargeThreshold === null) return transactions;
    return transactions.filter(t => t.amount < filters.excludeLargeThreshold!);
  }, [transactions, filters.excludeLargeThreshold]);

  // Dynamically compute monthly summaries from chartTransactions to support "日常模式" and manual records
  const dynamicMonthlySummaries = useMemo(() => {
    return calculateDynamicMonthlySummaries(chartTransactions, monthlySummaries);
  }, [chartTransactions, monthlySummaries]);

  // Total filtered amount
  const totalFilteredAmount = useMemo(() => {
    return filteredTransactions.reduce((acc, cur) => acc + cur.amount, 0);
  }, [filteredTransactions]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-5 z-50 animate-bounce-short">
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
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <Header
        gasConfig={gasConfig}
        isSyncing={isSyncing}
        onRefresh={handleRefresh}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        dataSource={dataSource}
      />

      {/* Tab Navigation */}
      <div className="sticky top-16 sm:top-[72px] z-20 bg-white/90 backdrop-blur-sm border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1.5 py-1.5 sm:py-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>📊 儀表板</span>
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'monthly'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>📅 每月花費分析</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {isLoading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-700">正在讀取財務記帳資料...</p>
            <p className="text-xs text-slate-400">正在連接與初始化資料結構</p>
          </div>
        ) : activeTab === 'dashboard' ? (
          <>
            {/* Demo Mode banner */}
            {dataSource === 'demo' && (
              <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start sm:items-center space-x-2.5 text-violet-900">
                  <span className="text-lg leading-none shrink-0">🎭</span>
                  <p>
                    <strong className="font-bold">Demo 示範模式：</strong>
                    目前顯示的是範例假資料，並非您的真實帳目。
                    請點擊右方按鈕連線您的 Google 試算表，即可看到即時真實記帳資料。
                  </p>
                </div>
                <button
                  onClick={() => setIsSyncModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow-sm shrink-0 transition-colors whitespace-nowrap"
                >
                  連線 Google 試算表
                </button>
              </div>
            )}

            {/* 日常模式 banner when active */}
            {filters.excludeLargeThreshold !== null && (
              <div className="bg-slate-900 text-white rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs">
                <span>
                  <strong>🛡️ 日常模式已開啟：</strong>
                  已排除單筆 ≥ NT${filters.excludeLargeThreshold.toLocaleString()} 的大額支出，圖表與指標僅反映日常消費。
                </span>
                <button
                  onClick={() => setFilters(p => ({ ...p, excludeLargeThreshold: null }))}
                  className="ml-4 text-slate-300 hover:text-white font-bold shrink-0"
                >✕ 關閉</button>
              </div>
            )}

            {/* 1. Metric Cards */}
            <MetricCards
              monthlySummaries={dynamicMonthlySummaries}
              transactions={chartTransactions}
              selectedMonth={filters.selectedMonth}
            />

            {/* 2. Burn Rate Card */}
            <BurnRateCard
              transactions={chartTransactions}
              monthlySummaries={dynamicMonthlySummaries}
            />

            {/* 3. Life Insights */}
            <InsightsPanel
              transactions={chartTransactions}
              monthlySummaries={dynamicMonthlySummaries}
            />

            {/* 4. Visual Charts — with drill-down */}
            <ExpenseCharts
              monthlySummaries={dynamicMonthlySummaries}
              transactions={chartTransactions}
              selectedMonth={filters.selectedMonth}
              selectedCategory={filters.selectedCategory}
              onCategoryClick={handleCategoryDrillDown}
              onMonthClick={handleMonthDrillDown}
            />

            {/* 5. Multi-dimensional Filters */}
            <FilterBar
              filters={filters}
              onFilterChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
              availableMonths={availableMonths}
              totalFilteredCount={filteredTransactions.length}
              totalFilteredAmount={totalFilteredAmount}
            />

            {/* 6. Detailed Transaction List */}
            <TransactionList
              transactions={filteredTransactions}
              onDeleteRecord={handleDeleteRecord}
            />
          </>
        ) : (
          /* ── Monthly Breakdown Tab ── */
          <MonthlyBreakdownPage
            transactions={chartTransactions}
            onDeleteRecord={handleDeleteRecord}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-400">
        <p>個人財務儀表板 · LINE Bot + Google Sheets + React & Tailwind CSS</p>
      </footer>

      {/* Modals */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        config={gasConfig}
        onSave={handleSaveGasConfig}
        onResetToLocal={handleResetToLocal}
      />

      <AddRecordModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddRecord={handleAddRecord}
      />
    </div>
  );
};
