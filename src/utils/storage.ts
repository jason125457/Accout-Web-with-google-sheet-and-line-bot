import { GasConfig, Transaction, MonthlySummary } from '../types/finance';
import { formatDate } from './dateUtils';

// Bump this when the data schema changes to auto-clear stale cached data
const CACHE_VERSION = 'v5';

const KEYS = {
  GAS_CONFIG: 'finance_dashboard_gas_config',
  CUSTOM_TRANSACTIONS: 'finance_dashboard_custom_records',
  CACHED_DATA: 'finance_dashboard_cached_data',
  CACHE_VERSION: 'finance_dashboard_cache_version',
};

// Auto-clear old cached data on version bump
(function migrateCacheVersion() {
  try {
    const stored = localStorage.getItem(KEYS.CACHE_VERSION);
    if (stored !== CACHE_VERSION) {
      localStorage.removeItem(KEYS.CACHED_DATA);
      localStorage.setItem(KEYS.CACHE_VERSION, CACHE_VERSION);
    }
  } catch (_) { /* silent */ }
})();

export const getGasConfig = (): GasConfig => {
  try {
    const raw = localStorage.getItem(KEYS.GAS_CONFIG);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse gas config:', e);
  }
  return { webAppUrl: '', secretToken: '', lastSyncTime: '' };
};

export const saveGasConfig = (config: GasConfig): void => {
  try {
    localStorage.setItem(KEYS.GAS_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save gas config:', e);
  }
};

export const getCustomTransactions = (): Transaction[] => {
  try {
    const raw = localStorage.getItem(KEYS.CUSTOM_TRANSACTIONS);
    if (raw) {
      const records: Transaction[] = JSON.parse(raw);
      return records.map(r => ({
        ...r,
        date: formatDate(r.date),
        category: r.category === '生存' ? '生活' : r.category
      }));
    }
  } catch (e) {
    console.error('Failed to load custom transactions:', e);
  }
  return [];
};

export const saveCustomTransactions = (records: Transaction[]): void => {
  try {
    localStorage.setItem(KEYS.CUSTOM_TRANSACTIONS, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save custom transactions:', e);
  }
};

export const deleteCustomTransaction = (id: string): Transaction[] => {
  try {
    const current = getCustomTransactions();
    const updated = current.filter(r => r.id !== id);
    saveCustomTransactions(updated);
    return updated;
  } catch (e) {
    console.error('Failed to delete custom transaction:', e);
  }
  return [];
};

export const getCachedData = (): { details: Transaction[]; summary: MonthlySummary[]; lastUpdated: string } | null => {
  try {
    const raw = localStorage.getItem(KEYS.CACHED_DATA);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.details)) {
        data.details = data.details.map((d: Transaction) => ({
          ...d,
          date: formatDate(d.date),
          category: d.category === '生存' ? '生活' : d.category
        }));
      }
      return data;
    }
  } catch (e) {
    console.error('Failed to load cached data:', e);
  }
  return null;
};

export const saveCachedData = (data: { details: Transaction[]; summary: MonthlySummary[] }): void => {
  try {
    localStorage.setItem(KEYS.CACHED_DATA, JSON.stringify({
      ...data,
      lastUpdated: new Date().toISOString()
    }));
  } catch (e) {
    console.error('Failed to save cached data:', e);
  }
};
