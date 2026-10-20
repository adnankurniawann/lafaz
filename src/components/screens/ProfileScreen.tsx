"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/Button";
import { BoltIcon, FlameIcon } from "@/components/icons";
import { Mascot } from "@/components/Mascot";
import { Dialog } from "@/components/Sheet";
import { BADGES } from "@/lib/badges";
import { units } from "@/lib/course";
import { letters } from "@/lib/letters";
import { rankFor } from "@/lib/rank";
import { useSpeech } from "@/lib/speech";
import { DAILY_GOALS, MASTERED, streakToday, useGame } from "@/lib/store";

export function ProfileScreen() {
  const s = useGame();
  const [confirmReset, setConfirmReset] = useState(false);
  const rank = rankFor(s.totalXp);
  const speech = useSpeech();
  const mastered = letters.filter((l) => (s.mastery[l.id] ?? 0) >= MASTERED).length;

  const stats = [
    { label: "Hari beruntun", value: streakToday(s.streak), icon: <FlameIcon className="size-7" /> },
    { label: "Total XP", value: s.totalXp, icon: <BoltIcon className="size-7" /> },
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

      <div className="mt-5 rounded-2xl border-2 border-gold/50 bg-gold/10 p-4">
        <p className="text-xs font-extrabold uppercase tracking-wider text-gold-dark">Rank</p>
        <p className="text-2xl font-extrabold">{rank.name}</p>
        {rank.next ? (
          <>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-gold" style={{ width: `${((s.totalXp - rank.xp) / (rank.next.xp - rank.xp)) * 100}%` }} />
            </div>
            <p className="mt-1 text-xs text-muted">
              {rank.next.xp - s.totalXp} XP lagi menuju {rank.next.name}
            </p>
          </>
        ) : (
          <p className="text-xs text-muted">Rank tertinggi. Terus menyala!</p>
        )}
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

      <h2 className="mt-6 text-lg font-extrabold">Badge</h2>
      <ul className="mt-2 grid grid-cols-2 gap-3">
        {BADGES.map((b) => {
          const earned = !!s.badges[b.id];
          return (
            <li key={b.id} className={`rounded-2xl border-2 p-3 ${earned ? "border-gold bg-gold/10" : "border-line"}`}>
              <span className={`text-3xl ${earned ? "" : "opacity-30 grayscale"}`}>{b.icon}</span>
              <p className="mt-1 font-extrabold leading-tight">{b.title}</p>
              <p className="text-xs text-muted">{earned ? "Didapat" : b.how}</p>
              {b.id === "juara-tantangan" && s.challenges.length > 0 && (
                <p className="mt-1 text-xs font-bold text-orange">
                  Tantangan unit {units.filter((u) => s.challenges.includes(u.id)).map((u) => u.number).join(", ")}
                </p>
              )}
            </li>
          );
        })}
      </ul>

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

      <div className="mt-3 flex items-center justify-between rounded-2xl border-2 border-line p-4">
        <span className="font-bold">Cek Suara</span>
        <span className="text-sm text-muted">
          {speech.status === "ready"
            ? "Siap, jalan di perangkat ini"
            : speech.status === "loading"
              ? `Mengunduh ${Math.round(speech.progress)}%`
              : speech.status === "error"
                ? "Belum tersedia"
                : "Menunggu"}
        </span>
      </div>

      <div className="mt-6 rounded-2xl bg-gold/15 p-4 text-sm leading-relaxed">
        <p className="font-extrabold">Mau makin mantap?</p>
        Coba perdengarkan bacaanmu ke guru atau teman yang lancar. Lafaz belum bisa menilai makhraj, telinga mereka bisa.
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
          <p className="mt-1 text-muted">XP, streak, badge, dan lesson yang selesai akan hilang. Rekaman di studio tidak ikut terhapus.</p>
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
