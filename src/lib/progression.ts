import type { ProgramExercise, WorkoutLog } from "@/lib/types";

export type WeightSuggestion = {
  weight: number | null;
  reason: string;
};

const INCREMENT_KG = 2.5;

/** Достаёт нижнюю границу повторов из "8", "8-10", "40-60 сек" → 8, 8, null (не силовая схема). */
export function parseTargetReps(target: string): number | null {
  if (/сек|мин/i.test(target)) return null;
  const match = target.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

function topSetWeight(log: WorkoutLog): number | null {
  const weights = log.sets.map((s) => s.weight_kg).filter((w): w is number => w != null);
  return weights.length > 0 ? Math.max(...weights) : null;
}

/**
 * Предлагает вес на следующую тренировку по последнему подходу того же упражнения:
 * все подходы выполнены на плановые повторы → +2.5 кг; иначе — тот же вес.
 * `history` — логи этого упражнения СТРОГО до текущей даты, в любом порядке.
 */
export function suggestNextWeight(exercise: ProgramExercise, history: WorkoutLog[]): WeightSuggestion {
  const last = [...history].sort((a, b) => b.log_date.localeCompare(a.log_date))[0];

  if (!last || last.sets.length === 0) {
    return exercise.target_weight_kg
      ? { weight: exercise.target_weight_kg, reason: "Плановый вес программы" }
      : { weight: null, reason: "Ещё не выполнялось — начни с комфортного веса" };
  }

  const lastWeight = topSetWeight(last);
  if (lastWeight === null) {
    return { weight: exercise.target_weight_kg, reason: "В прошлый раз вес не указан" };
  }

  const targetReps = parseTargetReps(exercise.target_reps);
  if (targetReps === null) {
    return { weight: lastWeight, reason: `Вес с прошлой тренировки (${last.log_date.slice(5)})` };
  }

  const allSetsHitTarget = last.sets.every((s) => (s.reps ?? 0) >= targetReps);

  if (allSetsHitTarget) {
    return {
      weight: roundToHalf(lastWeight + INCREMENT_KG),
      reason: `+${INCREMENT_KG} кг — в прошлый раз выполнил все повторы на ${lastWeight} кг`,
    };
  }

  return {
    weight: lastWeight,
    reason: `Тот же вес — в прошлый раз не все подходы дошли до ${targetReps} повторов`,
  };
}
