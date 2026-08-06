import { notificationService } from '@/services/notificationService';
import { getTodayKey } from '@/utils/constants';

export interface ScheduledReminder {
  time: string; // HH:MM (24h format)
  title: string;
  body: string;
  daysOfWeek?: number[]; // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
  dayOfMonth?: number; // 1 = 1st of month
}

const WEEKDAYS = [1, 2, 3, 4, 5]; // Mon - Fri
const WEEKENDS = [0, 6]; // Sun, Sat

const ROUTINE_REMINDERS: ScheduledReminder[] = [
  // =========================================================================
  // 1. MONDAY – FRIDAY WORKDAY SCHEDULE
  // =========================================================================
  {
    time: '05:00',
    title: 'Wake Up 🌅',
    body: 'Start your day. Drink 1 glass of water.',
    daysOfWeek: WEEKDAYS,
  },
  {
    time: '05:20',
    title: 'Head to Ground 🏃',
    body: 'Time for walking, jogging & fitness.',
    daysOfWeek: WEEKDAYS,
  },
  {
    time: '06:30',
    title: 'Return Home 🏡',
    body: 'Freshen up & enjoy breakfast.',
    daysOfWeek: WEEKDAYS,
  },
  {
    time: '08:30',
    title: 'Take Creatine 💊',
    body: '3–5 g creatine dose with water.',
    daysOfWeek: WEEKDAYS,
  },
  {
    time: '08:45',
    title: 'Finish Breakfast 🍳',
    body: 'Wrap up breakfast & prepare mentally for work.',
    daysOfWeek: WEEKDAYS,
  },
  {
    time: '09:50',
    title: 'Deep Work in 10 Mins ⚡',
    body: 'Remove distractions. Lock in.',
    daysOfWeek: WEEKDAYS,
  },
  {
    time: '10:50',
    title: 'Drink Water 💧',
    body: 'Stretch 5 mins & stay hydrated.',
    daysOfWeek: WEEKDAYS,
  },
  {
    time: '11:50',
    title: 'Drink Water 💧',
    body: 'Hydrate & refresh your mind.',
    daysOfWeek: WEEKDAYS,
  },
  {
    time: '12:50',
    title: 'Lunch Time 🍲',
    body: 'Eat well & spend time with family.',
    daysOfWeek: WEEKDAYS,
  },
  {
    time: '13:30',
    title: 'Time for DSA 💻',
    body: '30 mins problem solving. Also drink water 💧',
    daysOfWeek: WEEKDAYS,
  },
  {
    time: '14:00',
    title: 'Python Session 🐍',
    body: '30 mins hands-on coding.',
    daysOfWeek: WEEKDAYS,
  },
  {
    time: '14:30',
    title: 'Quick Revision 🧠',
    body: 'Review your DSA & Python notes.',
    daysOfWeek: WEEKDAYS,
  },
  {
    time: '15:00',
    title: 'Market Research 🚀',
    body: 'Explore AI, Tech, Startups & Business.',
    daysOfWeek: WEEKDAYS,
  },
  {
    time: '15:30',
    title: 'Apply for Jobs 💼',
    body: 'Log your daily targeted applications.',
    daysOfWeek: WEEKDAYS,
  },
  {
    time: '16:00',
    title: 'Read Your Book 📚',
    body: '30 mins of focused reading.',
    daysOfWeek: WEEKDAYS,
  },
  {
    time: '16:30',
    title: 'Go Outside 🍎',
    body: 'Outdoor walk & healthy snack time.',
    daysOfWeek: WEEKDAYS,
  },
  {
    time: '17:30',
    title: 'Return Home 🏡',
    body: 'Freshen up.',
    daysOfWeek: WEEKDAYS,
  },
  {
    time: '18:00',
    title: 'Temple Time 🙏',
    body: 'Hanuman Chalisa & calm reflection.',
    daysOfWeek: WEEKDAYS,
  },
  {
    time: '19:00',
    title: 'Dinner & Family 🍽️',
    body: 'Phone-free quality family time.',
    daysOfWeek: WEEKDAYS,
  },
  {
    time: '19:30',
    title: 'Drink Water 💧',
    body: 'Hydrate after dinner.',
    daysOfWeek: WEEKDAYS,
  },
  {
    time: '20:00',
    title: 'Explore AI Tools 🤖',
    body: 'Learn one useful AI tool today.',
    daysOfWeek: WEEKDAYS,
  },
  {
    time: '21:00',
    title: 'Journal Before Sleep 📝',
    body: 'Write today wins & reflections.',
    daysOfWeek: WEEKDAYS,
  },
  {
    time: '21:30',
    title: 'Prepare for Tomorrow 🌙',
    body: 'Night routine & small glass of water.',
    daysOfWeek: WEEKDAYS,
  },
  {
    time: '22:00',
    title: 'Lights Off & Sleep 💤',
    body: 'Rest up. Tomorrow is Day + 1.',
    daysOfWeek: WEEKDAYS,
  },

  // =========================================================================
  // 2. SATURDAY & SUNDAY WEEKEND RECOVERY SCHEDULE
  // =========================================================================
  {
    time: '05:00',
    title: 'Wake Up 🌅',
    body: 'No snooze. Drink 1 glass of water.',
    daysOfWeek: WEEKENDS,
  },
  {
    time: '05:20',
    title: 'Morning Fitness 🏃',
    body: 'Walk, jog, stretch, enjoy sunrise.',
    daysOfWeek: WEEKENDS,
  },
  {
    time: '06:30',
    title: 'Freshen Up 🚿',
    body: 'Shower & get ready for a relaxed day.',
    daysOfWeek: WEEKENDS,
  },
  {
    time: '08:00',
    title: 'Breakfast 🍽️',
    body: 'Enjoy a healthy weekend breakfast.',
    daysOfWeek: WEEKENDS,
  },
  {
    time: '08:30',
    title: 'Take Creatine 💊',
    body: 'Take 3–5 g with water.',
    daysOfWeek: WEEKENDS,
  },
  {
    time: '10:00',
    title: 'DSA & Python Revision 📚',
    body: 'Revise only. No new topics. (1 hour)',
    daysOfWeek: WEEKENDS,
  },
  {
    time: '11:00',
    title: 'Drink Water 💧',
    body: 'Mid-morning hydration break.',
    daysOfWeek: WEEKENDS,
  },
  {
    time: '12:45',
    title: 'Weekend Lunch 🍛',
    body: 'Eat well & spend quality time with family.',
    daysOfWeek: WEEKENDS,
  },
  {
    time: '13:30',
    title: 'Drink Water 💧',
    body: 'Hydrate after lunch.',
    daysOfWeek: WEEKENDS,
  },
  {
    time: '15:30',
    title: 'Healthy Snack 🍎',
    body: 'Fruit, curd, or peanuts. Hydrate.',
    daysOfWeek: WEEKENDS,
  },
  {
    time: '16:30',
    title: 'Explore & Family 🌍',
    body: 'Visit a new place, meet friends, or relax with family.',
    daysOfWeek: WEEKENDS,
  },
  {
    time: '18:00',
    title: 'Temple Time 🛕',
    body: 'Hanuman Chalisa, prayer & reflection.',
    daysOfWeek: WEEKENDS,
  },
  {
    time: '19:00',
    title: 'Weekend Dinner 🍽️',
    body: 'Phone-free family dinner.',
    daysOfWeek: WEEKENDS,
  },
  {
    time: '19:30',
    title: 'Evening Hydration 💧',
    body: 'Drink water.',
    daysOfWeek: WEEKENDS,
  },
  {
    time: '21:00',
    title: 'Weekend Journal 📓',
    body: 'Write what you explored, learned, or enjoyed today.',
    daysOfWeek: WEEKENDS,
  },
  {
    time: '21:30',
    title: 'Small Water 💧',
    body: 'Hydrate before bed.',
    daysOfWeek: WEEKENDS,
  },
  {
    time: '22:00',
    title: 'Prepare for Monday 🌙',
    body: 'Organize desk, clothes & essentials.',
    daysOfWeek: WEEKENDS,
  },
  {
    time: '22:30',
    title: 'Sleep 😴',
    body: 'Sleep on time to maintain your 5:00 AM wake-up habit.',
    daysOfWeek: WEEKENDS,
  },

  // =========================================================================
  // 3. SPECIFIC WEEKLY REMINDERS
  // =========================================================================
  {
    time: '08:00',
    title: 'Wednesday Meal Prep 🍗',
    body: 'Buy chicken & prepare non-veg lunch.',
    daysOfWeek: [3], // Wednesday
  },
  {
    time: '08:00',
    title: 'Saturday Tasks 🧺🛒',
    body: 'Laundry, check groceries & revise notes.',
    daysOfWeek: [6], // Saturday
  },
  {
    time: '08:00',
    title: 'Sunday Meal Prep 🥗🍗',
    body: 'Buy chicken, meal prep & non-veg lunch.',
    daysOfWeek: [0], // Sunday
  },

  // =========================================================================
  // 4. MONTHLY REMINDERS
  // =========================================================================
  {
    time: '09:00',
    title: 'Monthly Restock 🛒',
    body: 'Buy groceries, fruits, veggies, creatine & protein.',
    dayOfMonth: 1, // 1st of month
  },
];

let lastTriggeredMap: Record<string, string> = {};

export function initRoutineScheduler(): void {
  if (typeof window === 'undefined') return;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => {})
      .catch(() => {});
  }

  setInterval(() => {
    checkScheduledReminders();
  }, 30000);

  checkScheduledReminders();
}

function checkScheduledReminders(): void {
  const now = new Date();
  const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const currentDayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
  const currentDayOfMonth = now.getDate(); // 1 - 31
  const todayKey = getTodayKey();

  ROUTINE_REMINDERS.forEach((reminder) => {
    if (reminder.time !== currentHHMM) return;

    if (reminder.daysOfWeek && !reminder.daysOfWeek.includes(currentDayOfWeek)) {
      return;
    }

    if (reminder.dayOfMonth && reminder.dayOfMonth !== currentDayOfMonth) {
      return;
    }

    const triggerKey = `${todayKey}-${reminder.time}-${reminder.title}`;
    if (!lastTriggeredMap[triggerKey]) {
      lastTriggeredMap[triggerKey] = 'triggered';
      notificationService.sendNotification(reminder.title, reminder.body);
    }
  });
}
