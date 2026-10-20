"use client";

import { useState } from "react";
import { dayKey } from "@/lib/dates";
import { streakToday, useGame, useNow } from "@/lib/store";
import { FlameIcon } from "./icons";

export function TopBar({ title }: { title?: string }) {
  useNow(); // re-render when the day changes
  const streak = useGame((s) => s.streak);
  const doneToday = streak.lastDay === dayKey();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b-2 border-line bg-white">
      <div className="flex h-14 items-center justify-between px-4">
        <span className="flex items-center gap-2 text-lg font-extrabold text-green">
          <span className="arabic-big flex size-8 items-center justify-center rounded-lg bg-green text-xl text-white">ل</span>
          {title}
        </span>
        <button type="button" onClick={() => setOpen(!open)} className={`flex items-center gap-1 font-extrabold ${doneToday ? "text-orange" : "text-muted"}`}>
          <FlameIcon lit={doneToday} />
          {streakToday(streak)}
        </button>
      </div>

      {open && <StreakPanel onClose={() => setOpen(false)} />}
    </header>
  );
}

function StreakPanel({ onClose }: { onClose: () => void }) {
  const streak = useGame((s) => s.streak);
  const doneToday = streak.lastDay === dayKey();
  return (
    <button type="button" onClick={onClose} className="animate-fade-in block w-full border-t-2 border-line px-4 py-4 text-left">
      <p className="text-lg font-extrabold">{streakToday(streak)} hari beruntun</p>
      <p className="text-sm text-muted">
        {doneToday ? "Streak hari ini sudah aman. Sampai besok!" : "Selesaikan satu lesson hari ini untuk menjaga streak."}
      </p>
      <p className="mt-2 text-sm font-bold text-blue">🧊 Pembeku streak: {streak.freezes}</p>
      <p className="text-xs text-muted">Kamu dapat 1 pembeku gratis tiap minggu. Kalau sehari terlewat, pembeku dipakai otomatis.</p>
    </button>
  );
}
