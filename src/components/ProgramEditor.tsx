"use client";

import { useState, useTransition } from "react";
import { motion } from "motion/react";
import { Plus, Trash2, X, Check, Loader2, Dumbbell } from "lucide-react";
import { saveProgramAction, deleteProgramAction } from "@/lib/healthActions";
import { WEEKDAYS } from "@/lib/types";
import type { Program, ProgramDayInput, ProgramExerciseInput, ProgramInput } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-border bg-bg-elevated-2 px-3 py-2 text-sm text-text placeholder:text-text-faint outline-none focus:border-violet";

function emptyExercise(): ProgramExerciseInput {
  return { name: "", target_sets: 4, target_reps: "8-10", target_weight_kg: null, notes: null };
}

function buildInitialDays(program?: Program): Record<number, { enabled: boolean; label: string; exercises: ProgramExerciseInput[] }> {
  const map: Record<number, { enabled: boolean; label: string; exercises: ProgramExerciseInput[] }> = {};
  for (const w of WEEKDAYS) {
    const existing = program?.days.find((d) => d.weekday === w.value);
    map[w.value] = existing
      ? {
          enabled: true,
          label: existing.label,
          exercises: existing.exercises.map((e) => ({
            name: e.name,
            target_sets: e.target_sets,
            target_reps: e.target_reps,
            target_weight_kg: e.target_weight_kg,
            notes: e.notes,
          })),
        }
      : { enabled: false, label: "", exercises: [] };
  }
  return map;
}

export default function ProgramEditor({
  program,
  onClose,
  onSaved,
}: {
  program?: Program;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(program?.name ?? "");
  const [startDate, setStartDate] = useState(program?.start_date ?? new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(program?.end_date ?? "");
  const [days, setDays] = useState(buildInitialDays(program));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggleDay(weekday: number) {
    setDays((prev) => ({
      ...prev,
      [weekday]: { ...prev[weekday], enabled: !prev[weekday].enabled },
    }));
  }

  function updateDayLabel(weekday: number, label: string) {
    setDays((prev) => ({ ...prev, [weekday]: { ...prev[weekday], label } }));
  }

  function addExercise(weekday: number) {
    setDays((prev) => ({
      ...prev,
      [weekday]: { ...prev[weekday], exercises: [...prev[weekday].exercises, emptyExercise()] },
    }));
  }

  function updateExercise(weekday: number, index: number, patch: Partial<ProgramExerciseInput>) {
    setDays((prev) => {
      const exercises = prev[weekday].exercises.map((ex, i) => (i === index ? { ...ex, ...patch } : ex));
      return { ...prev, [weekday]: { ...prev[weekday], exercises } };
    });
  }

  function removeExercise(weekday: number, index: number) {
    setDays((prev) => ({
      ...prev,
      [weekday]: { ...prev[weekday], exercises: prev[weekday].exercises.filter((_, i) => i !== index) },
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Укажи название программы");
    if (!endDate) return setError("Укажи дату окончания программы");
    if (endDate < startDate) return setError("Дата окончания раньше даты начала");

    const activeDays: ProgramDayInput[] = WEEKDAYS.filter((w) => days[w.value].enabled)
      .map((w) => ({
        weekday: w.value,
        label: days[w.value].label.trim() || w.label,
        exercises: days[w.value].exercises
          .map((ex) => ({ ...ex, name: ex.name.trim() }))
          .filter((ex) => ex.name.length > 0),
      }))
      .filter((d) => d.exercises.length > 0);

    if (activeDays.length === 0) return setError("Добавь хотя бы один тренировочный день с упражнением");

    const input: ProgramInput = { name: name.trim(), start_date: startDate, end_date: endDate, days: activeDays };

    startTransition(async () => {
      await saveProgramAction(input, program?.id);
      onSaved();
    });
  }

  function handleDelete() {
    if (!program) return;
    startTransition(async () => {
      await deleteProgramAction(program.id);
      onSaved();
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="card p-6 md:p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-4.5 w-4.5 text-violet" />
          <h2 className="font-display text-lg font-semibold text-text">
            {program ? "Редактировать программу" : "Новая программа тренировок"}
          </h2>
        </div>
        <button type="button" onClick={onClose} className="text-text-faint hover:text-text p-1">
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="flex flex-col gap-1.5 sm:col-span-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-text-faint">Название</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Набор массы, цикл 1" className={inputClass} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] uppercase tracking-wider text-text-faint">Дата начала</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] uppercase tracking-wider text-text-faint">Дата окончания</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
          </label>
        </div>

        <div className="flex flex-col gap-3">
          {WEEKDAYS.map((w) => {
            const day = days[w.value];
            return (
              <div
                key={w.value}
                className={`rounded-xl border transition-colors ${
                  day.enabled ? "border-border bg-bg-elevated-2/60" : "border-border-soft"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleDay(w.value)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                >
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
                    style={{
                      borderColor: day.enabled ? "var(--cyan)" : "var(--border)",
                      background: day.enabled ? "linear-gradient(135deg, var(--violet), var(--cyan))" : "transparent",
                    }}
                  >
                    {day.enabled && <Check className="h-3 w-3 text-bg" strokeWidth={3} />}
                  </span>
                  <span className="text-sm font-medium text-text">{w.label}</span>
                  {!day.enabled && <span className="text-xs text-text-faint ml-auto">день отдыха</span>}
                </button>

                {day.enabled && (
                  <div className="px-4 pb-4 flex flex-col gap-3">
                    <input
                      value={day.label}
                      onChange={(e) => updateDayLabel(w.value, e.target.value)}
                      placeholder={`Название дня, например «${w.label === "Понедельник" ? "Грудь и трицепс" : "День"}»`}
                      className={inputClass}
                    />

                    <div className="flex flex-col gap-2">
                      {day.exercises.map((ex, i) => (
                        <div key={i} className="grid grid-cols-12 gap-2 items-center">
                          <input
                            value={ex.name}
                            onChange={(e) => updateExercise(w.value, i, { name: e.target.value })}
                            placeholder="Упражнение"
                            className={`${inputClass} col-span-12 sm:col-span-5`}
                          />
                          <input
                            type="number"
                            min={1}
                            value={ex.target_sets}
                            onChange={(e) => updateExercise(w.value, i, { target_sets: parseInt(e.target.value) || 1 })}
                            placeholder="Подх."
                            title="Подходы"
                            className={`${inputClass} col-span-4 sm:col-span-2`}
                          />
                          <input
                            value={ex.target_reps}
                            onChange={(e) => updateExercise(w.value, i, { target_reps: e.target.value })}
                            placeholder="8-10"
                            title="Повторения"
                            className={`${inputClass} col-span-4 sm:col-span-2`}
                          />
                          <input
                            type="number"
                            step="0.5"
                            value={ex.target_weight_kg ?? ""}
                            onChange={(e) =>
                              updateExercise(w.value, i, {
                                target_weight_kg: e.target.value ? parseFloat(e.target.value) : null,
                              })
                            }
                            placeholder="кг"
                            title="Вес"
                            className={`${inputClass} col-span-4 sm:col-span-2`}
                          />
                          <button
                            type="button"
                            onClick={() => removeExercise(w.value, i)}
                            className="col-span-12 sm:col-span-1 flex items-center justify-center text-text-faint hover:text-rose p-2"
                            aria-label="Удалить упражнение"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => addExercise(w.value)}
                      className="self-start inline-flex items-center gap-1.5 text-xs font-medium text-violet hover:opacity-80"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Добавить упражнение
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {error && <p className="text-sm text-rose">{error}</p>}

        <div className="flex items-center gap-3 border-t border-border-soft pt-5">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet to-cyan px-5 py-2.5 text-sm font-semibold text-bg hover:opacity-90 disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Сохранить программу
          </button>
          {program && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              className="text-sm text-rose hover:opacity-80 disabled:opacity-50"
            >
              Удалить программу
            </button>
          )}
        </div>
      </form>
    </motion.div>
  );
}
