"use client";

import { useState } from "react";
import { dayKey } from "@/lib/dates";
import { HEART_REFILL_COST, HEART_REFILL_MS, MAX_HEARTS, streakToday, useGame, useHearts, useNow } from "@/lib/store";
import { Button } from "./Button";
import { FlameIcon, GemIcon, HeartIcon } from "./icons";

export function TopBar({ title }: { title?: string }) {
  const now = useNow();
  const streak = useGame((s) => s.streak);
  const gems = useGame((s) => s.gems);
  const hearts = useHearts();
  const doneToday = streak.lastDay === dayKey();
  const [open, setOpen] = useState<"hearts" | "streak" | null>(null);

  return (
    <header className="sticky top-0 z-20 border-b-2 border-line bg-white">
      <div className="flex h-14 items-center justify-between px-4">
        <span className="flex items-center gap-2 text-lg font-extrabold text-green">
          <span className="arabic-big flex size-8 items-center justify-center rounded-lg bg-green text-xl text-white">ل</span>
          {title}
        </span>
        <div className="flex items-center gap-4 font-extrabold">
          <button type="button" onClick={() => setOpen(open === "streak" ? null : "streak")} className={`flex items-center gap-1 ${doneToday ? "text-orange" : "text-muted"}`}>
            <FlameIcon lit={doneToday} />
            {streakToday(streak)}
          </button>
          <span className="flex items-center gap-1 text-blue">
            <GemIcon />
            {gems}
          </span>
          <button type="button" onClick={() => setOpen(open === "hearts" ? null : "hearts")} className="flex items-center gap-1 text-red">
            <HeartIcon />
            {hearts.count}
          </button>
        </div>
      </div>

      {open === "hearts" && <HeartsPanel count={hearts.count} nextIn={hearts.count < MAX_HEARTS ? hearts.since + HEART_REFILL_MS - now : 0} onClose={() => setOpen(null)} />}
      {open === "streak" && <StreakPanel onClose={() => setOpen(null)} />}
    </header>
  );
}

function HeartsPanel({ count, nextIn, onClose }: { count: number; nextIn: number; onClose: () => void }) {
  const gems = useGame((s) => s.gems);
  const buy = useGame((s) => s.buyHeartRefill);
  const minutes = Math.max(1, Math.ceil(nextIn / 60_000));
  return (
    <div className="animate-fade-in border-t-2 border-line px-4 py-4">
      <div className="flex justify-center gap-1">
        {Array.from({ length: MAX_HEARTS }, (_, i) => (
          <HeartIcon key={i} className="size-8" empty={i >= count} />
        ))}
      </div>
      <p className="mt-2 text-center font-bold">
        {count >= MAX_HEARTS ? "Hatimu penuh! Ayo lanjut belajar." : `Hati berikutnya dalam ${minutes >= 60 ? `${Math.floor(minutes / 60)} jam ${minutes % 60} menit` : `${minutes} menit`}`}
      </p>
      <p className="mt-1 text-center text-sm text-muted">Latihan di tab Huruf memberi 1 hati tiap selesai.</p>
      {count < MAX_HEARTS && (
        <Button color="blue" className="mt-3" disabled={gems < HEART_REFILL_COST} onClick={() => buy() && onClose()}>
          Isi penuh · <GemIcon className="size-5" /> {HEART_REFILL_COST}
        </Button>
      )}
    </div>
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
