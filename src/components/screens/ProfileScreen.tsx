"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/Button";
import { BoltIcon, FlameIcon, GemIcon } from "@/components/icons";
import { Mascot } from "@/components/Mascot";
import { Dialog } from "@/components/Sheet";
import { letters } from "@/lib/letters";
import { DAILY_GOALS, streakToday, useGame } from "@/lib/store";

export function ProfileScreen() {
  const s = useGame();
  const [confirmReset, setConfirmReset] = useState(false);
  const mastered = letters.filter((l) => (s.mastery[l.id] ?? 0) >= 0.8).length;

  const stats = [
    { label: "Hari beruntun", value: streakToday(s.streak), icon: <FlameIcon className="size-7" /> },
    { label: "Total XP", value: s.totalXp, icon: <BoltIcon className="size-7" /> },
    { label: "Gems", value: s.gems, icon: <GemIcon className="size-7" /> },
    { label: "Huruf dikuasai", value: `${mastered}/${letters.length}`, icon: <span className="arabic-big text-2xl leading-none text-green">ب</span> },
    { label: "Lesson selesai", value: s.stats.lessons, icon: <span className="text-2xl">📖</span> },
    { label: "Combo terbaik", value: s.stats.bestCombo, icon: <span className="text-2xl">🔥</span> },
  ];

  return (
    <div className="px-4 pb-10 pt-5">
      <div className="flex items-center gap-4">
        <div className="flex size-20 items-center justify-center rounded-full bg-green/15">
          <Mascot size={64} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold">Pelajar Lafaz</h1>
          <p className="text-sm text-muted">Progres disimpan di perangkat ini</p>
        </div>
      </div>

      <h2 className="mt-6 text-lg font-extrabold">Statistik</h2>
      <div className="mt-2 grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-3 rounded-2xl border-2 border-line p-3">
            {stat.icon}
            <div>
              <p className="text-lg font-extrabold leading-tight">{stat.value}</p>
              <p className="text-xs text-muted">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-6 text-lg font-extrabold">Target harian</h2>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {DAILY_GOALS.map((g) => (
          <button
            key={g.xp}
            type="button"
            onClick={() => s.setDailyGoal(g.xp)}
            className={`rounded-2xl border-2 border-b-4 p-3 text-left ${s.dailyGoal === g.xp ? "border-blue bg-blue/10 text-blue" : "border-line"}`}
          >
            <p className="font-extrabold">{g.label}</p>
            <p className="text-xs">{g.xp} XP · {g.minutes}</p>
          </button>
        ))}
      </div>

      <label className="mt-6 flex items-center justify-between rounded-2xl border-2 border-line p-4 font-bold">
        Efek suara
        <input type="checkbox" checked={s.soundEffects} onChange={(e) => s.setSoundEffects(e.target.checked)} className="size-5 accent-green" />
      </label>

      <div className="mt-6 rounded-2xl bg-gold/15 p-4 text-sm leading-relaxed">
        <p className="font-extrabold">Jangan lupa talaqqi</p>
        Lafaz membantu latihan, tapi bacaan tetap perlu disetorkan dan dikoreksi langsung oleh guru.
      </div>

      <h2 className="mt-6 text-lg font-extrabold">Untuk guru</h2>
      <Link href="/studio" className="mt-2 flex items-center justify-between rounded-2xl border-2 border-line p-4 font-bold">
        🎙️ Studio rekam suara huruf
        <span className="text-muted">›</span>
      </Link>
      <Link href="/debug/tajwid" className="mt-2 flex items-center justify-between rounded-2xl border-2 border-line p-4 font-bold">
        🎨 Cek data tajwid
        <span className="text-muted">›</span>
      </Link>

      <Button color="ghost" className="mt-6 text-red" onClick={() => setConfirmReset(true)}>
        Hapus semua progres
      </Button>

      {confirmReset && (
        <Dialog onClose={() => setConfirmReset(false)}>
          <h2 className="text-xl font-extrabold">Hapus semua progres?</h2>
          <p className="mt-1 text-muted">XP, streak, gems, dan lesson yang selesai akan hilang. Rekaman di studio tidak ikut terhapus.</p>
          <div className="mt-5 space-y-3">
            <Button color="red" onClick={() => s.resetProgress()}>
              Hapus
            </Button>
            <Button color="ghost" onClick={() => setConfirmReset(false)}>
              Batal
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
