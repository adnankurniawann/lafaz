"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppGate } from "@/components/AppGate";
import { Button } from "@/components/Button";
import { Mascot, SpeechBubble } from "@/components/Mascot";
import { DAILY_GOALS, useGame } from "@/lib/store";

const MOTIVATIONS = [
  { id: "dari-nol", icon: "🌱", label: "Bisa baca Al-Qur'an dari nol" },
  { id: "tajwid", icon: "🎧", label: "Memperbaiki bacaan dan tajwid" },
  { id: "hafalan", icon: "🧠", label: "Persiapan menghafal" },
  { id: "anak", icon: "👨‍👧", label: "Belajar bersama anak" },
];

const EXPERIENCE = [
  { id: "baru", label: "Saya baru mulai", note: "Belum kenal huruf hijaiyah" },
  { id: "sebagian", label: "Kenal sebagian huruf", note: "Masih sering tertukar" },
  { id: "lancar", label: "Sudah bisa membaca", note: "Ingin memperbaiki tajwid" },
];

const STEPS = ["sambutan", "tujuan", "kemampuan", "target", "talaqqi"] as const;

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
  const [experience, setExperience] = useState<string | null>(null);
  const [goal, setGoal] = useState(20);

  const current = STEPS[step];
  const canContinue = current === "tujuan" ? !!motivation : current === "kemampuan" ? !!experience : true;

  const next = () => {
    if (step + 1 < STEPS.length) return setStep(step + 1);
    finish({ motivation: motivation!, experience: experience!, dailyGoal: goal });
    router.replace("/lesson/u1-1");
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

        {current === "kemampuan" && (
          <Question mascotText="Seberapa kenal kamu dengan huruf hijaiyah?">
            {EXPERIENCE.map((e) => (
              <Choice key={e.id} selected={experience === e.id} onClick={() => setExperience(e.id)}>
                <span className="flex flex-col">
                  {e.label}
                  <span className="text-sm font-semibold text-muted">{e.note}</span>
                </span>
              </Choice>
            ))}
            {experience === "lancar" && <p className="text-sm text-muted">Bagian tajwid sedang disiapkan. Untuk sekarang, mulai dari huruf dulu ya, sambil menguatkan makhraj.</p>}
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
            <h1 className="mt-5 text-2xl font-extrabold">Satu pesan penting</h1>
            <p className="mt-3 text-lg leading-relaxed text-muted">
              Lafaz adalah teman latihan. Bacaan Al-Qur&apos;an tetap paling baik dipelajari langsung dari guru (talaqqi). Tunjukkan bacaanmu ke ustadz atau ustadzah secara rutin, ya.
            </p>
          </div>
        )}
      </div>

      <Button disabled={!canContinue} onClick={next}>
        {current === "sambutan" ? "Mulai" : current === "talaqqi" ? "Mulai lesson pertama" : "Lanjut"}
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
