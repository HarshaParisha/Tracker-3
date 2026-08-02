import React, { useState } from 'react';
import { Menu, Bell, BellCheck, Volume2, Calendar, Moon, Sun, LogOut } from 'lucide-react';
import { notificationService } from '@/services/notificationService';
import { authService } from '@/services/authService';

interface TopBarProps {
  dayNumber: number;
  onToggleMobileSidebar: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebarCollapse: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const TopBar: React.FC<TopBarProps> = React.memo(({
  dayNumber,
  onToggleMobileSidebar,
  isDark,
  onToggleTheme,
}) => {
  const [notifGranted, setNotifGranted] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  const handleNotifClick = async () => {
    const granted = await notificationService.requestPermission();
    setNotifGranted(granted);
    if (granted) {
      notificationService.sendNotification('Alert System Active', 'Routine and hydration reminders operational.');
    }
  };

  const handleAudioTest = () => {
    notificationService.playChime();
  };

  const handleLogout = () => {
    if (confirm('Lock application and log out?')) {
      authService.logout();
    }
  };

  const todayString = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="flex flex-col justify-center border-b border-[var(--hairline)] bg-[var(--surface-soft)] px-3 sm:px-4 lg:px-6 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 transition-colors duration-150 shrink-0">
      <div className="flex h-12 items-center justify-between gap-2">
        {/* Left Side: Mobile Hamburger & Date Badge */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMobileSidebar}
            aria-label="Open navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-body)] hover:bg-[var(--surface-card)] lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--ink)]">
            <Calendar className="h-3.5 w-3.5 text-[#ff4d8b] shrink-0" />
            <span className="truncate max-w-[100px] sm:max-w-none">{todayString}</span>
            <span className="text-[var(--text-muted)]">•</span>
            <span className="font-mono text-[11px] font-bold text-[#ff4d8b] whitespace-nowrap">Day {dayNumber} of 90</span>
          </div>
        </div>

        {/* Right Side: Theme, Chime, Alerts & Logout */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            className="flex h-8 items-center gap-1 rounded-full border border-[var(--hairline)] bg-[var(--canvas)] px-2.5 text-xs font-bold text-[var(--ink)] hover:bg-[var(--surface-card)] transition"
          >
            {isDark ? <Sun className="h-3.5 w-3.5 text-[#e8b94a]" /> : <Moon className="h-3.5 w-3.5 text-[#b8a4ed]" />}
            <span className="hidden sm:inline">{isDark ? 'Clay Light' : 'Clay Dark'}</span>
          </button>

          <button
            onClick={handleAudioTest}
            title="Test audio chime"
            className="hidden sm:flex h-8 items-center gap-1.5 rounded-full border border-[var(--hairline)] bg-[var(--canvas)] px-3 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--surface-card)] transition"
          >
            <Volume2 className="h-3.5 w-3.5 text-[var(--text-muted)]" />
            <span>Audio Chime</span>
          </button>

          <button
            onClick={handleNotifClick}
            className={`flex h-8 items-center gap-1.5 rounded-full border px-2.5 sm:px-3.5 text-xs font-bold transition ${
              notifGranted
                ? 'border-[#ff4d8b] bg-[#ff4d8b] text-white'
                : 'border-[var(--hairline)] bg-[var(--canvas)] text-[var(--ink)] hover:bg-[var(--surface-card)]'
            }`}
          >
            {notifGranted ? <BellCheck className="h-3.5 w-3.5 text-white" /> : <Bell className="h-3.5 w-3.5 text-[#ff4d8b]" />}
            <span className="hidden sm:inline">{notifGranted ? 'Reminders Active' : 'Enable Alerts'}</span>
          </button>

          {/* Secure Logout Button */}
          <button
            onClick={handleLogout}
            title="Lock application & Logout"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
});

TopBar.displayName = 'TopBar';
