"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/Button";
import { AyahLettersText } from "@/components/AyahLettersText";
import { BoltIcon, FlameIcon } from "@/components/icons";
import { Mascot } from "@/components/Mascot";
import { knownCount, type AyahLetters } from "@/lib/ayah-letters";
import { getBadge } from "@/lib/badges";
import { LEVELS, learnedLetters } from "@/lib/course";
import { addDays, dayKey, WEEKDAYS } from "@/lib/dates";
import { getLetter, refLabel } from "@/lib/letters";
import { QUEST_ICON, questTitle } from "@/lib/quests";
import { rankFor } from "@/lib/rank";
import { useGame, type LessonSummary } from "@/lib/store";

type Summary = LessonSummary & { accuracy: number; seconds: number; perfect: boolean; challenge: boolean };
type Step = "result" | "ayah" | "badges" | "level" | "rank" | "streak" | "goal" | "quests";

const STREAK_MILESTONES = [7, 30, 100];

/** The screens after a lesson, one after another, like Duolingo. */
export function LessonEnd({ summary, backTo, ayah }: { summary: Summary; backTo: string; ayah?: AyahLetters }) {
  const router = useRouter();
  const totalXp = useGame((s) => s.totalXp);
  const rankUp = rankFor(totalXp - summary.xp).index < rankFor(totalXp).index;
  const steps: Step[] = [
    "result",
    ...(ayah ? (["ayah"] as const) : []),
    ...(summary.newBadges.length ? (["badges"] as const) : []),
    ...(summary.newLevels.length ? (["level"] as const) : []),
    ...(rankUp ? (["rank"] as const) : []),
    ...(summary.streakIncreased ? (["streak"] as const) : []),
    "goal",
    "quests",
  ];
  const [step, setStep] = useState(0);
  const current = steps[step];
  const next = () => (step + 1 < steps.length ? setStep(step + 1) : router.push(backTo));

  return (
    <div className="flex min-h-dvh flex-col px-5 pb-6 pt-10">
      <div className="flex flex-1 flex-col items-center justify-center text-center" key={current}>
        {current === "result" && <Result summary={summary} />}
        {current === "ayah" && ayah && <AyahStep ayah={ayah} />}
        {current === "badges" && <BadgeStep summary={summary} />}
        {current === "level" && <LevelStep summary={summary} />}
        {current === "rank" && <RankStep totalXp={totalXp} />}
        {current === "streak" && <StreakStep summary={summary} />}
        {current === "goal" && <GoalStep summary={summary} />}
        {current === "quests" && <QuestStep summary={summary} />}
      </div>
      <Button onClick={next}>Lanjut</Button>
    </div>
  );
}

function Confetti() {
  const colors = ["#3fb950", "#2b9ae6", "#f5b400", "#ef4b4b", "#9b5de5", "#ff9a1f"];
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 mx-auto h-0 max-w-[430px]" aria-hidden>
      {Array.from({ length: 28 }, (_, i) => (
        <span
          key={i}
          className="absolute top-0 block h-3 w-2 rounded-sm"
          style={{
            left: `${(i * 37) % 100}%`,
            background: colors[i % colors.length],
            animation: `confetti-fall ${1.6 + (i % 5) * 0.3}s ease-in ${(i % 7) * 0.12}s both`,
          }}
        />
      ))}
    </div>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: React.ReactNode }) {
  return (
    <div className={`flex-1 overflow-hidden rounded-2xl border-2 ${color}`}>
      <p className={`py-1 text-[11px] font-extrabold uppercase text-white ${color.replace("border", "bg")}`}>{label}</p>
      <p className="flex items-center justify-center gap-1 bg-white py-3 text-xl font-extrabold">
        {icon}
        {value}
      </p>
    </div>
  );
}

function Result({ summary }: { summary: Summary }) {
  const minutes = Math.floor(summary.seconds / 60);
  const seconds = String(summary.seconds % 60).padStart(2, "0");
  return (
    <>
      <Confetti />
      <Mascot mood="cheer" size={150} className="animate-pop-in" />
      <h1 className="mt-4 text-3xl font-extrabold text-gold">{summary.challenge ? "Tantangan lulus!" : summary.perfect ? "Sempurna!" : "Lesson selesai!"}</h1>
      <p className="mt-1 text-muted">{summary.perfect ? "Tanpa salah sama sekali. Barakallahu fiik!" : "Setiap salah adalah bagian dari belajar."}</p>
      <div className="mt-8 flex w-full gap-3">
        <StatCard label="Total XP" value={String(summary.xp)} color="border-gold" icon={<BoltIcon className="size-5" />} />
        <StatCard label={summary.accuracy >= 90 ? "Hebat" : "Akurasi"} value={`${summary.accuracy}%`} color="border-green" icon={null} />
        <StatCard label="Waktu" value={`${minutes}:${seconds}`} color="border-blue" icon={null} />
      </div>
      {summary.challenge && <p className="mt-4 font-bold text-orange">⚡ XP 2x dari Mode Tantangan</p>}
      <TroubleNote label="Ditaklukkan, keluar dari Huruf Bandel" letters={summary.troubleCleared} className="text-green-dark" />
      <TroubleNote label="Masuk Huruf Bandel, latih di tab Huruf" letters={summary.troubleAdded} className="text-orange" />
    </>
  );
}

function TroubleNote({ label, letters, className }: { label: string; letters: string[]; className: string }) {
  if (!letters.length) return null;
  return (
    <p className={`mt-4 flex flex-wrap items-center justify-center gap-x-2 text-sm font-bold ${className}`}>
      {label}:
      <span dir="rtl" className="arabic-big text-2xl leading-normal">
        {letters.map((l) => getLetter(l).char).join("  ")}
      </span>
    </p>
  );
}

/** Momen sorot huruf: a real ayah with the letters the learner already knows lit up. */
function AyahStep({ ayah }: { ayah: AyahLetters }) {
  const lessons = useGame((s) => s.lessons);
  const known = new Set(learnedLetters(lessons));
  return (
    <>
      <h1 className="text-2xl font-extrabold">Lihat, ini ayat Al-Qur&apos;an</h1>
      <p className="mt-1 text-muted">Huruf yang menyala sudah kamu kenal.</p>
      <div className="mt-6 w-full rounded-2xl border-2 border-line px-4 py-5">
        <AyahLettersText text={ayah.text} known={known} className="text-4xl! text-center!" />
        <p className="mt-4 text-xs font-bold text-muted">{refLabel(`${ayah.surah}:${ayah.ayah}`)}</p>
      </div>
      <p className="mt-5 text-lg font-extrabold text-green">
        Kamu sudah kenal {knownCount(ayah, known)} dari {ayah.letters.length} huruf di ayat ini
      </p>
      <p className="mt-1 text-sm text-muted">Ayat lainnya ada di Peta Ayat.</p>
    </>
  );
}

function RankStep({ totalXp }: { totalXp: number }) {
  return (
    <>
      <Confetti />
      <Mascot mood="cheer" size={130} className="animate-pop-in" />
      <p className="mt-4 text-sm font-extrabold uppercase tracking-wider text-muted">Rank baru</p>
      <h1 className="text-4xl font-extrabold text-gold">{rankFor(totalXp).name}</h1>
      <p className="mt-2 text-muted">Total {totalXp} XP. Rank tidak pernah turun, jadi santai saja.</p>
    </>
  );
}

function BadgeStep({ summary }: { summary: Summary }) {
  return (
    <>
      <Confetti />
      <h1 className="text-2xl font-extrabold text-gold">Badge baru!</h1>
      <ul className="mt-6 w-full space-y-3">
        {summary.newBadges.map((id) => {
          const badge = getBadge(id);
          return (
            <li key={id} className="flex items-center gap-4 rounded-2xl border-2 border-gold bg-gold/10 p-4 text-left animate-pop-in">
              <span className="text-4xl">{badge.icon}</span>
              <span>
                <span className="block text-lg font-extrabold">{badge.title}</span>
                <span className="text-sm text-muted">{badge.how}</span>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-sm text-muted">Semua badge ada di Profil.</p>
    </>
  );
}

function LevelStep({ summary }: { summary: Summary }) {
  const names = summary.newLevels.map((id) => LEVELS.find((l) => l.id === id)!.title).join(" dan ");
  return (
    <>
      <Confetti />
      <Mascot mood="cheer" size={130} className="animate-pop-in" />
      <h1 className="mt-4 text-2xl font-extrabold text-teal">Level {names} terbuka!</h1>
      <p className="mt-2 text-muted">Kamu sudah bisa membaca Al-Fatihah sendiri. Sekarang belajar tajwid lewat mendengar qari, atau mulai menghafal juz amma. Pilih Level di bar atas tab Belajar.</p>
    </>
  );
}

function StreakStep({ summary }: { summary: Summary }) {
  const xpByDay = useGame((s) => s.xpByDay);
  const today = dayKey();
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const milestone = STREAK_MILESTONES.includes(summary.streak);
  return (
    <>
      {milestone && <Confetti />}
      {milestone && <p className="mb-2 rounded-full bg-orange px-4 py-1 text-sm font-extrabold uppercase text-white">Pencapaian baru</p>}
      <FlameIcon className="size-32 animate-flame" />
      <p className="text-6xl font-extrabold text-orange">{summary.streak}</p>
      <h1 className="text-2xl font-extrabold text-orange">hari beruntun!</h1>
      {summary.usedFreezes > 0 && <p className="mt-2 text-sm text-blue">🧊 {summary.usedFreezes} pembeku streak dipakai untuk hari yang terlewat.</p>}
      <div className="mt-6 flex w-full justify-between rounded-2xl border-2 border-line p-4">
        {days.map((d) => {
          const weekday = WEEKDAYS[(new Date(`${d}T12:00`).getDay() + 6) % 7];
          const lit = (xpByDay[d] ?? 0) > 0;
          return (
            <div key={d} className="flex flex-col items-center gap-1 text-xs font-bold text-muted">
              {weekday}
              <span className={`flex size-8 items-center justify-center rounded-full ${lit ? "bg-orange text-white" : "bg-line"}`}>{lit ? "✓" : ""}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-muted">
        {summary.streak === 100
          ? "100 hari! Kebiasaan ini sudah jadi bagian dari harimu."
          : summary.streak === 30
            ? "Sebulan penuh belajar. Luar biasa konsisten!"
            : summary.streak === 7
              ? "Seminggu penuh! Kebiasaan baru mulai terbentuk."
              : "Sedikit tapi rutin lebih baik dari banyak tapi jarang."}
      </p>
    </>
  );
}

function GoalStep({ summary }: { summary: Summary }) {
  const reached = summary.goalAfter >= summary.dailyGoal;
  const justReached = reached && summary.goalBefore < summary.dailyGoal;
  const pct = Math.min(100, (summary.goalAfter / summary.dailyGoal) * 100);
  return (
    <>
      <Mascot mood={reached ? "cheer" : "happy"} size={130} />
      <h1 className="mt-4 text-2xl font-extrabold">{justReached ? "Target harian tercapai!" : reached ? "Target harian sudah tercapai" : "Target harian"}</h1>
      <div className="mt-6 w-full">
        <div className="h-5 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-gold transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 font-bold text-muted">
          {Math.min(summary.goalAfter, summary.dailyGoal)} / {summary.dailyGoal} XP
        </p>
      </div>
      {!reached && <p className="mt-4 text-muted">Tinggal {summary.dailyGoal - summary.goalAfter} XP lagi hari ini.</p>}
    </>
  );
}

function QuestStep({ summary }: { summary: Summary }) {
  const newlyDone = summary.quests.filter((q, i) => q.progress >= q.target && summary.questsBefore[i]?.progress < q.target);
  return (
    <>
      <h1 className="text-2xl font-extrabold">Misi harian</h1>
      <ul className="mt-6 w-full space-y-3 text-left">
        {summary.quests.map((q) => (
          <li key={q.id} className="flex items-center gap-3 rounded-2xl border-2 border-line p-3">
            <span className="text-2xl">{QUEST_ICON[q.kind]}</span>
            <div className="flex-1">
              <p className="font-bold">{questTitle(q)}</p>
              <div className="mt-1 h-3 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full bg-gold transition-all duration-700" style={{ width: `${(q.progress / q.target) * 100}%` }} />
              </div>
            </div>
            <span className="text-sm font-bold text-muted">
              {q.progress}/{q.target}
            </span>
          </li>
        ))}
      </ul>
      {newlyDone.length > 0 && (
        <p className="mt-4 flex items-center gap-2 font-bold text-blue">
          <BoltIcon className="size-5" /> {newlyDone.length} misi selesai! Klaim XP-nya di tab Misi.
        </p>
      )}
    </>
  );
}
