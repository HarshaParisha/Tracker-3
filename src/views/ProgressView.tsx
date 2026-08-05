import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { Card } from '@/components/common/Card';
import { StatWidget } from '@/components/common/StatWidget';
import { getStartDate } from '@/utils/constants';

import { Flame, Droplets, Briefcase, Calendar } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface ProgressViewProps {
  isDark?: boolean;
}

export const ProgressView: React.FC<ProgressViewProps> = ({ isDark = true }) => {
  const allDailyRecords = useLiveQuery(() => db.dailyRecords.toArray(), []);
  const allJobs = useLiveQuery(() => db.jobApplications.toArray(), []);

  const startDateStr = getStartDate();
  const validDailyRecords = allDailyRecords?.filter((r) => r.date >= startDateStr) || [];

  const totalDaysTracked = validDailyRecords.length;
  const avgWater = validDailyRecords.length
    ? Math.round(validDailyRecords.reduce((sum, r) => sum + (r.water || 0), 0) / validDailyRecords.length)
    : 0;

  // Best streak
  let bestStreak = 0;
  let currentStreak = 0;
  if (validDailyRecords.length > 0) {
    const sorted = [...validDailyRecords].sort((a, b) => a.date.localeCompare(b.date));
    for (const r of sorted) {
      if (r.routineDone && r.routineDone.length >= 5) {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
  }

  // Generate 90-day matrix cells
  const heatmapCells = [];
  for (let i = 0; i < 90; i++) {
    const d = new Date(startDateStr);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const record = validDailyRecords.find((r) => r.date === dateStr);
    const count = record?.routineDone?.length || 0;


    let intensity = isDark
      ? 'bg-[#181820] border-[#272732] text-zinc-500 hover:border-zinc-400/40'
      : 'bg-[#f4efdf] border-[#e2dccb] text-zinc-400 hover:border-zinc-400/60';
    if (count >= 15) intensity = 'bg-[#10b981] border-[#10b981] text-[#022c22] font-black shadow-xs';
    else if (count >= 10) intensity = 'bg-[#ff4d8b] border-[#ff4d8b] text-white font-bold shadow-xs';
    else if (count >= 5) intensity = 'bg-[#ffb084] border-[#ffb084] text-[#0a0a0a] font-bold shadow-xs';
    else if (count >= 1) intensity = 'bg-[#b8a4ed] border-[#b8a4ed] text-[#0a0a0a] font-bold shadow-xs';

    heatmapCells.push({
      dayNum: i + 1,
      date: dateStr,
      count,
      intensity,
    });
  }

  // Monthly Weekly averages calculation
  const getMonthChartData = (monthIdx: number) => {
    const startDay = monthIdx * 30;
    const weeksData = [];
    for (let w = 0; w < 4; w++) {
      let sumTasks = 0;
      let dayCount = 0;
      for (let d = 0; d < 7; d++) {
        const targetDate = new Date(startDateStr);

        targetDate.setDate(targetDate.getDate() + startDay + w * 7 + d);
        const dateStr = targetDate.toISOString().slice(0, 10);
        if (dateStr < startDateStr) continue;
        const record = validDailyRecords.find((r) => r.date === dateStr);
        if (record) {
          sumTasks += record.routineDone?.length || 0;
          dayCount++;
        }
      }
      weeksData.push({
        week: `Week ${w + 1}`,
        avgTasks: dayCount > 0 ? Math.round(sumTasks / dayCount) : 0,
      });
    }
    return weeksData;
  };

  const monthBarColors = ['#ff4d8b', '#a4d4c5', '#e8b94a'];
  const gridStroke = isDark ? '#223838' : '#e5e5e5';
  const axisStroke = isDark ? '#9ca3af' : '#6a6a6a';
  const tooltipBg = isDark ? '#050d0d' : '#0a0a0a';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-['Space_Grotesk'] text-3xl font-extrabold tracking-tight text-[var(--ink)]">3-Month Progress Card</h2>
        <p className="text-sm font-medium text-[var(--text-muted)]">90-Day Execution Matrix Heatmap & Consistency Benchmarks</p>
      </div>

      {/* Overview Saturated Stat Widgets */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatWidget
          label="DAYS LOGGED"
          value={`${totalDaysTracked} / 90`}
          subtext="Active days tracked"
          icon={Calendar}
          color="lavender"
        />
        <StatWidget
          label="LONGEST STREAK"
          value={`${bestStreak} Days`}
          subtext="High consistency streak"
          icon={Flame}
          color="pink"
        />
        <StatWidget
          label="AVG HYDRATION"
          value={`${avgWater} ml`}
          subtext="Daily average water"
          icon={Droplets}
          color="mint"
        />
        <StatWidget
          label="APPLICATIONS"
          value={allJobs?.length || 0}
          subtext="Career pipeline volume"
          icon={Briefcase}
          color="ochre"
        />
      </div>

      {/* 90-Day Activity Matrix Heatmap */}
      <Card title="90-Day Activity Heatmap Matrix" subtitle="Daily routine execution intensity over the 3-month plan" color="cream">
        <div className="pt-2">
          <div className="grid grid-cols-10 gap-1.5 sm:grid-cols-15 md:grid-cols-18 lg:grid-cols-30">
            {heatmapCells.map((cell) => (
              <div
                key={cell.dayNum}
                title={`Day ${cell.dayNum} (${cell.date}): ${cell.count} tasks executed`}
                className={`h-5 w-full rounded-md border text-[9px] font-mono flex items-center justify-center transition hover:scale-110 cursor-pointer ${cell.intensity}`}
              >
                {cell.dayNum}
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-[var(--text-muted)] border-t border-[var(--hairline)] pt-3">
            <span className="font-mono text-[11px] font-bold">LOW INTENSITY</span>
            <div className="flex items-center gap-1.5 font-mono text-[10px]">
              <span className={`h-3 w-3 rounded border ${isDark ? 'bg-[#181820] border-[#272732]' : 'bg-[#f4efdf] border-[#e2dccb]'}`} title="0 tasks executed"></span>
              <span className="h-3 w-3 rounded bg-[#b8a4ed] border border-[#b8a4ed]" title="1-4 tasks executed"></span>
              <span className="h-3 w-3 rounded bg-[#ffb084] border border-[#ffb084]" title="5-9 tasks executed"></span>
              <span className="h-3 w-3 rounded bg-[#ff4d8b] border border-[#ff4d8b]" title="10-14 tasks executed"></span>
              <span className="h-3 w-3 rounded bg-[#10b981] border border-[#10b981]" title="15+ tasks executed"></span>
            </div>
            <span className="font-mono text-[11px] font-bold">HIGH INTENSITY</span>
          </div>
        </div>
      </Card>

      {/* Monthly Breakdown Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[0, 1, 2].map((monthIdx) => (
          <Card key={monthIdx} title={`Month ${monthIdx + 1} Execution`} subtitle="Weekly task completion averages" color="cream">
            <div className="h-44 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getMonthChartData(monthIdx)} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />
                  <XAxis dataKey="week" stroke={axisStroke} fontSize={10} tickLine={false} />
                  <YAxis stroke={axisStroke} fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBg, borderRadius: '8px', color: '#ffffff', fontSize: '11px' }}
                    formatter={(val: any) => [`${val ?? 0} tasks/day`, 'Average']}
                  />
                  <Bar dataKey="avgTasks" fill={monthBarColors[monthIdx]} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
