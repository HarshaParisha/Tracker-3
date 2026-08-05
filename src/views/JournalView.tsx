import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type JournalEntry } from '@/db/database';
import { getTodayKey, getStartDate } from '@/utils/constants';
import { syncJournalEntryToSupabase, pullSupabaseToLocal } from '@/lib/supabase';
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

  // Auto pull from Supabase on view mount & window focus (cross-device sync)
  useEffect(() => {
    pullSupabaseToLocal();
    const handleFocus = () => pullSupabaseToLocal();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Synchronize state when selectedDate changes or database entry loads
  useEffect(() => {
    if (journalEntry) {
      const rawTitle = journalEntry.title || '';
      const rawContent = (journalEntry.content && journalEntry.content.trim())
        ? journalEntry.content
        : (journalEntry.free && journalEntry.free.trim())
          ? journalEntry.free
          : '';

      if (rawTitle) {
        setTitle(rawTitle);
        setContent(rawContent);
      } else if (rawContent) {
        // Automatically extract first line as headline if title wasn't saved separately
        const lines = rawContent.split('\n');
        if (lines.length > 1 && lines[0].length < 120 && !lines[0].startsWith('###')) {
          setTitle(lines[0].trim());
          setContent(lines.slice(1).join('\n').trim());
        } else {
          setTitle('');
          setContent(rawContent);
        }
      } else {
        // Legacy fallback
        const parts = [];
        if (journalEntry.wins) parts.push(`### Accomplishments & Wins\n${journalEntry.wins}`);
        if (journalEntry.mistakes) parts.push(`### Friction & Improvement\n${journalEntry.mistakes}`);
        if (journalEntry.lessons) parts.push(`### Core Lessons\n${journalEntry.lessons}`);
        if (journalEntry.gratitude) parts.push(`### Daily Gratitude\n${journalEntry.gratitude}`);
        if (journalEntry.tomorrow) parts.push(`### Tomorrow's Focus\n${journalEntry.tomorrow}`);
        if (parts.length > 0) {
          setTitle('');
          setContent(parts.join('\n\n'));
        } else {
          setTitle('');
          setContent('');
        }
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
        free: newTitle ? `${newTitle}\n\n${newContent}` : newContent, // Store combined in free for fallback
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
  const fullCombinedText = `${title ? title + ' ' : ''}${content}`;
  const wordCount = fullCombinedText.trim() ? fullCombinedText.trim().split(/\s+/).length : 0;
  const charCount = fullCombinedText.length;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  const handleCopy = () => {
    if (!content && !title) return;
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

  // 4K A4 Paper Image Export Handler (Preserves 100% exact Tracker App Fonts: Space Grotesk & Inter)
  const handleDownloadImage = async () => {
    if (!exportRef.current) return;
    try {
      setIsExporting(true);
      if (typeof document !== 'undefined' && document.fonts) {
        await document.fonts.ready;
      }
      await new Promise((resolve) => setTimeout(resolve, 400));

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;

      const dataUrl = await toPng(exportRef.current, {
        quality: 1.0,
        pixelRatio: isMobile ? 2 : 3,
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

            {/* Export 4K Image Button */}
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
        {/* Notebook Top Bar */}
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

        {/* Writing Canvas & Paper Sheet */}
        <div className="p-4 sm:p-6 md:p-8 space-y-4">
          {/* Prominent Journal Headline / Title Input */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Headline or Title for today's reflection..."
            className="w-full bg-transparent font-['Space_Grotesk'] text-xl sm:text-2xl md:text-3xl font-black text-[var(--ink)] placeholder-[var(--text-muted)] focus:outline-none border-b border-[var(--hairline)] pb-3"
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
              disabled={!content && !title}
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

      {/* Pristine 4K A4 Paper Target Node for Image Generation (100% Exact Tracker App Fonts: Space Grotesk & Inter) */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '850px',
          zIndex: -9999,
          pointerEvents: 'none',
          opacity: 0,
        }}
      >
        <div
          ref={exportRef}
          style={{
            width: '850px',
            minHeight: '1180px',
            padding: '48px 48px 40px 48px',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            boxSizing: 'border-box',
          }}
          className={`flex flex-col justify-between ${
            isDark ? 'bg-[#121218] text-[#f4f4f5]' : 'bg-[#fffaf0] text-[#0a0a0a]'
          }`}
        >
          {/* Inline Font CSS Embedding for html-to-image canvas capture */}
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700;800;900&display=swap');
            .t-space { font-family: 'Space Grotesk', 'Inter', sans-serif !important; }
            .t-inter { font-family: 'Inter', -apple-system, sans-serif !important; }
            .t-mono { font-family: 'Fredoka', ui-monospace, SFMono-Regular, monospace !important; }
          `}</style>

          <div>
            {/* Table Header Container: Prevents iOS Safari SVG ForeignObject CSS Gap bugs */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginBottom: '20px',
                paddingBottom: '16px',
                borderBottom: '2px solid rgba(125,125,125,0.25)',
              }}
            >
              <tbody>
                <tr>
                  <td style={{ verticalAlign: 'middle', textAlign: 'left', padding: '0 0 12px 0' }}>
                    <div style={{ display: 'block', marginBottom: '6px' }}>
                      <h1
                        className="t-space"
                        style={{
                          display: 'inline-block',
                          verticalAlign: 'middle',
                          fontSize: '28px',
                          fontWeight: 900,
                          letterSpacing: '-0.02em',
                          margin: 0,
                          padding: 0,
                          lineHeight: '1.1',
                          textTransform: 'uppercase',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        DAILY JOURNAL
                      </h1>
                      <span
                        className="t-mono"
                        style={{
                          display: 'inline-block',
                          verticalAlign: 'middle',
                          marginLeft: '12px',
                          backgroundColor: '#ff4d8b',
                          color: '#ffffff',
                          borderRadius: '9999px',
                          padding: '4px 12px',
                          fontSize: '11px',
                          fontWeight: 800,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Day {dayNumOfPlan} of 90
                      </span>
                    </div>

                    <div
                      className="t-mono"
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        opacity: 0.65,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        lineHeight: '1.2',
                        marginTop: '4px',
                      }}
                    >
                      {formattedDateString} • 90-DAY TRANSFORMATION PLAN
                    </div>
                  </td>

                  <td style={{ verticalAlign: 'top', textAlign: 'right', whiteSpace: 'nowrap', padding: '0 0 12px 0' }}>
                    <div className="t-mono" style={{ display: 'inline-block', fontSize: '10px', fontWeight: 800 }}>
                      {DAYS_OF_WEEK.map((dayLabel, idx) => {
                        const isSelected = idx === dayIndexMonStart;
                        return (
                          <span
                            key={dayLabel}
                            style={{
                              display: 'inline-block',
                              marginLeft: idx === 0 ? '0px' : '4px',
                              padding: '3px 7px',
                              borderRadius: '6px',
                              border: isSelected ? '1px solid #ff4d8b' : '1px solid currentColor',
                              backgroundColor: isSelected ? '#ff4d8b' : 'transparent',
                              color: isSelected ? '#ffffff' : 'inherit',
                              opacity: isSelected ? 1 : 0.4,
                            }}
                          >
                            {dayLabel}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Entry Headline Title (Explicit Space Grotesk Font matching Tracker App) */}
            {title ? (
              <h2
                className="t-space"
                style={{
                  fontSize: '22px',
                  fontWeight: 900,
                  margin: '0 0 20px 0',
                  paddingBottom: '12px',
                  borderBottom: '1px solid rgba(125,125,125,0.2)',
                  lineHeight: '1.3',
                  letterSpacing: '-0.01em',
                }}
              >
                {title}
              </h2>
            ) : null}

            {/* Lined / Blank Paper Content (Explicit Inter Font matching Tracker App) */}
            <div
              className="t-inter min-h-[750px] text-base font-normal whitespace-pre-wrap leading-relaxed px-2 py-1"
              style={
                paperStyle === 'lined'
                  ? {
                      backgroundImage: isDark
                        ? 'repeating-linear-gradient(transparent, transparent 31px, rgba(255, 255, 255, 0.08) 31px, rgba(255, 255, 255, 0.08) 32px)'
                        : 'repeating-linear-gradient(transparent, transparent 31px, rgba(0, 0, 0, 0.08) 31px, rgba(0, 0, 0, 0.08) 32px)',
                      lineHeight: '32px',
                    }
                  : {
                      lineHeight: '30px',
                    }
              }
            >
              {content || 'No journal entry recorded for this day.'}
            </div>
          </div>

          {/* Footer Watermark */}
          <div
            className="t-mono"
            style={{
              marginTop: '48px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(125,125,125,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              opacity: 0.7,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span><strong>{wordCount}</strong> words</span>
              <span>•</span>
              <span><strong>{charCount}</strong> chars</span>
              <span>•</span>
              <span>~<strong>{readTimeMin}</strong> min read</span>
            </div>
            <div style={{ fontWeight: 800, letterSpacing: '0.08em' }}>
              TRACKER • 90-DAY TRANSFORMATION
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
