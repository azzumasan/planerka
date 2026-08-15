"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronDown, Lightbulb, Loader2, Plus, Scale, Trash2 } from "lucide-react";
import { saveWorkoutLogAction, deleteWorkoutLogAction, saveBodyWeightAction } from "@/lib/healthActions";
import { suggestNextWeight } from "@/lib/progression";
import type { BodyWeightLog, ProgramDay, ProgramExercise, WorkoutLog, WorkoutSetInput } from "@/lib/types";

const numInputClass =
  "w-16 rounded-lg border border-border bg-bg-elevated-2 px-2 py-1.5 text-sm text-text text-center outline-none focus:border-violet";

function ExerciseLog({
  date,
  exercise,
  log,
  history,
  onSaved,
  onDeleted,
}: {
  date: string;
  exercise: ProgramExercise;
  log: WorkoutLog | undefined;
  history: WorkoutLog[];
  onSaved: (log: WorkoutLog) => void;
  onDeleted: (logId: number) => void;
}) {
  const [open, setOpen] = useState(false);

  const suggestion = log ? null : suggestNextWeight(exercise, history);
  const suggestedWeight = suggestion?.weight ?? exercise.target_weight_kg;

  const [sets, setSets] = useState<WorkoutSetInput[]>(
    log?.sets.map((s) => ({ set_number: s.set_number, reps: s.reps, weight_kg: s.weight_kg })) ??
      Array.from({ length: exercise.target_sets }, (_, i) => ({
        set_number: i + 1,
        reps: null,
        weight_kg: suggestedWeight,
      }))
  );
  const [pending, startTransition] = useTransition();

  function updateSet(index: number, patch: Partial<WorkoutSetInput>) {
    setSets((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function addSet() {
    setSets((prev) => [
      ...prev,
      { set_number: prev.length + 1, reps: null, weight_kg: suggestedWeight },
    ]);
  }

  function removeSet(index: number) {
    setSets((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, set_number: i + 1 })));
  }

  function handleSave() {
    startTransition(async () => {
      const saved = await saveWorkoutLogAction({
        log_date: date,
        program_exercise_id: exercise.id,
        exercise_name: exercise.name,
        notes: null,
        sets,
      });
      onSaved(saved);
      setOpen(false);
    });
  }

  function handleDelete() {
    if (!log) return;
    startTransition(async () => {
      await deleteWorkoutLogAction(log.id);
      onDeleted(log.id);
    });
  }

  const done = !!log && log.sets.length > 0;

  return (
    <div className="rounded-xl border border-border-soft bg-bg-elevated-2/60 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
          style={{
            borderColor: done ? "var(--cyan)" : "var(--border)",
            background: done ? "linear-gradient(135deg, var(--violet), var(--cyan))" : "transparent",
          }}
        >
          {done && <Check className="h-3 w-3 text-bg" strokeWidth={3} />}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text truncate">{exercise.name}</p>
          <p className="text-xs text-text-faint font-mono">
            план: {exercise.target_sets}×{exercise.target_reps}
            {exercise.target_weight_kg ? ` · ${exercise.target_weight_kg} кг` : ""}
          </p>
        </div>
        <ChevronDown className={`h-4 w-4 text-text-faint transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 flex flex-col gap-3 border-t border-border-soft pt-3">
              {suggestion && (
                <div className="flex items-start gap-2 rounded-lg bg-violet-soft px-3 py-2">
                  <Lightbulb className="h-3.5 w-3.5 text-violet shrink-0 mt-0.5" />
                  <p className="text-xs text-text-muted leading-relaxed">
                    {suggestion.weight != null && (
                      <span className="font-mono text-cyan font-semibold">{suggestion.weight} кг · </span>
                    )}
                    {suggestion.reason}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {sets.map((set, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-text-faint">
                    <span className="w-14 font-mono">подход {set.set_number}</span>
                    <input
                      type="number"
                      value={set.reps ?? ""}
                      onChange={(e) => updateSet(i, { reps: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="повт."
                      className={numInputClass}
                    />
                    <span>×</span>
                    <input
                      type="number"
                      step="0.5"
                      value={set.weight_kg ?? ""}
                      onChange={(e) => updateSet(i, { weight_kg: e.target.value ? parseFloat(e.target.value) : null })}
                      placeholder="кг"
                      className={numInputClass}
                    />
                    <span>кг</span>
                    <button
                      type="button"
                      onClick={() => removeSet(i)}
                      className="ml-auto text-text-faint hover:text-rose p-1"
                      aria-label="Удалить подход"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={addSet}
                  className="inline-flex items-center gap-1 text-xs font-medium text-violet hover:opacity-80"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Подход
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={pending}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet to-cyan px-3 py-1.5 text-xs font-semibold text-bg disabled:opacity-50"
                >
                  {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Сохранить факт
                </button>
                {log && (
                  <button type="button" onClick={handleDelete} disabled={pending} className="text-xs text-rose hover:opacity-80">
                    Удалить запись
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DayDetail({
  date,
  programDay,
  logs,
  allLogs,
  bodyWeight,
  onLogSaved,
  onLogDeleted,
  onBodyWeightSaved,
}: {
  date: string;
  programDay: ProgramDay | undefined;
  logs: WorkoutLog[];
  allLogs: WorkoutLog[];
  bodyWeight: BodyWeightLog | undefined;
  onLogSaved: (log: WorkoutLog) => void;
  onLogDeleted: (logId: number) => void;
  onBodyWeightSaved: (bw: BodyWeightLog) => void;
}) {
  const [weightInput, setWeightInput] = useState(bodyWeight?.weight_kg?.toString() ?? "");
  const [savingWeight, startWeightTransition] = useTransition();

  const dateLabel = new Date(date).toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  function handleSaveWeight() {
    const value = parseFloat(weightInput);
    if (!value) return;
    startWeightTransition(async () => {
      const saved = await saveBodyWeightAction(date, value);
      onBodyWeightSaved(saved);
    });
  }

  return (
    <div className="card p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-cyan mb-1">{dateLabel}</p>
          <h3 className="font-display text-lg font-semibold text-text">
            {programDay ? programDay.label : "День отдыха"}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-text-faint" />
          <input
            type="number"
            step="0.1"
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            placeholder="вес, кг"
            className="w-24 rounded-lg border border-border bg-bg-elevated-2 px-2.5 py-1.5 text-sm text-text outline-none focus:border-violet"
          />
          <button
            type="button"
            onClick={handleSaveWeight}
            disabled={savingWeight}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-muted hover:border-violet hover:text-text disabled:opacity-50"
          >
            {savingWeight ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Сохранить"}
          </button>
        </div>
      </div>

      {!programDay ? (
        <p className="text-sm text-text-faint">Плановых тренировок нет — можно отдыхать или записать что-то вне плана.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {programDay.exercises.map((exercise) => (
            <ExerciseLog
              key={exercise.id}
              date={date}
              exercise={exercise}
              log={logs.find((l) => l.program_exercise_id === exercise.id)}
              history={allLogs.filter((l) => l.program_exercise_id === exercise.id && l.log_date < date)}
              onSaved={onLogSaved}
              onDeleted={onLogDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
