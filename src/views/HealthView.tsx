import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { Card } from '@/components/common/Card';
import { getTodayKey, WATER_DAILY_GOAL } from '@/utils/constants';
import { syncDailyRecordToSupabase } from '@/lib/supabase';

import {
  Pill,
  Smile,
  Meh,
  Frown,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface HealthViewProps {
  isDark?: boolean;
}

export const HealthView: React.FC<HealthViewProps> = () => {
  const todayKey = getTodayKey();
  const dailyRecord = useLiveQuery(() => db.dailyRecords.get(todayKey), [todayKey]);

  const waterIntake = dailyRecord?.water || 0;
  const creatineGrams = dailyRecord?.creatine || 0;
  const workoutStatus = dailyRecord?.workout || null;
  const moodStatus = dailyRecord?.mood || null;

  const waterPct = Math.min(100, Math.round((waterIntake / WATER_DAILY_GOAL) * 100));

  const handleWaterAdd = async (amount: number) => {
    const current = await db.dailyRecords.get(todayKey);
    const updated = (current?.water || 0) + amount;
    const rec = {
      date: todayKey,
      water: updated,
      creatine: current?.creatine || 0,
      workout: current?.workout || null,
      mood: current?.mood || null,
      routineDone: current?.routineDone || [],
      mealsDone: current?.mealsDone || { breakfast: false, lunch: false, dinner: false, snack: false },
      groceryChecked: current?.groceryChecked || [],
    };
    await db.dailyRecords.put(rec);
    syncDailyRecordToSupabase(rec);
  };

  const handleCreatineLog = async () => {
    const current = await db.dailyRecords.get(todayKey);
    const newGrams = current?.creatine ? 0 : 5;
    const rec = {
      date: todayKey,
      water: current?.water || 0,
      creatine: newGrams,
      workout: current?.workout || null,
      mood: current?.mood || null,
      routineDone: current?.routineDone || [],
      mealsDone: current?.mealsDone || { breakfast: false, lunch: false, dinner: false, snack: false },
      groceryChecked: current?.groceryChecked || [],
    };
    await db.dailyRecords.put(rec);
    syncDailyRecordToSupabase(rec);
  };

  const handleWorkoutToggle = async (val: 'yes' | 'no') => {
    const current = await db.dailyRecords.get(todayKey);
    const rec = {
      date: todayKey,
      water: current?.water || 0,
      creatine: current?.creatine || 0,
      workout: val,
      mood: current?.mood || null,
      routineDone: current?.routineDone || [],
      mealsDone: current?.mealsDone || { breakfast: false, lunch: false, dinner: false, snack: false },
      groceryChecked: current?.groceryChecked || [],
    };
    await db.dailyRecords.put(rec);
    syncDailyRecordToSupabase(rec);
  };

  const handleMoodSelect = async (mood: string) => {
    const current = await db.dailyRecords.get(todayKey);
    const rec = {
      date: todayKey,
      water: current?.water || 0,
      creatine: current?.creatine || 0,
      workout: current?.workout || null,
      mood,
      routineDone: current?.routineDone || [],
      mealsDone: current?.mealsDone || { breakfast: false, lunch: false, dinner: false, snack: false },
      groceryChecked: current?.groceryChecked || [],
    };
    await db.dailyRecords.put(rec);
    syncDailyRecordToSupabase(rec);
  };


  const moods = [
    { id: 'great', label: 'Great', icon: Smile },
    { id: 'good', label: 'Good', icon: Smile },
    { id: 'okay', label: 'Okay', icon: Meh },
    { id: 'low', label: 'Low', icon: Frown },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-['Space_Grotesk'] text-3xl font-extrabold tracking-tight text-[var(--ink)]">Health & Fitness Log</h2>
        <p className="text-sm font-medium text-[var(--text-muted)]">Hydration Goal, Creatine Monohydrate & Post-Workout Recovery</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Hydration Card (Lavender Saturated Card) */}
        <Card title="Water Intake Target" subtitle="3.0 Liters Daily Goal" color="lavender">
          <div className="flex flex-col items-center justify-center py-4">
            {/* SVG Ring Progress */}
            <div className="relative flex h-36 w-36 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="rgba(10,10,10,0.15)" strokeWidth="8" fill="none" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="#0a0a0a"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray="263.89"
                  strokeDashoffset={263.89 - (263.89 * waterPct) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-500 ease-out"
                />
              </svg>
              <div className="absolute text-center">
                <span className="font-['Space_Grotesk'] text-2xl font-extrabold text-[#0a0a0a]">{waterIntake}</span>
                <span className="block font-mono text-[10px] font-bold text-[#0a0a0a]/70">/ 3000 ML</span>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => handleWaterAdd(250)}
                className="rounded-full bg-[#0a0a0a] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#0a0a0a]/80 transition"
              >
                +250 ml
              </button>
              <button
                onClick={() => handleWaterAdd(500)}
                className="rounded-full bg-[#0a0a0a] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#0a0a0a]/80 transition"
              >
                +500 ml
              </button>
            </div>
          </div>
        </Card>

        {/* Creatine Supplement Card (Mint Saturated Card) */}
        <Card title="Creatine Monohydrate" subtitle="3–5g Daily Dose • Post-Breakfast" color="mint">
          <div className="flex h-full flex-col justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0a0a0a] text-white">
                <Pill className="h-5 w-5 text-[#a4d4c5]" />
              </div>
              <div>
                <span className="font-mono text-xs font-bold text-[#0a0a0a]">DAILY DOSAGE</span>
                <p className="text-xs text-[#0a0a0a]/80 font-medium">
                  {creatineGrams > 0 ? '5g Dose Logged Today' : 'Pending Intake'}
                </p>
              </div>
            </div>

            <div className="my-6 text-center">
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-extrabold border ${creatineGrams > 0 ? 'border-[#0a0a0a] bg-[#0a0a0a] text-white' : 'border-[#0a0a0a]/30 bg-transparent text-[#0a0a0a]'}`}>
                {creatineGrams > 0 ? '✓ COMPLETED' : 'INCOMPLETE'}
              </span>
            </div>

            <button
              onClick={handleCreatineLog}
              className="w-full rounded-full bg-[#0a0a0a] py-2.5 text-xs font-bold text-white hover:bg-[#0a0a0a]/80 transition"
            >
              {creatineGrams > 0 ? 'Undo Log' : 'Log 5g Dose'}
            </button>
          </div>
        </Card>

        {/* Workout & Mood Card (Peach Saturated Card) */}
        <Card title="Workout & Mental State" subtitle="Post-Workout Recovery Index" color="peach">
          <div className="space-y-4">
            <div>
              <label className="block font-mono text-[10px] font-bold text-[#0a0a0a]/80 uppercase tracking-wider mb-2">
                WORKOUT EXECUTED
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleWorkoutToggle('yes')}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition ${
                    workoutStatus === 'yes'
                      ? 'border-[#0a0a0a] bg-[#0a0a0a] text-white'
                      : 'border-[#0a0a0a]/20 bg-white/40 text-[#0a0a0a]'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Executed</span>
                </button>
                <button
                  onClick={() => handleWorkoutToggle('no')}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition ${
                    workoutStatus === 'no'
                      ? 'border-[#0a0a0a] bg-[#0a0a0a] text-white'
                      : 'border-[#0a0a0a]/20 bg-white/40 text-[#0a0a0a]'
                  }`}
                >
                  <XCircle className="h-4 w-4" />
                  <span>Skipped</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block font-mono text-[10px] font-bold text-[#0a0a0a]/80 uppercase tracking-wider mb-2">
                POST-WORKOUT MOOD
              </label>
              <div className="grid grid-cols-4 gap-2">
                {moods.map((m) => {
                  const Icon = m.icon;
                  const isSelected = moodStatus === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleMoodSelect(m.id)}
                      className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-xs font-bold transition ${
                        isSelected
                          ? 'border-[#0a0a0a] bg-[#0a0a0a] text-white'
                          : 'border-[#0a0a0a]/20 bg-white/40 text-[#0a0a0a]'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-[10px]">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
