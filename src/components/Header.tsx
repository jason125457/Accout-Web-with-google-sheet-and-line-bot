import React from 'react';
import { WalletCards, RefreshCw, Settings, PlusCircle, Sparkles } from 'lucide-react';
import { GasConfig } from '../types/finance';

interface HeaderProps {
  gasConfig: GasConfig;
  isSyncing: boolean;
  onRefresh: () => void;
  onOpenSyncModal: () => void;
  onOpenAddModal: () => void;
  dataSource: 'cloud' | 'local' | 'demo';
}

export const Header: React.FC<HeaderProps> = ({
  gasConfig,
  isSyncing,
  onRefresh,
  onOpenSyncModal,
  onOpenAddModal,
  dataSource
}) => {
  const isCloudActive = Boolean(gasConfig.webAppUrl && dataSource === 'cloud');
  const isDemoMode = dataSource === 'demo';

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/70 transition-all h-16 sm:h-[72px]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-900 via-teal-900 to-teal-700 flex items-center justify-center text-white shadow-md shadow-teal-900/15 border border-white/20 shrink-0">
              <WalletCards className="w-4 h-4 sm:w-5 sm:h-5 text-teal-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight truncate">
                  個人財務儀表板
                </h1>
                <span className="hidden md:inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-700 border border-teal-500/20 items-center gap-1 shrink-0">
                  <Sparkles className="w-2.5 h-2.5" />
                  Fintech UI
                </span>
              </div>
              <p className="hidden sm:block text-xs text-slate-500 font-medium truncate">
                LINE Bot · Gemini 2.5 Flash · 即時雲端數據連動
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
            {/* Live Connection Beacon */}
            <div
              onClick={onOpenSyncModal}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full text-xs font-semibold border cursor-pointer transition-all active:scale-95 ${
                isCloudActive
                  ? 'bg-emerald-500/10 text-emerald-800 border-emerald-500/25 hover:bg-emerald-500/15'
                  : isDemoMode
                  ? 'bg-violet-100/80 text-violet-800 border-violet-300/60 hover:bg-violet-100'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/80'
              }`}
              title="點擊設定或測試 Google Apps Script 雲端連線"
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isCloudActive ? 'bg-emerald-500 live-beacon' : isDemoMode ? 'bg-violet-400' : 'bg-slate-400'
                }`}
              />
              <span className="hidden sm:inline">
                {isCloudActive ? 'Google 雲端連線' : isDemoMode ? '🎭 Demo 模式' : '離線模式'}
              </span>
              <span className="sm:hidden text-[11px]">
                {isCloudActive ? '雲端' : isDemoMode ? 'Demo' : '離線'}
              </span>
            </div>

            {/* Sync / Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isSyncing}
              className="inline-flex items-center justify-center p-1.5 sm:px-3 sm:py-2 text-xs font-semibold rounded-xl text-teal-800 bg-teal-50 hover:bg-teal-100/80 border border-teal-200/80 transition-all active:scale-95 disabled:opacity-50 shrink-0"
              title="立即從 Google 試算表同步最新帳目"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-teal-600' : 'text-teal-700'}`} />
              <span className="hidden sm:inline sm:ml-1.5">{isSyncing ? '同步中' : '即時同步'}</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSyncModal}
              className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all active:scale-95 shrink-0"
              title="Google Apps Script 連線與金鑰設定"
            >
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Add Record Button */}
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center justify-center space-x-1 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs font-semibold rounded-xl text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition-all active:scale-95 shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>記一筆</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
