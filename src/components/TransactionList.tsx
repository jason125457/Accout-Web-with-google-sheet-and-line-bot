import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Inbox, Sparkles, Trash2 } from 'lucide-react';
import { Transaction } from '../types/finance';

interface TransactionListProps {
  transactions: Transaction[];
  onDeleteRecord?: (id: string) => void;
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  '生活': { bg: 'bg-teal-50', text: 'text-teal-800', dot: 'bg-teal-600' },
  '雜支': { bg: 'bg-slate-100', text: 'text-slate-800', dot: 'bg-slate-500' },
  '娛樂': { bg: 'bg-amber-50', text: 'text-amber-800', dot: 'bg-amber-500' },
  '家用': { bg: 'bg-blue-50', text: 'text-blue-800', dot: 'bg-blue-600' },
  '社交': { bg: 'bg-pink-50', text: 'text-pink-800', dot: 'bg-pink-500' },
};

const DEFAULT_STYLE = { bg: 'bg-indigo-50', text: 'text-indigo-800', dot: 'bg-indigo-500' };

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDeleteRecord }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const totalPages = Math.ceil(transactions.length / pageSize) || 1;
  const currentSafePage = Math.min(currentPage, totalPages);
  const startIndex = (currentSafePage - 1) * pageSize;
  const currentRecords = transactions.slice(startIndex, startIndex + pageSize);

  const formatNTD = (val: number) => `NT$ ${Math.round(val).toLocaleString()}`;

  return (
    <div className="fintech-card overflow-hidden">
      {/* Table Header / Title */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>記帳明細列表</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 tabular-nums">
              {transactions.length} 筆
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">即時記錄與分類消費帳目明細</p>
        </div>
      </div>

      {/* Table Content */}
      {currentRecords.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-6">消費時間</th>
                <th className="py-3.5 px-6">分類</th>
                <th className="py-3.5 px-6">消費項目說明</th>
                <th className="py-3.5 px-6 text-right">支出金額</th>
                {onDeleteRecord && <th className="py-3.5 px-4 text-center w-14">操作</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentRecords.map((t) => {
                const style = CATEGORY_STYLES[t.category] || DEFAULT_STYLE;
                const isBig = t.amount >= 1000;

                return (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-default"
                  >
                    {/* Date */}
                    <td className="py-4 px-6 text-slate-500 font-mono text-xs whitespace-nowrap font-medium">
                      {t.date}
                    </td>

                    {/* Category Pill */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                        {t.category}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="py-4 px-6 font-semibold text-slate-800">
                      <span>{t.item}</span>
                      {t.isCustom && (
                        <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full font-bold border border-teal-200/50">
                          <Sparkles className="w-2.5 h-2.5" />
                          手動新增
                        </span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {isBig && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold tracking-tight">
                            大額
                          </span>
                        )}
                        <span
                          className={`font-extrabold tracking-tight tabular-nums text-sm ${
                            isBig ? 'text-amber-600 font-black' : 'text-slate-900'
                          }`}
                        >
                          -{formatNTD(t.amount)}
                        </span>
                      </div>
                    </td>

                    {/* Action */}
                    {onDeleteRecord && (
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        {t.isCustom ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`確定要刪除手動記帳「${t.item} (NT$ ${t.amount})」嗎？`)) {
                                onDeleteRecord(t.id);
                              }
                            }}
                            title="刪除此筆手動新增記帳"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all active:scale-90 inline-flex items-center justify-center"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-slate-300 text-xs select-none">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-20 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <Inbox className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-700">未找到符合條件的明細</p>
          <p className="text-xs text-slate-400">請嘗試清除篩選條件或切換為其他月份</p>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between">
          <p className="text-xs text-slate-400 font-medium">
            顯示第 <span className="font-bold text-slate-700">{startIndex + 1}</span> 至{' '}
            <span className="font-bold text-slate-700">{Math.min(startIndex + pageSize, transactions.length)}</span> 筆
            （共 <span className="font-bold text-slate-700">{transactions.length}</span> 筆）
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentSafePage === 1}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white disabled:opacity-30 transition-all flex items-center gap-1 active:scale-95"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              上一頁
            </button>
            <span className="text-xs font-bold px-2 text-slate-800 tabular-nums">
              {currentSafePage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentSafePage === totalPages}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white disabled:opacity-30 transition-all flex items-center gap-1 active:scale-95"
            >
              下一頁
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
