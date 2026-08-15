"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Dumbbell, Plus } from "lucide-react";
import ProgramEditor from "@/components/ProgramEditor";
import DayDetail from "@/components/DayDetail";
import type { BodyWeightLog, Program, ProgramDay, WorkoutLog } from "@/lib/types";

const MONTH_NAMES = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];
const WEEKDAY_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function isoDate(y: number, m: number, d: number): string {
  const dt = new Date(y, m, d);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function isoWeekday(dateStr: string): number {
  const jsDay = new Date(dateStr).getDay();
  return jsDay === 0 ? 7 : jsDay;
}

function programDayFor(programs: Program[], dateStr: string): ProgramDay | undefined {
  const program = programs.find((p) => p.start_date <= dateStr && dateStr <= p.end_date);
  if (!program) return undefined;
  return program.days.find((d) => d.weekday === isoWeekday(dateStr));
}

export default function HealthDashboard({
  initialPrograms,
  initialLogs,
  initialBodyWeights,
  initialYear,
  initialMonth,
}: {
  initialPrograms: Program[];
  initialLogs: WorkoutLog[];
  initialBodyWeights: BodyWeightLog[];
  initialYear: number;
  initialMonth: number;
}) {
  const [programs, setPrograms] = useState(initialPrograms);
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  // Вся история тренировок и веса — грузится один раз, дальше только фильтруется на клиенте.
  // Данных за годы личных тренировок не наберётся настолько много, чтобы это стало проблемой.
  const [logs, setLogs] = useState(initialLogs);
  const [bodyWeights, setBodyWeights] = useState(initialBodyWeights);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.getFullYear() === initialYear && today.getMonth() === initialMonth
      ? isoDate(today.getFullYear(), today.getMonth(), today.getDate())
      : isoDate(initialYear, initialMonth, 1);
  });
  const [showEditor, setShowEditor] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | undefined>(undefined);

  const monthStart = isoDate(year, month, 1);
  const monthEnd = isoDate(year, month + 1, 0);
  const logsInMonth = useMemo(
    () => logs.filter((l) => l.log_date >= monthStart && l.log_date <= monthEnd),
    [logs, monthStart, monthEnd]
  );

  const cells = useMemo(() => {
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = isoWeekday(isoDate(year, month, 1)) - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

    const result: { date: string; inMonth: boolean; dayNum: number }[] = [];
    for (let i = 0; i < totalCells; i++) {
      const dayOffset = i - startOffset + 1;
      const d = new Date(firstOfMonth);
      d.setDate(dayOffset);
      result.push({
        date: isoDate(d.getFullYear(), d.getMonth(), d.getDate()),
        inMonth: d.getMonth() === month,
        dayNum: d.getDate(),
      });
    }
    return result;
  }, [year, month]);

  const todayIso = isoDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  function changeMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setMonth(m);
    setYear(y);
  }

  function refreshPrograms() {
    // simplest reliable refresh: reload the page data via router-independent refetch
    window.location.reload();
  }

  const selectedProgramDay = programDayFor(programs, selectedDate);
  const selectedLogs = logs.filter((l) => l.log_date === selectedDate);
  const selectedBodyWeight = bodyWeights.find((b) => b.log_date === selectedDate);

  return (
    <div className="flex flex-col gap-6">
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-violet" />
            <h2 className="font-display text-sm font-semibold text-text-muted">Программы тренировок</h2>
          </div>
          <button
            type="button"
            onClick={() => { setEditingProgram(undefined); setShowEditor(true); }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet hover:opacity-80"
          >
            <Plus className="h-3.5 w-3.5" />
            Новая программа
          </button>
        </div>

        {programs.length === 0 ? (
          <p className="text-sm text-text-faint">
            Пока нет ни одной программы. Создай первую — и план тренировок появится в календаре.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {programs.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => { setEditingProgram(p); setShowEditor(true); }}
                className="rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-text-muted hover:border-violet hover:text-text transition-colors"
              >
                {p.name} · {p.start_date.slice(5)}–{p.end_date.slice(5)}
              </button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showEditor && (
          <ProgramEditor
            program={editingProgram}
            onClose={() => setShowEditor(false)}
            onSaved={refreshPrograms}
          />
        )}
      </AnimatePresence>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-text">
            {MONTH_NAMES[month]} {year}
          </h2>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => changeMonth(-1)} className="p-1.5 rounded-lg hover:bg-bg-elevated-2 text-text-muted">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => changeMonth(1)} className="p-1.5 rounded-lg hover:bg-bg-elevated-2 text-text-muted">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {WEEKDAY_SHORT.map((d) => (
            <div key={d} className="text-center font-mono text-[10px] uppercase text-text-faint py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((cell) => {
            const day = programDayFor(programs, cell.date);
            const hasLog = logsInMonth.some((l) => l.log_date === cell.date);
            const isSelected = cell.date === selectedDate;
            const isToday = cell.date === todayIso;

            return (
              <button
                key={cell.date}
                type="button"
                onClick={() => setSelectedDate(cell.date)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-1 text-sm transition-colors ${
                  !cell.inMonth
                    ? "text-text-faint/40"
                    : isSelected
                      ? "bg-violet-soft text-text border border-violet"
                      : "text-text hover:bg-bg-elevated-2 border border-transparent"
                } ${isToday && !isSelected ? "border border-border" : ""}`}
              >
                <span className={isToday ? "font-semibold text-cyan" : ""}>{cell.dayNum}</span>
                <span className="flex items-center gap-0.5 h-1.5">
                  {day && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: hasLog ? "var(--cyan)" : "var(--violet)" }}
                    />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <DayDetail
        date={selectedDate}
        programDay={selectedProgramDay}
        logs={selectedLogs}
        allLogs={logs}
        bodyWeight={selectedBodyWeight}
        onLogSaved={(log) => setLogs((prev) => [...prev.filter((l) => l.id !== log.id), log])}
        onLogDeleted={(id) => setLogs((prev) => prev.filter((l) => l.id !== id))}
        onBodyWeightSaved={(bw) => setBodyWeights((prev) => [...prev.filter((b) => b.id !== bw.id), bw])}
      />
    </div>
  );
}
