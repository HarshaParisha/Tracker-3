import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

import { DashboardView } from '@/views/DashboardView';
import { RoutineView } from '@/views/RoutineView';
import { HealthView } from '@/views/HealthView';
import { LearningView } from '@/views/LearningView';
import { JournalView } from '@/views/JournalView';
import { NutritionView } from '@/views/NutritionView';
import { GroceryView } from '@/views/GroceryView';
import { JobsView } from '@/views/JobsView';
import { ProgressView } from '@/views/ProgressView';
import { SettingsView } from '@/views/SettingsView';

import { getDayNumber } from '@/utils/constants';
import { pullSupabaseToLocal } from '@/lib/supabase';
import { initRoutineScheduler } from '@/services/routineScheduler';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(true);

  const dayNumber = getDayNumber();

  // Initial cloud database sync & routine notification scheduler initialization on startup
  useEffect(() => {
    pullSupabaseToLocal();
    initRoutineScheduler();
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView isDark={isDark} />;
      case 'routine':
        return <RoutineView isDark={isDark} />;
      case 'health':
        return <HealthView isDark={isDark} />;
      case 'learning':
        return <LearningView isDark={isDark} />;
      case 'journal':
        return <JournalView isDark={isDark} />;
      case 'nutrition':
        return <NutritionView isDark={isDark} />;
      case 'grocery':
        return <GroceryView isDark={isDark} />;
      case 'jobs':
        return <JobsView isDark={isDark} />;
      case 'progress':
        return <ProgressView isDark={isDark} />;
      case 'settings':
        return <SettingsView isDark={isDark} />;
      default:
        return <DashboardView isDark={isDark} />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--canvas)] text-[var(--ink)] transition-colors duration-150">
      {/* Sidebar (Desktop Rail / Mobile Slide-Over Drawer) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dayNumber={dayNumber}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Workspace */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        <TopBar
          dayNumber={dayNumber}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebarCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isDark={isDark}
          onToggleTheme={() => setIsDark(!isDark)}
        />

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-8 pb-32 sm:pb-36 lg:pb-8">
          <div key={activeTab} className="mx-auto max-w-7xl animate-view-fade">
            {renderActiveView()}
          </div>
        </main>

        {/* Native Mobile App Bottom Navigation Bar */}
        <MobileBottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenDrawer={() => setMobileSidebarOpen(true)}
        />
      </div>
    </div>
  );
};

export default App;
