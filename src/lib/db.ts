import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "planerka.db");

function createConnection(): DatabaseSync {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA foreign_keys = ON;");

  db.exec(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      full_name TEXT,
      birth_date TEXT,
      gender TEXT,
      height_cm REAL,
      weight_kg REAL,
      phone TEXT,
      email TEXT,
      city TEXT,
      occupation TEXT,
      blood_type TEXT,
      allergies TEXT,
      about TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL DEFAULT 'other',
      priority TEXT NOT NULL DEFAULT 'medium',
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'done')),
      due_date TEXT,
      period TEXT NOT NULL DEFAULT 'day' CHECK (period IN ('day', 'week', 'month', 'year')),
      completed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Заложено на будущие разделы планёрки.
    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      frequency TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS habit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
      log_date TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      UNIQUE(habit_id, log_date)
    );

    CREATE TABLE IF NOT EXISTS finance_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      amount REAL NOT NULL,
      category TEXT,
      description TEXT,
      tx_date TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      tags TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );

    -- Программы тренировок: недельный сплит, повторяющийся в диапазоне дат.
    CREATE TABLE IF NOT EXISTS programs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    -- Один день недели программы (1 = понедельник … 7 = воскресенье).
    CREATE TABLE IF NOT EXISTS program_days (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
      weekday INTEGER NOT NULL CHECK (weekday BETWEEN 1 AND 7),
      label TEXT NOT NULL,
      UNIQUE(program_id, weekday)
    );

    CREATE TABLE IF NOT EXISTS program_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program_day_id INTEGER NOT NULL REFERENCES program_days(id) ON DELETE CASCADE,
      order_index INTEGER NOT NULL DEFAULT 0,
      name TEXT NOT NULL,
      target_sets INTEGER NOT NULL DEFAULT 3,
      target_reps TEXT NOT NULL DEFAULT '8-10',
      target_weight_kg REAL,
      notes TEXT
    );

    -- Фактически выполненное упражнение в конкретный календарный день.
    CREATE TABLE IF NOT EXISTS workout_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      log_date TEXT NOT NULL,
      program_exercise_id INTEGER REFERENCES program_exercises(id) ON DELETE SET NULL,
      exercise_name TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      UNIQUE(log_date, program_exercise_id)
    );

    CREATE TABLE IF NOT EXISTS workout_log_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_log_id INTEGER NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
      set_number INTEGER NOT NULL,
      reps INTEGER,
      weight_kg REAL
    );

    CREATE TABLE IF NOT EXISTS body_weight_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      log_date TEXT NOT NULL UNIQUE,
      weight_kg REAL NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  const taskColumns = db.prepare("PRAGMA table_info(tasks)").all() as { name: string }[];
  if (!taskColumns.some((c) => c.name === "period")) {
    db.exec(
      "ALTER TABLE tasks ADD COLUMN period TEXT NOT NULL DEFAULT 'day' CHECK (period IN ('day', 'week', 'month', 'year'))"
    );
  }

  return db;
}

declare global {
  // eslint-disable-next-line no-var
  var __planerkaDb: DatabaseSync | undefined;
}

export function getDb(): DatabaseSync {
  if (!global.__planerkaDb) {
    global.__planerkaDb = createConnection();
  }
  return global.__planerkaDb;
}
