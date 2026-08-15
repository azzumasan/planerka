"use client";

import { motion } from "motion/react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { ListTodo, CircleCheck, TrendingUp, Flame, AlertTriangle, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AnalyticsData } from "@/lib/analytics";
import { CATEGORY_COLOR, PRIORITY_COLOR } from "@/lib/taskStyle";

const tooltipStyle = {
  background: "#12151e",
  border: "1px solid #232838",
  borderRadius: 10,
  fontSize: 12,
  color: "#eef0f8",
};

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  suffix?: string;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="card p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}
        >
          <Icon className="h-4.5 w-4.5" style={{ color }} strokeWidth={2} />
        </span>
      </div>
      <p className="font-display text-2xl font-semibold text-text tabular-nums">
        {value}
        {suffix && <span className="text-sm text-text-muted ml-1">{suffix}</span>}
      </p>
      <p className="text-xs text-text-muted mt-0.5">{label}</p>
    </motion.div>
  );
}

export default function AnalyticsDashboard({ data }: { data: AnalyticsData }) {
  const hasCompletions = data.dailyCompletions.some((d) => d.completed > 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={ListTodo} label="всего задач" value={data.total} color="#8b7bff" />
        <StatCard icon={CircleCheck} label="выполнено" value={data.done} color="#34e0c4" />
        <StatCard icon={Target} label="активно" value={data.active} color="#5b8dff" />
        <StatCard icon={TrendingUp} label="процент выполнения" value={data.completionRate} suffix="%" color="#34e0c4" />
        <StatCard icon={Flame} label="серия дней" value={data.streak} color="#f5a83c" />
        <StatCard icon={AlertTriangle} label="просрочено" value={data.overdue} color="#f8567e" />
      </div>

      <div className="card p-5">
        <h3 className="font-display text-sm font-semibold text-text-muted mb-4">
          Выполненные задачи · последние 14 дней
        </h3>
        {hasCompletions ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.dailyCompletions} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="fillCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34e0c4" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#34e0c4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1a1e2a" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#565d75", fontSize: 11 }} axisLine={{ stroke: "#232838" }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: "#565d75", fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#8b92aa" }} cursor={{ stroke: "#232838" }} />
              <Area type="monotone" dataKey="completed" name="выполнено" stroke="#34e0c4" strokeWidth={2} fill="url(#fillCompleted)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[220px] text-sm text-text-faint">
            Пока нет выполненных задач за этот период
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-display text-sm font-semibold text-text-muted mb-4">
            По категориям
          </h3>
          {data.categoryBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={data.categoryBreakdown}
                  dataKey="count"
                  nameKey="label"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {data.categoryBreakdown.map((entry) => (
                    <Cell key={entry.category} fill={CATEGORY_COLOR[entry.category]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span style={{ color: "#8b92aa", fontSize: 12 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[240px] text-sm text-text-faint">
              Нет данных
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-display text-sm font-semibold text-text-muted mb-4">
            По приоритету
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.priorityBreakdown} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#1a1e2a" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#565d75", fontSize: 11 }} axisLine={{ stroke: "#232838" }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: "#565d75", fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Legend formatter={(value) => <span style={{ color: "#8b92aa", fontSize: 12 }}>{value === "active" ? "в работе" : "выполнено"}</span>} />
              <Bar dataKey="active" name="active" radius={[6, 6, 0, 0]} fill="#565d75" fillOpacity={0.45}>
                {data.priorityBreakdown.map((entry) => (
                  <Cell key={entry.priority} fill={PRIORITY_COLOR[entry.priority]} fillOpacity={0.35} />
                ))}
              </Bar>
              <Bar dataKey="done" name="done" radius={[6, 6, 0, 0]} fill="#eef0f8">
                {data.priorityBreakdown.map((entry) => (
                  <Cell key={entry.priority} fill={PRIORITY_COLOR[entry.priority]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
