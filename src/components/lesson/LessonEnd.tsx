"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/Button";
import { BoltIcon, FlameIcon, GemIcon, HeartIcon } from "@/components/icons";
import { Mascot } from "@/components/Mascot";
import { addDays, dayKey, WEEKDAYS } from "@/lib/dates";
import { QUEST_ICON, questTitle } from "@/lib/quests";
import { useGame, type LessonSummary } from "@/lib/store";

type Summary = LessonSummary & { accuracy: number; seconds: number; perfect: boolean };
type Step = "result" | "streak" | "goal" | "quests";

/** The screens after a lesson, one after another, like Duolingo. */
export function LessonEnd({ summary, practice }: { summary: Summary; practice: boolean }) {
  const router = useRouter();
  const steps: Step[] = ["result", ...(summary.streakIncreased ? (["streak"] as const) : []), "goal", "quests"];
  const [step, setStep] = useState(0);
  const current = steps[step];
  const next = () => (step + 1 < steps.length ? setStep(step + 1) : router.push(practice ? "/huruf" : "/"));

  return (
    <div className="flex min-h-dvh flex-col px-5 pb-6 pt-10">
      <div className="flex flex-1 flex-col items-center justify-center text-center" key={current}>
        {current === "result" && <Result summary={summary} />}
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
      <h1 className="mt-4 text-3xl font-extrabold text-gold">{summary.perfect ? "Sempurna!" : "Lesson selesai!"}</h1>
      <p className="mt-1 text-muted">{summary.perfect ? "Tanpa salah sama sekali. Barakallahu fiik!" : "Setiap salah adalah bagian dari belajar."}</p>
      <div className="mt-8 flex w-full gap-3">
        <StatCard label="Total XP" value={String(summary.xp)} color="border-gold" icon={<BoltIcon className="size-5" />} />
        <StatCard label={summary.accuracy >= 90 ? "Hebat" : "Akurasi"} value={`${summary.accuracy}%`} color="border-green" icon={null} />
        <StatCard label="Waktu" value={`${minutes}:${seconds}`} color="border-blue" icon={null} />
      </div>
      {summary.heartGained && (
        <p className="mt-5 flex items-center gap-2 font-bold text-red">
          +1 <HeartIcon className="size-5" /> dari latihan
        </p>
      )}
    </>
  );
}

function StreakStep({ summary }: { summary: Summary }) {
  const xpByDay = useGame((s) => s.xpByDay);
  const today = dayKey();
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  return (
    <>
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
      <p className="mt-4 text-muted">Sedikit tapi rutin lebih baik dari banyak tapi jarang.</p>
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
          <GemIcon className="size-5" /> {newlyDone.length} misi selesai! Klaim hadiahnya di tab Misi.
        </p>
      )}
    </>
  );
}
