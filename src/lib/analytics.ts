import type { Task, TaskCategory, TaskPriority } from "@/lib/types";
import { TASK_CATEGORIES, TASK_PRIORITIES } from "@/lib/types";

function isoDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export type AnalyticsData = {
  total: number;
  done: number;
  active: number;
  overdue: number;
  completionRate: number;
  streak: number;
  dailyCompletions: { date: string; label: string; completed: number }[];
  categoryBreakdown: { category: TaskCategory; label: string; count: number }[];
  priorityBreakdown: { priority: TaskPriority; label: string; active: number; done: number }[];
};

export function computeAnalytics(tasks: Task[]): AnalyticsData {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const active = total - done;
  const todayIso = isoDay(new Date());
  const overdue = tasks.filter((t) => t.status === "active" && t.due_date && t.due_date < todayIso).length;
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

  const completionsByDay = new Map<string, number>();
  for (const t of tasks) {
    if (t.completed_at) {
      const day = isoDay(new Date(t.completed_at));
      completionsByDay.set(day, (completionsByDay.get(day) ?? 0) + 1);
    }
  }

  const dailyCompletions: AnalyticsData["dailyCompletions"] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() - 13);
  for (let i = 0; i < 14; i++) {
    const day = isoDay(cursor);
    dailyCompletions.push({
      date: day,
      label: cursor.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }),
      completed: completionsByDay.get(day) ?? 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  let streak = 0;
  const streakCursor = new Date();
  streakCursor.setHours(0, 0, 0, 0);
  while (true) {
    const day = isoDay(streakCursor);
    if ((completionsByDay.get(day) ?? 0) > 0) {
      streak += 1;
      streakCursor.setDate(streakCursor.getDate() - 1);
    } else {
      break;
    }
  }

  const categoryBreakdown = TASK_CATEGORIES.map(({ value, label }) => ({
    category: value,
    label,
    count: tasks.filter((t) => t.category === value).length,
  })).filter((c) => c.count > 0);

  const priorityBreakdown = TASK_PRIORITIES.map(({ value, label }) => ({
    priority: value,
    label,
    active: tasks.filter((t) => t.priority === value && t.status === "active").length,
    done: tasks.filter((t) => t.priority === value && t.status === "done").length,
  }));

  return {
    total,
    done,
    active,
    overdue,
    completionRate,
    streak,
    dailyCompletions,
    categoryBreakdown,
    priorityBreakdown,
  };
}
