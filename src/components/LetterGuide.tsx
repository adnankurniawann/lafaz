"use client";

import { examplesFor, getLetter, lettersReview, muqattaahFor, refLabel } from "@/lib/letters";
import { AudioButton } from "./AudioButton";
import { LetterSound, useHasLetterSound } from "./LetterSound";

/** Explanation card for one letter, used in the unit guide and the Huruf tab. */
export function LetterGuide({ id }: { id: string }) {
  const letter = getLetter(id);
  const hasSound = useHasLetterSound()(id);
  const muqattaah = muqattaahFor(id);

  return (
    <div className="rounded-2xl border-2 border-line p-4">
      <div className="flex items-center gap-4">
        <span className="arabic-big w-16 text-center text-6xl">{letter.fathah}</span>
        <div className="flex-1">
          <p className="text-xl font-extrabold">{letter.name}</p>
          <p className="text-muted">
            dibaca <b className="text-foreground">{letter.latin}</b>
          </p>
        </div>
        <LetterSound letter={id} />
      </div>
      {!hasSound && <p className="mt-2 text-xs text-muted">Suara huruf belum direkam ustadz. Tombol suara memutar contoh kata.</p>}

      <p className="mt-3 text-sm">
        <span className="font-bold">Makhraj: </span>
        {letter.makhraj}
      </p>

      <p className="mt-3 text-sm font-bold">Contoh dalam Al-Qur&apos;an</p>
      <ul className="mt-1 flex flex-wrap gap-2">
        {examplesFor(id).map((w) => (
          <li key={w.ref} className="flex items-center gap-2 rounded-xl border-2 border-line py-1 pl-1 pr-3">
            <AudioButton src={w.audio} size="sm" label={`Dengar ${w.text}`} />
            <span className="arabic-big text-2xl">{w.text}</span>
            <span className="text-[11px] text-muted">{refLabel(w.ref)}</span>
          </li>
        ))}
      </ul>

      {muqattaah && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-blue/10 p-2 text-sm">
          <AudioButton src={muqattaah.audio} size="sm" label="Dengar qari menyebut huruf ini" />
          <span>
            Qari menyebut nama huruf ini di awal surah: <span className="arabic-big text-2xl">{muqattaah.text}</span> ({refLabel(muqattaah.ref)})
          </span>
        </div>
      )}
      <p className="mt-3 text-[11px] text-amber-700">Materi ini {lettersReview}.</p>
    </div>
  );
}
