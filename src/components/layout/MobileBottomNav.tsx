import React from 'react';
import { LayoutDashboard, Clock, HeartPulse, BookOpen, Menu } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenDrawer: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = React.memo(({
  activeTab,
  setActiveTab,
  onOpenDrawer,
}) => {
  const quickTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'routine', label: 'Routine', icon: Clock },
    { id: 'health', label: 'Health', icon: HeartPulse },
    { id: 'learning', label: 'Learning', icon: BookOpen },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-[var(--hairline)] bg-[var(--surface-soft)]/95 backdrop-blur-md px-2 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-colors duration-150 lg:hidden shadow-lg">
      {quickTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 flex-col items-center justify-center py-1 transition-all min-h-[44px] ${
              isActive ? 'text-[#ff4d8b] font-bold' : 'text-[var(--text-muted)] hover:text-[var(--ink)]'
            }`}
          >
            <Icon className={`h-5 w-5 ${isActive ? 'scale-110 text-[#ff4d8b]' : ''} transition-transform`} />
            <span className="text-[10px] font-semibold tracking-tight mt-0.5">{tab.label}</span>
          </button>
        );
      })}

      {/* More / All Modules Drawer Button */}
      <button
        onClick={onOpenDrawer}
        className="flex flex-1 flex-col items-center justify-center py-1 text-[var(--text-muted)] hover:text-[var(--ink)] transition-all min-h-[44px]"
      >
        <Menu className="h-5 w-5" />
        <span className="text-[10px] font-semibold tracking-tight mt-0.5">More</span>
      </button>
    </div>
  );
});

MobileBottomNav.displayName = 'MobileBottomNav';
