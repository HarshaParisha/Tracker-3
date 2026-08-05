import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { StatWidget } from '@/components/common/StatWidget';
import { Card } from '@/components/common/Card';
import {
  getTodayKey,
  getDayNumber,
  getStartDate,
  getRoutine,
  WATER_DAILY_GOAL,
  type RoutineBlock,
} from '@/utils/constants';
import { syncDailyRecordToSupabase } from '@/lib/supabase';

import {
  Flame,
  Droplets,
  CheckCircle2,
  Briefcase,
  Plus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface DashboardViewProps {
  isDark?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ isDark = true }) => {
  const todayKey = getTodayKey();
  const dayNumber = getDayNumber();
  const routine = getRoutine();

  const dailyRecord = useLiveQuery(() => db.dailyRecords.get(todayKey), [todayKey]);
  const allDailyRecords = useLiveQuery(() => db.dailyRecords.toArray(), []);
  const allJobApplications = useLiveQuery(() => db.jobApplications.toArray(), []);

  // Current stats calculation
  const waterIntake = dailyRecord?.water || 0;
  const routineDoneCount = dailyRecord?.routineDone?.length || 0;
  const routineTotal = routine.length;
  const routinePct = Math.round((routineDoneCount / routineTotal) * 100);
  const jobsCount = allJobApplications?.length || 0;

  // Streak calculation
  let streak = 0;
  const startDateStr = getStartDate();
  if (allDailyRecords) {
    const validDailyRecords = allDailyRecords.filter((r) => r.date >= startDateStr);
    const sorted = [...validDailyRecords].sort((a, b) => b.date.localeCompare(a.date));
    for (const r of sorted) {
      if (r.routineDone && r.routineDone.length >= 5) {
        streak++;
      } else {
        break;
      }
    }
  }

  // Generate 7-day chart data
  const chartData = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = d.toISOString().slice(0, 10);
    const isBeforeStart = k < startDateStr;
    const rec = isBeforeStart ? undefined : allDailyRecords?.find((r) => r.date === k);
    chartData.push({
      day: dayNames[d.getDay()],
      water: rec?.water || 0,
      tasksCompleted: rec?.routineDone?.length || 0,
    });
  }

  const handleQuickWaterAdd = async (amount: number) => {
    const current = await db.dailyRecords.get(todayKey);
    const newAmount = (current?.water || 0) + amount;
    const updatedRecord = {
      date: todayKey,
      water: newAmount,
      creatine: current?.creatine || 0,
      workout: current?.workout || null,
      mood: current?.mood || null,
      routineDone: current?.routineDone || [],
      mealsDone: current?.mealsDone || { breakfast: false, lunch: false, dinner: false, snack: false },
      groceryChecked: current?.groceryChecked || [],
    };
    await db.dailyRecords.put(updatedRecord);
    syncDailyRecordToSupabase(updatedRecord);
  };


  const gridStroke = isDark ? '#242430' : '#e5e5e5';
  const axisStroke = isDark ? '#a1a1aa' : '#6a6a6a';
  const tooltipBg = isDark ? '#181820' : '#0a0a0a';
  const tooltipText = '#ffffff';

  return (
    <div className="space-y-6">
      {/* High-Contrast Page Headline */}
      <div>
        <h2 className="font-['Space_Grotesk'] text-3xl font-extrabold tracking-tight text-[var(--ink)]">Executive Dashboard</h2>
        <p className="text-sm font-semibold text-[var(--text-muted)]">
          3-Month Execution & Performance Overview • Day {dayNumber} of 90
        </p>
      </div>

      {/* Saturated Clay Stat Widgets */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatWidget
          label="DAY STREAK"
          value={`${streak} Days`}
          subtext="Min 5 tasks daily"
          icon={Flame}
          color="pink"
        />
        <StatWidget
          label="DAILY WATER"
          value={`${waterIntake} / ${WATER_DAILY_GOAL} ml`}
          subtext={`${Math.round((waterIntake / WATER_DAILY_GOAL) * 100)}% of target`}
          icon={Droplets}
          color="lavender"
        />
        <StatWidget
          label="ROUTINE PROGRESS"
          value={`${routineDoneCount} / ${routineTotal}`}
          subtext={`${routinePct}% completed today`}
          icon={CheckCircle2}
          color="peach"
        />
        <StatWidget
          label="APPLICATIONS"
          value={jobsCount}
          subtext="Quality applications logged"
          icon={Briefcase}
          color="ochre"
        />
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Water Chart */}
        <Card title="Water Intake Trend (Last 7 Days)" subtitle="Target at 3,000 ml per day" color="cream">
          <div className="h-52 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="day" stroke={axisStroke} fontSize={11} tickLine={false} />
                <YAxis stroke={axisStroke} fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: tooltipBg, borderColor: gridStroke, borderRadius: '8px', color: tooltipText, fontSize: '12px' }}
                  formatter={(val: any) => [`${val ?? 0} ml`, 'Water']}
                />
                <Bar dataKey="water" fill="#b8a4ed" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-[var(--hairline)] pt-3">
            <span className="text-xs font-semibold text-[var(--text-muted)]">Quick Hydration Add:</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleQuickWaterAdd(250)}
                className="flex items-center gap-1 rounded-full border border-[var(--hairline)] bg-[var(--canvas)] px-3 py-1 text-xs font-bold text-[var(--ink)] hover:bg-[var(--surface-card)] transition"
              >
                <Plus className="h-3 w-3" /> 250ml
              </button>
              <button
                onClick={() => handleQuickWaterAdd(500)}
                className="flex items-center gap-1 rounded-full border border-[var(--hairline)] bg-[var(--canvas)] px-3 py-1 text-xs font-bold text-[var(--ink)] hover:bg-[var(--surface-card)] transition"
              >
                <Plus className="h-3 w-3" /> 500ml
              </button>
            </div>
          </div>
        </Card>

        {/* Routine Execution Chart */}
        <Card title="Routine Execution Trend" subtitle="Tasks completed out of daily routine blocks" color="cream">
          <div className="h-52 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                <XAxis dataKey="day" stroke={axisStroke} fontSize={11} tickLine={false} />
                <YAxis stroke={axisStroke} fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: tooltipBg, borderColor: gridStroke, borderRadius: '8px', color: tooltipText, fontSize: '12px' }}
                  formatter={(val: any) => [`${val ?? 0} tasks`, 'Completed']}
                />
                <Bar dataKey="tasksCompleted" fill="#ff4d8b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-[var(--hairline)] pt-3 text-xs font-semibold text-[var(--text-muted)]">
            <span>Execution Rate</span>
            <span className="font-mono text-[#ff4d8b] font-bold">{routinePct}% Completed Today</span>
          </div>
        </Card>
      </div>

      {/* Routine Timeline Preview */}
      <Card title="Today's Timeline Schedule" subtitle="Live routine execution log" color="cream">
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {routine.map((block: RoutineBlock) => {
            const isDone = dailyRecord?.routineDone?.includes(block.id);
            return (
              <div
                key={block.id}
                className={`flex items-center justify-between rounded-xl border p-3 text-xs font-medium transition ${
                  isDone
                    ? 'border-[#a4d4c5] bg-[#a4d4c5]/20 text-[var(--ink)]'
                    : 'border-[var(--hairline)] bg-[var(--canvas)] text-[var(--ink)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full border ${isDone ? 'border-[#ff4d8b] bg-[#ff4d8b] text-white' : 'border-[var(--text-muted)] text-transparent'}`}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="font-mono text-[11px] font-bold text-[var(--text-muted)] mr-2">{block.time}</span>
                    <span className={`font-bold ${isDone ? 'line-through text-[var(--text-muted)]' : 'text-[var(--ink)]'}`}>{block.title}</span>
                  </div>
                </div>
                <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline">{block.tasks.slice(0, 50)}...</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
