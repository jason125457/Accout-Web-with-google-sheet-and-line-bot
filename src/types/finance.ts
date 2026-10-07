export type TransactionCategory = '生活' | '家用' | '社交' | '娛樂' | '雜支';

export type DataSource = 'cloud' | 'cache' | 'demo' | 'error';

export interface Transaction {
  id: string;
  date: string;       // YYYY-MM-DD
  item: string;       // 項目說明 (e.g. 午餐 粥 豆漿)
  category: TransactionCategory; // 嚴格限制為五大標準分類
  amount: number;     // 金額
  month: string;      // YYYY-MM
}

export interface MonthlySummary {
  month: string;        // YYYY-MM
  totalExpense: number; // 當月總支出
}

/** User-defined monthly budget per category, from the 「預算設定」 sheet. Missing = not set. */
export type CategoryBudgets = Partial<Record<TransactionCategory, number>>;

export interface CategorySummary {
  category: string;
  totalAmount: number;
  percentage: number;
  count: number;
}

export interface GasConfig {
  webAppUrl: string;
  secretToken: string;
  lastSyncTime?: string;  // display string (zh-TW locale)
  lastSyncAt?: string;    // ISO timestamp of the last successful sync
}

export type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

export interface FilterState {
  selectedMonth: string;              // 'all' 或 '2026-09'
  selectedCategory: string;           // 'all' 或 '生活'
  searchQuery: string;                // 關鍵字搜尋
  onlyBigExpenses: boolean;           // 只看大額 (>= 1,000)
  excludeLargeThreshold: number | null; // 排除非常規大額 (null=不排除, 5000=排除>=5000)
  sortBy: SortOption;                 // 排序
}
