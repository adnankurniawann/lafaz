// Potongan Ayat for Level Tajwid: a few words of an ayah around one marked
// rule, played from the full ayah audio with the word timings (FR-16).
// Examples come from scripts/build-tajweed-examples.ts.

import examplesData from "../../data/content/tajweed-examples.json";
import type { AudioSpan } from "./audio";
import { groupOf, type LessonRuleId } from "./tajweed-lessons";

export type Mark = { rule: LessonRuleId; start: number; end: number; word: number; review?: boolean };

export type ExampleAyah = {
  ref: string;
  text: string;
  /** Character range [start, end) of every word in `text`. */
  words: [number, number][];
  audio: string;
  /** Start and end of every word in the audio, in milliseconds. */
  timing: [number, number][];
  marks: Mark[];
};

/** Potongan Ayat: the words a mark touches, words `from` to `to`. */
export type Clip = { id: string; ayah: ExampleAyah; mark: Mark; from: number; to: number };

export const exampleAyahs: ExampleAyah[] = Object.entries(examplesData.ayahs as unknown as Record<string, Omit<ExampleAyah, "ref">>).map(([ref, a]) => ({ ref, ...a }));

const ayahByRef = new Map(exampleAyahs.map((a) => [a.ref, a]));

export function getExampleAyah(ref: string): ExampleAyah {
  return ayahByRef.get(ref)!;
}

function lastWordOf(ayah: ExampleAyah, mark: Mark) {
  return ayah.words.findIndex(([s, e]) => mark.end - 1 >= s && mark.end - 1 < e);
}

const LETTER = /[\u0621-\u064A\u0671]/;

// A clip covers the words the mark touches. When the mark ends a word, what
// comes next decides the rule (mad jaiz before a hamzah, for one), so the next
// word joins the clip too.
const clips: Clip[] = exampleAyahs.flatMap((ayah) =>
  ayah.marks.map((mark, i) => {
    let to = lastWordOf(ayah, mark);
    const endsWord = !LETTER.test(ayah.text.slice(mark.end, ayah.words[to][1]));
    if (endsWord && to + 1 < ayah.words.length) to += 1;
    return { id: `${ayah.ref}:${i}`, ayah, mark, from: mark.word, to };
  }),
);
const clipById = new Map(clips.map((c) => [c.id, c]));

export function getClip(id: string): Clip {
  return clipById.get(id)!;
}

/** Marks that touch the clip's words. */
export function marksIn(c: Pick<Clip, "ayah" | "from" | "to">): Mark[] {
  return c.ayah.marks.filter((m) => m.word <= c.to && lastWordOf(c.ayah, m) >= c.from);
}

/** No other rule of the same group in the clip, so what it sounds like is unambiguous. */
export function isClean(c: Clip) {
  const group = groupOf(c.mark.rule);
  return marksIn(c).every((m) => m.rule === c.mark.rule || groupOf(m.rule) !== group);
}

// Surahs a beginner is likely to know, used first in introductions.
const FAMILIAR = [1, 112, 113, 114, 108, 103, 110, 111, 109, 107, 106, 105, 102, 101, 100, 99, 97, 95, 94, 93];

function familiarity(c: Clip) {
  const index = FAMILIAR.indexOf(Number(c.ayah.ref.split(":")[0]));
  return index === -1 ? FAMILIAR.length : index;
}

/** Clips of a rule, simplest first: unambiguous, from familiar surahs, short. */
export function clipsFor(rule: LessonRuleId): Clip[] {
  return clips
    .filter((c) => c.mark.rule === rule)
    .sort((a, b) => Number(isClean(b)) - Number(isClean(a)) || familiarity(a) - familiarity(b) || a.to - a.from - (b.to - b.from));
}

/** Clean clips of other rules that do not contain `rule` at all. */
export function clipsWithout(rule: LessonRuleId, among: LessonRuleId[]): Clip[] {
  return clips.filter((c) => among.includes(c.mark.rule) && c.mark.rule !== rule && isClean(c) && !marksIn(c).some((m) => m.rule === rule));
}

/** Short ayat with the rule, for "cari di ayat". */
export function ayahsWith(rule: LessonRuleId, maxWords = 10): ExampleAyah[] {
  const all = exampleAyahs.filter((a) => a.marks.some((m) => m.rule === rule));
  const short = all.filter((a) => a.words.length <= maxWords);
  return short.length ? short : all;
}

export function clipWords(c: Pick<Clip, "ayah" | "from" | "to">): string[] {
  return ayahWords(c.ayah).slice(c.from, c.to + 1);
}

export type TextPart = { text: string; rule: LessonRuleId | null };

/** Splits part of an ayah into plain and highlighted pieces; `highlight` picks the colored marks. */
export function highlightParts(ayah: ExampleAyah, start: number, end: number, highlight: (m: Mark) => boolean): TextPart[] {
  const parts: TextPart[] = [];
  let pos = start;
  for (const m of ayah.marks) {
    if (!highlight(m) || m.end <= pos || m.start >= end) continue;
    const s = Math.max(m.start, pos);
    const e = Math.min(m.end, end);
    if (s > pos) parts.push({ text: ayah.text.slice(pos, s), rule: null });
    parts.push({ text: ayah.text.slice(s, e), rule: m.rule });
    pos = e;
  }
  if (pos < end) parts.push({ text: ayah.text.slice(pos, end), rule: null });
  return parts;
}

export function clipParts(c: Clip, highlight = true): TextPart[] {
  return highlightParts(c.ayah, c.ayah.words[c.from][0], c.ayah.words[c.to][1], (m) => highlight && m === c.mark);
}

// Word end times are approximate; a little extra keeps the last sound whole.
const TAIL_MS = 60;

function wordsSpan(ayah: ExampleAyah, from: number, to: number): AudioSpan {
  return { src: ayah.audio, startMs: ayah.timing[from][0], endMs: ayah.timing[to][1] + TAIL_MS };
}

export function clipSpan(c: Clip): AudioSpan {
  return wordsSpan(c.ayah, c.from, c.to);
}

export function ayahSpan(ayah: ExampleAyah): AudioSpan {
  return wordsSpan(ayah, 0, ayah.words.length - 1);
}

export function ayahWords(ayah: ExampleAyah): string[] {
  return ayah.words.map(([s, e]) => ayah.text.slice(s, e));
}

/** Words that count as an answer for "cari di ayat": every word a mark of the rule touches. */
export function wordsWithRule(ayah: ExampleAyah, rule: LessonRuleId): number[] {
  const out = new Set<number>();
  for (const m of ayah.marks) {
    if (m.rule !== rule) continue;
    for (let w = m.word; w <= lastWordOf(ayah, m); w++) out.add(w);
  }
  return [...out].sort((a, b) => a - b);
}
