"use client";

import { useEffect, useState } from "react";
import MobileNav from "@/components/MobileNav";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function dayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86400000);
}

const WEEKDAYS = [
  "воскресенье",
  "понедельник",
  "вторник",
  "среда",
  "четверг",
  "пятница",
  "суббота",
];

export default function HeaderBar() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border bg-bg/80 px-5 md:px-10 py-3.5 backdrop-blur-md">
      <MobileNav />

      <div className="hidden md:block" />

      <div className="flex items-center gap-3 font-mono text-xs text-text-muted">
        {now ? (
          <>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulse" />
              планёрка № {pad(dayOfYear(now))}
            </span>
            <span className="hidden sm:inline text-text-faint">·</span>
            <span className="hidden sm:inline capitalize">
              {WEEKDAYS[now.getDay()]}, {pad(now.getDate())}.{pad(now.getMonth() + 1)}.{now.getFullYear()}
            </span>
            <span className="text-text-faint">·</span>
            <span className="text-text tabular-nums">
              {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}
            </span>
          </>
        ) : (
          <span>&nbsp;</span>
        )}
      </div>
    </header>
  );
}
