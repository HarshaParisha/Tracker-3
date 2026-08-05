import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { Card } from '@/components/common/Card';
import { getTodayKey } from '@/utils/constants';
import { syncLearningRecordToSupabase } from '@/lib/supabase';
import { Save } from 'lucide-react';


interface LearningViewProps {
  isDark?: boolean;
}

export const LearningView: React.FC<LearningViewProps> = () => {
  const todayKey = getTodayKey();
  const learningRecord = useLiveQuery(() => db.learningRecords.get(todayKey), [todayKey]);

  const [dsaConcepts, setDsaConcepts] = useState('');
  const [dsaProblems, setDsaProblems] = useState(0);
  const [pythonConcepts, setPythonConcepts] = useState('');
  const [revDsa, setRevDsa] = useState(false);
  const [revPython, setRevPython] = useState(false);
  const [revNotes, setRevNotes] = useState(false);
  const [marketInsights, setMarketInsights] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [bookTakeaways, setBookTakeaways] = useState('');
  const [aiToolsNotes, setAiToolsNotes] = useState('');
  const [savedStatus, setSavedStatus] = useState(false);

  useEffect(() => {
    if (learningRecord) {
      setDsaConcepts(learningRecord.dsaConcepts || '');
      setDsaProblems(learningRecord.dsaProblems || 0);
      setPythonConcepts(learningRecord.pythonConcepts || '');
      setRevDsa(learningRecord.revision?.dsa || false);
      setRevPython(learningRecord.revision?.python || false);
      setRevNotes(learningRecord.revision?.notes || false);
      setMarketInsights(learningRecord.marketInsights || '');
      setBookTitle(learningRecord.bookTitle || '');
      setBookTakeaways(learningRecord.bookTakeaways || '');
      setAiToolsNotes(learningRecord.aiToolsNotes || '');
    }
  }, [learningRecord]);

  const handleSave = async () => {
    const record = {
      date: todayKey,
      dsaConcepts,
      dsaProblems: Number(dsaProblems) || 0,
      pythonConcepts,
      revision: { dsa: revDsa, python: revPython, notes: revNotes },
      marketInsights,
      bookTitle,
      bookTakeaways,
      aiToolsNotes,
    };
    await db.learningRecords.put(record);
    syncLearningRecordToSupabase(record);

    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2000);
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-['Space_Grotesk'] text-3xl font-extrabold tracking-tight text-[var(--ink)]">Learning & Skill Building</h2>
          <p className="text-sm font-semibold text-[var(--text-muted)]">DSA, Python, Revision, Market Analysis, Books & Tool Engineering</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 rounded-full bg-[#ff4d8b] px-5 py-2.5 text-xs font-bold text-white hover:opacity-90 transition shadow-sm"
        >
          <Save className="h-4 w-4 text-white" />
          <span>{savedStatus ? 'Saved ✓' : 'Save Learning Log'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* DSA Block */}
        <Card
          title="DSA (01:30 – 02:00 PM)"
          subtitle="Data Structures & Algorithms problem solving"
          color="cream"
        >
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ink)] mb-1">Concepts Covered</label>
              <textarea
                value={dsaConcepts}
                onChange={(e) => setDsaConcepts(e.target.value)}
                rows={2}
                placeholder="Binary Search, Dynamic Programming, Trees..."
                className="w-full rounded-xl border border-[var(--hairline)] bg-[var(--canvas)] p-2.5 text-xs font-medium text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ink)] mb-1">Problems Solved Count</label>
              <input
                type="number"
                min="0"
                value={dsaProblems}
                onChange={(e) => setDsaProblems(Number(e.target.value))}
                className="w-full rounded-xl border border-[var(--hairline)] bg-[var(--canvas)] p-2.5 text-xs font-bold text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
              />
            </div>
          </div>
        </Card>

        {/* Python Block */}
        <Card
          title="Python Practice (02:00 – 02:30 PM)"
          subtitle="Core language concepts & practical implementation"
          color="cream"
        >
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ink)] mb-1">Concepts & Implementation</label>
              <textarea
                value={pythonConcepts}
                onChange={(e) => setPythonConcepts(e.target.value)}
                rows={4}
                placeholder="Asyncio, Decorators, Type hinting, Generative patterns..."
                className="w-full rounded-xl border border-[var(--hairline)] bg-[var(--canvas)] p-2.5 text-xs font-medium text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
              />
            </div>
          </div>
        </Card>

        {/* Revision Checklist */}
        <Card
          title="Quick Revision (02:30 – 03:00 PM)"
          subtitle="Consolidate memory retention"
          color="cream"
        >
          <div className="space-y-2 py-2">
            <label className="flex items-center gap-3 rounded-xl border border-[var(--hairline)] bg-[var(--canvas)] p-3 text-xs font-bold text-[var(--ink)] cursor-pointer hover:border-[var(--brand-pink)] transition">
              <input
                type="checkbox"
                checked={revDsa}
                onChange={(e) => setRevDsa(e.target.checked)}
                className="h-4 w-4 rounded accent-[#ff4d8b]"
              />
              <span>DSA Revised</span>
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-[var(--hairline)] bg-[var(--canvas)] p-3 text-xs font-bold text-[var(--ink)] cursor-pointer hover:border-[var(--brand-pink)] transition">
              <input
                type="checkbox"
                checked={revPython}
                onChange={(e) => setRevPython(e.target.checked)}
                className="h-4 w-4 rounded accent-[#ff4d8b]"
              />
              <span>Python Revised</span>
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-[var(--hairline)] bg-[var(--canvas)] p-3 text-xs font-bold text-[var(--ink)] cursor-pointer hover:border-[var(--brand-pink)] transition">
              <input
                type="checkbox"
                checked={revNotes}
                onChange={(e) => setRevNotes(e.target.checked)}
                className="h-4 w-4 rounded accent-[#ff4d8b]"
              />
              <span>Daily Notes Revised</span>
            </label>
          </div>
        </Card>

        {/* Market Research */}
        <Card
          title="Market Research (03:00 – 03:30 PM)"
          subtitle="Technology trends, startups & industry analysis"
          color="cream"
        >
          <textarea
            value={marketInsights}
            onChange={(e) => setMarketInsights(e.target.value)}
            rows={4}
            placeholder="Key market insights, technology launches, industry shifts..."
            className="w-full rounded-xl border border-[var(--hairline)] bg-[var(--canvas)] p-2.5 text-xs font-medium text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
          />
        </Card>

        {/* Book Reading */}
        <Card
          title="Book Reading (04:00 – 04:30 PM)"
          subtitle="Comprehension over page count"
          color="cream"
        >
          <div className="space-y-3">
            <input
              type="text"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              placeholder="Book Title"
              className="w-full rounded-xl border border-[var(--hairline)] bg-[var(--canvas)] p-2.5 text-xs font-bold text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
            />
            <textarea
              value={bookTakeaways}
              onChange={(e) => setBookTakeaways(e.target.value)}
              rows={3}
              placeholder="Key insights & takeaways extracted from reading session..."
              className="w-full rounded-xl border border-[var(--hairline)] bg-[var(--canvas)] p-2.5 text-xs font-medium text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
            />
          </div>
        </Card>

        {/* Developer Tools */}
        <Card
          title="Developer Tools Exploration (08:00 – 09:00 PM)"
          subtitle="Evaluate utility, architecture & product suitability"
          color="cream"
        >
          <textarea
            value={aiToolsNotes}
            onChange={(e) => setAiToolsNotes(e.target.value)}
            rows={4}
            placeholder="Tool evaluated • What problem it solves • When to apply • Technical verdict..."
            className="w-full rounded-xl border border-[var(--hairline)] bg-[var(--canvas)] p-2.5 text-xs font-medium text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
          />
        </Card>
      </div>
    </div>
  );
};
