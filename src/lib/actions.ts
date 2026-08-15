"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import type { Profile, Task, TaskCategory, TaskPeriod, TaskPriority } from "@/lib/types";

function nowIso(): string {
  return new Date().toISOString();
}

export async function saveProfileAction(profile: Profile): Promise<void> {
  const db = getDb();
  const fields = {
    full_name: profile.full_name,
    birth_date: profile.birth_date,
    gender: profile.gender,
    height_cm: profile.height_cm,
    weight_kg: profile.weight_kg,
    phone: profile.phone,
    email: profile.email,
    city: profile.city,
    occupation: profile.occupation,
    blood_type: profile.blood_type,
    allergies: profile.allergies,
    about: profile.about,
  };

  db.prepare(
    `INSERT INTO profile (id, full_name, birth_date, gender, height_cm, weight_kg, phone, email, city, occupation, blood_type, allergies, about, updated_at)
     VALUES (1, :full_name, :birth_date, :gender, :height_cm, :weight_kg, :phone, :email, :city, :occupation, :blood_type, :allergies, :about, :updated_at)
     ON CONFLICT(id) DO UPDATE SET
       full_name = excluded.full_name,
       birth_date = excluded.birth_date,
       gender = excluded.gender,
       height_cm = excluded.height_cm,
       weight_kg = excluded.weight_kg,
       phone = excluded.phone,
       email = excluded.email,
       city = excluded.city,
       occupation = excluded.occupation,
       blood_type = excluded.blood_type,
       allergies = excluded.allergies,
       about = excluded.about,
       updated_at = excluded.updated_at`
  ).run({ ...fields, updated_at: nowIso() });

  revalidatePath("/profile");
}

export async function createTaskAction(input: {
  title: string;
  description: string | null;
  category: TaskCategory;
  priority: TaskPriority;
  due_date: string | null;
  period?: TaskPeriod;
}): Promise<Task> {
  const db = getDb();
  const now = nowIso();
  const result = db.prepare(
    `INSERT INTO tasks (title, description, category, priority, status, due_date, period, completed_at, created_at, updated_at)
     VALUES (:title, :description, :category, :priority, 'active', :due_date, :period, NULL, :created_at, :updated_at)`
  ).run({
    title: input.title,
    description: input.description,
    category: input.category,
    priority: input.priority,
    due_date: input.due_date,
    period: input.period ?? "day",
    created_at: now,
    updated_at: now,
  });

  const task = db
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .get(result.lastInsertRowid) as Task;

  revalidatePath("/tasks");
  revalidatePath("/analytics");

  return { ...task };
}

export async function toggleTaskAction(id: number, done: boolean): Promise<void> {
  const db = getDb();
  const now = nowIso();
  db.prepare(
    `UPDATE tasks SET status = :status, completed_at = :completed_at, updated_at = :updated_at WHERE id = :id`
  ).run({
    id,
    status: done ? "done" : "active",
    completed_at: done ? now : null,
    updated_at: now,
  });

  revalidatePath("/tasks");
  revalidatePath("/analytics");
}

export async function deleteTaskAction(id: number): Promise<void> {
  const db = getDb();
  db.prepare("DELETE FROM tasks WHERE id = ?").run(id);

  revalidatePath("/tasks");
  revalidatePath("/analytics");
}
