"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import harakat from "../../../data/content/harakat.json";
import reading from "../../../data/content/reading.json";
import { AudioButton } from "@/components/AudioButton";
import { Button } from "@/components/Button";
import { MicIcon } from "@/components/icons";
import { LetterSound, useHasLetterSound } from "@/components/LetterSound";
import { ShareCardButton } from "@/components/ShareCardButton";
import { playAudio } from "@/lib/audio";
import { ayahWords, getClip, getExampleAyah } from "@/lib/clips";
import type { Exercise } from "@/lib/exercises";
import { examplesFor, getLetter, muqattaahFor, refLabel, type WordExample } from "@/lib/letters";
import { shuffle } from "@/lib/random";
import { letterSoundUrl, useLetterAudio } from "@/lib/recordings";
import { sfx } from "@/lib/sfx";
import { transcribe, useSpeech } from "@/lib/speech";
import { matchWords } from "@/lib/speech-match";
import { useGame } from "@/lib/store";
import { arabicOf, isLetter, latinOf, singleHarakat } from "@/lib/syllables";
import { getLessonRule } from "@/lib/tajweed-lessons";
import { useRecorder } from "@/lib/use-recorder";

export type ChoiceState = { selected: string | null; checked: boolean };

const syllableWords = reading.syllableWords as Record<string, WordExample[]>;

/** A recorded sound for a letter or single-harakat token, if an ustadz recorded one. */
function tokenSoundUrl(urls: Record<string, string>, token: string) {
  if (isLetter(token)) return letterSoundUrl(urls, token);
  const single = singleHarakat(token);
  return single && letterSoundUrl(urls, single.letter, single.harakat);
}

/** Example audio for a token: the recording, else a qari word that starts with it. Never synthetic (ADR-0002). */
function tokenExample(urls: Record<string, string>, token: string) {
  return tokenSoundUrl(urls, token) ?? (isLetter(token) ? examplesFor(token)[0]?.audio : syllableWords[token]?.[0]?.audio);
}

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
    case "find-pick":
    case "word-start":
      return e.letter;
    case "word-listen":
      return e.word.ref;
    case "rule-compare":
      return String(e.answer);
    case "rule-from-text":
    case "rule-from-audio":
      return getClip(e.clip).mark.rule;
    case "sequence":
      return String(e.options.findIndex((o) => o.join() === e.letters.join()));
    default:
      return null;
  }
}

/** Whether the selected value is right. "Cari di ayat" accepts any word that has the rule. */
export function isCorrect(e: Exercise, selected: string | null): boolean {
  if (e.kind === "rule-find") return selected !== null && e.answers.includes(Number(selected));
  return selected === correctValue(e);
}

/** Shown in the red feedback panel after a wrong answer. */
export function correctAnswerText(e: Exercise) {
  switch (e.kind) {
    case "listen-pick":
    case "sound-pick":
    case "find-pick":
    case "word-start":
      return { arabic: arabicOf(e.letter), text: `dibaca "${latinOf(e.letter)}"` };
    case "word-listen":
      return { arabic: e.word.text, text: "" };
    case "word-initial": {
      const l = getLetter(e.letter);
      return { arabic: l.char, text: `huruf ${l.name}` };
    }
    case "name-pick": {
      const l = getLetter(e.letter);
      return { arabic: l.char, text: `namanya ${l.name}` };
    }
    case "sequence":
      return { arabic: e.letters.map(arabicOf).join(" "), text: `dibaca "${e.letters.map(latinOf).join(" ")}"` };
    case "rule-compare":
      return { arabic: "", text: `Potongan ${e.answer === 0 ? "A" : "B"}` };
    case "rule-from-text":
    case "rule-from-audio":
      return { arabic: "", text: getLessonRule(getClip(e.clip).mark.rule).name };
    case "rule-find": {
      const words = ayahWords(getExampleAyah(e.ayah));
      return { arabic: e.answers.map((w) => words[w]).join(" · "), text: "" };
    }
    default:
      return null;
  }
}

export function Prompt({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-extrabold leading-tight">{children}</h2>;
}

export function optionClass(value: string, state: ChoiceState, correct: string | null) {
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
          <span className="arabic-big block pb-3 text-6xl">{exercise.word.text}</span>
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
      <Prompt>{isLetter(exercise.letter) ? "Bagaimana membaca huruf ini?" : "Bagaimana membacanya?"}</Prompt>
      <div className="flex justify-center">
        <span className={`arabic-big rounded-3xl border-2 border-line px-10 leading-[1.6] ${exercise.letter.includes("+") ? "text-[80px]" : "text-[110px]"}`}>{arabicOf(exercise.letter)}</span>
      </div>
      <div className="grid gap-3">
        {exercise.options.map((id) => (
          <button
            key={id}
            type="button"
            disabled={state.checked}
            onClick={() => {
              onSelect(id);
              const url = tokenSoundUrl(urls, id);
              if (url) void playAudio(url);
            }}
            className={`${optionClass(id, state, correct)} py-4 text-2xl font-extrabold`}
          >
            {latinOf(id)}
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
  const sounds = exercise.letters.map((l) => tokenSoundUrl(urls, l));
  const correct = correctValue(exercise);
  return (
    <div className="flex flex-col gap-6">
      <Prompt>Baca dari kanan ke kiri</Prompt>
      <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-line py-4">
        <span className="arabic-big px-2 text-center text-6xl tracking-wide" dir="rtl">
          {exercise.letters.map(arabicOf).join("  ")}
        </span>
        {sounds.every(Boolean) && <AudioButton src={sounds as string[]} size="sm" />}
        <span className="text-xs font-bold text-muted">← arah membaca</span>
      </div>
      <div className="grid gap-3">
        {exercise.options.map((option, i) => (
          <button key={i} type="button" disabled={state.checked} onClick={() => onSelect(String(i))} className={`${optionClass(String(i), state, correct)} py-4 text-xl font-extrabold`}>
            {option.map(latinOf).join(" - ")}
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
                const url = tokenSoundUrl(urls, id);
                if (url) void playAudio(url);
                setPickLeft(id);
                tryPair(id, pickRight);
              }}
              className={`${cell("l", id, pickLeft === id)} w-full text-xl font-extrabold`}
            >
              {latinOf(id)}
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
              {arabicOf(id)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Record yourself, listen back next to the example, then judge it yourself. */
export function SpeakExercise({ exercise, onDone }: { exercise: Extract<Exercise, { kind: "speak" }>; onDone: (skipped: boolean) => void }) {
  const token = exercise.letter;
  const recorder = useRecorder(5000);
  const questEvent = useGame((s) => s.questEvent);
  const urls = useLetterAudio((s) => s.urls);
  const recorded = !!tokenSoundUrl(urls, token);
  const example = tokenExample(urls, token);

  useEffect(() => {
    if (recorder.state === "done") questEvent("record");
  }, [recorder.state, questEvent]);

  return (
    <div className="flex flex-col gap-6">
      <Prompt>{isLetter(token) ? "Ucapkan huruf ini" : "Ucapkan bacaan ini"}</Prompt>
      <div className="flex items-center justify-center gap-6 rounded-3xl border-2 border-line px-4 py-4">
        {example && <AudioButton src={example} size="md" autoPlay label="Dengar contoh" />}
        <div className="text-center">
          <span className={`arabic-big block leading-[1.5] ${token.includes("+") ? "text-7xl" : "text-[96px]"}`}>{arabicOf(token)}</span>
          <span className="font-extrabold">{latinOf(token)}</span>
        </div>
      </div>
      {!recorded && (
        <p className="-mt-3 text-center text-xs text-muted">
          {example ? "Contoh suara memakai kata dari Al-Qur'an yang diawali bacaan ini." : "Belum ada contoh suara. Baca sesuai tulisan latinnya."}
        </p>
      )}

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
            {example && (
              <div className="flex flex-col items-center gap-1 text-xs font-bold text-muted">
                <AudioButton src={example} size="md" label="Dengar contoh" />
                Contoh
              </div>
            )}
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

const MARKS = harakat.marks as { id: string; name: string; explain: string }[];

/** Bagian Membaca: what a mark or sign means, with syllables or Qur'an words to tap. */
export function MarkIntroExercise({ exercise }: { exercise: Extract<Exercise, { kind: "mark-intro" }> }) {
  const mark = MARKS.find((m) => m.id === exercise.topic)!;
  const urls = useLetterAudio((s) => s.urls);
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm font-extrabold uppercase tracking-wider text-purple">Tanda baru</p>
      <div className="rounded-3xl border-2 border-b-4 border-line p-5">
        <h2 className="text-2xl font-extrabold">{mark.name}</h2>
        <p className="mt-2 leading-relaxed text-muted">{mark.explain}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {exercise.examples.map((t) => {
          const url = tokenExample(urls, t);
          return (
            <button
              key={t}
              type="button"
              onClick={() => url && void playAudio(url)}
              className="flex flex-col items-center rounded-2xl border-2 border-b-4 border-line py-2"
            >
              <span className="arabic-big pb-2 text-5xl leading-[2.2]">{arabicOf(t)}</span>
              <span className="font-extrabold">{latinOf(t)}</span>
            </button>
          );
        })}
      </div>
      {exercise.words.map((w) => (
        <div key={w.ref} className="flex items-center gap-3 rounded-2xl bg-[#f7f7f7] p-3">
          <AudioButton src={w.audio} size="sm" />
          <span className="flex-1 text-sm text-muted">{refLabel(w.ref)}</span>
          <span className="arabic-big text-4xl">{w.text}</span>
        </div>
      ))}
    </div>
  );
}

/** See the sound in latin, find the Arabic. */
export function FindPickExercise({ exercise, state, onSelect }: ChoiceProps<"find-pick">) {
  return (
    <div className="flex flex-col gap-8">
      <Prompt>
        Mana yang dibaca <span className="text-blue">&ldquo;{latinOf(exercise.letter)}&rdquo;</span>?
      </Prompt>
      <TokenOptions exercise={exercise} options={exercise.options} state={state} onSelect={onSelect} />
    </div>
  );
}

function TokenOptions({ exercise, options, state, onSelect }: { exercise: Exercise; options: string[]; state: ChoiceState; onSelect: (v: string) => void }) {
  const correct = correctValue(exercise);
  return (
    <div className="grid grid-cols-3 gap-3">
      {options.map((t) => (
        <button key={t} type="button" disabled={state.checked} onClick={() => onSelect(t)} className={`${optionClass(t, state, correct)} arabic-big py-3 ${t.includes("+") ? "text-4xl" : "text-6xl"}`}>
          {arabicOf(t)}
        </button>
      ))}
    </div>
  );
}

/** Hear and see a Qur'an word, pick the syllable it opens with. */
export function WordStartExercise({ exercise, state, onSelect }: ChoiceProps<"word-start">) {
  return (
    <div className="flex flex-col gap-6">
      <Prompt>Kata ini diawali bunyi apa?</Prompt>
      <div className="flex items-center justify-center gap-4 rounded-3xl border-2 border-line py-4">
        <AudioButton src={exercise.word.audio} size="md" autoPlay />
        <div className="text-center">
          <span className="arabic-big block pb-3 text-6xl">{exercise.word.text}</span>
          <span className="text-xs text-muted">{refLabel(exercise.word.ref)}</span>
        </div>
      </div>
      <TokenOptions exercise={exercise} options={exercise.options} state={state} onSelect={onSelect} />
    </div>
  );
}

/** Hear the qari read one word of Al-Fatihah, pick it. */
export function WordListenExercise({ exercise, state, onSelect }: ChoiceProps<"word-listen">) {
  const correct = correctValue(exercise);
  return (
    <div className="flex flex-col gap-8">
      <Prompt>Kata mana yang dibaca qari?</Prompt>
      <div className="flex justify-center">
        <AudioButton src={exercise.word.audio} size="lg" autoPlay />
      </div>
      <div className="grid gap-3">
        {exercise.options.map((w) => (
          <button key={w.ref} type="button" disabled={state.checked} onClick={() => onSelect(w.ref)} className={`${optionClass(w.ref, state, correct)} arabic-big py-2 text-5xl leading-[1.9]`}>
            {w.text}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Momen Bisa Baca: read a real word or ayah yourself and record it. Cek Suara
 * checks it right away: every word heard means "bisa", a red word offers a retry.
 * Without the model it falls back to Nilai Sendiri. Never locks the learner out.
 */
export function ReadExercise({ exercise, onDone }: { exercise: Extract<Exercise, { kind: "read" }>; onDone: (read: boolean) => void }) {
  const isAyah = exercise.ref.split(":").length === 2;
  const speech = useSpeech();
  const questEvent = useGame((s) => s.questEvent);
  const [heard, setHeard] = useState<boolean[] | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkFailed, setCheckFailed] = useState(false);
  const [finished, setFinished] = useState(false);

  const finish = (read: boolean) => {
    setFinished(true);
    onDone(read);
  };

  const check = async (blob: Blob) => {
    setChecking(true);
    try {
      const result = matchWords(exercise.words, await transcribe(blob));
      setHeard(result);
      if (result.every(Boolean)) finish(true);
    } catch (err) {
      console.error("Cek Suara:", err);
      setCheckFailed(true);
    }
    setChecking(false);
  };

  // Check as soon as the recording is in.
  const recorder = useRecorder(isAyah ? 30000 : 6000, undefined, (blob) => {
    if (useSpeech.getState().status === "ready") void check(blob);
  });

  useEffect(() => {
    if (recorder.state === "done") questEvent("record");
  }, [recorder.state, questEvent]);

  const retry = () => {
    setHeard(null);
    setCheckFailed(false);
    recorder.reset();
  };

  const matched = heard?.filter(Boolean).length ?? 0;
  const allHeard = !!heard && matched === exercise.words.length;
  const selfAssess = speech.status !== "ready" || checkFailed;
  const [surah, ayah] = exercise.ref.split(":").map(Number);

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm font-extrabold uppercase tracking-wider text-gold">Momen Bisa Baca</p>
      <Prompt>{isAyah ? "Ayat ini bisa kamu baca sendiri. Coba!" : "Kata Al-Qur'an ini bisa kamu baca sendiri. Coba!"}</Prompt>
      <div className="rounded-3xl border-2 border-gold/50 bg-gold/5 px-4 py-3">
        <p dir="rtl" lang="ar" className={`arabic ${isAyah ? "" : "text-center! text-5xl!"}`}>
          {exercise.words.map((w, i) => (
            <span key={i} className={heard ? (heard[i] ? "text-green" : "text-red") : ""}>
              {w}{" "}
            </span>
          ))}
        </p>
        <p className="text-xs font-bold text-muted">{refLabel(exercise.ref)}</p>
      </div>

      {recorder.state === "denied" && <p className="rounded-xl bg-red/10 p-3 text-sm text-red-dark">Mikrofon tidak diizinkan. Izinkan mikrofon di pengaturan browser, atau lewati dulu.</p>}
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
          <p className="text-sm font-bold text-muted">{recorder.state === "recording" ? "Merekam... ketuk untuk berhenti" : "Baca pelan-pelan, lalu ketuk untuk merekam"}</p>
          <button type="button" onClick={() => onDone(false)} className="text-sm font-extrabold uppercase tracking-wide text-muted">
            Tidak bisa bicara sekarang
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-around rounded-2xl bg-[#f7f7f7] p-3">
            <div className="flex flex-col items-center gap-1 text-xs font-bold text-muted">
              <AudioButton src={recorder.url!} size="md" label="Putar rekamanmu" />
              Suaramu
            </div>
            <div className="flex flex-col items-center gap-1 text-xs font-bold text-muted">
              <AudioButton src={exercise.audio} size="md" label="Dengar qari" />
              Qari
            </div>
          </div>
          {checking ? (
            <p className="animate-pulse text-center font-bold text-blue">Cek Suara sedang mendengarkan...</p>
          ) : allHeard ? (
            <p className="rounded-xl bg-green/10 p-3 text-sm font-bold text-green-dark">Bacaanmu cocok! Semua kata terdengar jelas.</p>
          ) : heard ? (
            <p className="rounded-xl bg-blue/10 p-3 text-sm">
              Cek Suara mendengar <b>{matched} dari {exercise.words.length} kata</b>. Kata merah mungkin belum jelas: dengarkan qari, lalu coba lagi. Ini bantuan, bukan penilaian.
            </p>
          ) : (
            selfAssess && (
              <p className="text-center text-xs text-muted">
                {checkFailed
                  ? "Cek Suara belum bisa mendengar rekaman ini."
                  : speech.status === "loading"
                    ? `Cek Suara sedang disiapkan (${Math.round(speech.progress)}%).`
                    : "Cek Suara belum tersedia di perangkat ini."}{" "}
                Bandingkan sendiri dengan bacaan qari.
              </p>
            )
          )}
          {isAyah && (allHeard || selfAssess) && <ShareCardButton surah={surah} ayah={ayah} text={exercise.words.join(" ")} />}
          {!finished && !checking && (heard || selfAssess) && (
            <div className="grid grid-cols-2 gap-3">
              <Button color={heard ? "green" : "white"} onClick={retry}>
                Ulangi
              </Button>
              {heard ? (
                <Button color="white" onClick={() => finish(false)}>
                  Lanjut dulu
                </Button>
              ) : (
                <Button onClick={() => finish(true)}>Sudah bisa</Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
