import Papa from 'papaparse';
import { Transaction, MonthlySummary } from '../types/finance';
import { formatDate, compareTransactionDates } from './dateUtils';
import { normalizeCategory } from '../constants/categories';

export { formatDate };

// Parse transactions CSV
export async function parseTransactionsCSV(csvText: string): Promise<Transaction[]> {
  return new Promise((resolve) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, string>[];
        const transactions: Transaction[] = [];

        rows.forEach((row, index) => {
          // Identify date column: '時間', '日期', ' ', or first key
          const keys = Object.keys(row);
          const dateKey = keys.find(k => k.trim() === '時間' || k.trim() === '日期' || k.trim() === '') || keys[0];
          const itemKey = keys.find(k => k.trim() === '項目' || k.trim() === '說明') || '項目';
          const catKey = keys.find(k => k.trim() === '類別') || '類別';
          const amountKey = keys.find(k => k.trim() === '金額') || '金額';
          const monthKey = keys.find(k => k.trim() === '月份') || '月份';

          const rawDate = row[dateKey] || '';
          const formattedDate = formatDate(rawDate);
          const item = (row[itemKey] || '').trim();
          const category = normalizeCategory(row[catKey]);
          const rawAmount = parseFloat(String(row[amountKey] || '0').replace(/,/g, ''));
          const amount = isNaN(rawAmount) ? 0 : rawAmount;
          
          let month = (row[monthKey] || '').trim();
          if (!month && formattedDate.length >= 7) {
            month = formattedDate.slice(0, 7);
          }

          if (formattedDate && item && amount > 0) {
            transactions.push({
              id: `csv-${index}-${formattedDate}-${amount}`,
              date: formattedDate,
              item,
              category,
              amount,
              month,
            });
          }
        });

        // Default sort by date descending (newest first)
        transactions.sort((a, b) => compareTransactionDates(a.date, b.date, false));
        resolve(transactions);
      },
      error: () => resolve([])
    });
  });
}

// Parse monthly summary CSV
export async function parseMonthlySummaryCSV(csvText: string): Promise<MonthlySummary[]> {
  return new Promise((resolve) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, string>[];
        const summaries: MonthlySummary[] = [];

        rows.forEach((row) => {
          const keys = Object.keys(row);
          const monthKey = keys.find(k => k.includes('月')) || keys[0];
          const expenseKey = keys.find(k => k.includes('支出') || k.includes('金額')) || keys[1];

          let month = (row[monthKey] || '').trim();
          // If month format is e.g. 2026/01 or 2026-01-01
          if (month.length > 7) month = month.slice(0, 7);
          month = month.replace('/', '-');

          const rawExp = parseFloat(String(row[expenseKey] || '0').replace(/,/g, ''));
          const totalExpense = isNaN(rawExp) ? 0 : rawExp;

          if (month && totalExpense >= 0) {
            summaries.push({ month, totalExpense });
          }
        });

        summaries.sort((a, b) => a.month.localeCompare(b.month));
        resolve(summaries);
      },
      error: () => resolve([])
    });
  });
}
