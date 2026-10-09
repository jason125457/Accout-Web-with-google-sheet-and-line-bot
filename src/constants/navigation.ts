import { LayoutDashboard, CalendarDays, Sparkles, BarChart3, LucideIcon } from 'lucide-react';

export type AppTab = 'dashboard' | 'calendar' | 'review' | 'monthly';

/** Single source for the desktop sidebar and the mobile bottom nav. */
export const NAV_ITEMS: { tab: AppTab; label: string; short: string; icon: LucideIcon }[] = [
  { tab: 'dashboard', label: '總覽儀表板', short: '總覽', icon: LayoutDashboard },
  { tab: 'calendar', label: '消費月曆', short: '月曆', icon: CalendarDays },
  { tab: 'review', label: '月度回顧', short: '回顧', icon: Sparkles },
  { tab: 'monthly', label: '每月花費分析', short: '分析', icon: BarChart3 },
];
