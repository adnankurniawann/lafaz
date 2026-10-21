"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { LEVELS } from "@/lib/course";
import { dayKey } from "@/lib/dates";
import { streakToday, useGame, useNow } from "@/lib/store";
import { FlameIcon } from "./icons";

export function TopBar({ title }: { title?: string }) {
  useNow(); // re-render when the day changes
  const streak = useGame((s) => s.streak);
  const doneToday = streak.lastDay === dayKey();
  const [open, setOpen] = useState(false);
  const [levelsOpen, setLevelsOpen] = useState(false);
  const levels = useGame((s) => s.levels);
  const level = useGame((s) => s.level);
  // The Level picker shows on the Belajar tab once more than one Level is open (ADR-0010).
  const showLevels = usePathname() === "/" && levels.length > 1;

  return (
    <header className="sticky top-0 z-20 border-b-2 border-line bg-white">
      <div className="flex h-14 items-center justify-between px-4">
        <span className="flex items-center gap-2 text-lg font-extrabold text-green">
          <span className="arabic-big flex size-8 items-center justify-center rounded-lg bg-green text-xl text-white">ل</span>
          {title}
          {showLevels && (
            <button
              type="button"
              onClick={() => setLevelsOpen(!levelsOpen)}
              className="flex items-center gap-1 rounded-xl border-2 border-line px-3 py-1 text-sm font-extrabold uppercase tracking-wide text-foreground"
              aria-expanded={levelsOpen}
            >
              Level {LEVELS.find((l) => l.id === level)?.title}
              <span aria-hidden className="text-muted">
                ▾
              </span>
            </button>
          )}
        </span>
        <button type="button" onClick={() => setOpen(!open)} className={`flex items-center gap-1 font-extrabold ${doneToday ? "text-orange" : "text-muted"}`}>
          <FlameIcon lit={doneToday} />
          {streakToday(streak)}
        </button>
      </div>

      {open && <StreakPanel onClose={() => setOpen(false)} />}
      {levelsOpen && showLevels && <LevelPanel onClose={() => setLevelsOpen(false)} />}
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

function LevelPanel({ onClose }: { onClose: () => void }) {
  const levels = useGame((s) => s.levels);
  const current = useGame((s) => s.level);
  const setLevel = useGame((s) => s.setLevel);
  return (
    <div className="animate-fade-in space-y-2 border-t-2 border-line px-4 py-3">
      {LEVELS.filter((l) => levels.includes(l.id)).map((l) => (
        <button
          key={l.id}
          type="button"
          onClick={() => {
            setLevel(l.id);
            onClose();
          }}
          className={`block w-full rounded-2xl border-2 border-b-4 px-4 py-3 text-left ${l.id === current ? "border-blue bg-blue/10" : "border-line"}`}
        >
          <span className="font-extrabold">Level {l.title}</span>
          <span className="block text-sm text-muted">{l.description}</span>
        </button>
      ))}
      <p className="text-xs text-muted">Pindah Level kapan saja. Progres tiap Level tetap tersimpan.</p>
    </div>
  );
}
