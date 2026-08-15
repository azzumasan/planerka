import { getAllBodyWeights, getAllWorkoutLogs } from "@/lib/queries";
import { buildBodyWeightSeries, buildExerciseSeries } from "@/lib/workoutProgress";
import ProgressCharts from "@/components/ProgressCharts";
import PageHeader from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export default function ProgressPage() {
  const logs = getAllWorkoutLogs();
  const bodyWeights = getAllBodyWeights();

  const exerciseSeries = buildExerciseSeries(logs);
  const bodyWeightSeries = buildBodyWeightSeries(bodyWeights);

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow="04 · Здоровье и тренировки"
        title="Прогресс"
        subtitle="Рабочий вес по упражнениям и вес тела во времени — по всем записанным тренировкам."
      />
      <ProgressCharts exerciseSeries={exerciseSeries} bodyWeightSeries={bodyWeightSeries} />
    </div>
  );
}
