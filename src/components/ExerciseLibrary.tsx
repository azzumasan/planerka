"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, ListChecks, Target } from "lucide-react";
import MuscleMap from "@/components/MuscleMap";
import { EXERCISES, EXERCISE_CATEGORIES } from "@/lib/exerciseLibrary";
import { ACTIVATION_COLOR, ACTIVATION_LABEL, MUSCLE_LABELS, buildActivation } from "@/lib/muscles";
import type { ActivationLevel, MuscleId } from "@/lib/muscles";

const LEVELS: ActivationLevel[] = ["primary", "secondary", "stabilizer"];

function MuscleChips({ ids, level }: { ids: MuscleId[]; level: ActivationLevel }) {
  if (ids.length === 0) return null;
  const color = ACTIVATION_COLOR[level];
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: color }} />
        <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color }}>
          {ACTIVATION_LABEL[level]}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 pl-[18px]">
        {ids.map((id) => (
          <span
            key={id}
            className="rounded-md px-2 py-0.5 text-[11px] leading-relaxed"
            style={{
              color,
              backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
            }}
          >
            {MUSCLE_LABELS[id]}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ExerciseLibrary() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>(EXERCISES[0].id);

  const selected = useMemo(
    () => EXERCISES.find((e) => e.id === selectedId) ?? EXERCISES[0],
    [selectedId]
  );

  const activation = useMemo(
    () => buildActivation(selected.primary, selected.secondary, selected.stabilizer),
    [selected]
  );

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EXERCISE_CATEGORIES.map((cat) => ({
      category: cat,
      exercises: EXERCISES.filter(
        (e) =>
          e.category === cat.value &&
          (!q || e.name.toLowerCase().includes(q) || e.focus.toLowerCase().includes(q))
      ),
    })).filter((g) => g.exercises.length > 0);
  }, [query]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
      {/* ── Список упражнений ── */}
      <div className="card p-4">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск: жим, верх груди…"
            className="w-full rounded-lg border border-border bg-bg-elevated-2 pl-9 pr-3 py-2.5 text-sm text-text placeholder:text-text-faint outline-none focus:border-violet"
          />
        </div>

        <div className="flex flex-col gap-4 max-h-[720px] overflow-y-auto pr-1">
          {grouped.map(({ category, exercises }) => (
            <div key={category.value}>
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-text-faint mb-1.5 px-1">
                {category.label}
              </h3>
              <div className="flex flex-col gap-0.5">
                {exercises.map((ex) => {
                  const active = ex.id === selectedId;
                  return (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => setSelectedId(ex.id)}
                      className={`text-left rounded-lg px-3 py-2 transition-colors ${
                        active
                          ? "bg-violet-soft text-text"
                          : "text-text-muted hover:bg-bg-elevated-2 hover:text-text"
                      }`}
                    >
                      <span className={`block text-sm ${active ? "font-medium" : ""}`}>{ex.name}</span>
                      <span className="block text-[11px] text-text-faint mt-0.5">{ex.focus}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {grouped.length === 0 && (
            <p className="text-sm text-text-faint py-8 text-center">Ничего не найдено.</p>
          )}
        </div>
      </div>

      {/* ── Манекен + разбор ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selected.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-6"
        >
          <div className="card p-5 md:p-6">
            <div className="mb-1 flex items-center gap-2">
              <Target className="h-4 w-4 text-violet" />
              <p className="font-mono text-[11px] uppercase tracking-wider text-cyan">
                {selected.focus}
              </p>
            </div>
            <h2 className="font-display text-xl md:text-2xl font-semibold text-text mb-1">
              {selected.name}
            </h2>
            <p className="text-xs text-text-faint mb-5">{selected.equipment}</p>

            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,340px)_1fr] gap-6 items-start">
              <div className="mx-auto w-full max-w-[340px]">
                <MuscleMap activation={activation} />
              </div>

              <div className="flex flex-col gap-4">
                <MuscleChips ids={selected.primary} level="primary" />
                <MuscleChips ids={selected.secondary} level="secondary" />
                <MuscleChips ids={selected.stabilizer} level="stabilizer" />
              </div>
            </div>
          </div>

          <div className="card p-5 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <ListChecks className="h-4 w-4 text-violet" />
              <h3 className="font-display text-sm font-semibold text-text-muted">Техника выполнения</h3>
            </div>
            <ol className="flex flex-col gap-3">
              {selected.technique.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-text-muted leading-relaxed">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-violet-soft font-mono text-[11px] text-violet">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="card p-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            {LEVELS.map((level) => (
              <div key={level} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm" style={{ background: ACTIVATION_COLOR[level] }} />
                <span className="text-[11px] text-text-muted">{ACTIVATION_LABEL[level]}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
