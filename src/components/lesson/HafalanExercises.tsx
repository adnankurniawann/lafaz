"use client";

import { AudioButton } from "@/components/AudioButton";
import type { Exercise } from "@/lib/exercises";
import { refLabel } from "@/lib/letters";
import { correctValue, optionClass, Prompt, type ChoiceState } from "./Exercises";

type ChoiceProps<K extends Exercise["kind"]> = {
  exercise: Extract<Exercise, { kind: K }>;
  state: ChoiceState;
  onSelect: (value: string) => void;
};

/** How many times the qari reads the ayah in one tap: tikrar. */
const TIKRAR = 3;

/** Tikrar: the qari reads the ayah three times while the learner follows the text. */
export function AyahListenExercise({ exercise }: { exercise: Extract<Exercise, { kind: "ayah-listen" }> }) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm font-extrabold uppercase tracking-wider text-gold">Tikrar</p>
      <Prompt>Dengarkan qari sambil mengikuti teksnya</Prompt>
      <div className="rounded-3xl border-2 border-gold/50 bg-gold/5 px-4 py-3">
        <p dir="rtl" lang="ar" className="arabic">
          {exercise.text}
        </p>
        <p className="text-xs font-bold text-muted">{refLabel(exercise.ref)}</p>
      </div>
      <div className="flex items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-1 text-xs font-bold text-muted">
          <AudioButton src={Array(TIKRAR).fill(exercise.audio)} size="lg" autoPlay label={`Dengar ${TIKRAR} kali`} />
          {TIKRAR} kali
        </div>
        <div className="flex flex-col items-center gap-1 text-xs font-bold text-muted">
          <AudioButton src={exercise.audio} size="md" label="Dengar sekali" />1 kali
        </div>
      </div>
      <p className="text-center text-sm text-muted">Ikuti dengan suara pelan. Ulangi sampai lidahmu hafal iramanya.</p>
      <p className="rounded-2xl bg-[#f7f7f7] p-3 text-sm leading-relaxed">
        <span className="font-extrabold">Artinya: </span>
        {exercise.translation}
      </p>
    </div>
  );
}

/** One word of the ayah is hidden; pick it. */
export function MissingWordExercise({ exercise, state, onSelect }: ChoiceProps<"missing-word">) {
  const correct = correctValue(exercise);
  return (
    <div className="flex flex-col gap-6">
      <Prompt>Kata mana yang hilang?</Prompt>
      <div className="flex items-center gap-3 rounded-3xl border-2 border-line px-4 py-3">
        <AudioButton src={exercise.audio} size="sm" label="Dengar qari" />
        <p dir="rtl" lang="ar" className="arabic flex-1">
          {exercise.words.map((w, i) =>
            i === exercise.hidden ? (
              <span key={i} className={`mx-1 inline-block min-w-16 border-b-4 text-center ${state.checked ? "border-green text-green" : "border-gold"}`}>
                {state.checked ? w : " "}
              </span>
            ) : (
              <span key={i}>{w} </span>
            ),
          )}
        </p>
      </div>
      <div className="grid gap-3">
        {exercise.options.map((w) => (
          <button key={w} type="button" disabled={state.checked} onClick={() => onSelect(w)} className={`${optionClass(w, state, correct)} arabic-big py-2 text-4xl leading-[1.9]`}>
            {w}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Menyambung: which ayah comes after this one? */
export function NextAyahExercise({ exercise, state, onSelect }: ChoiceProps<"next-ayah">) {
  return (
    <div className="flex flex-col gap-6">
      <Prompt>Ayat apa sesudahnya?</Prompt>
      <div className="flex items-center gap-3 rounded-3xl border-2 border-line px-4 py-3">
        <AudioButton src={exercise.audio} size="sm" autoPlay label="Dengar qari" />
        <div className="flex-1">
          <p dir="rtl" lang="ar" className="arabic">
            {exercise.text}
          </p>
          <p className="text-xs font-bold text-muted">{refLabel(exercise.ref)}</p>
        </div>
      </div>
      <div className="grid gap-3">
        {exercise.options.map((o) => (
          <button key={o.ref} type="button" disabled={state.checked} onClick={() => onSelect(o.ref)} className={`${optionClass(o.ref, state, exercise.answer)} px-4 py-2`}>
            <span dir="rtl" lang="ar" className="arabic block text-right">
              {o.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
