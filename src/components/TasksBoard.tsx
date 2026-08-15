"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus, Flame, CircleCheck, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import TaskItem from "@/components/TaskItem";
import { createTaskAction, toggleTaskAction, deleteTaskAction } from "@/lib/actions";
import { TASK_CATEGORIES, TASK_PRIORITIES, TASK_PERIODS } from "@/lib/types";
import type { Task, TaskCategory, TaskPeriod, TaskPriority } from "@/lib/types";

const selectClass =
  "rounded-lg border border-border bg-bg-elevated-2 px-3 py-2 text-sm text-text outline-none focus:border-violet";

function StatTile({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="card flex items-center gap-3 px-4 py-3.5">
      <span
        className="flex h-9 w-9 items-center justify-center rounded-lg"
        style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}
      >
        <Icon className="h-4.5 w-4.5" style={{ color }} strokeWidth={2} />
      </span>
      <div>
        <p className="font-display text-xl font-semibold text-text tabular-nums">{value}</p>
        <p className="text-[11px] text-text-muted">{label}</p>
      </div>
    </div>
  );
}

export default function TasksBoard({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TaskCategory>("work");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [period, setPeriod] = useState<TaskPeriod>("day");
  const [dueDate, setDueDate] = useState("");
  const [periodFilter, setPeriodFilter] = useState<TaskPeriod | "all">("all");

  const visibleTasks = useMemo(
    () => (periodFilter === "all" ? tasks : tasks.filter((t) => t.period === periodFilter)),
    [tasks, periodFilter]
  );

  const active = useMemo(
    () => visibleTasks.filter((t) => t.status === "active").sort((a, b) => {
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return b.created_at.localeCompare(a.created_at);
    }),
    [visibleTasks]
  );
  const done = useMemo(
    () => visibleTasks.filter((t) => t.status === "done").sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? "")),
    [visibleTasks]
  );

  const overdue = active.filter((t) => t.due_date && t.due_date < new Date().toISOString().slice(0, 10)).length;

  function handleToggle(id: number, isDone: boolean) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: isDone ? "done" : "active", completed_at: isDone ? new Date().toISOString() : null }
          : t
      )
    );
    startTransition(async () => {
      await toggleTaskAction(id, isDone);
    });
  }

  function handleDelete(id: number) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    startTransition(async () => {
      await deleteTaskAction(id);
    });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    setTitle("");
    startTransition(async () => {
      const task = await createTaskAction({
        title: trimmed,
        description: null,
        category,
        priority,
        due_date: dueDate || null,
        period,
      });
      setTasks((prev) => [task, ...prev]);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-3">
        <StatTile icon={Clock} label="в работе" value={active.length} color="var(--violet)" />
        <StatTile icon={Flame} label="просрочено" value={overdue} color="var(--rose)" />
        <StatTile icon={CircleCheck} label="выполнено" value={done.length} color="var(--cyan)" />
      </div>

      <form onSubmit={handleCreate} className="card flex flex-wrap items-center gap-2.5 p-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Новая задача… например: подготовить отчёт"
          className="flex-1 min-w-[180px] rounded-lg border border-border bg-bg-elevated-2 px-3.5 py-2.5 text-sm text-text placeholder:text-text-faint outline-none focus:border-violet"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value as TaskCategory)} className={selectClass}>
          {TASK_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className={selectClass}>
          {TASK_PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <select value={period} onChange={(e) => setPeriod(e.target.value as TaskPeriod)} className={selectClass}>
          {TASK_PERIODS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className={selectClass}
        />
        <button
          type="submit"
          disabled={!title.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet to-cyan px-4 py-2.5 text-sm font-semibold text-bg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Добавить
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {(["all", ...TASK_PERIODS.map((p) => p.value)] as (TaskPeriod | "all")[]).map((value) => {
          const label = value === "all" ? "Все" : TASK_PERIODS.find((p) => p.value === value)?.label;
          const isActive = periodFilter === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setPeriodFilter(value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors border ${
                isActive
                  ? "border-violet bg-violet-soft text-text"
                  : "border-border text-text-muted hover:text-text hover:border-text-faint"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div>
        <h3 className="font-mono text-xs uppercase tracking-widest text-text-faint mb-3">
          В работе · {active.length}
        </h3>
        <div className="flex flex-col gap-2.5">
          <AnimatePresence initial={false}>
            {active.map((task) => (
              <TaskItem key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} />
            ))}
          </AnimatePresence>
          {active.length === 0 && (
            <p className="text-sm text-text-faint py-6 text-center border border-dashed border-border-soft rounded-xl">
              Пусто. Самое время добавить задачу.
            </p>
          )}
        </div>
      </div>

      {done.length > 0 && (
        <div>
          <h3 className="font-mono text-xs uppercase tracking-widest text-text-faint mb-3">
            Выполнено · {done.length}
          </h3>
          <div className="flex flex-col gap-2.5">
            <AnimatePresence initial={false}>
              {done.map((task) => (
                <TaskItem key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
