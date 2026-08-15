import ExerciseLibrary from "@/components/ExerciseLibrary";
import PageHeader from "@/components/PageHeader";

export default function ExerciseLibraryPage() {
  return (
    <div className="max-w-5xl">
      <PageHeader
        eyebrow="04 · Здоровье и тренировки"
        title="Библиотека упражнений"
        subtitle="Выбери упражнение — справа покажется техника выполнения и целевая мышца на теле."
      />
      <ExerciseLibrary />
    </div>
  );
}
