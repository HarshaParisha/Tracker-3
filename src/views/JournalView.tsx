import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type JournalEntry } from '@/db/database';
import { getTodayKey, getStartDate } from '@/utils/constants';
import { syncJournalEntryToSupabase } from '@/lib/supabase';
import { toPng } from 'html-to-image';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Save,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  CheckCircle2,
  Download,
} from 'lucide-react';

interface JournalViewProps {
  isDark?: boolean;
}

const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const JournalView: React.FC<JournalViewProps> = ({ isDark = true }) => {
  const todayKey = getTodayKey();
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);
  const [paperStyle, setPaperStyle] = useState<'lined' | 'blank'>(() => {
    return (localStorage.getItem('tracker_journal_paper_style') as 'lined' | 'blank') || 'lined';
  });

  const journalEntry = useLiveQuery(
    () => db.journalEntries.get(selectedDate),
    [selectedDate]
  );

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const isInitialMount = useRef(true);
  const exportRef = useRef<HTMLDivElement>(null);

  // Synchronize state when selectedDate changes or database entry loads
  useEffect(() => {
    if (journalEntry) {
      setTitle(journalEntry.title || '');
      if (journalEntry.content !== undefined) {
        setContent(journalEntry.content || '');
      } else if (journalEntry.free !== undefined) {
        setContent(journalEntry.free || '');
      } else {
        // Build legacy text fallback if opening an old multi-field entry
        const parts = [];
        if (journalEntry.wins) parts.push(`### Accomplishments & Wins\n${journalEntry.wins}`);
        if (journalEntry.mistakes) parts.push(`### Friction & Improvement\n${journalEntry.mistakes}`);
        if (journalEntry.lessons) parts.push(`### Core Lessons\n${journalEntry.lessons}`);
        if (journalEntry.gratitude) parts.push(`### Daily Gratitude\n${journalEntry.gratitude}`);
        if (journalEntry.tomorrow) parts.push(`### Tomorrow's Focus\n${journalEntry.tomorrow}`);
        if (journalEntry.free) parts.push(`### Notes & Reflections\n${journalEntry.free}`);
        setContent(parts.join('\n\n'));
      }
    } else {
      setTitle('');
      setContent('');
    }
    setSaveStatus('idle');
  }, [selectedDate, journalEntry]);

  // Handle Save to Dexie & Supabase
  const handleSave = useCallback(
    async (newTitle = title, newContent = content) => {
      setSaveStatus('saving');
      const entry: JournalEntry = {
        date: selectedDate,
        title: newTitle,
        content: newContent,
        free: newContent, // Dual-write for backward compatibility
      };
      await db.journalEntries.put(entry);
      syncJournalEntryToSupabase(entry);

      setTimeout(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      }, 300);
    },
    [selectedDate, title, content]
  );

  // Auto-save debounce on content or title change (after initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      handleSave(title, content);
    }, 1200);
    return () => clearTimeout(timer);
  }, [title, content]);

  // Date Navigation Helpers
  const handlePrevDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handleToday = () => {
    setSelectedDate(todayKey);
  };

  // Day of week calculation for selected date
  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const dayOfWeekNum = selectedDateObj.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  // Map to MON=0 ... SUN=6 index
  const dayIndexMonStart = dayOfWeekNum === 0 ? 6 : dayOfWeekNum - 1;

  const handleSelectDayOfWeek = (monIndex: number) => {
    const currentMonIndex = dayIndexMonStart;
    const diffDays = monIndex - currentMonIndex;
    const newDate = new Date(selectedDateObj);
    newDate.setDate(newDate.getDate() + diffDays);
    setSelectedDate(newDate.toISOString().slice(0, 10));
  };

  // 90-Day Plan Day Number calculation
  const startDateStr = getStartDate();
  const startMs = new Date(startDateStr + 'T00:00:00').getTime();
  const currentMs = selectedDateObj.getTime();
  const dayNumOfPlan = Math.max(1, Math.floor((currentMs - startMs) / 86400000) + 1);

  // Formatted date string (e.g. Wednesday, August 5, 2026)
  const formattedDateString = selectedDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Writing statistics
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(`${title ? title + '\n\n' : ''}${content}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleStyle = () => {
    const nextStyle = paperStyle === 'lined' ? 'blank' : 'lined';
    setPaperStyle(nextStyle);
    localStorage.setItem('tracker_journal_paper_style', nextStyle);
  };

  const handleClear = () => {
    if (!content && !title) return;
    if (window.confirm('Are you sure you want to clear this entry?')) {
      setTitle('');
      setContent('');
      handleSave('', '');
    }
  };

  // 4K A4 Paper Image Export Handler
  const handleDownloadImage = async () => {
    if (!exportRef.current) return;
    try {
      setIsExporting(true);
      await new Promise((resolve) => setTimeout(resolve, 150));

      const dataUrl = await toPng(exportRef.current, {
        quality: 1.0,
        pixelRatio: 3, // 3x pixel scale for crystal clear 4K paper image clarity!
        cacheBust: true,
      });

      const link = document.createElement('a');
      link.download = `day${dayNumOfPlan}-journal.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export journal image:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto pb-12 sm:pb-10 relative">
      {/* Top Header & Date Navigation Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5 sm:gap-3">
            <h2 className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--ink)]">
              Daily Journal
            </h2>
            <span className="rounded-full bg-[#ff4d8b]/15 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-mono font-bold text-[#ff4d8b] border border-[#ff4d8b]/30">
              Day {dayNumOfPlan} of 90
            </span>
          </div>
          <p className="mt-1 text-xs font-semibold text-[var(--text-muted)]">
            {formattedDateString} • Writer's Minimal Reflection Space
          </p>
        </div>

        {/* Date Controls & Save/Export Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          {/* Day Navigation */}
          <div className="flex items-center rounded-xl border border-[var(--hairline)] bg-[var(--surface-soft)] p-1">
            <button
              onClick={handlePrevDay}
              title="Previous Day"
              className="flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-[var(--ink)] active:scale-95 hover:bg-[var(--surface-card)] transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="relative px-2 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-[#ff4d8b]" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                className="bg-transparent font-mono text-xs font-bold text-[var(--ink)] focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={handleNextDay}
              title="Next Day"
              className="flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-[var(--ink)] active:scale-95 hover:bg-[var(--surface-card)] transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Today Shortcut */}
            <button
              onClick={handleToday}
              className={`rounded-xl px-3 py-2 text-xs font-bold font-mono transition border active:scale-95 ${
                selectedDate === todayKey
                  ? 'bg-[#ff4d8b] text-white border-[#ff4d8b]'
                  : 'bg-[var(--surface-soft)] text-[var(--ink)] border-[var(--hairline)] hover:bg-[var(--surface-card)]'
              }`}
            >
              Today
            </button>

            {/* Export 4K Image Button (Placed beside Save Entry) */}
            <button
              onClick={handleDownloadImage}
              disabled={isExporting}
              className="flex items-center gap-2 rounded-xl border border-[#ff4d8b]/30 bg-[#ff4d8b]/10 px-3.5 py-2 text-xs font-bold text-[#ff4d8b] active:scale-95 hover:bg-[#ff4d8b]/20 transition shadow-xs disabled:opacity-50"
              title="Download Journal Entry as 4K A4 Paper Image"
            >
              {isExporting ? (
                <RotateCcw className="h-3.5 w-3.5 animate-spin text-[#ff4d8b]" />
              ) : (
                <Download className="h-3.5 w-3.5 text-[#ff4d8b]" />
              )}
              <span>{isExporting ? 'Exporting 4K...' : 'Download Image'}</span>
            </button>

            {/* Manual Save Button */}
            <button
              onClick={() => handleSave()}
              className="flex items-center gap-2 rounded-xl bg-[#ff4d8b] px-4 py-2 text-xs font-bold text-white active:scale-95 hover:opacity-90 transition shadow-sm"
            >
              {saveStatus === 'saving' ? (
                <RotateCcw className="h-3.5 w-3.5 animate-spin text-white" />
              ) : saveStatus === 'saved' ? (
                <Check className="h-3.5 w-3.5 text-white" />
              ) : (
                <Save className="h-3.5 w-3.5 text-white" />
              )}
              <span>{saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved ✓' : 'Save Entry'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Aesthetic Dairy Main Notebook Card */}
      <div className="rounded-2xl sm:rounded-3xl border border-[var(--hairline)] bg-[var(--surface-card)] shadow-lg overflow-hidden transition-all">
        {/* Notebook Top Bar (Inspired by physical diary layout) */}
        <div className="border-b border-[var(--hairline)] bg-[var(--surface-soft)] px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
          {/* Day of Week Selector Bar (MON TUE WED THU FRI SAT SUN) */}
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none w-full md:w-auto">
            <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] mr-1 uppercase tracking-wider shrink-0">
              DAY:
            </span>
            {DAYS_OF_WEEK.map((dayLabel, idx) => {
              const isSelected = idx === dayIndexMonStart;
              return (
                <button
                  key={dayLabel}
                  onClick={() => handleSelectDayOfWeek(idx)}
                  className={`flex flex-col items-center justify-center rounded-xl px-2.5 py-1 text-[10px] font-mono font-extrabold transition-all shrink-0 active:scale-95 ${
                    isSelected
                      ? 'bg-[#ff4d8b] text-white shadow-xs scale-105'
                      : 'bg-[var(--canvas)] text-[var(--text-muted)] hover:text-[var(--ink)] border border-[var(--hairline)]'
                  }`}
                >
                  <span>{dayLabel}</span>
                  <span
                    className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-transparent'
                    }`}
                  ></span>
                </button>
              );
            })}
          </div>

          {/* Right Top Bar Options */}
          <div className="flex items-center justify-between md:justify-end gap-3 text-xs w-full md:w-auto pt-1 md:pt-0 border-t md:border-t-0 border-[var(--hairline)]">
            {/* Lined Paper vs Blank Toggle */}
            <button
              onClick={handleToggleStyle}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--hairline)] bg-[var(--canvas)] px-3 py-1.5 text-[11px] font-bold text-[var(--ink)] active:scale-95 hover:bg-[var(--surface-card)] transition"
              title="Toggle Notebook Lined Paper style"
            >
              <BookOpen className="h-3.5 w-3.5 text-[#ff4d8b]" />
              <span>{paperStyle === 'lined' ? 'Lined Paper' : 'Blank Canvas'}</span>
            </button>

            {/* Save Status Indicator */}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-500">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Auto-saved
              </span>
            )}
          </div>
        </div>

        {/* Writing Canvas */}
        <div className="p-4 sm:p-6 md:p-8 space-y-4">
          {/* Optional Title Input */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Headline or Title for today's reflection..."
            className="w-full bg-transparent font-['Space_Grotesk'] text-lg sm:text-xl md:text-2xl font-extrabold text-[var(--ink)] placeholder-[var(--text-muted)] focus:outline-none border-b border-[var(--hairline)] pb-3"
          />

          {/* Lined / Blank Free-Form Writer Canvas */}
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your thoughts, daily learnings, ideas, accomplishments, or reflections freely here..."
              style={
                paperStyle === 'lined'
                  ? {
                      backgroundImage: isDark
                        ? 'repeating-linear-gradient(transparent, transparent 31px, rgba(255, 255, 255, 0.06) 31px, rgba(255, 255, 255, 0.06) 32px)'
                        : 'repeating-linear-gradient(transparent, transparent 31px, rgba(0, 0, 0, 0.06) 31px, rgba(0, 0, 0, 0.06) 32px)',
                      lineHeight: '32px',
                    }
                  : { lineHeight: '28px' }
              }
              className="min-h-[380px] sm:min-h-[460px] w-full resize-y bg-transparent p-2 text-base font-normal text-[var(--ink)] placeholder-[var(--text-muted)] focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Notebook Footer Toolbar & Metrics */}
        <div className="border-t border-[var(--hairline)] bg-[var(--surface-soft)] px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--text-muted)] font-mono">
          {/* Metrics */}
          <div className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs">
            <span>
              <strong className="text-[var(--ink)] font-extrabold">{wordCount}</strong> words
            </span>
            <span>
              <strong className="text-[var(--ink)] font-extrabold">{charCount}</strong> chars
            </span>
            <span>
              ~<strong className="text-[var(--ink)] font-extrabold">{readTimeMin}</strong> min read
            </span>
          </div>

          {/* Utility Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={!content}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--hairline)] bg-[var(--canvas)] px-3 py-1.5 text-[11px] font-bold text-[var(--ink)] active:scale-95 hover:bg-[var(--surface-card)] transition disabled:opacity-40"
              title="Copy journal entry"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-[var(--text-muted)]" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>

            <button
              onClick={handleClear}
              disabled={!content && !title}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--hairline)] bg-[var(--canvas)] px-3 py-1.5 text-[11px] font-bold text-rose-500 active:scale-95 hover:bg-rose-500/10 transition disabled:opacity-40"
              title="Clear entry"
            >
              <RotateCcw className="h-3 w-3 text-rose-500" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Off-screen Pristine 4K A4 Paper Target Node for Image Generation */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none opacity-0">
        <div
          ref={exportRef}
          className={`w-[850px] min-h-[1180px] p-12 font-sans flex flex-col justify-between ${
            isDark ? 'bg-[#121218] text-[#f4f4f5]' : 'bg-[#fffaf0] text-[#0a0a0a]'
          }`}
        >
          <div>
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-current/20 pb-4 mb-6">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="font-['Space_Grotesk'] text-3xl font-extrabold tracking-tight">
                    DAILY JOURNAL
                  </h1>
                  <span className="rounded-full bg-[#ff4d8b] px-3.5 py-1 text-xs font-mono font-extrabold text-white">
                    Day {dayNumOfPlan} of 90
                  </span>
                </div>
                <p className="mt-1.5 text-xs font-semibold opacity-70 tracking-wide uppercase font-mono">
                  {formattedDateString} • 90-DAY TRANSFORMATION PLAN
                </p>
              </div>

              {/* Day Chips */}
              <div className="flex items-center gap-1.5 font-mono text-xs font-extrabold">
                {DAYS_OF_WEEK.map((dayLabel, idx) => {
                  const isSelected = idx === dayIndexMonStart;
                  return (
                    <div
                      key={dayLabel}
                      className={`px-2.5 py-1 rounded-lg border ${
                        isSelected
                          ? 'bg-[#ff4d8b] text-white border-[#ff4d8b]'
                          : 'bg-transparent opacity-40 border-current'
                      }`}
                    >
                      {dayLabel}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Entry Title */}
            {title && (
              <h2 className="font-['Space_Grotesk'] text-2xl font-extrabold mb-5 pb-3 border-b border-current/15">
                {title}
              </h2>
            )}

            {/* Lined / Blank Paper Content */}
            <div
              style={
                paperStyle === 'lined'
                  ? {
                      backgroundImage: isDark
                        ? 'repeating-linear-gradient(transparent, transparent 31px, rgba(255, 255, 255, 0.08) 31px, rgba(255, 255, 255, 0.08) 32px)'
                        : 'repeating-linear-gradient(transparent, transparent 31px, rgba(0, 0, 0, 0.08) 31px, rgba(0, 0, 0, 0.08) 32px)',
                      lineHeight: '32px',
                    }
                  : { lineHeight: '30px' }
              }
              className="min-h-[750px] text-base font-normal whitespace-pre-wrap leading-relaxed px-2 py-1"
            >
              {content || 'No journal entry recorded for this day.'}
            </div>
          </div>

          {/* Footer Watermark */}
          <div className="mt-12 pt-4 border-t border-current/20 flex items-center justify-between font-mono text-xs opacity-75">
            <div className="flex items-center gap-4">
              <span><strong>{wordCount}</strong> words</span>
              <span>•</span>
              <span><strong>{charCount}</strong> chars</span>
              <span>•</span>
              <span>~<strong>{readTimeMin}</strong> min read</span>
            </div>
            <div className="font-extrabold tracking-wider">
              TRACKER • 90-DAY TRANSFORMATION
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
