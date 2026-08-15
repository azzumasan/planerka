"use client";

import { useMemo, useState, useTransition } from "react";
import { motion } from "motion/react";
import { Check, Loader2, IdCard, Ruler, Phone, HeartPulse, PenLine } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { saveProfileAction } from "@/lib/actions";
import type { Profile } from "@/lib/types";

function calcAge(isoDate: string | null): number | null {
  if (!isoDate) return null;
  const b = new Date(isoDate);
  if (Number.isNaN(b.getTime())) return null;
  const today = new Date();
  let years = today.getFullYear() - b.getFullYear();
  const beforeBirthday =
    today.getMonth() < b.getMonth() ||
    (today.getMonth() === b.getMonth() && today.getDate() < b.getDate());
  if (beforeBirthday) years -= 1;
  return years;
}

function calcBmi(heightCm: number | null, weightKg: number | null): number | null {
  if (!heightCm || !weightKg) return null;
  const meters = heightCm / 100;
  return weightKg / (meters * meters);
}

function bmiLabel(bmi: number | null): { text: string; color: string } | null {
  if (bmi === null) return null;
  if (bmi < 18.5) return { text: "недостаток", color: "var(--amber)" };
  if (bmi < 25) return { text: "норма", color: "var(--cyan)" };
  if (bmi < 30) return { text: "избыток", color: "var(--amber)" };
  return { text: "ожирение", color: "var(--rose)" };
}

const inputClass =
  "w-full rounded-lg border border-border bg-bg-elevated-2 px-3.5 py-2.5 text-sm text-text placeholder:text-text-faint outline-none transition-colors focus:border-violet";

function Field({
  label,
  children,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${wide ? "sm:col-span-2" : ""}`}>
      <span className="font-mono text-[11px] uppercase tracking-wider text-text-faint">
        {label}
      </span>
      {children}
    </label>
  );
}

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 mb-4 mt-8 first:mt-0">
      <Icon className="h-4 w-4 text-violet" strokeWidth={2} />
      <h2 className="font-display text-sm font-semibold tracking-wide text-text-muted">
        {children}
      </h2>
    </div>
  );
}

export default function ProfileForm({ profile }: { profile: Profile }) {
  const [form, setForm] = useState<Profile>(profile);
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const age = useMemo(() => calcAge(form.birth_date), [form.birth_date]);
  const bmi = useMemo(() => calcBmi(form.height_cm, form.weight_kg), [form.height_cm, form.weight_kg]);
  const bmiInfo = bmiLabel(bmi);

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await saveProfileAction(form);
      setDirty(false);
      setSavedAt(new Date());
    });
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      onSubmit={handleSubmit}
      className="card p-6 md:p-8"
    >
      <SectionTitle icon={IdCard}>Основное</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="ФИО" wide>
          <input
            className={inputClass}
            value={form.full_name ?? ""}
            onChange={(e) => update("full_name", e.target.value || null)}
            placeholder="Ахметов Азат Ерланович"
          />
        </Field>
        <Field label="Дата рождения">
          <input
            type="date"
            className={inputClass}
            value={form.birth_date ?? ""}
            onChange={(e) => update("birth_date", e.target.value || null)}
          />
        </Field>
        <Field label="Возраст">
          <div className="flex items-center h-[42px] px-1">
            <span className="font-mono text-lg font-semibold text-cyan">
              {age !== null ? `${age} лет` : "—"}
            </span>
          </div>
        </Field>
        <Field label="Пол">
          <select
            className={inputClass}
            value={form.gender ?? ""}
            onChange={(e) => update("gender", e.target.value || null)}
          >
            <option value="">Не указано</option>
            <option value="male">Мужской</option>
            <option value="female">Женский</option>
          </select>
        </Field>
        <Field label="Город">
          <input
            className={inputClass}
            value={form.city ?? ""}
            onChange={(e) => update("city", e.target.value || null)}
            placeholder="Алматы"
          />
        </Field>
      </div>

      <SectionTitle icon={Ruler}>Физические показатели</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Рост, см">
          <input
            type="number"
            step="0.1"
            className={inputClass}
            value={form.height_cm ?? ""}
            onChange={(e) => update("height_cm", e.target.value ? parseFloat(e.target.value) : null)}
            placeholder="178"
          />
        </Field>
        <Field label="Вес, кг">
          <input
            type="number"
            step="0.1"
            className={inputClass}
            value={form.weight_kg ?? ""}
            onChange={(e) => update("weight_kg", e.target.value ? parseFloat(e.target.value) : null)}
            placeholder="74"
          />
        </Field>
        <Field label="ИМТ">
          <div className="flex items-center gap-2 h-[42px] px-1">
            <span className="font-mono text-lg font-semibold text-text">
              {bmi !== null ? bmi.toFixed(1) : "—"}
            </span>
            {bmiInfo && (
              <span
                className="text-xs font-medium rounded-full px-2 py-0.5"
                style={{ color: bmiInfo.color, backgroundColor: `color-mix(in srgb, ${bmiInfo.color} 15%, transparent)` }}
              >
                {bmiInfo.text}
              </span>
            )}
          </div>
        </Field>
      </div>

      <SectionTitle icon={Phone}>Контакты</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Телефон">
          <input
            type="tel"
            className={inputClass}
            value={form.phone ?? ""}
            onChange={(e) => update("phone", e.target.value || null)}
            placeholder="+7 700 000 00 00"
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            className={inputClass}
            value={form.email ?? ""}
            onChange={(e) => update("email", e.target.value || null)}
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Профессия / должность">
          <input
            className={inputClass}
            value={form.occupation ?? ""}
            onChange={(e) => update("occupation", e.target.value || null)}
            placeholder="Product manager"
          />
        </Field>
      </div>

      <SectionTitle icon={HeartPulse}>Здоровье</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Группа крови">
          <select
            className={inputClass}
            value={form.blood_type ?? ""}
            onChange={(e) => update("blood_type", e.target.value || null)}
          >
            <option value="">Не указано</option>
            <option value="I (0)">I (0)</option>
            <option value="II (A)">II (A)</option>
            <option value="III (B)">III (B)</option>
            <option value="IV (AB)">IV (AB)</option>
          </select>
        </Field>
        <Field label="Аллергии и особенности">
          <input
            className={inputClass}
            value={form.allergies ?? ""}
            onChange={(e) => update("allergies", e.target.value || null)}
            placeholder="Например: пенициллин, лактоза"
          />
        </Field>
      </div>

      <SectionTitle icon={PenLine}>О себе</SectionTitle>
      <textarea
        rows={3}
        className={inputClass}
        value={form.about ?? ""}
        onChange={(e) => update("about", e.target.value || null)}
        placeholder="Коротко о себе, приоритетах, контексте жизни"
      />

      <div className="mt-8 flex items-center gap-4 border-t border-border-soft pt-6">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet to-cyan px-5 py-2.5 text-sm font-semibold text-bg transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Сохранить в дело
        </button>
        <span className="font-mono text-xs text-text-muted">
          {dirty
            ? "есть несохранённые изменения"
            : savedAt
              ? `сохранено · ${savedAt.toLocaleTimeString("ru-RU")}`
              : profile.updated_at
                ? `сохранено · ${new Date(profile.updated_at).toLocaleString("ru-RU")}`
                : "изменений ещё не было"}
        </span>
      </div>
    </motion.form>
  );
}
