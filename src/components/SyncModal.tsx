import React, { useState } from 'react';
import { X, ShieldCheck, Link2, Key, CheckCircle2, AlertCircle, Loader2, RotateCcw } from 'lucide-react';
import { GasConfig } from '../types/finance';
import { fetchFromGas } from '../utils/gasApi';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GasConfig;
  onSave: (newConfig: GasConfig) => Promise<boolean>;
  onResetToLocal: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
  onResetToLocal
}) => {
  const [url, setUrl] = useState(config.webAppUrl || '');
  const [token, setToken] = useState(config.secretToken || '');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!url.trim()) {
      setTestResult({ success: false, message: '請輸入 Google Apps Script 網頁應用程式 URL' });
      return;
    }
    setIsTesting(true);
    setTestResult(null);

    const res = await fetchFromGas(url.trim(), token.trim());
    setIsTesting(false);

    if (res.success) {
      const detailCount = res.details?.length || 0;
      const summaryCount = res.summary?.length || 0;
      setTestResult({
        success: true,
        message: `連線成功！已成功擷取 ${detailCount} 筆明細、${summaryCount} 個月份彙總資料。`
      });
    } else {
      setTestResult({
        success: false,
        message: res.message || '連線失敗，請檢查網址或金鑰。'
      });
    }
  };

  const handleSaveAndSync = async () => {
    setIsSaving(true);
    const success = await onSave({
      webAppUrl: url.trim(),
      secretToken: token.trim(),
      lastSyncTime: new Date().toLocaleString('zh-TW')
    });
    setIsSaving(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-[calc(1rem+env(safe-area-inset-bottom,0px))] bg-slate-900/50 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 relative my-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Google 試算表即時連線設定</h3>
            <p className="text-xs text-slate-500">
              連線至您的 Google Apps Script Web App，即時同步 LINE Bot 記帳數據
            </p>
          </div>
        </div>

        {/* Form Inputs */}
        <div className="space-y-4 text-sm">
          {/* Web App URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-teal-600" />
              網頁應用程式 URL (Web App URL)
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setTestResult(null);
              }}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs font-mono transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Secret Token */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-teal-600" />
              專屬防盜密鑰 (API_SECRET_TOKEN)
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                setTestResult(null);
              }}
              placeholder="您在「指令碼屬性」設定的暗號密碼"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs font-mono transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Test connection action */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || !url.trim()}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors disabled:opacity-50"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                  <span>測試連線中...</span>
                </>
              ) : (
                <span>🔍 測試連線</span>
              )}
            </button>
            {config.lastSyncTime && (
              <span className="text-[11px] text-slate-400">上次同步：{config.lastSyncTime}</span>
            )}
          </div>

          {/* Test Result Box */}
          {testResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start space-x-2 ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <p className="leading-relaxed">{testResult.message}</p>
            </div>
          )}

          {/* Security Notice */}
          <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100 flex items-start space-x-2 text-[11px] text-teal-800 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <p>
              <strong>隱私保證：</strong>網址與金鑰僅保存在您本機的瀏覽器內部 (localStorage)，全程透過 HTTPS 直連 Google 伺服器，絕不上傳至任何第三方。
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              onResetToLocal();
              onClose();
            }}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            切換回本機資料
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSaveAndSync}
              disabled={isSaving || !url.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {isSaving ? '同步儲存中...' : '儲存並同步'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
