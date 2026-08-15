import "server-only";
import { getDb } from "@/lib/db";
import type {
  BodyWeightLog,
  Profile,
  Program,
  ProgramDay,
  ProgramExercise,
  Task,
  WorkoutLog,
  WorkoutLogSet,
} from "@/lib/types";

export function getProfile(): Profile {
  const db = getDb();
  const row = db.prepare("SELECT * FROM profile WHERE id = 1").get() as
    | (Profile & { id: number })
    | undefined;

  if (!row) {
    return {
      full_name: null,
      birth_date: null,
      gender: null,
      height_cm: null,
      weight_kg: null,
      phone: null,
      email: null,
      city: null,
      occupation: null,
      blood_type: null,
      allergies: null,
      about: null,
      updated_at: null,
    };
  }

  const { id: _id, ...profile } = row;
  return profile;
}

export function getTasks(): Task[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM tasks ORDER BY status ASC, due_date IS NULL, due_date ASC, created_at DESC")
    .all() as Task[];
  return rows.map((row) => ({ ...row }));
}

export function getTaskById(id: number): Task | undefined {
  const db = getDb();
  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as
    | Task
    | undefined;
  return row ? { ...row } : undefined;
}

export function getPrograms(): Program[] {
  const db = getDb();
  const programRows = db.prepare("SELECT * FROM programs ORDER BY start_date DESC").all() as Omit<
    Program,
    "days"
  >[];
  const dayRows = db.prepare("SELECT * FROM program_days ORDER BY weekday ASC").all() as Omit<
    ProgramDay,
    "exercises"
  >[];
  const exercises = (
    db.prepare("SELECT * FROM program_exercises ORDER BY order_index ASC").all() as ProgramExercise[]
  ).map((e) => ({ ...e }));

  const days: ProgramDay[] = dayRows.map((d) => ({
    ...d,
    exercises: exercises.filter((e) => e.program_day_id === d.id),
  }));

  return programRows.map((p) => ({
    ...p,
    days: days.filter((d) => d.program_id === p.id),
  }));
}

export function getProgramForDate(date: string): Program | undefined {
  return getPrograms().find((p) => p.start_date <= date && date <= p.end_date);
}

export function getAllWorkoutLogs(): WorkoutLog[] {
  const db = getDb();
  const logRows = db
    .prepare("SELECT * FROM workout_logs ORDER BY log_date ASC, id ASC")
    .all() as Omit<WorkoutLog, "sets">[];

  if (logRows.length === 0) return [];

  const logs: WorkoutLog[] = logRows.map((l) => ({ ...l, sets: [] }));

  const ids = logs.map((l) => l.id);
  const placeholders = ids.map(() => "?").join(",");
  const sets = (
    db
      .prepare(`SELECT * FROM workout_log_sets WHERE workout_log_id IN (${placeholders}) ORDER BY set_number ASC`)
      .all(...ids) as WorkoutLogSet[]
  ).map((s) => ({ ...s }));

  for (const log of logs) {
    log.sets = sets.filter((s) => s.workout_log_id === log.id);
  }

  return logs;
}

export function getAllBodyWeights(): BodyWeightLog[] {
  const db = getDb();
  return (
    db.prepare("SELECT * FROM body_weight_logs ORDER BY log_date ASC").all() as BodyWeightLog[]
  ).map((w) => ({ ...w }));
}
