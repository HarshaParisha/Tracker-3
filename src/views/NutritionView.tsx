import React, { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { Card } from '@/components/common/Card';
import {
  getTodayKey,
  getDayNumber,
  getDayOfWeek,
  WEEK1_MEALS,
  WEEK2_MEALS,
} from '@/utils/constants';
import { syncDailyRecordToSupabase, pullSupabaseToLocal } from '@/lib/supabase';
import { AlertOctagon, CheckSquare, Square } from 'lucide-react';

interface NutritionViewProps {
  isDark?: boolean;
}

export const NutritionView: React.FC<NutritionViewProps> = () => {
  const todayKey = getTodayKey();
  const dayNumber = getDayNumber();
  const dayOfWeek = getDayOfWeek(); // 0=Sun, 1=Mon, ..., 6=Sat

  // Auto pull from Supabase on view mount & window focus
  useEffect(() => {
    pullSupabaseToLocal();
    const handleFocus = () => pullSupabaseToLocal();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const weekNum = Math.ceil(dayNumber / 7);
  const isWeek1Rotation = weekNum % 2 === 1;
  const mealsSource = isWeek1Rotation ? WEEK1_MEALS : WEEK2_MEALS;

  // Day index mapping: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
  const mealDayIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const breakfastText = mealsSource.breakfast[mealDayIdx] || mealsSource.breakfast[0];
  const lunchText = mealsSource.lunch[mealDayIdx] || mealsSource.lunch[0];
  const dinnerText = mealsSource.dinner[mealDayIdx] || mealsSource.dinner[0];
  const snackText = mealsSource.snack;

  // Non-Veg days: Wednesday (3) & Sunday (0)
  const isNonVegDay = dayOfWeek === 3 || dayOfWeek === 0;

  const dailyRecord = useLiveQuery(() => db.dailyRecords.get(todayKey), [todayKey]);
  const mealsDone = dailyRecord?.mealsDone || { breakfast: false, lunch: false, dinner: false, snack: false };

  const handleMealToggle = async (mealKey: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    const current = await db.dailyRecords.get(todayKey);
    const updatedMealsDone = {
      ...mealsDone,
      [mealKey]: !mealsDone[mealKey],
    };

    const newRecord = {
      date: todayKey,
      water: current?.water || 0,
      creatine: current?.creatine || 0,
      workout: current?.workout || null,
      mood: current?.mood || null,
      routineDone: current?.routineDone || [],
      mealsDone: updatedMealsDone,
      groceryChecked: current?.groceryChecked || [],
    };

    await db.dailyRecords.put(newRecord);
    syncDailyRecordToSupabase(newRecord);
  };

  const avoidFoods = [
    'Bakery Snacks & Pastries',
    'Commercial Chips & Processed Snacks',
    'Soft Drinks & Carbonated Beverages',
    'Packaged Fruit Juices with Added Sugar',
    'Instant Noodles & Preserved Foods',
    'Deep Fried Fast Food',
    'Excess Refined Sweets & Confectionery',
    'Sugary Tea or Coffee Multiple Times Daily',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-['Space_Grotesk'] text-3xl font-extrabold tracking-tight text-[var(--ink)]">Nutrition & Meal Rotation</h2>
          <p className="text-sm font-semibold text-[var(--text-muted)]">
            Week {weekNum} Rotation ({isWeek1Rotation ? 'Menu 1' : 'Menu 2'}) • High Protein & Fiber Focus
          </p>
        </div>
        <span className={`rounded-full px-3.5 py-1.5 text-xs font-bold border ${
          isNonVegDay
            ? 'border-[#ff4d8b] bg-[#ff4d8b] text-white'
            : 'border-[#1a3a3a] bg-[#1a3a3a] text-white'
        }`}>
          {isNonVegDay ? 'NON-VEGETARIAN DAY (Chicken / Egg Focus)' : 'VEGETARIAN DAY (Dal, Soy & Legumes)'}
        </span>
      </div>

      {/* Daily Meals Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Breakfast */}
        <Card title="Breakfast (08:00 AM)" subtitle="High energy start" color="cream">
          <div className="flex h-full flex-col justify-between py-2 space-y-4">
            <p className="text-xs font-semibold text-[var(--ink)] leading-relaxed">{breakfastText}</p>
            <button
              onClick={() => handleMealToggle('breakfast')}
              className={`flex items-center justify-center gap-2 rounded-full border p-2.5 text-xs font-bold transition ${
                mealsDone.breakfast
                  ? 'border-[#ff4d8b] bg-[#ff4d8b] text-white'
                  : 'border-[var(--hairline)] bg-[var(--canvas)] text-[var(--ink)] hover:bg-[var(--surface-soft)]'
              }`}
            >
              {mealsDone.breakfast ? <CheckSquare className="h-4 w-4 text-white" /> : <Square className="h-4 w-4 text-[var(--text-muted)]" />}
              <span>{mealsDone.breakfast ? 'Breakfast Completed' : 'Mark Completed'}</span>
            </button>
          </div>
        </Card>

        {/* Lunch */}
        <Card title="Lunch (01:00 PM)" subtitle="Protein & Complex Carbs" color="cream">
          <div className="flex h-full flex-col justify-between py-2 space-y-4">
            <p className="text-xs font-semibold text-[var(--ink)] leading-relaxed">{lunchText}</p>
            <button
              onClick={() => handleMealToggle('lunch')}
              className={`flex items-center justify-center gap-2 rounded-full border p-2.5 text-xs font-bold transition ${
                mealsDone.lunch
                  ? 'border-[#ff4d8b] bg-[#ff4d8b] text-white'
                  : 'border-[var(--hairline)] bg-[var(--canvas)] text-[var(--ink)] hover:bg-[var(--surface-soft)]'
              }`}
            >
              {mealsDone.lunch ? <CheckSquare className="h-4 w-4 text-white" /> : <Square className="h-4 w-4 text-[var(--text-muted)]" />}
              <span>{mealsDone.lunch ? 'Lunch Completed' : 'Mark Completed'}</span>
            </button>
          </div>
        </Card>

        {/* Evening Snack */}
        <Card title="Evening Snack (04:30 PM)" subtitle="Clean nourishment" color="cream">
          <div className="flex h-full flex-col justify-between py-2 space-y-4">
            <p className="text-xs font-semibold text-[var(--ink)] leading-relaxed">{snackText}</p>
            <button
              onClick={() => handleMealToggle('snack')}
              className={`flex items-center justify-center gap-2 rounded-full border p-2.5 text-xs font-bold transition ${
                mealsDone.snack
                  ? 'border-[#ff4d8b] bg-[#ff4d8b] text-white'
                  : 'border-[var(--hairline)] bg-[var(--canvas)] text-[var(--ink)] hover:bg-[var(--surface-soft)]'
              }`}
            >
              {mealsDone.snack ? <CheckSquare className="h-4 w-4 text-white" /> : <Square className="h-4 w-4 text-[var(--text-muted)]" />}
              <span>{mealsDone.snack ? 'Snack Completed' : 'Mark Completed'}</span>
            </button>
          </div>
        </Card>

        {/* Dinner */}
        <Card title="Dinner (07:00 PM)" subtitle="Balanced nutrition" color="cream">
          <div className="flex h-full flex-col justify-between py-2 space-y-4">
            <p className="text-xs font-semibold text-[var(--ink)] leading-relaxed">{dinnerText}</p>
            <button
              onClick={() => handleMealToggle('dinner')}
              className={`flex items-center justify-center gap-2 rounded-full border p-2.5 text-xs font-bold transition ${
                mealsDone.dinner
                  ? 'border-[#ff4d8b] bg-[#ff4d8b] text-white'
                  : 'border-[var(--hairline)] bg-[var(--canvas)] text-[var(--ink)] hover:bg-[var(--surface-soft)]'
              }`}
            >
              {mealsDone.dinner ? <CheckSquare className="h-4 w-4 text-white" /> : <Square className="h-4 w-4 text-[var(--text-muted)]" />}
              <span>{mealsDone.dinner ? 'Dinner Completed' : 'Mark Completed'}</span>
            </button>
          </div>
        </Card>
      </div>

      {/* Foods to Avoid Guidelines */}
      <Card title="Strict Dietary Restrictions" subtitle="Eliminate anti-productivity foods" color="cream">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 pt-2">
          {avoidFoods.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2.5 rounded-xl border border-[#ff4d8b]/30 bg-[#ff4d8b]/10 p-3 text-xs font-bold text-[var(--ink)]">
              <AlertOctagon className="h-4 w-4 text-[#ff4d8b] shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
