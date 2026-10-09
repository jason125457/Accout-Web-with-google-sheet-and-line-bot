import React from 'react';
import { Settings } from 'lucide-react';
import { AppTab, NAV_ITEMS } from '../constants/navigation';

interface BottomNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onOpenSettings: () => void;
}

/** Phone/tablet primary navigation (hidden on lg+, where the sidebar takes over). */
export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab, onOpenSettings }) => {
  const itemClass = (active: boolean) =>
    `flex flex-col items-center justify-center gap-0.5 min-h-12 rounded-xl text-[11px] font-bold transition-colors ${
      active ? 'text-primary-strong' : 'text-ink-muted hover:text-ink'
    }`;
  return (
    <nav
      aria-label="主要導覽"
      className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-surface/95 backdrop-blur border-t border-line px-2 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))]"
    >
      <div className="max-w-lg mx-auto grid grid-cols-5">
        {NAV_ITEMS.map(({ tab, short, icon: Icon }) => (
          <button
            key={tab}
            onClick={() => onSelectTab(tab)}
            aria-current={activeTab === tab ? 'page' : undefined}
            className={itemClass(activeTab === tab)}
          >
            <Icon className="w-5 h-5" aria-hidden="true" />
            {short}
          </button>
        ))}
        <button onClick={onOpenSettings} className={itemClass(false)}>
          <Settings className="w-5 h-5" aria-hidden="true" />
          設定
        </button>
      </div>
    </nav>
  );
};
