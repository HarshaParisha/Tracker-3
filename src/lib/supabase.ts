import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { db, type DailyRecord, type LearningRecord, type JournalEntry, type JobApplication, type CustomGroceryItem } from '@/db/database';

export const DEFAULT_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const DEFAULT_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export function getSupabaseCredentials(): { url: string; key: string } {
  if (typeof window !== 'undefined') {
    const url = localStorage.getItem('tracker_supabase_url') || import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const key = localStorage.getItem('tracker_supabase_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
    return { url, key };
  }
  return { url: DEFAULT_SUPABASE_URL, key: DEFAULT_SUPABASE_ANON_KEY };
}

export function setSupabaseCredentials(url: string, key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('tracker_supabase_url', url);
    localStorage.setItem('tracker_supabase_key', key);
    supabaseInstance = null;
  }
}

export function clearSupabaseCredentials(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('tracker_supabase_url');
    localStorage.removeItem('tracker_supabase_key');
    supabaseInstance = null;
  }
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  const creds = getSupabaseCredentials();
  if (!supabaseInstance) {
    supabaseInstance = createClient(creds.url, creds.key);
  }
  return supabaseInstance;
}

export async function checkSupabaseConnection(): Promise<{ connected: boolean; url: string; error?: string }> {
  try {
    const client = getSupabaseClient();
    const creds = getSupabaseCredentials();
    if (!creds.url || !creds.key) {
      return { connected: false, url: '', error: 'Missing Supabase credentials in .env' };
    }
    const { error } = await client.from('daily_records').select('date').limit(1);

    if (error && error.code !== 'PGRST116' && !error.message.includes('relation "public.daily_records" does not exist')) {
      return { connected: false, url: creds.url, error: error.message };
    }

    return { connected: true, url: creds.url };
  } catch (err: any) {
    const creds = getSupabaseCredentials();
    return { connected: false, url: creds.url, error: err?.message || 'Connection failed' };
  }
}

// ============================================================================
// AUTOMATED BACKGROUND ITEM SYNC ROUTINES
// ============================================================================

export async function syncDailyRecordToSupabase(record: DailyRecord): Promise<void> {
  try {
    const creds = getSupabaseCredentials();
    if (!creds.url || !creds.key) return;
    const client = getSupabaseClient();
    await client.from('daily_records').upsert({
      date: record.date,
      water: record.water,
      creatine: record.creatine,
      workout: record.workout,
      mood: record.mood,
      routine_done: record.routineDone,
      meals_done: record.mealsDone,
      grocery_checked: record.groceryChecked,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'date' });
  } catch {
    // Silent background fallback
  }
}

export async function syncLearningRecordToSupabase(record: LearningRecord): Promise<void> {
  try {
    const creds = getSupabaseCredentials();
    if (!creds.url || !creds.key) return;
    const client = getSupabaseClient();
    await client.from('learning_records').upsert({
      date: record.date,
      dsa_concepts: record.dsaConcepts,
      dsa_problems: record.dsaProblems,
      python_concepts: record.pythonConcepts,
      revision: record.revision,
      market_insights: record.marketInsights,
      book_title: record.bookTitle,
      book_takeaways: record.bookTakeaways,
      ai_tools_notes: record.aiToolsNotes,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'date' });
  } catch {
    // Silent background fallback
  }
}

export async function syncJournalEntryToSupabase(entry: JournalEntry): Promise<void> {
  try {
    const creds = getSupabaseCredentials();
    if (!creds.url || !creds.key) return;
    const client = getSupabaseClient();
    await client.from('journal_entries').upsert({
      date: entry.date,
      title: entry.title || '',
      content: entry.content || entry.free || '',
      wins: entry.wins || '',
      mistakes: entry.mistakes || '',
      lessons: entry.lessons || '',
      gratitude: entry.gratitude || '',
      tomorrow: entry.tomorrow || '',
      free: entry.free || entry.content || '',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'date' });
  } catch {
    // Silent background fallback
  }
}

export async function syncJobApplicationToSupabase(app: JobApplication): Promise<void> {
  try {
    const creds = getSupabaseCredentials();
    if (!creds.url || !creds.key) return;
    const client = getSupabaseClient();
    await client.from('job_applications').upsert({
      id: app.id,
      company: app.company,
      role: app.role,
      status: app.status,
      date: app.date,
      notes: app.notes,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
  } catch {
    // Silent background fallback
  }
}

export async function deleteJobApplicationFromSupabase(id: string): Promise<void> {
  try {
    const creds = getSupabaseCredentials();
    if (!creds.url || !creds.key) return;
    const client = getSupabaseClient();
    await client.from('job_applications').delete().eq('id', id);
  } catch {
    // Silent background fallback
  }
}

export async function syncCustomGroceryItemToSupabase(item: CustomGroceryItem): Promise<void> {
  try {
    const creds = getSupabaseCredentials();
    if (!creds.url || !creds.key) return;
    const client = getSupabaseClient();
    await client.from('custom_grocery_items').upsert({
      id: item.id,
      name: item.name,
      category: item.category,
      checked: item.checked,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
  } catch {
    // Silent background fallback
  }
}

// ============================================================================
// FULL BULK SYNC & INITIAL LOAD PULL
// ============================================================================

export async function syncLocalToSupabase(): Promise<{ success: boolean; message: string }> {
  const creds = getSupabaseCredentials();
  if (!creds.url || !creds.key) {
    return { success: false, message: 'Missing Supabase credentials in .env' };
  }
  const client = getSupabaseClient();

  try {
    const dailyRecords = await db.dailyRecords.toArray();
    const learningRecords = await db.learningRecords.toArray();
    const journalEntries = await db.journalEntries.toArray();
    const jobApplications = await db.jobApplications.toArray();
    const customGroceryItems = await db.customGroceryItems.toArray();

    if (dailyRecords.length > 0) {
      await client.from('daily_records').upsert(
        dailyRecords.map((r) => ({
          date: r.date,
          water: r.water,
          creatine: r.creatine,
          workout: r.workout,
          mood: r.mood,
          routine_done: r.routineDone,
          meals_done: r.mealsDone,
          grocery_checked: r.groceryChecked,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: 'date' }
      );
    }

    if (learningRecords.length > 0) {
      await client.from('learning_records').upsert(
        learningRecords.map((r) => ({
          date: r.date,
          dsa_concepts: r.dsaConcepts,
          dsa_problems: r.dsaProblems,
          python_concepts: r.pythonConcepts,
          revision: r.revision,
          market_insights: r.marketInsights,
          book_title: r.bookTitle,
          book_takeaways: r.bookTakeaways,
          ai_tools_notes: r.aiToolsNotes,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: 'date' }
      );
    }

    if (journalEntries.length > 0) {
      await client.from('journal_entries').upsert(
        journalEntries.map((r) => ({
          date: r.date,
          wins: r.wins,
          mistakes: r.mistakes,
          lessons: r.lessons,
          gratitude: r.gratitude,
          tomorrow: r.tomorrow,
          free: r.free,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: 'date' }
      );
    }

    if (jobApplications.length > 0) {
      await client.from('job_applications').upsert(
        jobApplications.map((r) => ({
          id: r.id,
          company: r.company,
          role: r.role,
          status: r.status,
          date: r.date,
          notes: r.notes,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: 'id' }
      );
    }

    if (customGroceryItems.length > 0) {
      await client.from('custom_grocery_items').upsert(
        customGroceryItems.map((r) => ({
          id: r.id,
          name: r.name,
          category: r.category,
          checked: r.checked,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: 'id' }
      );
    }

    return { success: true, message: 'Supabase Cloud Database Synced Successfully! ✓' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Sync failed' };
  }
}

export async function pullSupabaseToLocal(): Promise<void> {
  try {
    const creds = getSupabaseCredentials();
    if (!creds.url || !creds.key) return;
    const client = getSupabaseClient();

    // 1. Pull Daily Records
    const { data: dailyData } = await client.from('daily_records').select('*');
    if (dailyData && dailyData.length > 0) {
      const records: DailyRecord[] = dailyData.map((d: any) => ({
        date: d.date,
        water: d.water || 0,
        creatine: d.creatine || 0,
        workout: d.workout || null,
        mood: d.mood || null,
        routineDone: d.routine_done || [],
        mealsDone: d.meals_done || { breakfast: false, lunch: false, dinner: false, snack: false },
        groceryChecked: d.grocery_checked || [],
      }));
      await db.dailyRecords.bulkPut(records);
    }

    // 2. Pull Learning Records
    const { data: learningData } = await client.from('learning_records').select('*');
    if (learningData && learningData.length > 0) {
      const records: LearningRecord[] = learningData.map((l: any) => ({
        date: l.date,
        dsaConcepts: l.dsa_concepts || '',
        dsaProblems: l.dsa_problems || 0,
        pythonConcepts: l.python_concepts || '',
        revision: l.revision || { dsa: false, python: false, notes: false },
        marketInsights: l.market_insights || '',
        bookTitle: l.book_title || '',
        bookTakeaways: l.book_takeaways || '',
        aiToolsNotes: l.ai_tools_notes || '',
      }));
      await db.learningRecords.bulkPut(records);
    }

    // 3. Pull Journal Entries
    const { data: journalData } = await client.from('journal_entries').select('*');
    if (journalData && journalData.length > 0) {
      const records: JournalEntry[] = journalData.map((j: any) => ({
        date: j.date,
        wins: j.wins || '',
        mistakes: j.mistakes || '',
        lessons: j.lessons || '',
        gratitude: j.gratitude || '',
        tomorrow: j.tomorrow || '',
        free: j.free || '',
      }));
      await db.journalEntries.bulkPut(records);
    }

    // 4. Pull Job Applications
    const { data: jobData } = await client.from('job_applications').select('*');
    if (jobData && jobData.length > 0) {
      const records: JobApplication[] = jobData.map((a: any) => ({
        id: a.id,
        company: a.company,
        role: a.role,
        status: a.status,
        date: a.date,
        notes: a.notes || '',
      }));
      await db.jobApplications.bulkPut(records);
    }
  } catch {
    // Silent background pull fallback
  }
}
