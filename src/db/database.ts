import Dexie, { type Table } from 'dexie';

export interface DailyRecord {
  date: string; // Key: YYYY-MM-DD
  water: number; // in ml
  creatine: number; // in grams (0 or 5)
  workout: string | null; // 'yes' | 'no' | null
  mood: string | null; // 'great' | 'good' | 'okay' | 'low' | 'bad'
  routineDone: number[]; // indices of completed routine blocks
  mealsDone: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
    snack: boolean;
  };
  groceryChecked: string[]; // checked grocery keys
}

export interface LearningRecord {
  date: string; // Key: YYYY-MM-DD
  dsaConcepts: string;
  dsaProblems: number;
  pythonConcepts: string;
  revision: {
    dsa: boolean;
    python: boolean;
    notes: boolean;
  };
  marketInsights: string;
  bookTitle: string;
  bookTakeaways: string;
  aiToolsNotes: string;
}

export interface JournalEntry {
  date: string; // Key: YYYY-MM-DD
  wins: string;
  mistakes: string;
  lessons: string;
  gratitude: string;
  tomorrow: string;
  free: string;
}

export interface JobApplication {
  id: string; // Key
  company: string;
  role: string;
  status:
    | 'applied'
    | 'shortlisted'
    | 'assessment'
    | 'screening'
    | 'interview'
    | 'hr_round'
    | 'offer'
    | 'rejected'
    | 'withdrawn'
    | 'joined';
  date: string; // YYYY-MM-DD
  notes?: string;
}

export interface CustomGroceryItem {
  id: string;
  name: string;
  category: 'veg' | 'fruit' | 'protein' | 'carbs' | 'custom';
  checked: boolean;
}

export class TransformationDatabase extends Dexie {
  dailyRecords!: Table<DailyRecord, string>;
  learningRecords!: Table<LearningRecord, string>;
  journalEntries!: Table<JournalEntry, string>;
  jobApplications!: Table<JobApplication, string>;
  customGroceryItems!: Table<CustomGroceryItem, string>;

  constructor() {
    super('TransformationTrackerDB');
    this.version(1).stores({
      dailyRecords: 'date',
      learningRecords: 'date',
      journalEntries: 'date',
      jobApplications: 'id, company, status, date',
      customGroceryItems: 'id, category',
    });
  }
}

export const db = new TransformationDatabase();
