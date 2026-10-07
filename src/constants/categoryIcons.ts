import { ShoppingBag, Home, Users, Film, Receipt, Tag, LucideIcon } from 'lucide-react';

/** One distinct icon per standard category; used by the budget panel and transaction list. */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  '生活': ShoppingBag,
  '家用': Home,
  '社交': Users,
  '娛樂': Film,
  '雜支': Receipt,
};

export const categoryIcon = (category: string): LucideIcon => CATEGORY_ICONS[category] ?? Tag;
