import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { getTodayKey, getRoutine, isWeekendDay } from '@/utils/constants';
import { syncDailyRecordToSupabase } from '@/lib/supabase';
import { Clock, CheckSquare, Square } from 'lucide-react';

import confetti from 'canvas-confetti';

interface RoutineViewProps {
  isDark?: boolean;
}

export const RoutineView: React.FC<RoutineViewProps> = () => {
  const todayKey = getTodayKey();
  const routine = getRoutine();
  const isWeekend = isWeekendDay();

  const dailyRecord = useLiveQuery(() => db.dailyRecords.get(todayKey), [todayKey]);
  const completedIndices = dailyRecord?.routineDone || [];

  const handleToggleBlock = async (blockId: number) => {
    const current = await db.dailyRecords.get(todayKey);
    const existing = current?.routineDone || [];
    const isAdding = !existing.includes(blockId);

    const updated = isAdding
      ? [...existing, blockId]
      : existing.filter((id) => id !== blockId);

    const updatedRecord = {
      date: todayKey,
      water: current?.water || 0,
      creatine: current?.creatine || 0,
      workout: current?.workout || null,
      mood: current?.mood || null,
      routineDone: updated,
      mealsDone: current?.mealsDone || { breakfast: false, lunch: false, dinner: false, snack: false },
      groceryChecked: current?.groceryChecked || [],
    };
    await db.dailyRecords.put(updatedRecord);
    syncDailyRecordToSupabase(updatedRecord);

    if (isAdding && updated.length === routine.length) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  };


  const progressPct = Math.round((completedIndices.length / routine.length) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-['Space_Grotesk'] text-3xl font-extrabold tracking-tight text-[var(--ink)]">Daily Routine Timeline</h2>
          <p className="text-sm font-medium text-[var(--text-muted)]">
            {isWeekend ? 'Weekend Recovery & Growth Plan' : 'Weekday Deep Focus & Execution Schedule'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="block font-mono text-sm font-extrabold text-[var(--ink)]">
              {completedIndices.length} / {routine.length} Blocks
            </span>
            <span className="text-[11px] font-bold text-[#ff4d8b]">{progressPct}% Completed</span>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ff4d8b] text-white shadow-sm">
            <Clock className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--surface-card)] border border-[var(--hairline)]">
        <div
          className="h-full bg-[#ff4d8b] transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Routine Blocks List */}
      <div className="space-y-3">
        {routine.map((block) => {
          const isDone = completedIndices.includes(block.id);
          return (
            <div
              key={block.id}
              onClick={() => handleToggleBlock(block.id)}
              className={`group flex cursor-pointer items-start justify-between rounded-2xl border p-4.5 transition-all shadow-xs ${
                isDone
                  ? 'border-[#a4d4c5] bg-[#a4d4c5]/25 text-[var(--ink)]'
                  : 'border-[var(--hairline)] bg-[var(--surface-card)] hover:bg-[var(--surface-soft)]'
              }`}
            >
              <div className="flex items-start gap-4">
                <button
                  type="button"
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition ${
                    isDone ? 'text-[#ff4d8b]' : 'text-[var(--text-muted)] group-hover:text-[var(--ink)]'
                  }`}
                >
                  {isDone ? <CheckSquare className="h-5 w-5 text-[#ff4d8b]" /> : <Square className="h-5 w-5" />}
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#ff4d8b]">{block.time}</span>
                    <h3 className={`font-['Space_Grotesk'] text-sm font-bold ${isDone ? 'line-through text-[var(--text-muted)]' : 'text-[var(--ink)]'}`}>
                      {block.title}
                    </h3>
                  </div>
                  <p className={`mt-1 text-xs leading-relaxed ${isDone ? 'text-[var(--text-muted)]' : 'text-[var(--text-body)]'}`}>
                    {block.tasks}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
