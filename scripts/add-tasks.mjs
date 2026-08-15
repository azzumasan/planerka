#!/usr/bin/env node
// Служебный скрипт: добавляет задачи в базу планёрки напрямую, минуя UI.
// Используется, когда список задач присылают текстом в чат, а не через приложение.
//
// Использование: node scripts/add-tasks.mjs '[{"title":"...", "category":"work", "priority":"medium", "period":"day", "due_date":"2026-08-07"}]'

import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
const DB_PATH = path.join(DATA_DIR, "planerka.db");

const VALID_CATEGORIES = ["work", "health", "personal", "finance", "learning", "other"];
const VALID_PRIORITIES = ["low", "medium", "high"];
const VALID_PERIODS = ["day", "week", "month", "year"];

function fail(message) {
  console.error(`Ошибка: ${message}`);
  process.exit(1);
}

const raw = process.argv[2];
if (!raw) {
  fail("не передан JSON-список задач первым аргументом");
}

let tasks;
try {
  tasks = JSON.parse(raw);
} catch {
  fail("не удалось разобрать JSON");
}

if (!Array.isArray(tasks) || tasks.length === 0) {
  fail("ожидался непустой массив задач");
}

for (const [i, t] of tasks.entries()) {
  if (!t.title || typeof t.title !== "string") fail(`задача #${i + 1}: нет title`);
  if (t.category && !VALID_CATEGORIES.includes(t.category)) fail(`задача #${i + 1}: неверная category "${t.category}"`);
  if (t.priority && !VALID_PRIORITIES.includes(t.priority)) fail(`задача #${i + 1}: неверный priority "${t.priority}"`);
  if (t.period && !VALID_PERIODS.includes(t.period)) fail(`задача #${i + 1}: неверный period "${t.period}"`);
}

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA foreign_keys = ON;");

const columns = db.prepare("PRAGMA table_info(tasks)").all().map((c) => c.name);
if (!columns.includes("period")) {
  fail("в таблице tasks нет колонки period — сначала запусти приложение один раз (npm run dev), чтобы применилась миграция базы");
}

const now = new Date().toISOString();
const insert = db.prepare(`
  INSERT INTO tasks (title, description, category, priority, status, due_date, period, completed_at, created_at, updated_at)
  VALUES (:title, :description, :category, :priority, 'active', :due_date, :period, NULL, :created_at, :updated_at)
`);

let inserted = 0;
for (const t of tasks) {
  insert.run({
    title: t.title,
    description: t.description ?? null,
    category: t.category ?? "other",
    priority: t.priority ?? "medium",
    due_date: t.due_date ?? null,
    period: t.period ?? "day",
    created_at: now,
    updated_at: now,
  });
  inserted += 1;
}

db.close();
console.log(`Добавлено задач: ${inserted}`);
