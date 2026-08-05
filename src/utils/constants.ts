export const WATER_DAILY_GOAL = 3000; // 3 Liters

export function getStartDate(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('tracker_start_date');
    if (saved && saved >= "2026-08-05") return saved;
  }
  return "2026-08-05"; // Default Day 1: August 5, 2026 (Exact 3-Month Plan to November 5, 2026)
}

export function setStartDate(dateStr: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('tracker_start_date', dateStr);
  }
}

export function getTodayKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDayNumber(): number {
  const startDateStr = getStartDate();
  const start = new Date(startDateStr).getTime();
  const now = new Date(getTodayKey()).getTime();
  const diffDays = Math.floor((now - start) / 86400000) + 1;
  return Math.max(1, diffDays);
}

export function getDayOfWeek(): number {
  return new Date().getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
}

export function isWeekendDay(): boolean {
  const dow = getDayOfWeek();
  return dow === 0 || dow === 6;
}

export function getRoutine(): RoutineBlock[] {
  return isWeekendDay() ? WEEKEND_ROUTINE : WEEKDAY_ROUTINE;
}

export interface RoutineBlock {
  id: number;
  time: string;
  title: string;
  tasks: string;
}

export const WEEKDAY_ROUTINE: RoutineBlock[] = [
  { id: 0, time: "05:00 AM", title: "Wake Up", tasks: "Alarm ringing · Immediate wake up · 1 Glass water · Freshen up" },
  { id: 1, time: "05:30 – 06:30 AM", title: "Morning Fitness", tasks: "Walk · Jog · Run · Stretch · Sunrise observation · Mental relaxation" },
  { id: 2, time: "06:30 – 09:00 AM", title: "Morning Routine", tasks: "Return home · Freshen up · Breakfast · Family time · Mental prep" },
  { id: 3, time: "09:00 – 10:00 AM", title: "Preparation Block", tasks: "Relax · Workspace organization · Face wash · Goal setting" },
  { id: 4, time: "10:00 AM – 12:50 PM", title: "Deep Work Session", tasks: "Focus strictly on highest priority task · Device shutdown · Zero distraction" },
  { id: 5, time: "10:50 AM", title: "Water Break", tasks: "Scheduled hydration break 1" },
  { id: 6, time: "11:50 AM", title: "Water Break", tasks: "Scheduled hydration break 2" },
  { id: 7, time: "12:50 – 01:30 PM", title: "Lunch & Family Time", tasks: "Lunch · Family interaction · Relaxation · Learning preparation" },
  { id: 8, time: "01:30 – 02:00 PM", title: "DSA Learning Block", tasks: "Concepts · Problem solving · Structured notes" },
  { id: 9, time: "02:00 – 02:30 PM", title: "Python Practice Block", tasks: "Core concepts · Hands-on implementation · Code documentation" },
  { id: 10, time: "02:30 – 03:00 PM", title: "Quick Revision", tasks: "Consolidate DSA & Python notes · Memory retention review" },
  { id: 11, time: "03:00 – 03:30 PM", title: "Market Research", tasks: "Technology analysis · Industry trends · Product launches · Market notes" },
  { id: 12, time: "03:30 – 04:00 PM", title: "Job Applications", tasks: "Targeted quality applications · Pipeline updates · Application history" },
  { id: 13, time: "04:00 – 04:30 PM", title: "Book Reading", tasks: "Deep comprehension reading · Concept extraction & synthesis" },
  { id: 14, time: "04:30 – 05:30 PM", title: "Outdoor Exploration", tasks: "Walk · Observations · New ideas & field notes" },
  { id: 15, time: "05:30 – 06:00 PM", title: "Return & Freshen Up", tasks: "Return home · Personal hygiene & preparation" },
  { id: 16, time: "06:00 – 06:30 PM", title: "Temple & Reflection", tasks: "Hanuman Chalisa · Meditation · Quiet reflection" },
  { id: 17, time: "07:00 – 08:00 PM", title: "Dinner & Family Time", tasks: "Nutritious dinner · Family interaction · Screen shutdown" },
  { id: 18, time: "08:00 – 09:00 PM", title: "Developer Tools Exploration", tasks: "Productivity, Development, Design & Automation analysis" },
  { id: 19, time: "09:00 – 09:30 PM", title: "Daily Journaling", tasks: "Wins · Improvement areas · Lessons · Gratitude · Next day focus" },
  { id: 20, time: "09:30 – 10:00 PM", title: "Night Routine", tasks: "Prepare tomorrow's attire · Workspace cleanup · Full digital shutdown" },
  { id: 21, time: "10:00 PM", title: "Sleep Target", tasks: "Sleep by 10:00 PM · 7 Hours continuous rest" },
];

export const WEEKEND_ROUTINE: RoutineBlock[] = [
  { id: 0, time: "05:00 AM", title: "Wake Up", tasks: "Alarm ringing · Immediate wake up · 1 Glass water · Freshen up" },
  { id: 1, time: "05:30 – 06:30 AM", title: "Morning Fitness", tasks: "Walk · Jog · Run · Stretch · Outdoor sunrise review" },
  { id: 2, time: "06:30 – 09:00 AM", title: "Morning Routine", tasks: "Breakfast · Quality family time · Mental relaxation" },
  { id: 3, time: "09:00 – 10:00 AM", title: "Workspace & Weekly Planning", tasks: "Organize living space & desk · Laptop maintenance · Goal review" },
  { id: 4, time: "10:00 – 11:00 AM", title: "DSA & Python Consolidation", tasks: "Revise week's concepts · Review notes · Re-solve previous problems" },
  { id: 5, time: "11:00 AM – 12:30 PM", title: "Elective Learning", tasks: "Technical talks · Product case studies · Soft skills & articles" },
  { id: 6, time: "12:30 – 01:30 PM", title: "Lunch & Family Time", tasks: "Lunch · Family time · Relaxation" },
  { id: 7, time: "01:30 – 04:30 PM", title: "Personal Recovery Block", tasks: "Reading · Documentaries · Photography · Cafe visit · Rest" },
  { id: 8, time: "04:30 – 06:00 PM", title: "Field Exploration & Networking", tasks: "Tech meetups · Coworking spaces · Industry networking · Field notes" },
  { id: 9, time: "06:00 – 06:30 PM", title: "Temple & Reflection", tasks: "Hanuman Chalisa · Meditation · Quiet reflection" },
  { id: 10, time: "07:00 – 08:00 PM", title: "Dinner & Family Time", tasks: "Nutritious dinner · Family interaction" },
  { id: 11, time: "08:00 – 09:30 PM", title: "Evening Relaxation", tasks: "Conversations · Gaming · Reading · Journaling" },
  { id: 12, time: "09:30 – 10:00 PM", title: "Weekend Journaling", tasks: "Experiences · Network contacts · Learnings · Gratitude" },
  { id: 13, time: "10:00 – 10:30 PM", title: "Monday Preparation", tasks: "Prepare workspace & attire · Digital shutdown" },
  { id: 14, time: "10:30 PM", title: "Sleep Target", tasks: "Sleep by 10:30 PM · Wake at 05:00 AM Monday" },
];

export const WEEK1_MEALS = {
  breakfast: [
    "Oats + Milk + Banana",
    "Vegetable Upma + Curd",
    "Oats + Apple",
    "Poha + Peanuts",
    "Vegetable Dalia",
    "Oats + Banana",
    "Vegetable Upma"
  ],
  lunch: [
    "Rice + Dal + Vegetable Curry + Curd + Cucumber Salad",
    "Rice + Dal + Vegetable Curry + Curd + Salad",
    "Rice + Chicken Curry + Salad (500g Chicken)",
    "Rice + Dal + Vegetable Curry + Curd",
    "Rice + Dal + Vegetable Curry + Curd",
    "Rice + Dal + Vegetable Curry + Curd",
    "Chicken Curry + Rice + Salad (500g Chicken)"
  ],
  dinner: [
    "2-3 Chapatis + Vegetable Curry + Dal + Curd",
    "2-3 Chapatis + Vegetable Curry + Dal + Curd",
    "2-3 Chapatis + Vegetable Curry + Dal + Curd",
    "2-3 Chapatis + Vegetable Curry + Dal + Curd",
    "2-3 Chapatis + Vegetable Curry + Dal + Curd",
    "2-3 Chapatis + Vegetable Curry + Dal + Curd",
    "2-3 Chapatis + Vegetable Curry + Dal + Curd"
  ],
  snack: "Fruit (Banana / Apple) OR Curd OR Roasted Peanuts OR Cucumber"
};

export const WEEK2_MEALS = {
  breakfast: [
    "Vegetable Poha + Banana + Milk",
    "Oats + Apple",
    "Vegetable Dalia",
    "Oats + Papaya",
    "Upma",
    "Oats + Banana",
    "Poha"
  ],
  lunch: [
    "Rice + Rajma / Chickpeas + Vegetable Curry + Curd",
    "Rice + Rajma / Chickpeas + Vegetable Curry + Curd",
    "Chicken Curry + Rice + Salad (500g Chicken)",
    "Rice + Rajma / Chickpeas + Vegetable Curry + Curd",
    "Rice + Rajma / Chickpeas + Vegetable Curry + Curd",
    "Rice + Rajma / Chickpeas + Vegetable Curry + Curd",
    "Chicken Curry + Rice + Salad (500g Chicken)"
  ],
  dinner: [
    "Chapati + Soy Chunk Curry + Vegetables + Curd",
    "Chapati + Soy Chunk Curry + Vegetables + Curd",
    "Chapati + Soy Chunk Curry + Vegetables + Curd",
    "Chapati + Soy Chunk Curry + Vegetables + Curd",
    "Chapati + Soy Chunk Curry + Vegetables + Curd",
    "Chapati + Soy Chunk Curry + Vegetables + Curd",
    "Chapati + Soy Chunk Curry + Vegetables + Curd"
  ],
  snack: "Fruit (Banana / Apple) OR Curd OR Roasted Peanuts OR Cucumber"
};

export const DEFAULT_GROCERY = {
  veg: [
    "Tomatoes – 1 kg",
    "Onions – 1 kg",
    "Carrots – 500 g",
    "Cucumber – 1 kg",
    "Beans – 500 g",
    "Capsicum – 500 g",
    "Spinach – 2 bunches",
    "Bottle Gourd – 1",
    "Ridge Gourd – 1",
    "Cabbage – 1 medium",
    "Cauliflower – 1",
    "Beetroot – 500 g",
    "Green Chillies",
    "Curry Leaves",
    "Coriander"
  ],
  fruit: [
    "Bananas – 12",
    "Apples – 4",
    "Papaya – 1 medium",
    "Guava (Seasonal)",
    "Sweet Lime (Seasonal)"
  ],
  protein: [
    "Toor Dal – 2 kg",
    "Moong Dal – 1 kg",
    "Chickpeas – 1 kg",
    "Soy Chunks – 1 kg",
    "Peanuts – 1 kg",
    "Curd (Fresh Weekly)",
    "Milk – 500 ml Daily",
    "Eggs – 30 Pack",
    "Chicken – 500g (Wed)",
    "Chicken – 500g (Sun)"
  ],
  carbs: [
    "Rice – 5 kg",
    "Wheat Flour – 5 kg",
    "Oats – 2 kg",
    "Turmeric",
    "Salt",
    "Black Pepper",
    "Jeera & Mustard",
    "Coriander Powder",
    "Red Chilli Powder",
    "Ginger & Garlic",
    "Lemon"
  ]
};
