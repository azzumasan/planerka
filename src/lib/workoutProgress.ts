import type { BodyWeightLog, WorkoutLog } from "@/lib/types";

function shortLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}

export type ExercisePoint = {
  date: string;
  label: string;
  topWeight: number | null;
  volume: number;
};

export type ExerciseSeries = {
  exerciseName: string;
  points: ExercisePoint[];
};

/** Группирует логи по названию упражнения и считает рабочий вес/объём по каждой тренировке. */
export function buildExerciseSeries(logs: WorkoutLog[]): ExerciseSeries[] {
  const byName = new Map<string, WorkoutLog[]>();
  for (const log of logs) {
    if (log.sets.length === 0) continue;
    const arr = byName.get(log.exercise_name) ?? [];
    arr.push(log);
    byName.set(log.exercise_name, arr);
  }

  const series: ExerciseSeries[] = [];
  for (const [exerciseName, entries] of byName) {
    const sorted = [...entries].sort((a, b) => a.log_date.localeCompare(b.log_date));
    const points = sorted.map((log) => {
      const weights = log.sets.map((s) => s.weight_kg).filter((w): w is number => w != null);
      const volume = log.sets.reduce((sum, s) => sum + (s.reps ?? 0) * (s.weight_kg ?? 0), 0);
      return {
        date: log.log_date,
        label: shortLabel(log.log_date),
        topWeight: weights.length > 0 ? Math.max(...weights) : null,
        volume: Math.round(volume),
      };
    });
    series.push({ exerciseName, points });
  }

  return series.sort((a, b) => b.points.length - a.points.length);
}

export type BodyWeightPoint = { date: string; label: string; weight: number };

export function buildBodyWeightSeries(logs: BodyWeightLog[]): BodyWeightPoint[] {
  return [...logs]
    .sort((a, b) => a.log_date.localeCompare(b.log_date))
    .map((w) => ({ date: w.log_date, label: shortLabel(w.log_date), weight: w.weight_kg }));
}
