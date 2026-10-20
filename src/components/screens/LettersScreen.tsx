"use client";

import { useState } from "react";
import { ButtonLink } from "@/components/Button";
import { LetterGuide } from "@/components/LetterGuide";
import { Sheet } from "@/components/Sheet";
import { PRACTICE_ID, TROUBLE_ID, learnedLetters } from "@/lib/course";
import { playAudio } from "@/lib/audio";
import { examplesFor, getLetter, letters } from "@/lib/letters";
import { dayKey } from "@/lib/dates";
import { letterSoundUrl, useLetterAudio } from "@/lib/recordings";
import { dueKeys } from "@/lib/review";
import { MASTERED, useGame } from "@/lib/store";
import { TROUBLE_EXIT } from "@/lib/trouble";

export function LettersScreen() {
  const lessons = useGame((s) => s.lessons);
  const mastery = useGame((s) => s.mastery);
  const trouble = useGame((s) => s.troubleLetters);
  const due = dueKeys(useGame((s) => s.reviews), dayKey()).length;
  const urls = useLetterAudio((s) => s.urls);
  const learned = learnedLetters(lessons);
  const [open, setOpen] = useState<string | null>(null);
  const mastered = letters.filter((l) => (mastery[l.id] ?? 0) >= MASTERED).length;

  return (
    <div className="px-4 pb-8 pt-5">
      <h1 className="text-center text-2xl font-extrabold">Ayo kenali huruf hijaiyah!</h1>
      <p className="mt-1 text-center text-muted">Ketuk huruf untuk mendengar dan melihat penjelasannya.</p>

      <div className="mt-5">
        <ButtonLink href={`/lesson/${PRACTICE_ID}`} color="blue" aria-disabled={learned.length === 0} className={learned.length === 0 ? "pointer-events-none opacity-50" : ""}>
          Latihan Ulang{due > 0 && ` · ${due} siap diulang`}
        </ButtonLink>
        {learned.length > 0 && <p className="mt-2 text-center text-xs text-muted">Huruf dan bacaan muncul lagi makin jarang setiap kali kamu benar.</p>}
        {learned.length === 0 && <p className="mt-2 text-center text-xs text-muted">Selesaikan lesson pertama untuk membuka latihan.</p>}
      </div>

      <section className="mt-5 rounded-2xl border-2 border-orange/40 bg-orange/5 p-4">
        <h2 className="font-extrabold">Huruf Bandel</h2>
        {Object.keys(trouble).length === 0 ? (
          <p className="mt-1 text-sm text-muted">Belum ada. Huruf yang kamu jawab salah dikumpulkan di sini supaya bisa ditaklukkan.</p>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted">Jawab benar {TROUBLE_EXIT} kali berturut-turut untuk menaklukkan.</p>
            <ul dir="rtl" className="mt-3 flex flex-wrap gap-2">
              {Object.entries(trouble).map(([id, streak]) => (
                <li key={id} className="flex flex-col items-center rounded-xl border-2 border-line bg-white px-3 pb-1.5">
                  <span className="arabic-big text-3xl leading-[1.9]">{getLetter(id).char}</span>
                  <span className="flex gap-0.5" aria-label={`${streak} dari ${TROUBLE_EXIT} benar`}>
                    {Array.from({ length: TROUBLE_EXIT }, (_, i) => (
                      <span key={i} className={`size-1.5 rounded-full ${i < streak ? "bg-green" : "bg-line"}`} />
                    ))}
                  </span>
                </li>
              ))}
            </ul>
            <ButtonLink href={`/lesson/${TROUBLE_ID}`} color="gold" className="mt-3">
              Taklukkan
            </ButtonLink>
          </>
        )}
      </section>

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
