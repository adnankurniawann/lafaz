"use client";

import { useState } from "react";
import { ButtonLink } from "@/components/Button";
import { LetterGuide } from "@/components/LetterGuide";
import { Sheet } from "@/components/Sheet";
import { PRACTICE_ID, learnedLetters } from "@/lib/course";
import { playAudio } from "@/lib/audio";
import { examplesFor, getLetter, letters } from "@/lib/letters";
import { letterSoundUrl, useLetterAudio } from "@/lib/recordings";
import { useGame } from "@/lib/store";

export function LettersScreen() {
  const lessons = useGame((s) => s.lessons);
  const mastery = useGame((s) => s.mastery);
  const urls = useLetterAudio((s) => s.urls);
  const learned = learnedLetters(lessons);
  const [open, setOpen] = useState<string | null>(null);
  const mastered = letters.filter((l) => (mastery[l.id] ?? 0) >= 0.8).length;

  return (
    <div className="px-4 pb-8 pt-5">
      <h1 className="text-center text-2xl font-extrabold">Ayo kenali huruf hijaiyah!</h1>
      <p className="mt-1 text-center text-muted">Ketuk huruf untuk mendengar dan melihat penjelasannya.</p>

      <div className="mt-5">
        <ButtonLink href={`/lesson/${PRACTICE_ID}`} color="blue" aria-disabled={learned.length === 0} className={learned.length === 0 ? "pointer-events-none opacity-50" : ""}>
          Latihan huruf · +1 hati
        </ButtonLink>
        {learned.length === 0 && <p className="mt-2 text-center text-xs text-muted">Selesaikan lesson pertama untuk membuka latihan.</p>}
      </div>

      <p className="mt-6 text-sm font-extrabold text-muted">
        {mastered} dari {letters.length} huruf dikuasai
      </p>
      <div dir="rtl" className="mt-3 grid grid-cols-4 gap-2.5">
        {letters.map((l) => {
          const value = mastery[l.id] ?? 0;
          const known = learned.includes(l.id);
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => {
                const url = letterSoundUrl(urls, l.id) ?? examplesFor(l.id)[0].audio;
                void playAudio(url);
                setOpen(l.id);
              }}
              className={`flex flex-col items-center rounded-2xl border-2 border-b-4 pb-2 pt-1 transition active:translate-y-[2px] ${known ? "border-line bg-white" : "border-line bg-[#f7f7f7] opacity-70"}`}
            >
              <span className="arabic-big text-4xl leading-[2]">{l.char}</span>
              <span dir="ltr" className="text-xs font-bold text-muted">
                {l.latin}
              </span>
              <span className="mt-1.5 h-1.5 w-3/4 overflow-hidden rounded-full bg-line">
                <span className="block h-full rounded-full bg-gold" style={{ width: `${value * 100}%` }} />
              </span>
            </button>
          );
        })}
      </div>

      {open && (
        <Sheet title={`Huruf ${getLetter(open).name}`} onClose={() => setOpen(null)}>
          <LetterGuide id={open} />
        </Sheet>
      )}
    </div>
  );
}
