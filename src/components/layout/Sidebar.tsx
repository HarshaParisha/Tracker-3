import React from 'react';
import {
  LayoutDashboard,
  Clock,
  HeartPulse,
  BookOpen,
  PenTool,
  Utensils,
  ShoppingCart,
  Briefcase,
  Activity,
  Settings,
  Download,
  Upload,
  PanelLeftClose,
  PanelLeft,
  X,
  LogOut,
} from 'lucide-react';
import { db } from '@/db/database';
import { authService } from '@/services/authService';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  dayNumber: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = React.memo(({
  activeTab,
  setActiveTab,
  isOpenMobile,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'routine', label: 'Routine', icon: Clock },
    { id: 'health', label: 'Health & Workout', icon: HeartPulse },
    { id: 'learning', label: 'Learning & Skill', icon: BookOpen },
    { id: 'journal', label: 'Daily Journal', icon: PenTool },
    { id: 'nutrition', label: 'Nutrition Plan', icon: Utensils },
    { id: 'grocery', label: 'Grocery Checklist', icon: ShoppingCart },
    { id: 'jobs', label: 'Job Applications', icon: Briefcase },
    { id: 'progress', label: '3-Month Progress', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = () => {
    if (confirm('Lock application and log out?')) {
      authService.logout();
    }
  };

  const handleExport = async () => {
    const dailyRecords = await db.dailyRecords.toArray();
    const learningRecords = await db.learningRecords.toArray();
    const journalEntries = await db.journalEntries.toArray();
    const jobApplications = await db.jobApplications.toArray();
    const customGroceryItems = await db.customGroceryItems.toArray();

    const data = {
      exportDate: new Date().toISOString(),
      dailyRecords,
      learningRecords,
      journalEntries,
      jobApplications,
      customGroceryItems,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.dailyRecords) await db.dailyRecords.bulkPut(data.dailyRecords);
        if (data.learningRecords) await db.learningRecords.bulkPut(data.learningRecords);
        if (data.journalEntries) await db.journalEntries.bulkPut(data.journalEntries);
        if (data.jobApplications) await db.jobApplications.bulkPut(data.jobApplications);
        if (data.customGroceryItems) await db.customGroceryItems.bulkPut(data.customGroceryItems);

        window.location.reload();
      } catch {
        alert('Failed to import backup JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. DESKTOP SIDEBAR (Strictly Desktop lg:flex, hidden on Mobile)          */}
      {/* ========================================================================= */}
      <aside
        className={`hidden lg:flex lg:flex-col lg:justify-between shrink-0 h-screen border-r border-[var(--hairline)] bg-[var(--surface-soft)] p-3 transition-all duration-200 gpu-accelerated ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div>
          {/* Header */}
          <div className="mb-6 flex items-center justify-between border-b border-[var(--hairline)] pb-4">
            {!isCollapsed ? (
              <>
                <div>
                  <h1 className="font-['Space_Grotesk'] text-xl font-extrabold tracking-tight text-[var(--ink)]">
                    Tracker<span className="text-[#ff4d8b]">.</span>
                  </h1>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">90-DAY TRANSFORMATION</p>
                </div>
                <button
                  onClick={onToggleCollapse}
                  title="Collapse to Icon Rail"
                  className="flex items-center justify-center rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-card)] hover:text-[var(--ink)] transition"
                >
                  <PanelLeftClose className="h-5 w-5" />
                </button>
              </>
            ) : (
              <button
                onClick={onToggleCollapse}
                title="Expand Sidebar"
                className="mx-auto flex items-center justify-center rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-card)] hover:text-[var(--ink)] transition"
              >
                <PanelLeft className="h-5 w-5 text-[#ff4d8b]" />
              </button>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              if (isCollapsed) {
                return (
                  <button
                    key={item.id}
                    title={item.label}
                    onClick={() => setActiveTab(item.id)}
                    className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                      isActive
                        ? 'bg-[#ff4d8b] text-white shadow-sm font-bold'
                        : 'text-[var(--text-muted)] hover:bg-[var(--surface-card)] hover:text-[var(--ink)]'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center gap-3 rounded-full px-3.5 py-2.5 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#ff4d8b] text-white shadow-sm font-bold'
                      : 'text-[var(--text-body)] hover:bg-[var(--surface-card)] hover:text-[var(--ink)]'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-[var(--text-muted)]'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Storage Actions */}
        {!isCollapsed ? (
          <div className="border-t border-[var(--hairline)] pt-4 space-y-2">
            <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono mb-1">
              <span>STORAGE</span>
              <span className="font-bold text-[#a4d4c5]">LOCAL INDEXEDDB</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExport}
                className="flex items-center justify-center gap-1.5 rounded-full border border-[var(--hairline)] bg-[var(--canvas)] px-3 py-1.5 text-[11px] font-semibold text-[var(--ink)] hover:bg-[var(--surface-card)] transition"
              >
                <Download className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                <span>Export</span>
              </button>
              <label className="flex items-center justify-center gap-1.5 rounded-full border border-[var(--hairline)] bg-[var(--canvas)] px-3 py-1.5 text-[11px] font-semibold text-[var(--ink)] hover:bg-[var(--surface-card)] transition cursor-pointer">
                <Upload className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                <span>Import</span>
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] font-bold text-red-400 hover:bg-red-500/20 hover:text-red-300 transition mt-1"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Lock &amp; Logout</span>
            </button>
          </div>
        ) : (
          <div className="border-t border-[var(--hairline)] pt-3 flex flex-col items-center gap-2">
            <button
              onClick={handleExport}
              title="Export Backup JSON"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--hairline)] bg-[var(--canvas)] text-[var(--text-muted)] hover:text-[var(--ink)] transition"
            >
              <Download className="h-4 w-4" />
            </button>
            {/* Collapsed Logout Icon */}
            <button
              onClick={handleLogout}
              title="Lock & Logout"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </aside>

      {/* ========================================================================= */}
      {/* 2. MOBILE OVERLAY DRAWER (Strictly Mobile lg:hidden)                       */}
      {/* ========================================================================= */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-80 max-w-[85vw] border-r border-[var(--hairline)] bg-[var(--surface-soft)] p-4 shadow-2xl transition-transform duration-200 lg:hidden ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col justify-between pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
          <div>
            {/* Mobile Header */}
            <div className="mb-6 flex items-center justify-between border-b border-[var(--hairline)] pb-4">
              <div>
                <h1 className="font-['Space_Grotesk'] text-xl font-extrabold tracking-tight text-[var(--ink)]">
                  Tracker<span className="text-[#ff4d8b]">.</span>
                </h1>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">90-DAY TRANSFORMATION</p>
              </div>
              <button
                onClick={onCloseMobile}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-card)] text-[var(--ink)] hover:opacity-80 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile Navigation Items */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      onCloseMobile();
                    }}
                    className={`flex w-full items-center gap-3 rounded-full px-3.5 py-3 text-xs font-semibold transition-all min-h-[44px] ${
                      isActive
                        ? 'bg-[#ff4d8b] text-white shadow-sm font-bold'
                        : 'text-[var(--text-body)] hover:bg-[var(--surface-card)] hover:text-[var(--ink)]'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-[var(--text-muted)]'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Mobile Footer Storage Actions */}
          <div className="border-t border-[var(--hairline)] pt-4 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono mb-1">
              <span>STORAGE</span>
              <span className="font-bold text-[#a4d4c5]">LOCAL INDEXEDDB</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExport}
                className="flex items-center justify-center gap-1.5 rounded-full border border-[var(--hairline)] bg-[var(--canvas)] px-3 py-2 text-[11px] font-semibold text-[var(--ink)] hover:bg-[var(--surface-card)] transition min-h-[40px]"
              >
                <Download className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                <span>Export</span>
              </button>
              <label className="flex items-center justify-center gap-1.5 rounded-full border border-[var(--hairline)] bg-[var(--canvas)] px-3 py-2 text-[11px] font-semibold text-[var(--ink)] hover:bg-[var(--surface-card)] transition cursor-pointer min-h-[40px]">
                <Upload className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                <span>Import</span>
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
            </div>

            {/* Mobile Logout Button */}
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-[12px] font-bold text-red-400 hover:bg-red-500/20 hover:text-red-300 transition min-h-[44px]"
            >
              <LogOut className="h-4 w-4" />
              <span>Lock &amp; Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
});

Sidebar.displayName = 'Sidebar';
