import { TransactionCategory } from '../types/finance';

export const STANDARD_CATEGORIES: readonly TransactionCategory[] = [
  '生活',
  '家用',
  '社交',
  '娛樂',
  '雜支',
] as const;

const LEGACY_CATEGORY_MAP: Record<string, TransactionCategory> = {
  '生存': '生活',
  '交通': '雜支',
};

export function normalizeCategory(raw: unknown): TransactionCategory {
  const value = String(raw ?? '').trim();
  if (LEGACY_CATEGORY_MAP[value]) return LEGACY_CATEGORY_MAP[value];
  if ((STANDARD_CATEGORIES as readonly string[]).includes(value)) {
    return value as TransactionCategory;
  }
  return '雜支';
}
