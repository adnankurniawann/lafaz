"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppGate } from "@/components/AppGate";
import { Button } from "@/components/Button";
import { Mascot, SpeechBubble } from "@/components/Mascot";
import { PLACEMENT_ID, currentLessonId, type LevelId } from "@/lib/course";
import { DAILY_GOALS, useGame } from "@/lib/store";

const MOTIVATIONS = [
  { id: "dari-nol", icon: "🌱", label: "Bisa baca Al-Qur'an dari nol" },
  { id: "tajwid", icon: "🎧", label: "Memperbaiki bacaan dan tajwid" },
  { id: "hafalan", icon: "🧠", label: "Persiapan menghafal" },
  { id: "anak", icon: "👨‍👧", label: "Belajar bersama anak" },
  { id: "penasaran", icon: "🔍", label: "Penasaran dengan huruf Arab" },
];

// "Mau mulai dari mana?" (ADR-0010). The choice is trusted without a test,
// except "tes", which runs Tes Matrikulasi. Level Hafalan joins in Blok 5.
const STARTS: { id: string; level: LevelId; experience: string; label: string; note: string }[] = [
  { id: "iqro", level: "iqro", experience: "baru", label: "Dari huruf pertama", note: "Level Iqro: belum kenal huruf hijaiyah" },
  { id: "tes", level: "iqro", experience: "sebagian", label: "Belum tahu, tes aku dulu", note: "Kenal sebagian huruf? Tes singkat, paling banyak 15 soal" },
  { id: "tajwid", level: "tajwid", experience: "lancar", label: "Langsung Tajwid", note: "Level Tajwid: sudah bisa membaca, ingin memperbaiki bacaan" },
];

const STEPS = ["sambutan", "tujuan", "mulai", "target", "talaqqi"] as const;

export function OnboardingScreen() {
  return (
    <AppGate requireOnboarding={false}>
      <Onboarding />
    </AppGate>
  );
}

function Onboarding() {
  const router = useRouter();
  const finish = useGame((s) => s.finishOnboarding);
  const [step, setStep] = useState(0);
  const [motivation, setMotivation] = useState<string | null>(null);
  const [start, setStart] = useState<(typeof STARTS)[number] | null>(null);
  const [goal, setGoal] = useState(20);

  const current = STEPS[step];
  const canContinue = current === "tujuan" ? !!motivation : current === "mulai" ? !!start : true;
  const takesTest = start?.id === "tes";

  const next = () => {
    if (step + 1 < STEPS.length) return setStep(step + 1);
    finish({ motivation: motivation!, experience: start!.experience, dailyGoal: goal, level: start!.level });
    router.replace(takesTest ? `/lesson/${PLACEMENT_ID}` : `/lesson/${currentLessonId({}, start!.level)}`);
  };

  return (
    <div className="flex min-h-dvh flex-col px-5 pb-6 pt-4">
      {step > 0 && (
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setStep(step - 1)} className="text-2xl font-bold text-muted" aria-label="Kembali">
            ←
          </button>
          <div className="h-4 flex-1 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-green transition-all" style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col pt-6" key={current}>
        {current === "sambutan" && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <SpeechBubble className="animate-pop-in">Assalamu&apos;alaikum! Aku Pelita.</SpeechBubble>
            <Mascot mood="cheer" size={170} className="mt-4" />
            <h1 className="mt-6 text-3xl font-extrabold text-green">Lafaz</h1>
            <p className="mt-2 text-lg text-muted">Belajar membaca Al-Qur&apos;an dari huruf pertama, 5 menit sehari.</p>
          </div>
        )}

        {current === "tujuan" && (
          <Question mascotText="Apa tujuanmu belajar?">
            {MOTIVATIONS.map((m) => (
              <Choice key={m.id} selected={motivation === m.id} onClick={() => setMotivation(m.id)}>
                <span className="text-2xl">{m.icon}</span>
                {m.label}
              </Choice>
            ))}
          </Question>
        )}

        {current === "mulai" && (
          <Question mascotText="Mau mulai dari mana?">
            {STARTS.map((o) => (
              <Choice key={o.id} selected={start?.id === o.id} onClick={() => setStart(o)}>
                <span className="flex flex-col">
                  {o.label}
                  <span className="text-sm font-semibold text-muted">{o.note}</span>
                </span>
              </Choice>
            ))}
            <p className="text-sm text-muted">Bisa pindah Level kapan saja nanti.</p>
          </Question>
        )}

        {current === "target" && (
          <Question mascotText="Berapa target harianmu?">
            {DAILY_GOALS.map((g) => (
              <Choice key={g.xp} selected={goal === g.xp} onClick={() => setGoal(g.xp)}>
                <span className="flex-1">{g.label}</span>
                <span className="text-sm font-semibold text-muted">
                  {g.minutes} · {g.xp} XP
                </span>
              </Choice>
            ))}
          </Question>
        )}

        {current === "talaqqi" && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <Mascot mood="think" size={140} />
            <h1 className="mt-5 text-2xl font-extrabold">Belajar di sini, kapan saja</h1>
            <p className="mt-3 text-lg leading-relaxed text-muted">
              Tidak perlu pernah mengaji sebelumnya. Salah juga tidak apa-apa, di sini tidak ada yang menghukum.
            </p>
            <p className="mt-3 leading-relaxed text-muted">
              Mau makin mantap? Coba perdengarkan bacaanmu ke guru atau teman yang lancar. Belajar langsung seperti ini disebut talaqqi.
            </p>
          </div>
        )}
      </div>

      <Button disabled={!canContinue} onClick={next}>
        {current === "sambutan" ? "Mulai" : current === "talaqqi" ? (takesTest ? "Mulai tes singkat" : "Mulai lesson pertama") : "Lanjut"}
      </Button>
    </div>
  );
}

function Question({ mascotText, children }: { mascotText: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="mb-3 flex items-end gap-3">
        <Mascot size={80} />
        <SpeechBubble className="mb-6">{mascotText}</SpeechBubble>
      </div>
      {children}
    </div>
  );
}

function Choice({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl border-2 border-b-4 px-4 py-4 text-left font-extrabold transition active:translate-y-[2px] ${selected ? "border-blue bg-blue/10 text-blue" : "border-line"}`}
    >
      {children}
    </button>
  );
}
