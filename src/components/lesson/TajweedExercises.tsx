"use client";

import { useEffect, useState } from "react";
import { AudioButton, usePlayingSrc } from "@/components/AudioButton";
import { Button } from "@/components/Button";
import { MicIcon } from "@/components/icons";
import { playSpan, playSpans, spanKey } from "@/lib/audio";
import { ayahSpan, ayahWords, clipParts, clipSpan, clipWords, getClip, getExampleAyah, highlightParts, type Clip, type TextPart } from "@/lib/clips";
import type { Exercise } from "@/lib/exercises";
import { refLabel } from "@/lib/letters";
import { transcribe, useSpeech } from "@/lib/speech";
import { matchWords } from "@/lib/speech-match";
import { useGame } from "@/lib/store";
import { getLessonRule, type LessonRuleId } from "@/lib/tajweed-lessons";
import { useRecorder } from "@/lib/use-recorder";
import { optionClass, Prompt, type ChoiceState } from "./Exercises";

type ChoiceProps<K extends Exercise["kind"]> = {
  exercise: Extract<Exercise, { kind: K }>;
  state: ChoiceState;
  onSelect: (value: string) => void;
};

/** Slower playback keeps the pitch, so dengung and mad are easier to hear. */
const SLOW = 0.7;

/**
 * Teks Utsmani of a clip or ayah. `reveal` colors each rule in its own color;
 * otherwise highlighted parts get one neutral color, so the color never gives the answer away.
 */
function ArabicParts({ parts, reveal = true, className = "" }: { parts: TextPart[]; reveal?: boolean; className?: string }) {
  return (
    <p dir="rtl" lang="ar" className={`arabic ${className}`}>
      {parts.map((p, i) =>
        p.rule ? (
          <span key={i} className={reveal ? "font-bold" : "rounded bg-gold/30"} style={reveal ? { color: getLessonRule(p.rule).color } : undefined}>
            {p.text}
          </span>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </p>
  );
}

function ClipButtons({ clip, autoPlay = false }: { clip: Clip; autoPlay?: boolean }) {
  const span = clipSpan(clip);
  return (
    <div className="flex shrink-0 gap-2">
      <AudioButton span={span} size="sm" autoPlay={autoPlay} label="Dengar qari" />
      <AudioButton span={span} rate={SLOW} size="sm" label="Dengar pelan" className="text-lg">
        🐢
      </AudioButton>
    </div>
  );
}

function ReviewNote({ clip }: { clip: Clip }) {
  const rule = getLessonRule(clip.mark.rule);
  if (!clip.mark.review) return null;
  return <p className="text-[11px] text-amber-700">{rule.detected ? "Dideteksi otomatis dari teks, perlu cek ustadz." : "Penandaan dari data sumber yang belum pasti, perlu cek ustadz."}</p>;
}

function RuleOptions({ options, state, onSelect, correct }: { options: LessonRuleId[]; state: ChoiceState; onSelect: (v: string) => void; correct: string }) {
  return (
    <div className="grid gap-3">
      {options.map((id) => (
        <button key={id} type="button" disabled={state.checked} onClick={() => onSelect(id)} className={`${optionClass(id, state, correct)} px-4 py-3 text-left text-lg font-extrabold`}>
          {getLessonRule(id).name}
          <span className="block text-sm font-semibold text-muted">{getLessonRule(id).meaning}</span>
        </button>
      ))}
    </div>
  );
}

/** Kenali bunyinya: the rule in a few lines, then clips of the qari with the rule colored. */
export function RuleIntroExercise({ exercise }: { exercise: Extract<Exercise, { kind: "rule-intro" }> }) {
  const rule = getLessonRule(exercise.rule);
  const clips = exercise.clips.map(getClip);
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-extrabold uppercase tracking-wider text-purple">Hukum baru</p>
      <div className="rounded-3xl border-2 border-b-4 border-line p-4">
        <p className="text-2xl font-extrabold" style={{ color: rule.color }}>
          {rule.name}
        </p>
        <p className="text-sm text-muted">artinya {rule.meaning}</p>
        <p className="mt-3">{rule.summary}</p>
        {rule.letters.length > 0 && (
          <p dir="rtl" lang="ar" className="arabic-big mt-1 text-3xl tracking-wider">
            {rule.letters.join(" ")}
          </p>
        )}
        <p className="mt-2 text-sm">
          <b>Cara baca:</b> {rule.howTo}
        </p>
        <p className="mt-1 text-sm">
          <b>Yang didengar:</b> {rule.listenFor}
        </p>
      </div>
      <p className="font-extrabold">Dengarkan qari</p>
      <ul className="space-y-3">
        {clips.map((c, i) => (
          <li key={c.id} className="rounded-2xl bg-[#f7f7f7] p-3">
            <div className="flex items-center gap-3">
              <ClipButtons clip={c} autoPlay={i === 0} />
              <ArabicParts parts={clipParts(c)} className="flex-1 text-[1.9rem]!" />
            </div>
            <p className="text-xs text-muted">{refLabel(c.ayah.ref)}</p>
            <ReviewNote clip={c} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Dengar dan bandingkan: two clips, A and B. The text shows once answered. */
export function RuleCompareExercise({ exercise, state, onSelect }: ChoiceProps<"rule-compare">) {
  const rule = getLessonRule(exercise.rule);
  const clips = exercise.clips.map(getClip);
  const spans = clips.map(clipSpan);
  const playing = usePlayingSrc();
  const questEvent = useGame((s) => s.questEvent);

  useEffect(() => {
    const id = setTimeout(() => void playSpans(spans), 400);
    return () => clearTimeout(id);
    // Play A then B once when the question appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <Prompt>
        Mana yang ada <span style={{ color: rule.color }}>{rule.name}</span>?
      </Prompt>
      <p className="-mt-3 text-sm text-muted">{rule.listenFor}</p>
      <div className="grid grid-cols-2 gap-3">
        {clips.map((c, i) => {
          const value = String(i);
          const isPlaying = playing === spanKey(spans[i]);
          return (
            <button
              key={c.id}
              type="button"
              disabled={state.checked}
              onClick={() => {
                questEvent("listen");
                void playSpan(spans[i]);
                onSelect(value);
              }}
              className={`${optionClass(value, state, String(exercise.answer))} flex flex-col items-center gap-2 py-5`}
            >
              <span className={`flex size-14 items-center justify-center rounded-2xl bg-blue text-2xl text-white ${isPlaying ? "brightness-110" : ""}`}>🔊</span>
              <span className="text-xl font-extrabold">Potongan {i === 0 ? "A" : "B"}</span>
            </button>
          );
        })}
      </div>
      <div className="flex justify-center">
        <AudioButton span={spans[0]} rate={SLOW} size="sm" label="Dengar A pelan" className="mr-2 text-lg">
          🐢A
        </AudioButton>
        <AudioButton span={spans[1]} rate={SLOW} size="sm" label="Dengar B pelan" className="text-lg">
          🐢B
        </AudioButton>
      </div>
      {state.checked && (
        <div className="space-y-2">
          {clips.map((c, i) => (
            <div key={c.id} className="flex items-center gap-3 rounded-2xl bg-[#f7f7f7] px-3">
              <span className="font-extrabold text-muted">{i === 0 ? "A" : "B"}</span>
              <ArabicParts parts={clipParts(c)} className="flex-1 text-[1.7rem]!" />
              <span className="text-xs font-bold" style={{ color: getLessonRule(c.mark.rule).color }}>
                {getLessonRule(c.mark.rule).name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Tebak dari Potongan Ayat: the highlighted part, which rule is it? */
export function RuleFromTextExercise({ exercise, state, onSelect }: ChoiceProps<"rule-from-text">) {
  const clip = getClip(exercise.clip);
  return (
    <div className="flex flex-col gap-5">
      <Prompt>Hukum apa yang ditandai?</Prompt>
      <div className="rounded-3xl border-2 border-line px-4 py-2">
        <div className="flex items-center gap-3">
          <ClipButtons clip={clip} />
          <ArabicParts parts={clipParts(clip)} reveal={state.checked} className="flex-1 text-[2.1rem]!" />
        </div>
        <p className="text-xs text-muted">{refLabel(clip.ayah.ref)}</p>
        <ReviewNote clip={clip} />
      </div>
      <RuleOptions options={exercise.options} state={state} onSelect={onSelect} correct={clip.mark.rule} />
    </div>
  );
}

/** Tebak dari suara: only the qari, no text until the answer is checked. */
export function RuleFromAudioExercise({ exercise, state, onSelect }: ChoiceProps<"rule-from-audio">) {
  const clip = getClip(exercise.clip);
  const span = clipSpan(clip);
  return (
    <div className="flex flex-col gap-5">
      <Prompt>Hukum apa yang kamu dengar?</Prompt>
      <div className="flex items-center justify-center gap-4">
        <AudioButton span={span} size="lg" autoPlay label="Dengar qari" />
        <AudioButton span={span} rate={SLOW} size="md" label="Dengar pelan">
          🐢
        </AudioButton>
      </div>
      {state.checked ? (
        <div className="rounded-2xl bg-[#f7f7f7] px-3">
          <ArabicParts parts={clipParts(clip)} className="text-[1.9rem]!" />
          <p className="text-xs text-muted">{refLabel(clip.ayah.ref)}</p>
        </div>
      ) : (
        <p className="text-center text-sm text-muted">Teksnya muncul setelah kamu menjawab.</p>
      )}
      <RuleOptions options={exercise.options} state={state} onSelect={onSelect} correct={clip.mark.rule} />
    </div>
  );
}

/** Cari di ayat: tap one word that has the rule. */
export function RuleFindExercise({ exercise, state, onSelect }: ChoiceProps<"rule-find">) {
  const rule = getLessonRule(exercise.rule);
  const ayah = getExampleAyah(exercise.ayah);
  const words = ayahWords(ayah);
  return (
    <div className="flex flex-col gap-5">
      <Prompt>
        Ketuk kata yang ada <span style={{ color: rule.color }}>{rule.name}</span>
      </Prompt>
      <p className="-mt-3 text-sm text-muted">{rule.summary}</p>
      <div className="flex items-center gap-3">
        <AudioButton span={ayahSpan(ayah)} size="sm" label="Dengar ayat" />
        <span className="text-xs font-bold text-muted">{refLabel(ayah.ref)}</span>
      </div>
      <div dir="rtl" className="flex flex-wrap gap-2">
        {words.map((w, i) => {
          const value = String(i);
          const right = state.checked && exercise.answers.includes(i);
          const wrong = state.checked && state.selected === value && !right;
          const [start, end] = ayah.words[i];
          return (
            <button
              key={i}
              type="button"
              disabled={state.checked}
              onClick={() => onSelect(value)}
              className={`rounded-2xl border-2 border-b-4 px-3 transition active:translate-y-[2px] ${
                right ? "border-green bg-green/10" : wrong ? "animate-shake border-red bg-red/10" : state.selected === value ? "border-blue bg-blue/10" : "border-line bg-white"
              }`}
            >
              <ArabicParts parts={state.checked ? highlightParts(ayah, start, end, (m) => m.rule === exercise.rule) : [{ text: w, rule: null }]} className="text-[1.9rem]!" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Ucapkan potongan: Cek Suara checks the words; the tajwid itself is Nilai Sendiri. */
export function ClipSpeakExercise({ exercise, onDone }: { exercise: Extract<Exercise, { kind: "clip-speak" }>; onDone: (skipped: boolean) => void }) {
  const clip = getClip(exercise.clip);
  const rule = getLessonRule(clip.mark.rule);
  const words = clipWords(clip);
  const speech = useSpeech();
  const questEvent = useGame((s) => s.questEvent);
  const [heard, setHeard] = useState<boolean[] | null>(null);
  const [checking, setChecking] = useState(false);

  const check = async (blob: Blob) => {
    setChecking(true);
    try {
      setHeard(matchWords(words, await transcribe(blob)));
    } catch (err) {
      console.error("Cek Suara:", err);
    }
    setChecking(false);
  };

  const recorder = useRecorder(8000, undefined, (blob) => {
    if (useSpeech.getState().status === "ready") void check(blob);
  });

  useEffect(() => {
    if (recorder.state === "done") questEvent("record");
  }, [recorder.state, questEvent]);

  const retry = () => {
    setHeard(null);
    recorder.reset();
  };

  return (
    <div className="flex flex-col gap-5">
      <Prompt>Ucapkan potongan ini</Prompt>
      <div className="rounded-3xl border-2 border-line px-4 py-2">
        <div className="flex items-center gap-3">
          <ClipButtons clip={clip} autoPlay />
          <p dir="rtl" lang="ar" className="arabic flex-1 text-[2.1rem]!">
            {heard
              ? words.map((w, i) => (
                  <span key={i} className={heard[i] ? "text-green" : "text-red"}>
                    {w}{" "}
                  </span>
                ))
              : clipParts(clip).map((p, i) => (
                  <span key={i} className={p.rule ? "font-bold" : ""} style={p.rule ? { color: rule.color } : undefined}>
                    {p.text}
                  </span>
                ))}
          </p>
        </div>
        <p className="text-xs text-muted">
          {refLabel(clip.ayah.ref)} · perhatikan <b style={{ color: rule.color }}>{rule.name}</b>: {rule.howTo}
        </p>
      </div>

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
          <p className="text-sm font-bold text-muted">{recorder.state === "recording" ? "Merekam... ketuk untuk berhenti" : "Ketuk lalu baca potongannya"}</p>
          <button type="button" onClick={() => onDone(true)} className="text-sm font-extrabold uppercase tracking-wide text-muted">
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
              <AudioButton span={clipSpan(clip)} size="md" label="Dengar qari" />
              Qari
            </div>
          </div>
          {checking ? (
            <p className="animate-pulse text-center font-bold text-blue">Cek Suara sedang mendengarkan...</p>
          ) : heard ? (
            <p className="rounded-xl bg-blue/10 p-3 text-sm">
              Cek Suara mendengar <b>{heard.filter(Boolean).length} dari {words.length} kata</b>. Cek Suara hanya mengenali kata, belum bisa menilai dengung atau panjang bacaan. Untuk tajwidnya, bandingkan sendiri dengan qari.
            </p>
          ) : (
            <p className="text-center text-xs text-muted">
              {speech.status === "loading" ? `Cek Suara sedang disiapkan (${Math.round(speech.progress)}%). ` : ""}Bandingkan sendiri dengan bacaan qari. Sudah mirip?
            </p>
          )}
          {!checking && (
            <div className="grid grid-cols-2 gap-3">
              <Button color="white" onClick={retry}>
                Ulangi
              </Button>
              <Button onClick={() => onDone(false)}>Sudah benar</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
