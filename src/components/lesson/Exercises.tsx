"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AudioButton } from "@/components/AudioButton";
import { Button } from "@/components/Button";
import { MicIcon } from "@/components/icons";
import { LetterSound, useHasLetterSound } from "@/components/LetterSound";
import { playAudio } from "@/lib/audio";
import type { Exercise } from "@/lib/exercises";
import { examplesFor, getLetter, muqattaahFor, refLabel } from "@/lib/letters";
import { shuffle } from "@/lib/random";
import { letterSoundUrl, useLetterAudio } from "@/lib/recordings";
import { sfx } from "@/lib/sfx";
import { useGame } from "@/lib/store";
import { useRecorder } from "@/lib/use-recorder";

export type ChoiceState = { selected: string | null; checked: boolean };

type ChoiceProps<K extends Exercise["kind"]> = {
  exercise: Extract<Exercise, { kind: K }>;
  state: ChoiceState;
  onSelect: (value: string) => void;
};

/** The value that counts as correct for exercises answered with PERIKSA. */
export function correctValue(e: Exercise): string | null {
  switch (e.kind) {
    case "listen-pick":
    case "word-initial":
    case "sound-pick":
    case "name-pick":
      return e.letter;
    case "sequence":
      return String(e.options.findIndex((o) => o.join() === e.letters.join()));
    default:
      return null;
  }
}

/** Shown in the red feedback panel after a wrong answer. */
export function correctAnswerText(e: Exercise) {
  switch (e.kind) {
    case "listen-pick":
    case "sound-pick": {
      const l = getLetter(e.letter);
      return { arabic: l.fathah, text: `dibaca "${l.latin}"` };
    }
    case "word-initial": {
      const l = getLetter(e.letter);
      return { arabic: l.char, text: `huruf ${l.name}` };
    }
    case "name-pick": {
      const l = getLetter(e.letter);
      return { arabic: l.char, text: `namanya ${l.name}` };
    }
    case "sequence":
      return { arabic: e.letters.map((l) => getLetter(l).fathah).join(" "), text: `dibaca "${e.letters.map((l) => getLetter(l).latin).join(" ")}"` };
    default:
      return null;
  }
}

function Prompt({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-extrabold leading-tight">{children}</h2>;
}

function optionClass(value: string, state: ChoiceState, correct: string | null) {
  const base = "rounded-2xl border-2 border-b-4 transition active:translate-y-[2px]";
  if (state.checked && value === correct) return `${base} border-green bg-green/10 text-green-dark`;
  if (state.checked && value === state.selected) return `${base} border-red bg-red/10 text-red-dark animate-shake`;
  if (value === state.selected) return `${base} border-blue bg-blue/10 text-blue`;
  return `${base} border-line bg-white`;
}

function LetterOptions({ exercise, options, state, onSelect, show }: { exercise: Exercise; options: string[]; state: ChoiceState; onSelect: (v: string) => void; show: (id: string) => string }) {
  const correct = correctValue(exercise);
  return (
    <div className={`grid gap-3 ${options.length === 4 ? "grid-cols-2" : "grid-cols-3"}`}>
      {options.map((id) => (
        <button key={id} type="button" disabled={state.checked} onClick={() => onSelect(id)} className={`${optionClass(id, state, correct)} arabic-big py-3 text-6xl`}>
          {show(id)}
        </button>
      ))}
    </div>
  );
}

export function IntroExercise({ exercise }: { exercise: Extract<Exercise, { kind: "intro" }> }) {
  const letter = getLetter(exercise.letter);
  const hasSound = useHasLetterSound()(exercise.letter);
  const example = examplesFor(exercise.letter)[0];
  const muqattaah = muqattaahFor(exercise.letter);
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm font-extrabold uppercase tracking-wider text-purple">Huruf baru</p>
      <div className="flex flex-col items-center rounded-3xl border-2 border-b-4 border-line py-6">
        <span className="arabic-big text-[120px] leading-[1.6]">{letter.fathah}</span>
        <p className="text-2xl font-extrabold">{letter.name}</p>
        <p className="text-lg text-muted">
          dibaca <b className="text-foreground">{letter.latin}</b>
        </p>
        <div className="mt-4">
          <LetterSound letter={exercise.letter} size="md" autoPlay />
        </div>
        {!hasSound && <p className="mt-2 px-6 text-center text-xs text-muted">Suara huruf belum direkam ustadz, tombol memutar contoh kata di bawah.</p>}
      </div>
      <div className="flex items-center gap-3 rounded-2xl bg-[#f7f7f7] p-3">
        <AudioButton src={example.audio} size="sm" />
        <div className="flex-1 text-sm">
          Contoh dalam Al-Qur&apos;an <span className="text-muted">({refLabel(example.ref)})</span>
        </div>
        <span className="arabic-big text-4xl">{example.text}</span>
      </div>
      {muqattaah && (
        <div className="flex items-center gap-3 rounded-2xl bg-blue/10 p-3 text-sm">
          <AudioButton src={muqattaah.audio} size="sm" />
          <span className="flex-1">Dengar qari menyebut nama huruf ini ({refLabel(muqattaah.ref)})</span>
          <span className="arabic-big text-4xl">{muqattaah.text}</span>
        </div>
      )}
      <p className="text-sm text-muted">
        <b className="text-foreground">Makhraj:</b> {letter.makhraj}
      </p>
    </div>
  );
}

export function ListenPickExercise({ exercise, state, onSelect }: ChoiceProps<"listen-pick">) {
  return (
    <div className="flex flex-col gap-8">
      <Prompt>Pilih huruf yang kamu dengar</Prompt>
      <div className="flex justify-center">
        <LetterSound letter={exercise.letter} size="lg" autoPlay />
      </div>
      <LetterOptions exercise={exercise} options={exercise.options} state={state} onSelect={onSelect} show={(id) => getLetter(id).fathah} />
    </div>
  );
}

export function WordInitialExercise({ exercise, state, onSelect }: ChoiceProps<"word-initial">) {
  return (
    <div className="flex flex-col gap-6">
      <Prompt>Kata ini diawali huruf apa?</Prompt>
      <div className="flex items-center justify-center gap-4 rounded-3xl border-2 border-line py-4">
        <AudioButton src={exercise.word.audio} size="md" autoPlay />
        <div className="text-center">
          <span className="arabic-big block text-6xl">{exercise.word.text}</span>
          <span className="text-xs text-muted">{refLabel(exercise.word.ref)}</span>
        </div>
      </div>
      <LetterOptions exercise={exercise} options={exercise.options} state={state} onSelect={onSelect} show={(id) => getLetter(id).char} />
    </div>
  );
}

export function SoundPickExercise({ exercise, state, onSelect }: ChoiceProps<"sound-pick">) {
  const urls = useLetterAudio((s) => s.urls);
  const correct = correctValue(exercise);
  return (
    <div className="flex flex-col gap-6">
      <Prompt>Bagaimana membaca huruf ini?</Prompt>
      <div className="flex justify-center">
        <span className="arabic-big rounded-3xl border-2 border-line px-10 text-[110px] leading-[1.6]">{getLetter(exercise.letter).fathah}</span>
      </div>
      <div className="grid gap-3">
        {exercise.options.map((id) => (
          <button
            key={id}
            type="button"
            disabled={state.checked}
            onClick={() => {
              onSelect(id);
              const url = letterSoundUrl(urls, id);
              if (url) void playAudio(url);
            }}
            className={`${optionClass(id, state, correct)} py-4 text-2xl font-extrabold`}
          >
            {getLetter(id).latin}
          </button>
        ))}
      </div>
    </div>
  );
}

export function NamePickExercise({ exercise, state, onSelect }: ChoiceProps<"name-pick">) {
  const correct = correctValue(exercise);
  return (
    <div className="flex flex-col gap-6">
      <Prompt>Apa nama huruf ini?</Prompt>
      <div className="flex justify-center">
        <span className="arabic-big rounded-3xl border-2 border-line px-10 text-[110px] leading-[1.6]">{getLetter(exercise.letter).char}</span>
      </div>
      <div className="grid gap-3">
        {exercise.options.map((id) => (
          <button key={id} type="button" disabled={state.checked} onClick={() => onSelect(id)} className={`${optionClass(id, state, correct)} py-4 text-2xl font-extrabold`}>
            {getLetter(id).name}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SequenceExercise({ exercise, state, onSelect }: ChoiceProps<"sequence">) {
  const urls = useLetterAudio((s) => s.urls);
  const sounds = exercise.letters.map((l) => letterSoundUrl(urls, l));
  const correct = correctValue(exercise);
  return (
    <div className="flex flex-col gap-6">
      <Prompt>Baca dari kanan ke kiri</Prompt>
      <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-line py-4">
        <span className="arabic-big text-7xl tracking-wide" dir="rtl">
          {exercise.letters.map((l) => getLetter(l).fathah).join("  ")}
        </span>
        {sounds.every(Boolean) && <AudioButton src={sounds as string[]} size="sm" />}
        <span className="text-xs font-bold text-muted">← arah membaca</span>
      </div>
      <div className="grid gap-3">
        {exercise.options.map((option, i) => (
          <button key={i} type="button" disabled={state.checked} onClick={() => onSelect(String(i))} className={`${optionClass(String(i), state, correct)} py-4 text-xl font-extrabold`}>
            {option.map((l) => getLetter(l).latin).join(" - ")}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Tap a letter and its sound. Mistakes are counted but never cost a heart. */
export function MatchExercise({ exercise, onDone }: { exercise: Extract<Exercise, { kind: "match" }>; onDone: (mistakes: number) => void }) {
  const right = useMemo(() => shuffle(exercise.letters), [exercise]);
  const left = useMemo(() => shuffle(exercise.letters), [exercise]);
  const urls = useLetterAudio((s) => s.urls);
  const [pickLeft, setPickLeft] = useState<string | null>(null);
  const [pickRight, setPickRight] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string[]>([]);
  const mistakes = useRef(0);

  const tryPair = (l: string | null, r: string | null) => {
    if (!l || !r) return;
    if (l === r) {
      const next = [...matched, l];
      setMatched(next);
      sfx.tap();
      if (next.length === exercise.letters.length) setTimeout(() => onDone(mistakes.current), 350);
    } else {
      setWrong([`l-${l}`, `r-${r}`]);
      mistakes.current += 1;
      setTimeout(() => setWrong([]), 450);
    }
    setPickLeft(null);
    setPickRight(null);
  };

  const cell = (side: "l" | "r", id: string, picked: boolean) => {
    const done = matched.includes(id);
    const isWrong = wrong.includes(`${side}-${id}`);
    return `flex h-[72px] items-center justify-center rounded-2xl border-2 border-b-4 transition ${
      done ? "border-line bg-[#f7f7f7] text-[#cfcfcf]" : isWrong ? "border-red bg-red/10 text-red animate-shake" : picked ? "border-blue bg-blue/10 text-blue" : "border-line bg-white"
    }`;
  };

  return (
    <div className="flex flex-col gap-6">
      <Prompt>Pasangkan huruf dengan bacaannya</Prompt>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <div className="space-y-3">
          {left.map((id) => (
            <button
              key={id}
              type="button"
              disabled={matched.includes(id)}
              onClick={() => {
                const url = letterSoundUrl(urls, id);
                if (url) void playAudio(url);
                setPickLeft(id);
                tryPair(id, pickRight);
              }}
              className={`${cell("l", id, pickLeft === id)} w-full text-xl font-extrabold`}
            >
              {getLetter(id).latin}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {right.map((id) => (
            <button
              key={id}
              type="button"
              disabled={matched.includes(id)}
              onClick={() => {
                setPickRight(id);
                tryPair(pickLeft, id);
              }}
              className={`${cell("r", id, pickRight === id)} arabic-big w-full pb-2 text-4xl leading-none`}
            >
              {getLetter(id).fathah}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Record yourself, listen back next to the example, then judge it yourself. */
export function SpeakExercise({ exercise, onDone }: { exercise: Extract<Exercise, { kind: "speak" }>; onDone: (skipped: boolean) => void }) {
  const letter = getLetter(exercise.letter);
  const recorder = useRecorder(5000);
  const questEvent = useGame((s) => s.questEvent);
  const hasSound = useHasLetterSound()(exercise.letter);

  useEffect(() => {
    if (recorder.state === "done") questEvent("record");
  }, [recorder.state, questEvent]);

  return (
    <div className="flex flex-col gap-6">
      <Prompt>Ucapkan huruf ini</Prompt>
      <div className="flex items-center justify-center gap-6 rounded-3xl border-2 border-line py-4">
        <LetterSound letter={exercise.letter} size="md" autoPlay />
        <div className="text-center">
          <span className="arabic-big block text-[96px] leading-[1.5]">{letter.fathah}</span>
          <span className="font-extrabold">{letter.latin}</span>
        </div>
      </div>
      {!hasSound && <p className="-mt-3 text-center text-xs text-muted">Contoh suara memakai kata dari Al-Qur&apos;an yang diawali huruf ini.</p>}

      {recorder.state === "denied" && <p className="rounded-xl bg-red/10 p-3 text-sm text-red-dark">Mikrofon tidak diizinkan. Izinkan mikrofon di pengaturan browser, atau lewati soal ini.</p>}
      {recorder.state === "unsupported" && <p className="rounded-xl bg-red/10 p-3 text-sm text-red-dark">Browser ini belum bisa merekam suara.</p>}

      {recorder.state !== "done" ? (
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={recorder.state === "recording" ? recorder.stop : recorder.start}
            className={`flex size-24 items-center justify-center rounded-full border-b-[6px] text-white ${recorder.state === "recording" ? "animate-pulse-ring border-red-dark bg-red" : "border-blue-dark bg-blue"}`}
            aria-label={recorder.state === "recording" ? "Berhenti merekam" : "Mulai merekam"}
          >
            <MicIcon className="size-10" />
          </button>
          <p className="text-sm font-bold text-muted">{recorder.state === "recording" ? "Merekam... ketuk untuk berhenti" : "Ketuk lalu ucapkan"}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-around rounded-2xl bg-[#f7f7f7] p-3">
            <div className="flex flex-col items-center gap-1 text-xs font-bold text-muted">
              <AudioButton src={recorder.url!} size="md" label="Putar rekamanmu" />
              Suaramu
            </div>
            <div className="flex flex-col items-center gap-1 text-xs font-bold text-muted">
              <LetterSound letter={exercise.letter} size="md" />
              Contoh
            </div>
          </div>
          <p className="text-center text-sm text-muted">Bandingkan keduanya. Sudah mirip?</p>
          <div className="grid grid-cols-2 gap-3">
            <Button color="white" onClick={recorder.reset}>
              Ulangi
            </Button>
            <Button onClick={() => onDone(false)}>Sudah benar</Button>
          </div>
        </div>
      )}

      {recorder.state !== "done" && (
        <button type="button" onClick={() => onDone(true)} className="text-sm font-extrabold uppercase tracking-wide text-muted">
          Tidak bisa bicara sekarang
        </button>
      )}
    </div>
  );
}
