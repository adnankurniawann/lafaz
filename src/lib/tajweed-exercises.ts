// Soal for Level Tajwid, built from Potongan Ayat (FR-16): kenali bunyinya,
// dengar dan bandingkan, tebak dari Potongan Ayat, tebak dari suara, cari di
// ayat, and ucapkan potongan.

import { ayahsWith, clipsFor, clipsWithout, isClean, wordsWithRule, type Clip } from "./clips";
import { rulesUpTo, unitOf, type LessonNode } from "./course";
import type { Exercise } from "./exercises";
import { pick, shuffle } from "./random";
import { groupOf, type LessonRuleId } from "./tajweed-lessons";

let counter = 0;
const nextId = (kind: string) => `${kind}-${++counter}`;

// How many of the simplest clips a rule draws from, so early questions stay easy.
const POOL = 16;

export function buildTajweed(lesson: LessonNode): Exercise[] {
  const focus = lesson.rules!;
  const group = groupOf(focus[0]).rules;
  // Answer options are the rules of this group taught so far.
  const known = rulesUpTo(unitOf(lesson.id)).filter((r) => group.includes(r));
  const canGuess = known.length >= 2;
  const used = new Set<string>();
  const usedAyahs = new Set<string>();
  const rule = (i: number) => focus[i % focus.length];
  // Guessing questions alternate the new rule with ones learned before, so the
  // answer is not always the unit's own rule.
  const earlier = known.filter((r) => !focus.includes(r));
  const guessRule = (i: number) => (i % 2 === 1 && earlier.length ? pick(earlier) : rule(i));

  const take = (candidates: Clip[]): Clip | undefined => {
    const fresh = candidates.filter((c) => !used.has(c.id));
    const c = pick(fresh.length ? fresh : candidates);
    if (c) used.add(c.id);
    return c;
  };
  const clipOf = (r: LessonRuleId, clean = false) => {
    const all = clipsFor(r).slice(0, POOL);
    return take(clean ? all.filter(isClean) : all);
  };
  const options = (r: LessonRuleId) => shuffle([r, ...shuffle(known.filter((k) => k !== r)).slice(0, 3)]);

  const intro = (r: LessonRuleId): Exercise => {
    const clips = clipsFor(r).slice(0, 3);
    clips.forEach((c) => used.add(c.id));
    return { kind: "rule-intro", id: nextId("rule-intro"), rule: r, clips: clips.map((c) => c.id) };
  };

  const compare = (r: LessonRuleId): Exercise | undefined => {
    const target = clipOf(r, true) ?? clipOf(r);
    const other = take(clipsWithout(r, group));
    if (!target || !other) return undefined;
    const answer = Math.random() < 0.5 ? 0 : 1;
    const clips: [string, string] = answer === 0 ? [target.id, other.id] : [other.id, target.id];
    return { kind: "rule-compare", id: nextId("compare"), rule: r, clips, answer };
  };

  const fromText = (r: LessonRuleId): Exercise | undefined => {
    const c = clipOf(r);
    return c && { kind: "rule-from-text", id: nextId("from-text"), clip: c.id, options: options(r) };
  };

  // Only a clip with no other rule of the group can be guessed by ear alone.
  const fromAudio = (r: LessonRuleId): Exercise | undefined => {
    const c = clipOf(r, true);
    return c ? { kind: "rule-from-audio", id: nextId("from-audio"), clip: c.id, options: options(r) } : fromText(r);
  };

  const find = (r: LessonRuleId): Exercise | undefined => {
    const ayahs = ayahsWith(r);
    const fresh = ayahs.filter((a) => !usedAyahs.has(a.ref));
    const ayah = pick(fresh.length ? fresh : ayahs);
    if (!ayah) return undefined;
    usedAyahs.add(ayah.ref);
    return { kind: "rule-find", id: nextId("find"), rule: r, ayah: ayah.ref, answers: wordsWithRule(ayah, r) };
  };

  const speak = (r: LessonRuleId): Exercise | undefined => {
    const c = clipOf(r, true) ?? clipOf(r);
    return c && { kind: "clip-speak", id: nextId("clip-speak"), clip: c.id };
  };

  const guess = (r: LessonRuleId) => (canGuess ? fromText(r) : compare(r));
  const guessByEar = (r: LessonRuleId) => (canGuess ? fromAudio(r) : compare(r));
  const times = (n: number, make: (r: LessonRuleId) => Exercise | undefined) => Array.from({ length: n }, (_, i) => make(rule(i)));
  const guesses = (n: number, make: (r: LessonRuleId) => Exercise | undefined) => Array.from({ length: n }, (_, i) => make(guessRule(i)));
  const list = (items: (Exercise | undefined)[]) => items.filter((e): e is Exercise => !!e);

  switch (lesson.lessonKind) {
    case "kenali":
      return list([...focus.flatMap((r) => [intro(r), compare(r), compare(r)]), guess(guessRule(0)), find(rule(0)), guess(guessRule(1)), compare(rule(1))]);
    case "bandingkan":
      return list(shuffle([...times(6, compare), find(rule(0)), find(rule(1)), guessByEar(guessRule(2)), guessByEar(guessRule(3))]));
    case "tebak":
      return list(shuffle([...guesses(4, fromText), ...guesses(4, fromAudio), compare(rule(0)), compare(rule(1))]));
    case "tebak-suara":
      return list(shuffle([...guesses(8, fromAudio), compare(rule(0)), compare(rule(1))]));
    case "cari":
      return list(shuffle([...times(6, find), compare(rule(0)), compare(rule(1)), guess(guessRule(2)), guess(guessRule(3))]));
    case "ucapkan":
      return list([speak(rule(0)), compare(rule(0)), speak(rule(1)), guessByEar(guessRule(1)), speak(rule(2)), compare(rule(2)), guessByEar(guessRule(3)), find(rule(3))]);
    default:
      return list(shuffle([...times(3, compare), ...guesses(3, guess), ...guesses(3, guessByEar), ...times(2, find)]));
  }
}
