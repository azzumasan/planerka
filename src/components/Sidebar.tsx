"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  UserRound,
  ListChecks,
  BarChart3,
  HeartPulse,
  Wallet,
  NotebookText,
  Sparkles,
  Mic,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/voice", label: "Голосовая планёрка", icon: Mic, ready: true },
  { href: "/profile", label: "Личный кабинет", icon: UserRound, ready: true },
  { href: "/tasks", label: "Задачи и цели", icon: ListChecks, ready: true },
  { href: "/analytics", label: "Аналитика", icon: BarChart3, ready: true },
  { href: "/health", label: "Здоровье и тренировки", icon: HeartPulse, ready: true },
  { href: "/finance", label: "Финансы", icon: Wallet, ready: false },
  { href: "/notes", label: "Заметки", icon: NotebookText, ready: false },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-bg-elevated/60 px-4 py-6 h-screen overflow-y-auto">
      <div className="flex items-center gap-2.5 px-2 mb-8">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet to-cyan">
          <Sparkles className="h-4 w-4 text-bg" strokeWidth={2.5} />
        </span>
        <span className="font-display font-semibold text-lg tracking-tight text-text">
          Планёрка
        </span>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          if (!item.ready) {
            return (
              <div
                key={item.href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-text-faint cursor-default select-none"
              >
                <Icon className="h-4.5 w-4.5" strokeWidth={1.8} />
                <span className="text-sm flex-1">{item.label}</span>
                <span className="text-[10px] uppercase tracking-wider font-mono text-text-faint border border-border-soft rounded px-1.5 py-0.5">
                  скоро
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                active
                  ? "bg-violet-soft text-text"
                  : "text-text-muted hover:bg-bg-elevated-2 hover:text-text"
              }`}
            >
              <Icon
                className="h-4.5 w-4.5 shrink-0"
                strokeWidth={2}
                style={{ color: active ? "var(--violet)" : undefined }}
              />
              <span className="text-sm font-medium">{item.label}</span>
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gradient-to-br from-violet to-cyan" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-xl border border-border-soft bg-bg-elevated-2 px-3 py-3">
        <p className="text-[11px] text-text-faint leading-relaxed">
          Личная база данных хранится локально, в SQLite. Никуда не отправляется.
        </p>
      </div>
    </aside>
  );
}
