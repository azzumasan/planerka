import { getTasks } from "@/lib/queries";
import { computeAnalytics } from "@/lib/analytics";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import PageHeader from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const tasks = getTasks();
  const data = computeAnalytics(tasks);

  return (
    <div className="max-w-6xl">
      <PageHeader
        eyebrow="03 · Аналитика"
        title="Разбор полётов"
        subtitle="Цифры и графики по всей проделанной работе."
      />
      <AnalyticsDashboard data={data} />
    </div>
  );
}
