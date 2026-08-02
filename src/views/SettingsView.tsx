import React, { useState } from 'react';
import { db } from '@/db/database';
import { Card } from '@/components/common/Card';
import { getStartDate, setStartDate, getDayNumber, getTodayKey } from '@/utils/constants';
import { notificationService } from '@/services/notificationService';
import { Calendar, Volume2, Bell, RefreshCw, CheckCircle2, Trash2 } from 'lucide-react';

interface SettingsViewProps {
  isDark?: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = () => {
  const [startDateInput, setStartDateInput] = useState(getStartDate());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [wipeSuccess, setWipeSuccess] = useState(false);
  const currentDayNum = getDayNumber();

  const handleSaveStartDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDateInput) return;
    setStartDate(startDateInput);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleRestartTracker = () => {
    if (confirm('Are you sure you want to restart your 90-Day Transformation starting today?')) {
      const today = getTodayKey();
      setStartDate(today);
      setStartDateInput(today);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  const handleWipeAllData = async () => {
    if (confirm('⚠️ WARNING: This will permanently erase ALL logged data (routines, water, learning, journals, job applications, custom groceries) and reset your tracker. Are you sure?')) {
      await Promise.all([
        db.dailyRecords.clear(),
        db.learningRecords.clear(),
        db.journalEntries.clear(),
        db.jobApplications.clear(),
        db.customGroceryItems.clear(),
      ]);

      const today = getTodayKey();
      setStartDate(today);
      setStartDateInput(today);

      setWipeSuccess(true);
      setTimeout(() => {
        setWipeSuccess(false);
        window.location.reload();
      }, 1500);
    }
  };

  const handleAudioTest = () => {
    notificationService.playChime();
  };

  const handleNotifPermission = async () => {
    const granted = await notificationService.requestPermission();
    if (granted) {
      notificationService.sendNotification('Alert Test', 'Notifications & Chime audio are configured properly.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="font-['Space_Grotesk'] text-3xl font-extrabold tracking-tight text-[var(--ink)]">Tracker Settings</h2>
        <p className="text-sm font-semibold text-[var(--text-muted)] font-medium">Configure 3-Month Start Date, Routine Alarms & Data Management</p>
      </div>

      {/* Start Date Configuration */}
      <Card title="Transformation Schedule & Start Date" subtitle="Set your official Day 1 date to calculate 90-day progress" color="cream">
        <form onSubmit={handleSaveStartDate} className="space-y-4 pt-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-[var(--ink)] uppercase tracking-wider mb-1.5">
                Transformation Start Date (Day 1)
              </label>
              <div className="relative flex items-center">
                <Calendar className="absolute left-3 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
                <input
                  type="date"
                  required
                  value={startDateInput}
                  onChange={(e) => setStartDateInput(e.target.value)}
                  className="w-full rounded-xl border border-[var(--hairline)] bg-[var(--canvas)] pl-10 pr-4 py-2.5 text-xs font-bold text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
                />
              </div>
            </div>

            <div className="sm:pt-5 flex items-center gap-2">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-full bg-[#ff4d8b] px-6 py-2.5 text-xs font-bold text-white hover:opacity-90 transition shadow-sm min-h-[44px]"
              >
                <CheckCircle2 className="h-4 w-4 text-white" />
                <span>{saveSuccess ? 'Saved ✓' : 'Save Start Date'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-[var(--hairline)] bg-[var(--canvas)] p-3 text-xs font-medium">
            <span className="text-[var(--text-muted)]">Current Progress Status:</span>
            <span className="font-mono font-bold text-[var(--ink)]">
              Day {currentDayNum} of 90 • (Started {getStartDate()})
            </span>
          </div>
        </form>
      </Card>

      {/* Tracker Reset & Data Management */}
      <Card title="Tracker Reset & Data Management" subtitle="Manage transformation cycle and local IndexedDB database" color="cream">
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-4">
            <div>
              <span className="block font-bold text-xs text-[var(--ink)]">Restart Transformation Cycle</span>
              <p className="text-xs text-[var(--text-muted)] max-w-md">
                Restarts your 90-day progress cycle starting today ({getTodayKey()}) while preserving history.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRestartTracker}
              className="flex items-center gap-2 rounded-full border border-[var(--hairline)] bg-[var(--canvas)] px-4 py-2 text-xs font-bold text-[var(--ink)] hover:bg-[var(--surface-soft)] transition shrink-0 min-h-[44px]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Restart Today</span>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="block font-bold text-xs text-[#ef4444]">Wipe All Data & Start Fresh</span>
              <p className="text-xs text-[var(--text-muted)] max-w-md">
                Permanently erases all routines, journals, health logs, job applications, and grocery checklists from your local device.
              </p>
            </div>
            <button
              type="button"
              onClick={handleWipeAllData}
              className="flex items-center gap-2 rounded-full bg-[#ef4444] px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition shrink-0 shadow-sm min-h-[44px]"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{wipeSuccess ? 'Wiped ✓' : 'Wipe All Data'}</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Sound & Alert Preferences */}
      <Card title="Audio & Alarm Diagnostics" subtitle="Test alert chime volume and browser notifications" color="cream">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
          <div className="flex items-center justify-between rounded-xl border border-[var(--hairline)] bg-[var(--canvas)] p-3.5">
            <div>
              <span className="block font-bold text-xs text-[var(--ink)]">Audio Chime Test</span>
              <span className="text-[11px] text-[var(--text-muted)]">Boosted Web Audio chime sound</span>
            </div>
            <button
              onClick={handleAudioTest}
              className="flex items-center gap-1.5 rounded-full border border-[var(--hairline)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-bold text-[var(--ink)] hover:bg-[var(--surface-card)] transition min-h-[40px]"
            >
              <Volume2 className="h-4 w-4 text-[var(--text-muted)]" />
              <span>Test Chime</span>
            </button>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-[var(--hairline)] bg-[var(--canvas)] p-3.5">
            <div>
              <span className="block font-bold text-xs text-[var(--ink)]">Browser Notifications</span>
              <span className="text-[11px] text-[var(--text-muted)]">Water break & routine alerts</span>
            </div>
            <button
              onClick={handleNotifPermission}
              className="flex items-center gap-1.5 rounded-full bg-[#ff4d8b] px-3.5 py-2 text-xs font-bold text-white hover:opacity-90 transition shadow-sm min-h-[40px]"
            >
              <Bell className="h-3.5 w-3.5 text-white" />
              <span>Request</span>
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};
