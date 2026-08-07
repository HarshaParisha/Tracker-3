import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type JobApplication } from '@/db/database';
import { Card } from '@/components/common/Card';
import { getTodayKey } from '@/utils/constants';
import { syncJobApplicationToSupabase, deleteJobApplicationFromSupabase, pullSupabaseToLocal } from '@/lib/supabase';
import { Plus, Trash2, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

interface JobsViewProps {
  isDark?: boolean;
}

const ITEMS_PER_PAGE = 6;

export const JobsView: React.FC<JobsViewProps> = () => {
  const todayKey = getTodayKey();
  const allApplications = useLiveQuery(() => db.jobApplications.toArray(), []);

  // Auto pull from Supabase on view mount & window focus
  useEffect(() => {
    pullSupabaseToLocal();
    const handleFocus = () => pullSupabaseToLocal();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState<JobApplication['status']>('applied');
  const [date, setDate] = useState(todayKey);
  const [notes, setNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const handleAddApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;

    const newApp: JobApplication = {
      id: `job-${Date.now()}`,
      company: company.trim(),
      role: role.trim(),
      status,
      date,
      notes: notes.trim(),
    };

    await db.jobApplications.add(newApp);
    syncJobApplicationToSupabase(newApp);

    setCompany('');
    setRole('');
    setNotes('');
    setCurrentPage(1); // Jump to first page to see the newly logged application
  };

  const handleDelete = async (id: string) => {
    await db.jobApplications.delete(id);
    deleteJobApplicationFromSupabase(id);
  };

  const handleStatusChange = async (id: string, newStatus: JobApplication['status']) => {
    await db.jobApplications.update(id, { status: newStatus });
    const updated = await db.jobApplications.get(id);
    if (updated) syncJobApplicationToSupabase(updated);
  };

  // Sort applications Newest to Oldest (New to Old)
  const sortedApps = (allApplications || []).slice().sort((a, b) => {
    if (b.date !== a.date) {
      return b.date.localeCompare(a.date);
    }
    return b.id.localeCompare(a.id);
  });

  // Filter by status
  const filteredApps = sortedApps.filter((app) => {
    if (filterStatus === 'all') return true;
    return app.status === filterStatus;
  });

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredApps.length / ITEMS_PER_PAGE));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedApps = filteredApps.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getStatusBadge = (s: JobApplication['status']) => {
    const badgeStyles: Record<JobApplication['status'], string> = {
      applied: 'border-[#b8a4ed] bg-[#b8a4ed] text-[#0a0a0a]',
      shortlisted: 'border-[#70a1ff] bg-[#70a1ff] text-[#0a0a0a]',
      assessment: 'border-[#e8b94a] bg-[#e8b94a] text-[#0a0a0a]',
      screening: 'border-[#ffb084] bg-[#ffb084] text-[#0a0a0a]',
      interview: 'border-[#ff4d8b] bg-[#ff4d8b] text-white',
      hr_round: 'border-[#a55eea] bg-[#a55eea] text-white',
      offer: 'border-[#a4d4c5] bg-[#a4d4c5] text-[#0a0a0a]',
      rejected: 'border-[var(--hairline)] bg-[var(--surface-soft)] text-[var(--text-muted)]',
      withdrawn: 'border-slate-500 bg-slate-500 text-white',
      joined: 'border-[#2ed573] bg-[#2ed573] text-[#0a0a0a]',
    };
    return badgeStyles[s] || badgeStyles.applied;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-['Space_Grotesk'] text-3xl font-extrabold tracking-tight text-[var(--ink)]">Job Applications Pipeline</h2>
          <p className="text-sm font-semibold text-[var(--text-muted)]">03:30 – 04:00 PM Daily Goal • Targeted Applications & Status History</p>
        </div>
        <span className="font-mono text-xs font-bold text-[#0a0a0a] bg-[#e8b94a] px-3.5 py-1.5 rounded-full border border-[#e8b94a]">
          {allApplications?.length || 0} Total Applied
        </span>
      </div>

      {/* Add Application Card */}
      <Card title="Add Opportunity" subtitle="Log application details and target company" color="cream">
        <form onSubmit={handleAddApplication} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-[11px] font-bold text-[var(--ink)] uppercase tracking-wider mb-1">Company</label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company Name"
                className="w-full rounded-xl border border-[var(--hairline)] bg-[var(--canvas)] p-2.5 text-xs font-semibold text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[var(--ink)] uppercase tracking-wider mb-1">Role / Position</label>
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Software Engineer, Product..."
                className="w-full rounded-xl border border-[var(--hairline)] bg-[var(--canvas)] p-2.5 text-xs font-semibold text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[var(--ink)] uppercase tracking-wider mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as JobApplication['status'])}
                className="w-full rounded-xl border border-[var(--hairline)] bg-[var(--canvas)] p-2.5 text-xs font-semibold text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
              >
                <option value="applied" className="bg-[var(--canvas)] text-[var(--ink)]">Applied</option>
                <option value="shortlisted" className="bg-[var(--canvas)] text-[var(--ink)]">Shortlisted</option>
                <option value="assessment" className="bg-[var(--canvas)] text-[var(--ink)]">Assessment</option>
                <option value="screening" className="bg-[var(--canvas)] text-[var(--ink)]">Screening</option>
                <option value="interview" className="bg-[var(--canvas)] text-[var(--ink)]">Interview</option>
                <option value="hr_round" className="bg-[var(--canvas)] text-[var(--ink)]">HR Round</option>
                <option value="offer" className="bg-[var(--canvas)] text-[var(--ink)]">Offer</option>
                <option value="rejected" className="bg-[var(--canvas)] text-[var(--ink)]">Rejected</option>
                <option value="withdrawn" className="bg-[var(--canvas)] text-[var(--ink)]">Withdrawn</option>
                <option value="joined" className="bg-[var(--canvas)] text-[var(--ink)]">Joined</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[var(--ink)] uppercase tracking-wider mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-[var(--hairline)] bg-[var(--canvas)] p-2.5 text-xs font-semibold text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (Referral contact, tech stack, job link...)"
              className="flex-1 rounded-xl border border-[var(--hairline)] bg-[var(--canvas)] p-2.5 text-xs text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none"
            />
            <button
              type="submit"
              className="flex items-center justify-center gap-1.5 rounded-full bg-[#ff4d8b] px-6 py-2.5 text-xs font-bold text-white hover:opacity-90 transition shrink-0 shadow-sm min-h-[42px]"
            >
              <Plus className="h-4 w-4" />
              <span>Log Application</span>
            </button>
          </div>
        </form>
      </Card>

      {/* Applications Table Card with 6-line Newest-to-Oldest Pagination */}
      <Card
        title="Application History Pipeline"
        color="cream"
        action={
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-[var(--text-muted)]" />
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-full border border-[var(--hairline)] bg-[var(--canvas)] px-3 py-1 text-xs font-semibold text-[var(--ink)] focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="applied">Applied</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="assessment">Assessment</option>
              <option value="screening">Screening</option>
              <option value="interview">Interview</option>
              <option value="hr_round">HR Round</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
              <option value="joined">Joined</option>
            </select>
          </div>
        }
      >
        {/* 1. Mobile Cards Layout (Strictly visible on screens < 640px) */}
        <div className="space-y-3 sm:hidden">
          {paginatedApps.map((app) => (
            <div key={app.id} className="rounded-xl border border-[var(--hairline)] bg-[var(--canvas)] p-3.5 space-y-2.5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-['Space_Grotesk'] text-base font-extrabold text-[var(--ink)] block">{app.company}</span>
                  <span className="text-xs font-semibold text-[var(--text-body)] block mt-0.5">{app.role}</span>
                </div>
                <div className="shrink-0">
                  <select
                    value={app.status}
                    onChange={(e) => handleStatusChange(app.id, e.target.value as JobApplication['status'])}
                    className={`rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider focus:outline-none cursor-pointer ${getStatusBadge(app.status)}`}
                  >
                    <option value="applied" className="bg-[var(--canvas)] text-[var(--ink)]">Applied</option>
                    <option value="shortlisted" className="bg-[var(--canvas)] text-[var(--ink)]">Shortlisted</option>
                    <option value="assessment" className="bg-[var(--canvas)] text-[var(--ink)]">Assessment</option>
                    <option value="screening" className="bg-[var(--canvas)] text-[var(--ink)]">Screening</option>
                    <option value="interview" className="bg-[var(--canvas)] text-[var(--ink)]">Interview</option>
                    <option value="hr_round" className="bg-[var(--canvas)] text-[var(--ink)]">HR Round</option>
                    <option value="offer" className="bg-[var(--canvas)] text-[var(--ink)]">Offer</option>
                    <option value="rejected" className="bg-[var(--canvas)] text-[var(--ink)]">Rejected</option>
                    <option value="withdrawn" className="bg-[var(--canvas)] text-[var(--ink)]">Withdrawn</option>
                    <option value="joined" className="bg-[var(--canvas)] text-[var(--ink)]">Joined</option>
                  </select>
                </div>
              </div>

              {app.notes && (
                <p className="text-xs text-[var(--text-muted)] bg-[var(--surface-soft)] p-2 rounded-lg font-medium">
                  {app.notes}
                </p>
              )}

              <div className="flex items-center justify-between border-t border-[var(--hairline)] pt-2 text-[11px]">
                <span className="font-mono font-bold text-[var(--text-muted)]">Applied: {app.date}</span>
                <button
                  onClick={() => handleDelete(app.id)}
                  className="flex items-center gap-1 text-[var(--text-muted)] hover:text-[#ff4d8b] font-semibold transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
          {filteredApps.length === 0 && (
            <p className="py-8 text-center text-xs font-medium text-[var(--text-muted)]">No application records found.</p>
          )}
        </div>

        {/* 2. Desktop/Laptop Table Layout (Strictly visible on screens >= 640px) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--hairline)] text-[10px] font-mono font-bold uppercase text-[var(--text-muted)]">
                <th className="pb-3 pt-1 whitespace-nowrap">Date</th>
                <th className="pb-3 pt-1 whitespace-nowrap">Company</th>
                <th className="pb-3 pt-1 whitespace-nowrap">Role</th>
                <th className="pb-3 pt-1 whitespace-nowrap">Status</th>
                <th className="pb-3 pt-1">Notes</th>
                <th className="pb-3 pt-1 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--hairline)]">
              {paginatedApps.map((app) => (
                <tr key={app.id} className="hover:bg-[var(--surface-soft)] transition">
                  <td className="py-3 font-mono text-[11px] font-bold text-[var(--text-muted)] whitespace-nowrap pr-4">{app.date}</td>
                  <td className="py-3 font-extrabold text-[var(--ink)] whitespace-nowrap pr-4">{app.company}</td>
                  <td className="py-3 text-[var(--text-body)] font-medium whitespace-nowrap pr-4">{app.role}</td>
                  <td className="py-3 whitespace-nowrap pr-4">
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app.id, e.target.value as JobApplication['status'])}
                      className={`rounded-full border px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider focus:outline-none cursor-pointer ${getStatusBadge(app.status)}`}
                    >
                      <option value="applied" className="bg-[var(--canvas)] text-[var(--ink)]">Applied</option>
                      <option value="shortlisted" className="bg-[var(--canvas)] text-[var(--ink)]">Shortlisted</option>
                      <option value="assessment" className="bg-[var(--canvas)] text-[var(--ink)]">Assessment</option>
                      <option value="screening" className="bg-[var(--canvas)] text-[var(--ink)]">Screening</option>
                      <option value="interview" className="bg-[var(--canvas)] text-[var(--ink)]">Interview</option>
                      <option value="hr_round" className="bg-[var(--canvas)] text-[var(--ink)]">HR Round</option>
                      <option value="offer" className="bg-[var(--canvas)] text-[var(--ink)]">Offer</option>
                      <option value="rejected" className="bg-[var(--canvas)] text-[var(--ink)]">Rejected</option>
                      <option value="withdrawn" className="bg-[var(--canvas)] text-[var(--ink)]">Withdrawn</option>
                      <option value="joined" className="bg-[var(--canvas)] text-[var(--ink)]">Joined</option>
                    </select>
                  </td>
                  <td className="py-3 text-[var(--text-muted)] max-w-xs truncate">{app.notes || '—'}</td>
                  <td className="py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleDelete(app.id)}
                      className="text-[var(--text-muted)] hover:text-[#ff4d8b] transition p-1"
                      title="Delete application"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredApps.length === 0 && (
            <p className="py-8 text-center text-xs font-medium text-[var(--text-muted)]">No application records found.</p>
          )}
        </div>

        {/* 3. Responsive 6-Line Pagination Bar */}
        {filteredApps.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[var(--hairline)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="font-mono text-[11px] font-bold text-[var(--text-muted)]">
              Showing <span className="text-[var(--ink)] font-extrabold">{startIndex + 1}</span>–
              <span className="text-[var(--ink)] font-extrabold">{Math.min(startIndex + ITEMS_PER_PAGE, filteredApps.length)}</span> of{' '}
              <span className="text-[var(--ink)] font-extrabold">{filteredApps.length}</span> applications
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validCurrentPage === 1}
                className="flex items-center gap-1 rounded-xl border border-[var(--hairline)] bg-[var(--surface-soft)] px-3 py-1.5 text-xs font-bold text-[var(--ink)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--surface-card)] active:scale-95 transition"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Prev</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`h-8 w-8 rounded-xl text-xs font-mono font-bold transition active:scale-95 flex items-center justify-center shrink-0 ${
                    validCurrentPage === pageNum
                      ? 'bg-[#ff4d8b] text-white shadow-xs font-extrabold scale-105'
                      : 'border border-[var(--hairline)] bg-[var(--surface-soft)] text-[var(--ink)] hover:bg-[var(--surface-card)]'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validCurrentPage === totalPages}
                className="flex items-center gap-1 rounded-xl border border-[var(--hairline)] bg-[var(--surface-soft)] px-3 py-1.5 text-xs font-bold text-[var(--ink)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--surface-card)] active:scale-95 transition"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
