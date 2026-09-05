import { Transaction, MonthlySummary } from '../types/finance';
import { formatDate, compareTransactionDates } from './dateUtils';

/**
 * Converts any month-like raw value to a clean "YYYY-MM" string.
 * Handles: ISO timestamps, YYYY/MM, YYYY-MM-DD, Excel serial numbers (already converted), etc.
 */
export function normalizeMonthString(raw: unknown): string {
  if (raw == null) return '';
  let s = String(raw).trim();
  if (!s || s === '0') return '';

  // 1. ISO datetime / UTC timestamp: e.g. "2026-08-31T16:00:00.000Z" (which is 2026-09-01 00:00:00 GMT+8)
  // Must parse with Date to convert from UTC to local user timezone (avoid shifting backward 1 month!)
  if (s.includes('T') || s.endsWith('Z')) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${year}-${month}`;
    }
  }

  // 2. Excel serial date number: e.g. 46266.0 (2026-09-01) or 46235.0 (2026-08-01)
  const num = typeof raw === 'number' ? raw : parseFloat(s);
  if (!isNaN(num) && num > 35000 && num < 65000 && !s.includes('-') && !s.includes('/')) {
    const ms = Math.round((num - 25569) * 86400 * 1000);
    const d = new Date(ms);
    const local = new Date(ms + d.getTimezoneOffset() * 60000);
    const year = local.getFullYear();
    const month = String(local.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  // 3. YYYY/MM or YYYY-MM
  s = s.replace(/\//g, '-');
  const match = s.match(/^(\d{4})-(\d{1,2})/);
  if (match) {
    return `${match[1]}-${match[2].padStart(2, '0')}`;
  }

  return '';
}

export interface GasFetchResult {
  success: boolean;
  message?: string;
  details?: Transaction[];
  summary?: MonthlySummary[];
  updatedAt?: string;
}

// Convert 2D array or object array from GAS into standard Transaction[]
export function normalizeGasDetails(rawDetails: any[]): Transaction[] {
  if (!Array.isArray(rawDetails) || rawDetails.length === 0) return [];

  const transactions: Transaction[] = [];

  // Check if first row is header array
  if (Array.isArray(rawDetails[0])) {
    const headerRow = rawDetails[0].map((h: any) => String(h).trim());
    const dateIdx = headerRow.findIndex((h: string) => h === '時間' || h === '日期' || h === '');
    const itemIdx = headerRow.findIndex((h: string) => h === '項目' || h === '說明');
    const catIdx = headerRow.findIndex((h: string) => h === '類別');
    const amtIdx = headerRow.findIndex((h: string) => h === '金額');
    const monthIdx = headerRow.findIndex((h: string) => h === '月份');

    for (let i = 1; i < rawDetails.length; i++) {
      const row = rawDetails[i];
      if (!Array.isArray(row) || row.length === 0) continue;

      const rawDate = String(row[dateIdx >= 0 ? dateIdx : 0] || '');
      const formattedDate = formatDate(rawDate);
      const item = String(row[itemIdx >= 0 ? itemIdx : 1] || '').trim();
      const rawCat = String(row[catIdx >= 0 ? catIdx : 2] || '生活').trim();
      const category = rawCat === '生存' ? '生活' : (rawCat || '生活');
      const rawAmt = parseFloat(String(row[amtIdx >= 0 ? amtIdx : 3] || '0'));
      const amount = isNaN(rawAmt) ? 0 : rawAmt;
      let month = normalizeMonthString(row[monthIdx >= 0 ? monthIdx : 4]);
      if (!month && formattedDate.length >= 7) month = formattedDate.slice(0, 7);

      if (formattedDate && item && amount > 0) {
        transactions.push({
          id: `gas-${i}-${formattedDate}-${amount}`,
          date: formattedDate,
          item,
          category,
          amount,
          month
        });
      }
    }
  } else {
    // Array of objects
    rawDetails.forEach((row, i) => {
      const rawDate = row['時間'] || row['日期'] || row['date'] || '';
      const formattedDate = formatDate(rawDate);
      const item = String(row['項目'] || row['說明'] || row['item'] || '').trim();
      const rawCat = String(row['類別'] || row['category'] || '生活').trim();
      const category = rawCat === '生存' ? '生活' : (rawCat || '生活');
      const rawAmt = parseFloat(String(row['金額'] || row['amount'] || '0'));
      const amount = isNaN(rawAmt) ? 0 : rawAmt;
      let month = normalizeMonthString(row['月份'] || row['month'] || '');
      if (!month && formattedDate.length >= 7) month = formattedDate.slice(0, 7);

      if (formattedDate && item && amount > 0) {
        transactions.push({
          id: `gas-${i}-${formattedDate}-${amount}`,
          date: formattedDate,
          item,
          category,
          amount,
          month
        });
      }
    });
  }

  transactions.sort((a, b) => compareTransactionDates(a.date, b.date, false));
  return transactions;
}

// Convert 2D array or object array from GAS into MonthlySummary[]
export function normalizeGasSummary(rawSummary: any[]): MonthlySummary[] {
  if (!Array.isArray(rawSummary) || rawSummary.length === 0) return [];

  const summaries: MonthlySummary[] = [];

  if (Array.isArray(rawSummary[0])) {
    const headerRow = rawSummary[0].map((h: any) => String(h).trim());
    const monthIdx = headerRow.findIndex((h: string) => h.includes('月'));
    const expIdx = headerRow.findIndex((h: string) => h.includes('支出') || h.includes('金額'));

    for (let i = 1; i < rawSummary.length; i++) {
      const row = rawSummary[i];
      if (!Array.isArray(row) || row.length === 0) continue;

      let month = normalizeMonthString(row[monthIdx >= 0 ? monthIdx : 0]);

      const rawExp = parseFloat(String(row[expIdx >= 0 ? expIdx : 1] || '0'));
      const totalExpense = isNaN(rawExp) ? 0 : rawExp;

      if (month && totalExpense >= 0) {
        summaries.push({ month, totalExpense });
      }
    }
  } else {
    rawSummary.forEach((row) => {
      const month = normalizeMonthString(row['月份'] || row['month'] || '');
      const rawExp = parseFloat(String(row['總支出'] || row['totalExpense'] || '0'));
      const totalExpense = isNaN(rawExp) ? 0 : rawExp;

      if (month && totalExpense >= 0) {
        summaries.push({ month, totalExpense });
      }
    });
  }

  summaries.sort((a, b) => a.month.localeCompare(b.month));
  return summaries;
}

// Fetch from Google Apps Script Web App
export async function fetchFromGas(webAppUrl: string, secretToken: string): Promise<GasFetchResult> {
  if (!webAppUrl) {
    return { success: false, message: '請輸入 Google Apps Script 網頁應用程式 URL' };
  }

  try {
    const cleanUrl = webAppUrl.trim();
    const urlObj = new URL(cleanUrl);
    if (secretToken) {
      urlObj.searchParams.set('token', secretToken.trim());
    }

    const response = await fetch(urlObj.toString(), {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 403) {
        return { success: false, message: '403 Forbidden: 密鑰 Token 錯誤，請檢查專屬密鑰' };
      }
      return { success: false, message: `伺服器回應錯誤 (HTTP ${response.status})` };
    }

    const data = await response.json();

    if (data.status === 'error') {
      return { success: false, message: data.message || 'Google Apps Script 回傳錯誤' };
    }

    const details = normalizeGasDetails(data.details || []);
    const summary = normalizeGasSummary(data.summary || []);

    return {
      success: true,
      details,
      summary,
      updatedAt: data.updatedAt || new Date().toISOString()
    };
  } catch (error: any) {
    console.error('GAS fetch error:', error);
    return {
      success: false,
      message: `連線失敗: ${error.message || '請確認網路狀態及網址是否正確'}`
    };
  }
}
