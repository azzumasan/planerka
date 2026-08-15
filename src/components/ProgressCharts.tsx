"use client";

import { useMemo, useState } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Dumbbell, Scale, TrendingUp } from "lucide-react";
import type { BodyWeightPoint, ExerciseSeries } from "@/lib/workoutProgress";

const tooltipStyle = {
  background: "#12151e",
  border: "1px solid #232838",
  borderRadius: 10,
  fontSize: 12,
  color: "#eef0f8",
};

type Metric = "topWeight" | "volume";

export default function ProgressCharts({
  exerciseSeries,
  bodyWeightSeries,
}: {
  exerciseSeries: ExerciseSeries[];
  bodyWeightSeries: BodyWeightPoint[];
}) {
  const [selectedExercise, setSelectedExercise] = useState(exerciseSeries[0]?.exerciseName ?? "");
  const [metric, setMetric] = useState<Metric>("topWeight");

  const series = useMemo(
    () => exerciseSeries.find((s) => s.exerciseName === selectedExercise),
    [exerciseSeries, selectedExercise]
  );

  const lastPoint = series?.points[series.points.length - 1];
  const firstPoint = series?.points[0];
  const weightDelta =
    lastPoint?.topWeight != null && firstPoint?.topWeight != null
      ? lastPoint.topWeight - firstPoint.topWeight
      : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="card p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-violet" />
            <h2 className="font-display text-sm font-semibold text-text-muted">Вес на упражнении</h2>
          </div>

          {exerciseSeries.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="rounded-lg border border-border bg-bg-elevated-2 px-3 py-2 text-sm text-text outline-none focus:border-violet max-w-[220px]"
              >
                {exerciseSeries.map((s) => (
                  <option key={s.exerciseName} value={s.exerciseName}>
                    {s.exerciseName} · {s.points.length}
                  </option>
                ))}
              </select>
              <div className="flex items-center rounded-lg border border-border overflow-hidden text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setMetric("topWeight")}
                  className={`px-3 py-2 font-medium transition-colors ${metric === "topWeight" ? "bg-violet-soft text-text" : "text-text-muted hover:text-text"}`}
                >
                  Вес
                </button>
                <button
                  type="button"
                  onClick={() => setMetric("volume")}
                  className={`px-3 py-2 font-medium border-l border-border transition-colors ${metric === "volume" ? "bg-violet-soft text-text" : "text-text-muted hover:text-text"}`}
                >
                  Объём
                </button>
              </div>
            </div>
          )}
        </div>

        {!series || series.points.length === 0 ? (
          <div className="flex items-center justify-center h-[220px] text-sm text-text-faint text-center px-6">
            Пока нет записанных подходов. Как только запишешь факт по упражнению в разделе «Тренировки», здесь появится график.
          </div>
        ) : (
          <>
            {metric === "topWeight" && weightDelta !== null && series.points.length > 1 && (
              <div className="flex items-center gap-1.5 mb-3 text-xs">
                <TrendingUp className="h-3.5 w-3.5" style={{ color: weightDelta >= 0 ? "var(--cyan)" : "var(--rose)" }} />
                <span style={{ color: weightDelta >= 0 ? "var(--cyan)" : "var(--rose)" }} className="font-mono font-semibold">
                  {weightDelta >= 0 ? "+" : ""}
                  {weightDelta} кг
                </span>
                <span className="text-text-faint">
                  с {firstPoint?.label} по {lastPoint?.label}
                </span>
              </div>
            )}
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={series.points} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillProgress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b7bff" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#8b7bff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1a1e2a" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#565d75", fontSize: 11 }} axisLine={{ stroke: "#232838" }} tickLine={false} />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#565d75", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                  domain={metric === "topWeight" ? ["dataMin - 5", "dataMax + 5"] : [0, "dataMax + 100"]}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: "#8b92aa" }}
                  formatter={(value) => [metric === "topWeight" ? `${value} кг` : `${value} кг·повт`, metric === "topWeight" ? "Рабочий вес" : "Объём"]}
                />
                <Area
                  type="monotone"
                  dataKey={metric}
                  name={metric === "topWeight" ? "Рабочий вес" : "Объём"}
                  stroke="#8b7bff"
                  strokeWidth={2}
                  fill="url(#fillProgress)"
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      <div className="card p-5 md:p-6">
        <div className="flex items-center gap-2 mb-5">
          <Scale className="h-4 w-4 text-cyan" />
          <h2 className="font-display text-sm font-semibold text-text-muted">Вес тела</h2>
        </div>

        {bodyWeightSeries.length === 0 ? (
          <div className="flex items-center justify-center h-[220px] text-sm text-text-faint text-center px-6">
            Пока нет записей веса. Отмечай вес в панели дня на странице «Тренировки».
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={bodyWeightSeries} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="fillBodyWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34e0c4" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#34e0c4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1a1e2a" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#565d75", fontSize: 11 }} axisLine={{ stroke: "#232838" }} tickLine={false} />
              <YAxis
                tick={{ fill: "#565d75", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={36}
                domain={["dataMin - 2", "dataMax + 2"]}
              />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#8b92aa" }} formatter={(value) => [`${value} кг`, "Вес тела"]} />
              <Area type="monotone" dataKey="weight" name="Вес тела" stroke="#34e0c4" strokeWidth={2} fill="url(#fillBodyWeight)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
