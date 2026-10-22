"use client";

import { useState } from "react";
import { AyahLettersText } from "@/components/AyahLettersText";
import { knownCount, type AyahLetters } from "@/lib/ayah-letters";
import { learnedLetters } from "@/lib/course";
import { useGame } from "@/lib/store";
import quranIndex from "../../../data/quran/index.json";

// The three marks each ayah can earn; a box shows the highest one.
const MARKS = [
  { label: "Hurufnya dikenal", className: "bg-green" },
  { label: "Bisa dibaca", className: "bg-blue" },
  { label: "Sudah hafal", className: "bg-gold" },
];

export function AyahMapScreen({ ayahs }: { ayahs: AyahLetters[] }) {
  const lessons = useGame((s) => s.lessons);
  const readAyahs = useGame((s) => s.readAyahs);
  const memorized = useGame((s) => s.memorized);
  const known = new Set(learnedLetters(lessons));
  const [open, setOpen] = useState<number | null>(null);
  const share = (a: AyahLetters) => knownCount(a, known) / a.letters.length;
  const isRead = (a: AyahLetters) => !!readAyahs[`${a.surah}:${a.ayah}`];
  const isMemorized = (a: AyahLetters) => !!memorized[`${a.surah}:${a.ayah}`];
  const lit = ayahs.filter((a) => share(a) === 1).length;
  const read = Object.keys(readAyahs).length;
  const hafal = Object.keys(memorized).length;

  return (
    <div className="px-4 pb-8 pt-5">
      <h1 className="text-center text-2xl font-extrabold">Peta Ayat</h1>
      <p className="mt-1 text-center text-muted">
        {known.size === 0
          ? "Ayat menyala saat kamu mengenal huruf-hurufnya."
          : lit > 0
            ? `${lit} dari ${ayahs.length} ayat sudah kamu kenal semua hurufnya.`
            : `Kamu sudah kenal ${known.size} huruf. Ayat makin terang setiap huruf baru.`}
        {read > 0 && ` ${read} ayat sudah kamu baca sendiri.`}
        {hafal > 0 && ` ${hafal} ayat sudah kamu hafal.`}
      </p>

      <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs font-bold">
        {MARKS.map((m) => (
          <span key={m.label} className="flex items-center gap-1.5">
            <span className={`size-3 rounded-sm ${m.className}`} />
            {m.label}
          </span>
        ))}
      </div>

      <ul className="mt-5 space-y-3">
        {quranIndex.surahs.map((surah) => {
          const list = ayahs.filter((a) => a.surah === surah.number);
          const surahLit = list.filter((a) => share(a) === 1).length;
          const expanded = open === surah.number;
          return (
            <li key={surah.number} className="rounded-2xl border-2 border-line">
              <button type="button" onClick={() => setOpen(expanded ? null : surah.number)} className="block w-full p-3 text-left" aria-expanded={expanded}>
                <span className="flex items-center justify-between gap-2">
                  <span className="font-extrabold">
                    {surah.number}. {surah.englishName}
                  </span>
                  <span className="text-xs font-bold text-muted">
                    {surahLit}/{list.length} ayat
                  </span>
                </span>
                <span className="mt-2 flex flex-wrap gap-1" aria-hidden>
                  {list.map((a) => (
                    <span key={a.ayah} className="size-3.5 rounded-sm bg-line">
                      {isMemorized(a) ? (
                        <span className="block size-full rounded-sm bg-gold" />
                      ) : isRead(a) ? (
                        <span className="block size-full rounded-sm bg-blue" />
                      ) : (
                        <span className="block size-full rounded-sm bg-green" style={{ opacity: share(a) === 1 ? 1 : share(a) * 0.8 }} />
                      )}
                    </span>
                  ))}
                </span>
              </button>
              {expanded && (
                <ol className="space-y-3 border-t-2 border-line p-3">
                  {list.map((a) => (
                    <li key={a.ayah}>
                      <AyahLettersText text={a.text} known={known} />
                      <p className="text-xs font-bold text-muted">
                        Ayat {a.ayah} · kenal {knownCount(a, known)} dari {a.letters.length} huruf
                        {isRead(a) && <span className="text-blue"> · bisa dibaca</span>}
                        {isMemorized(a) && <span className="text-gold"> · sudah hafal</span>}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
