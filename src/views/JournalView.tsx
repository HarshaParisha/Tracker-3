import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { Card } from '@/components/common/Card';
import { getTodayKey } from '@/utils/constants';
import { syncJournalEntryToSupabase } from '@/lib/supabase';
import { Trophy, AlertTriangle, Lightbulb, Heart, Target, FileText, Save } from 'lucide-react';


interface JournalViewProps {
  isDark?: boolean;
}

export const JournalView: React.FC<JournalViewProps> = () => {
  const todayKey = getTodayKey();
  const journalEntry = useLiveQuery(() => db.journalEntries.get(todayKey), [todayKey]);

  const [wins, setWins] = useState('');
  const [mistakes, setMistakes] = useState('');
  const [lessons, setLessons] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [tomorrow, setTomorrow] = useState('');
  const [free, setFree] = useState('');
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    if (journalEntry) {
      setWins(journalEntry.wins || '');
      setMistakes(journalEntry.mistakes || '');
      setLessons(journalEntry.lessons || '');
      setGratitude(journalEntry.gratitude || '');
      setTomorrow(journalEntry.tomorrow || '');
      setFree(journalEntry.free || '');
    }
  }, [journalEntry]);

  const handleSave = async () => {
    const entry = {
      date: todayKey,
      wins,
      mistakes,
      lessons,
      gratitude,
      tomorrow,
      free,
    };
    await db.journalEntries.put(entry);
    syncJournalEntryToSupabase(entry);

    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-['Space_Grotesk'] text-3xl font-extrabold tracking-tight text-[var(--ink)]">Daily Journal & Reflection</h2>
          <p className="text-sm font-semibold text-[var(--text-muted)]">09:00 – 09:30 PM • Daily Synthesis, Lessons Learned & Tomorrow Planning</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 rounded-full bg-[#ff4d8b] px-5 py-2.5 text-xs font-bold text-white hover:opacity-90 transition shadow-sm"
        >
          <Save className="h-4 w-4 text-white" />
          <span>{savedMessage ? 'Journal Saved ✓' : 'Save Journal Entry'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Wins */}
        <Card title="Today's Accomplishments & Wins" color="cream">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#a4d4c5] text-[#0a0a0a] shrink-0 mt-1">
              <Trophy className="h-4 w-4" />
            </div>
            <textarea
              value={wins}
              onChange={(e) => setWins(e.target.value)}
              onBlur={handleSave}
              rows={4}
              placeholder="What went exceptionally well today?"
              className="w-full rounded-xl border border-[var(--hairline)] bg-[var(--canvas)] p-3 text-xs text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
            />
          </div>
        </Card>

        {/* Mistakes & Friction Points */}
        <Card title="Areas of Friction & Improvement" color="cream">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ff4d8b] text-white shrink-0 mt-1">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <textarea
              value={mistakes}
              onChange={(e) => setMistakes(e.target.value)}
              onBlur={handleSave}
              rows={4}
              placeholder="What friction occurred or what could have been handled better?"
              className="w-full rounded-xl border border-[var(--hairline)] bg-[var(--canvas)] p-3 text-xs text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
            />
          </div>
        </Card>

        {/* Lessons Learned */}
        <Card title="Core Lessons Synthesized" color="cream">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e8b94a] text-[#0a0a0a] shrink-0 mt-1">
              <Lightbulb className="h-4 w-4" />
            </div>
            <textarea
              value={lessons}
              onChange={(e) => setLessons(e.target.value)}
              onBlur={handleSave}
              rows={4}
              placeholder="Key insights & takeaways to integrate moving forward..."
              className="w-full rounded-xl border border-[var(--hairline)] bg-[var(--canvas)] p-3 text-xs text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
            />
          </div>
        </Card>

        {/* Gratitude */}
        <Card title="Daily Gratitude" color="cream">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ffb084] text-[#0a0a0a] shrink-0 mt-1">
              <Heart className="h-4 w-4" />
            </div>
            <textarea
              value={gratitude}
              onChange={(e) => setGratitude(e.target.value)}
              onBlur={handleSave}
              rows={4}
              placeholder="What people, experiences, or opportunities are you grateful for today?"
              className="w-full rounded-xl border border-[var(--hairline)] bg-[var(--canvas)] p-3 text-xs text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
            />
          </div>
        </Card>

        {/* Tomorrow's Focus */}
        <Card title="Tomorrow's Primary Focus" color="cream">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--ink)] text-[var(--canvas)] shrink-0 mt-1">
              <Target className="h-4 w-4" />
            </div>
            <textarea
              value={tomorrow}
              onChange={(e) => setTomorrow(e.target.value)}
              onBlur={handleSave}
              rows={4}
              placeholder="Highest priority objectives & single deep-work task for tomorrow..."
              className="w-full rounded-xl border border-[var(--hairline)] bg-[var(--canvas)] p-3 text-xs text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
            />
          </div>
        </Card>

        {/* Free Writing */}
        <Card title="Free Reflection & Notes" color="cream">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#b8a4ed] text-[#0a0a0a] shrink-0 mt-1">
              <FileText className="h-4 w-4" />
            </div>
            <textarea
              value={free}
              onChange={(e) => setFree(e.target.value)}
              onBlur={handleSave}
              rows={4}
              placeholder="Additional reflections, ideas, or unstructured notes..."
              className="w-full rounded-xl border border-[var(--hairline)] bg-[var(--canvas)] p-3 text-xs text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
            />
          </div>
        </Card>
      </div>
    </div>
  );
};
