export type Profile = {
  full_name: string | null;
  birth_date: string | null;
  gender: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  occupation: string | null;
  blood_type: string | null;
  allergies: string | null;
  about: string | null;
  updated_at: string | null;
};

export type TaskCategory =
  | "work"
  | "health"
  | "personal"
  | "finance"
  | "learning"
  | "other";

export type TaskPriority = "low" | "medium" | "high";

export type TaskStatus = "active" | "done";

export type TaskPeriod = "day" | "week" | "month" | "year";

export type Task = {
  id: number;
  title: string;
  description: string | null;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  period: TaskPeriod;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export const TASK_CATEGORIES: { value: TaskCategory; label: string }[] = [
  { value: "work", label: "Работа" },
  { value: "health", label: "Здоровье" },
  { value: "personal", label: "Личное" },
  { value: "finance", label: "Финансы" },
  { value: "learning", label: "Обучение" },
  { value: "other", label: "Другое" },
];

export const TASK_PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Низкий" },
  { value: "medium", label: "Средний" },
  { value: "high", label: "Высокий" },
];

export const TASK_PERIODS: { value: TaskPeriod; label: string }[] = [
  { value: "day", label: "День" },
  { value: "week", label: "Неделя" },
  { value: "month", label: "Месяц" },
  { value: "year", label: "Год" },
];

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type DraftTask = {
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
};

export const WEEKDAYS: { value: number; label: string; short: string }[] = [
  { value: 1, label: "Понедельник", short: "Пн" },
  { value: 2, label: "Вторник", short: "Вт" },
  { value: 3, label: "Среда", short: "Ср" },
  { value: 4, label: "Четверг", short: "Чт" },
  { value: 5, label: "Пятница", short: "Пт" },
  { value: 6, label: "Суббота", short: "Сб" },
  { value: 7, label: "Воскресенье", short: "Вс" },
];

export type ProgramExercise = {
  id: number;
  program_day_id: number;
  order_index: number;
  name: string;
  target_sets: number;
  target_reps: string;
  target_weight_kg: number | null;
  notes: string | null;
};

export type ProgramDay = {
  id: number;
  program_id: number;
  weekday: number;
  label: string;
  exercises: ProgramExercise[];
};

export type Program = {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  created_at: string;
  days: ProgramDay[];
};

export type ProgramExerciseInput = {
  name: string;
  target_sets: number;
  target_reps: string;
  target_weight_kg: number | null;
  notes: string | null;
};

export type ProgramDayInput = {
  weekday: number;
  label: string;
  exercises: ProgramExerciseInput[];
};

export type ProgramInput = {
  name: string;
  start_date: string;
  end_date: string;
  days: ProgramDayInput[];
};

export type WorkoutLogSet = {
  id: number;
  workout_log_id: number;
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
};

export type WorkoutLog = {
  id: number;
  log_date: string;
  program_exercise_id: number | null;
  exercise_name: string;
  notes: string | null;
  created_at: string;
  sets: WorkoutLogSet[];
};

export type WorkoutSetInput = {
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
};

export type BodyWeightLog = {
  id: number;
  log_date: string;
  weight_kg: number;
  created_at: string;
};
