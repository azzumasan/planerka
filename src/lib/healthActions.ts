"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import type { BodyWeightLog, Program, ProgramInput, WorkoutLog, WorkoutSetInput } from "@/lib/types";

function nowIso(): string {
  return new Date().toISOString();
}

export async function saveProgramAction(input: ProgramInput, id?: number): Promise<Program> {
  const db = getDb();
  const now = nowIso();

  let programId: number;

  if (id) {
    db.prepare("UPDATE programs SET name = :name, start_date = :start_date, end_date = :end_date WHERE id = :id").run(
      { id, name: input.name, start_date: input.start_date, end_date: input.end_date }
    );
    db.prepare("DELETE FROM program_days WHERE program_id = ?").run(id);
    programId = id;
  } else {
    const result = db
      .prepare("INSERT INTO programs (name, start_date, end_date, created_at) VALUES (:name, :start_date, :end_date, :created_at)")
      .run({ name: input.name, start_date: input.start_date, end_date: input.end_date, created_at: now });
    programId = Number(result.lastInsertRowid);
  }

  const insertDay = db.prepare(
    "INSERT INTO program_days (program_id, weekday, label) VALUES (:program_id, :weekday, :label)"
  );
  const insertExercise = db.prepare(
    `INSERT INTO program_exercises (program_day_id, order_index, name, target_sets, target_reps, target_weight_kg, notes)
     VALUES (:program_day_id, :order_index, :name, :target_sets, :target_reps, :target_weight_kg, :notes)`
  );

  for (const day of input.days) {
    if (day.exercises.length === 0) continue;
    const dayResult = insertDay.run({ program_id: programId, weekday: day.weekday, label: day.label });
    const dayId = Number(dayResult.lastInsertRowid);
    day.exercises.forEach((ex, index) => {
      insertExercise.run({
        program_day_id: dayId,
        order_index: index,
        name: ex.name,
        target_sets: ex.target_sets,
        target_reps: ex.target_reps,
        target_weight_kg: ex.target_weight_kg,
        notes: ex.notes,
      });
    });
  }

  revalidatePath("/health");

  const program = db.prepare("SELECT * FROM programs WHERE id = ?").get(programId) as Omit<Program, "days">;
  return { ...program, days: [] };
}

export async function deleteProgramAction(id: number): Promise<void> {
  const db = getDb();
  db.prepare("DELETE FROM programs WHERE id = ?").run(id);
  revalidatePath("/health");
}

export async function saveWorkoutLogAction(input: {
  log_date: string;
  program_exercise_id: number | null;
  exercise_name: string;
  notes: string | null;
  sets: WorkoutSetInput[];
}): Promise<WorkoutLog> {
  const db = getDb();
  const now = nowIso();

  let logId: number;
  const existing = input.program_exercise_id
    ? (db
        .prepare("SELECT id FROM workout_logs WHERE log_date = ? AND program_exercise_id = ?")
        .get(input.log_date, input.program_exercise_id) as { id: number } | undefined)
    : undefined;

  if (existing) {
    db.prepare("UPDATE workout_logs SET exercise_name = :exercise_name, notes = :notes WHERE id = :id").run({
      id: existing.id,
      exercise_name: input.exercise_name,
      notes: input.notes,
    });
    db.prepare("DELETE FROM workout_log_sets WHERE workout_log_id = ?").run(existing.id);
    logId = existing.id;
  } else {
    const result = db
      .prepare(
        `INSERT INTO workout_logs (log_date, program_exercise_id, exercise_name, notes, created_at)
         VALUES (:log_date, :program_exercise_id, :exercise_name, :notes, :created_at)`
      )
      .run({
        log_date: input.log_date,
        program_exercise_id: input.program_exercise_id,
        exercise_name: input.exercise_name,
        notes: input.notes,
        created_at: now,
      });
    logId = Number(result.lastInsertRowid);
  }

  const insertSet = db.prepare(
    "INSERT INTO workout_log_sets (workout_log_id, set_number, reps, weight_kg) VALUES (:workout_log_id, :set_number, :reps, :weight_kg)"
  );
  for (const set of input.sets) {
    insertSet.run({ workout_log_id: logId, set_number: set.set_number, reps: set.reps, weight_kg: set.weight_kg });
  }

  revalidatePath("/health");
  revalidatePath("/analytics");

  const log = db.prepare("SELECT * FROM workout_logs WHERE id = ?").get(logId) as Omit<WorkoutLog, "sets">;
  const sets = db
    .prepare("SELECT * FROM workout_log_sets WHERE workout_log_id = ? ORDER BY set_number ASC")
    .all(logId) as WorkoutLog["sets"];

  return { ...log, sets: sets.map((s) => ({ ...s })) };
}

export async function deleteWorkoutLogAction(id: number): Promise<void> {
  const db = getDb();
  db.prepare("DELETE FROM workout_logs WHERE id = ?").run(id);
  revalidatePath("/health");
  revalidatePath("/analytics");
}

export async function saveBodyWeightAction(logDate: string, weightKg: number): Promise<BodyWeightLog> {
  const db = getDb();
  const now = nowIso();

  db.prepare(
    `INSERT INTO body_weight_logs (log_date, weight_kg, created_at)
     VALUES (:log_date, :weight_kg, :created_at)
     ON CONFLICT(log_date) DO UPDATE SET weight_kg = excluded.weight_kg`
  ).run({ log_date: logDate, weight_kg: weightKg, created_at: now });

  revalidatePath("/health");

  const row = db.prepare("SELECT * FROM body_weight_logs WHERE log_date = ?").get(logDate) as BodyWeightLog;
  return { ...row };
}
