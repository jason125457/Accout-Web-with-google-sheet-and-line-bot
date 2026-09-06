import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Cloud,
  RefreshCw,
  X,
  Wallet
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'dashboard' | 'monthly';
  onSelectTab: (tab: 'dashboard' | 'monthly') => void;
  dataSource: 'cloud' | 'local' | 'demo';
  isSyncing: boolean;
  onRefresh: () => void;
  onOpenSyncModal: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  dataSource,
  isSyncing,
  onRefresh,
  onOpenSyncModal,
  isOpenMobile,
  onCloseMobile,
}) => {
  const content = (
    <div className="flex flex-col h-full bg-[#111A18] text-slate-300 select-none">
      {/* 1. Brand Logo */}
      <div className="px-6 pt-[max(1.75rem,calc(env(safe-area-inset-top,0px)+1.25rem))] pb-6 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#E5A93C] to-[#B87C1E] flex items-center justify-center text-[#111A18] shadow-md shadow-black/20">
            <Wallet className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
              <span>記帳本</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-emerald-400 font-semibold tracking-normal">
                PRO
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">個人財務智慧管理</p>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Main Navigation Menu */}
      <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-2">
          分析與視圖
        </div>

        {/* 總覽儀表板 */}
        <button
          onClick={() => {
            onSelectTab('dashboard');
            onCloseMobile();
          }}
          className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'dashboard'
              ? 'bg-gradient-to-r from-[#E5A93C] to-[#D4982E] text-[#111A18] shadow-lg shadow-[#E5A93C]/20'
              : 'text-slate-300 hover:bg-white/5 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          <span className="flex-1 text-left">總覽儀表板</span>
        </button>

        {/* 每月花費分析 */}
        <button
          onClick={() => {
            onSelectTab('monthly');
            onCloseMobile();
          }}
          className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'monthly'
              ? 'bg-gradient-to-r from-[#E5A93C] to-[#D4982E] text-[#111A18] shadow-lg shadow-[#E5A93C]/20'
              : 'text-slate-300 hover:bg-white/5 hover:text-white'
          }`}
        >
          <CalendarDays className="w-4 h-4 shrink-0" />
          <span className="flex-1 text-left">每月花費分析</span>
        </button>

        <div className="pt-5 pb-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-2">
            系統與設定
          </div>
        </div>

        {/* 雲端同步設定 */}
        <button
          onClick={() => {
            onOpenSyncModal();
            onCloseMobile();
          }}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
        >
          <Cloud className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="flex-1 text-left">雲端連線設定</span>
          {dataSource === 'cloud' && (
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          )}
        </button>
      </div>

      {/* 3. Bottom Cloud Status Card */}
      <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] border-t border-white/5">
        <div className="bg-[#182622] rounded-2xl p-3.5 border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  dataSource === 'cloud'
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]'
                    : 'bg-amber-400'
                }`}
              />
              <span className="text-xs font-bold text-white">
                {dataSource === 'cloud' ? 'Google 試算表' : 'Demo 示範模式'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              {dataSource === 'cloud' ? '即時' : '唯讀'}
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            {dataSource === 'cloud'
              ? '已與 LINE Bot 記帳庫雙向連線'
              : '目前為擬真假資料，隨時可綁定'}
          </p>

          <button
            onClick={onRefresh}
            disabled={isSyncing}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isSyncing ? '同步更新中...' : '即時同步更新'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed Left) */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-30 shadow-xl shadow-black/10">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full shadow-2xl z-10 animate-slide-right">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
