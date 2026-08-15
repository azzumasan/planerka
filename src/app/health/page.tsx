import Link from "next/link";
import { BookOpen, LineChart } from "lucide-react";
import { getAllBodyWeights, getAllWorkoutLogs, getPrograms } from "@/lib/queries";
import HealthDashboard from "@/components/HealthDashboard";
import PageHeader from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export default async function HealthPage() {
  const now = new Date();

  const programs = getPrograms();
  const logs = getAllWorkoutLogs();
  const bodyWeights = getAllBodyWeights();

  return (
    <div className="max-w-4xl">
      <PageHeader
        eyebrow="04 · Здоровье и тренировки"
        title="Тренировки"
        subtitle="Программа на неделю, календарь по дням, план и факт по каждому подходу."
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/health/progress"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-text-muted hover:border-violet hover:text-text transition-colors"
            >
              <LineChart className="h-4 w-4 text-cyan" />
              Прогресс
            </Link>
            <Link
              href="/health/exercises"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-text-muted hover:border-violet hover:text-text transition-colors"
            >
              <BookOpen className="h-4 w-4 text-violet" />
              Библиотека упражнений
            </Link>
          </div>
        }
      />
      <HealthDashboard
        initialPrograms={programs}
        initialLogs={logs}
        initialBodyWeights={bodyWeights}
        initialYear={now.getFullYear()}
        initialMonth={now.getMonth()}
      />
    </div>
  );
}
