import { getTasks } from "@/lib/queries";
import TasksBoard from "@/components/TasksBoard";
import PageHeader from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const tasks = getTasks();

  return (
    <div className="max-w-4xl">
      <PageHeader
        eyebrow="02 · Задачи и цели"
        title="Повестка на сегодня"
        subtitle="Отмечай выполненное — эти данные питают Аналитику."
      />
      <TasksBoard initialTasks={tasks} />
    </div>
  );
}
