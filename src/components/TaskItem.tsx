"use client";

import { motion } from "motion/react";
import { Trash2 } from "lucide-react";
import TaskCheckbox from "@/components/TaskCheckbox";
import { CATEGORY_COLOR, PRIORITY_COLOR, PRIORITY_LABEL } from "@/lib/taskStyle";
import { TASK_CATEGORIES, TASK_PERIODS } from "@/lib/types";
import type { Task } from "@/lib/types";

function dueLabel(dueDate: string | null, done: boolean): { text: string; tone: "normal" | "warn" | "danger" } | null {
  if (!dueDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);

  if (done) {
    return { text: due.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" }), tone: "normal" };
  }
  if (diffDays < 0) return { text: `просрочено · ${Math.abs(diffDays)} дн.`, tone: "danger" };
  if (diffDays === 0) return { text: "сегодня", tone: "warn" };
  if (diffDays === 1) return { text: "завтра", tone: "normal" };
  return { text: due.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" }), tone: "normal" };
}

const toneColor = { normal: "var(--text-muted)", warn: "var(--amber)", danger: "var(--rose)" };

export default function TaskItem({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: (id: number, done: boolean) => void;
  onDelete: (id: number) => void;
}) {
  const done = task.status === "done";
  const due = dueLabel(task.due_date, done);
  const categoryLabel = TASK_CATEGORIES.find((c) => c.value === task.category)?.label ?? task.category;
  const periodLabel = TASK_PERIODS.find((p) => p.value === task.period)?.label;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.2 }}
      className="group flex items-center gap-3.5 rounded-xl border border-border-soft bg-bg-elevated-2/60 px-4 py-3.5 hover:border-border transition-colors"
    >
      <TaskCheckbox checked={done} onChange={() => onToggle(task.id, !done)} />

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate transition-colors ${
            done ? "text-text-faint line-through" : "text-text"
          }`}
        >
          {task.title}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span
            className="text-[11px] font-medium rounded-full px-2 py-0.5"
            style={{
              color: CATEGORY_COLOR[task.category],
              backgroundColor: `color-mix(in srgb, ${CATEGORY_COLOR[task.category]} 15%, transparent)`,
            }}
          >
            {categoryLabel}
          </span>
          {task.period !== "day" && (
            <span className="text-[11px] font-medium rounded-full px-2 py-0.5 border border-border-soft text-text-muted">
              {periodLabel}
            </span>
          )}
          {!done && (
            <span className="flex items-center gap-1 text-[11px] text-text-faint">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: PRIORITY_COLOR[task.priority] }}
              />
              {PRIORITY_LABEL[task.priority]}
            </span>
          )}
          {due && (
            <span className="text-[11px] font-mono" style={{ color: toneColor[due.tone] }}>
              {due.text}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onDelete(task.id)}
        aria-label="Удалить задачу"
        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 text-text-faint hover:text-rose transition-opacity p-1.5"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
