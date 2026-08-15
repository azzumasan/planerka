"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Sparkles } from "lucide-react";
import {
  UserRound,
  ListChecks,
  BarChart3,
  HeartPulse,
  Wallet,
  NotebookText,
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

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Закрыть меню" : "Открыть меню"}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-muted"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
        <span className="flex items-center gap-1.5 font-display font-semibold text-sm">
          <Sparkles className="h-3.5 w-3.5 text-violet" />
          Планёрка
        </span>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-[57px] z-30 border-b border-border bg-bg-elevated px-4 py-3 shadow-xl">
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              if (!item.ready) {
                return (
                  <div
                    key={item.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-text-faint"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm flex-1">{item.label}</span>
                    <span className="text-[10px] font-mono uppercase">скоро</span>
                  </div>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                    active ? "bg-violet-soft text-text" : "text-text-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}
