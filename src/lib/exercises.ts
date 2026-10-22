import reading from "../../data/content/reading.json";
import { lettersUpTo, unitOf, type LessonNode } from "./course";
import { examplesFor, getLetter, letters as allLetters, type WordExample } from "./letters";
import { pick, shuffle } from "./random";
import { DRILL_LETTERS, isLetter, latinOf, makeToken, variants, type MarkUnit } from "./syllables";
import { buildHafalan, type SurahAyah } from "./hafalan-exercises";
import { buildTajweed } from "./tajweed-exercises";
import type { LessonRuleId } from "./tajweed-lessons";

// A "token" is a bare letter id (read with fathah) or a syllable from syllables.ts.
// Letter exercises and Bagian Membaca drills share the same exercise kinds.

export type Exercise = (
  /** New letter card, not graded. */
  | { kind: "intro"; id: string; letter: string }
  /** Hear the letter, pick it. Needs a recording of the letter. */
  | { kind: "listen-pick"; id: string; letter: string; options: string[] }
  /** Hear and see a Qur'an word, pick the letter it starts with. */
  | { kind: "word-initial"; id: string; letter: string; word: WordExample; options: string[] }
  /** See a token, pick how it sounds. */
  | { kind: "sound-pick"; id: string; letter: string; options: string[] }
  /** See the letter, pick its name. */
  | { kind: "name-pick"; id: string; letter: string; options: string[] }
  /** Match tokens with their sounds. */
  | { kind: "match"; id: string; letters: string[] }
  /** Read a short Iqro-style row such as بَ تَ ثَ, right to left. */
  | { kind: "sequence"; id: string; letters: string[]; options: string[][] }
  /** Record yourself and compare with the example. Self-assessed. */
  | { kind: "speak"; id: string; letter: string }
  /** Bagian Membaca: card that explains a mark or sign, with examples. */
  | { kind: "mark-intro"; id: string; topic: MarkUnit | "khusus"; examples: string[]; words: WordExample[] }
  /** See the sound written in latin, pick the Arabic syllable. */
  | { kind: "find-pick"; id: string; letter: string; options: string[] }
  /** Hear and see a Qur'an word, pick the syllable it starts with. */
  | { kind: "word-start"; id: string; letter: string; word: WordExample; options: string[] }
  /** Hear the qari read one word, pick which word it was. */
  | { kind: "word-listen"; id: string; word: WordExample; options: WordExample[] }
  /** Momen Bisa Baca: read a real word or ayah yourself, then hear the qari. */
  | { kind: "read"; id: string; text: string; audio: string; ref: string; words: string[] }
  // ---- Level Tajwid. Clips are Potongan Ayat ids from clips.ts. ----
  /** Kenali bunyinya: what the rule is, with a few clips to hear. Not graded. */
  | { kind: "rule-intro"; id: string; rule: LessonRuleId; clips: string[] }
  /** Dengar dan bandingkan: two clips, pick the one with the rule. */
  | { kind: "rule-compare"; id: string; rule: LessonRuleId; clips: [string, string]; answer: 0 | 1 }
  /** Tebak dari Potongan Ayat: one part highlighted, pick the rule. */
  | { kind: "rule-from-text"; id: string; clip: string; options: LessonRuleId[] }
  /** Tebak dari suara: audio only, the text shows after answering. */
  | { kind: "rule-from-audio"; id: string; clip: string; options: LessonRuleId[] }
  /** Cari di ayat: tap a word that has the rule. Any word the rule touches counts. */
  | { kind: "rule-find"; id: string; rule: LessonRuleId; ayah: string; answers: number[] }
  /** Ucapkan potongan: record it, Cek Suara per word, Nilai Sendiri for the tajwid. */
  | { kind: "clip-speak"; id: string; clip: string }
  // ---- Level Hafalan. Refs are "surah:ayah". ----
  /** Tikrar: hear the qari read the ayah again and again, with its text and meaning. Not graded. */
  | { kind: "ayah-listen"; id: string; ref: string; text: string; translation: string; audio: string }
  /** One word of the ayah is hidden; pick it. */
  | { kind: "missing-word"; id: string; ref: string; words: string[]; hidden: number; options: string[]; audio: string }
  /** The ayah that comes after this one. */
  | { kind: "next-ayah"; id: string; ref: string; text: string; audio: string; options: { ref: string; text: string }[]; answer: string }
  /** Recite ayat, from memory when `hide` (only the first word shows). `test`: Tes hafalan, a pass marks them "sudah hafal". */
  | { kind: "recite"; id: string; refs: string[]; words: string[]; audio: string[]; hide: boolean; test: boolean }
) & {
  /** Tes Matrikulasi: which stage the question belongs to. */
  stage?: number;
};

export type ExerciseKind = Exercise["kind"];

/** Checked by the app. In Mode Tantangan these are timed and a wrong answer costs a life. */
export const GRADED: ExerciseKind[] = [
  "listen-pick",
  "word-initial",
  "sound-pick",
  "name-pick",
  "sequence",
  "find-pick",
  "word-start",
  "word-listen",
  "rule-compare",
  "rule-from-text",
  "rule-from-audio",
  "rule-find",
  "missing-word",
  "next-ayah",
];

export type FatihahAyah = { number: number; text: string; audio: string; words: { text: string; audio: string }[] };

export type BuildContext = {
  /** Letters that have a recorded sound (from files or the studio). */
  hasSound: (letter: string) => boolean;
  /** For practice: weaker letters come up more often. */
  mastery?: Record<string, number>;
  /** Al-Fatihah, for Bagian Membaca units 17 and 18. */
  fatihah?: FatihahAyah[];
  /** Level Hafalan: every ayah of the lesson's surah. */
  surah?: SurahAyah[];
};

let counter = 0;
const nextId = (kind: string) => `${kind}-${++counter}`;

/** Up to `count` letters for answer options: the answer, look-alikes, then others. */
function optionsFor(answer: string, pool: string[], count: number, distinct?: (l: string) => string): string[] {
  const out = [answer];
  const key = distinct ?? ((l: string) => l);
  const taken = new Set([key(answer)]);
  const add = (l: string) => {
    if (out.length >= count || out.includes(l) || taken.has(key(l))) return;
    out.push(l);
    taken.add(key(l));
  };
  shuffle(getLetter(answer).similar.filter((l) => pool.includes(l))).forEach(add);
  shuffle(pool).forEach(add);
  return shuffle(out);
}

/** Options for a syllable: the answer and close variants, each with a different sound. */
function tokenOptions(answer: string, count: number): string[] {
  const out = [answer];
  for (const v of shuffle(variants(answer))) if (out.length < count && !out.some((o) => latinOf(o) === latinOf(v))) out.push(v);
  return shuffle(out);
}

const nameOf = (l: string) => getLetter(l).name;

function listenOrWord(letter: string, pool: string[], ctx: BuildContext): Exercise {
  if (ctx.hasSound(letter) && Math.random() < 0.6) {
    return { kind: "listen-pick", id: nextId("listen"), letter, options: optionsFor(letter, pool, 4) };
  }
  return wordInitial(letter, pool);
}

function wordInitial(letter: string, pool: string[]): Exercise {
  const word = pick(examplesFor(letter));
  return { kind: "word-initial", id: nextId("word"), letter, word, options: optionsFor(letter, pool, 3) };
}

function soundPick(letter: string, pool: string[]): Exercise {
  return { kind: "sound-pick", id: nextId("sound"), letter, options: optionsFor(letter, pool, 3, latinOf) };
}

function namePick(letter: string, pool: string[]): Exercise {
  return { kind: "name-pick", id: nextId("name"), letter, options: optionsFor(letter, pool, 3, nameOf) };
}

function match(tokens: string[]): Exercise {
  // Matching by sound needs every sound to be different (alif and hamzah are both "a").
  const seen = new Set<string>();
  const unique = shuffle(tokens).filter((l) => !seen.has(latinOf(l)) && seen.add(latinOf(l)));
  return { kind: "match", id: nextId("match"), letters: unique.slice(0, 5) };
}

/** A row read right to left. Distractors: the same row read left to right, and one letter swapped. */
function sequence(pool: string[], focus: string[]): Exercise {
  const size = pool.length >= 3 && Math.random() < 0.5 ? 3 : 2;
  const row = [pick(focus)];
  for (const l of shuffle(pool)) if (row.length < size && !row.includes(l)) row.push(l);
  return rowExercise(shuffle(row), (t) => getLetter(t).similar.find((l) => pool.includes(l) && !row.includes(l)) ?? pool.find((l) => !row.includes(l)));
}

function rowExercise(row: string[], swap: (token: string) => string | undefined): Exercise {
  const options = [row, [...row].reverse()];
  const swapAt = Math.floor(Math.random() * row.length);
  const swapWith = swap(row[swapAt]);
  if (swapWith) options.push(row.map((l, i) => (i === swapAt ? swapWith : l)));
  const key = (o: string[]) => o.map(latinOf).join(" ");
  const unique = options.filter((o, i) => options.findIndex((x) => key(x) === key(o)) === i);
  return { kind: "sequence", id: nextId("seq"), letters: row, options: shuffle(unique) };
}

function speak(letter: string): Exercise {
  return { kind: "speak", id: nextId("speak"), letter };
}

function mixed(focus: string[], pool: string[], ctx: BuildContext, count: number): Exercise[] {
  const makers = [
    (l: string) => listenOrWord(l, pool, ctx),
    (l: string) => soundPick(l, pool),
    (l: string) => namePick(l, pool),
    (l: string) => wordInitial(l, pool),
  ];
  return Array.from({ length: count }, (_, i) => makers[i % makers.length](focus[i % focus.length]));
}

export function buildLesson(lesson: LessonNode, ctx: BuildContext): Exercise[] {
  if (lesson.rules) return buildTajweed(lesson);
  if (lesson.surah) return buildHafalan(lesson, ctx.surah ?? []);
  if (lesson.topic) return buildReading(lesson, ctx);
  const unit = unitOf(lesson.id);
  const focus = shuffle(lesson.letters);
  const pool = lettersUpTo(unit);

  switch (lesson.lessonKind) {
    case "kenalan": {
      // Each new letter: card, then two quick checks using only this unit's letters.
      const out: Exercise[] = [];
      lesson.letters.forEach((letter, i) => {
        const seen = lesson.letters.slice(0, i + 1);
        out.push({ kind: "intro", id: nextId("intro"), letter });
        if (seen.length >= 2) out.push(soundPick(letter, seen));
        out.push(wordInitial(letter, seen.length >= 2 ? seen : lesson.letters));
      });
      out.push(match(lesson.letters), ...mixed(focus, lesson.letters, ctx, 2));
      return out;
    }
    case "dengar":
      return shuffle([...mixed(focus, pool, ctx, 8), ...focus.slice(0, 2).map((l) => listenOrWord(l, pool, ctx))]);
    case "latihan":
      return [
        match(lesson.letters),
        ...shuffle([sequence(pool, focus), sequence(pool, focus), sequence(pool, focus), soundPick(focus[0], pool), wordInitial(focus[1 % focus.length], pool)]),
        match(shuffle(pool).slice(0, 5)),
        sequence(pool, focus),
        ...mixed(focus, pool, ctx, 2),
      ];
    case "ucapkan": {
      const out = focus.slice(0, 5).flatMap((l, i) => [speak(l), i % 2 === 0 ? sequence(pool, [l]) : wordInitial(l, pool)]);
      return [...out, ...mixed(focus, pool, ctx, Math.max(0, 8 - out.length))];
    }
    case "uji":
      return shuffle([...mixed(shuffle(lesson.letters), pool, ctx, 9), sequence(pool, focus), sequence(pool, focus), match(focus)]).slice(0, 12);
    case "bedakan":
    default: {
      // Options come only from inside each group of look-alikes or sound-alikes.
      const out: Exercise[] = [];
      for (const group of shuffle(lesson.groups ?? [])) {
        const l = pick(group);
        out.push(group.length > 1 && Math.random() < 0.5 ? namePick(l, group) : listenOrWord(l, group, ctx));
      }
      return [...out.slice(0, 10), match(shuffle(lesson.letters).slice(0, 5))];
    }
  }
}

// ---- Bagian Membaca ----

const syllableWords = reading.syllableWords as Record<string, WordExample[]>;
const moments = reading.moments as { unit: string; words: WordExample[]; ayah?: { ref: string; text: string; audio: string; words: string[] } }[];
const special = reading.special as Record<"wasla" | "dagger" | "silentLam", WordExample[]>;

const readPick = (t: string): Exercise => ({ kind: "sound-pick", id: nextId("sound"), letter: t, options: tokenOptions(t, 3) });
const findPick = (t: string): Exercise => ({ kind: "find-pick", id: nextId("find"), letter: t, options: tokenOptions(t, 3) });

function tokenRow(topic: MarkUnit): Exercise {
  const row = Array.from({ length: Math.random() < 0.5 ? 3 : 2 }, () => makeToken(topic));
  return rowExercise(row, (t) => pick(variants(t)));
}

/** "Kata ini diawali bunyi apa?" for kasrah and dhammah, when the qari has such a word. */
function wordStart(t: string): Exercise | undefined {
  const words = syllableWords[t];
  return words && { kind: "word-start", id: nextId("start"), letter: t, word: pick(words), options: tokenOptions(t, 3) };
}

function readMoment(text: string, audio: string, ref: string, words: string[]): Exercise {
  return { kind: "read", id: nextId("read"), text, audio, ref, words };
}

/** The Momen Bisa Baca after a unit: a newly readable Qur'an word, and the first whole ayah if there is one. */
function unitMoments(unitId: string): Exercise[] {
  const m = moments.find((x) => x.unit === unitId);
  if (!m) return [];
  const word = m.words[0];
  return [...(word ? [readMoment(word.text, word.audio, word.ref, [word.text])] : []), ...(m.ayah ? [readMoment(m.ayah.text, m.ayah.audio, m.ayah.ref, m.ayah.words)] : [])];
}

function wordListen(word: WordExample, pool: WordExample[]): Exercise {
  const others = shuffle(pool.filter((w) => w.text !== word.text)).filter((w, i, a) => a.findIndex((x) => x.text === w.text) === i);
  return { kind: "word-listen", id: nextId("listen-word"), word, options: shuffle([word, ...others.slice(0, 2)]) };
}

function fatihahWords(ctx: BuildContext, ayahs?: number[]): WordExample[] {
  return (ctx.fatihah ?? []).filter((a) => !ayahs || ayahs.includes(a.number)).flatMap((a) => a.words.map((w, i) => ({ ...w, ref: `1:${a.number}:${i + 1}` })));
}

function buildReading(lesson: LessonNode, ctx: BuildContext): Exercise[] {
  const topic = lesson.topic!;
  const unitId = unitOf(lesson.id).id;

  if (topic === "fatihah") {
    const ayahs = (ctx.fatihah ?? []).filter((a) => lesson.ayahs?.includes(a.number));
    const read = (a: FatihahAyah) => readMoment(a.text, a.audio, `1:${a.number}`, a.words.map((w) => w.text));
    if (lesson.lessonKind === "uji") return ayahs.map(read);
    const pool = fatihahWords(ctx);
    // Hear the words of each ayah, then read the ayah yourself.
    return ayahs.flatMap((a) => [...shuffle(fatihahWords(ctx, [a.number])).slice(0, 3).map((w) => wordListen(w, pool)), read(a)]);
  }

  if (topic === "khusus") {
    const pool = fatihahWords(ctx);
    const examples = [...special.wasla, ...special.dagger, ...special.silentLam];
    switch (lesson.lessonKind) {
      case "kenalan":
        return [
          { kind: "mark-intro", id: nextId("mark"), topic, examples: [], words: [special.wasla[0], special.dagger[0], special.silentLam[0]].filter(Boolean) },
          ...shuffle(examples).slice(0, 6).map((w) => wordListen(w, pool)),
        ];
      case "uji":
        return [...shuffle(examples).slice(0, 5).map((w) => wordListen(w, pool)), ...unitMoments(unitId)];
      default:
        return shuffle(pool).slice(0, 8).map((w) => wordListen(w, pool));
    }
  }

  const focus = shuffle(DRILL_LETTERS);
  const tok = (i: number) => makeToken(topic, focus[i % focus.length]);
  const listenish = (i: number) => wordStart(tok(i)) ?? findPick(tok(i));
  switch (lesson.lessonKind) {
    case "kenalan":
      return [
        { kind: "mark-intro", id: nextId("mark"), topic, examples: Array.from({ length: 4 }, (_, i) => tok(i)), words: [] },
        readPick(tok(0)),
        readPick(tok(1)),
        findPick(tok(2)),
        match(Array.from({ length: 5 }, (_, i) => tok(i + 3))),
        readPick(tok(8)),
        findPick(tok(9)),
        listenish(10),
        tokenRow(topic),
      ];
    case "dengar":
      return Array.from({ length: 10 }, (_, i) => (i % 3 === 0 ? readPick(tok(i)) : i % 3 === 1 ? findPick(tok(i)) : listenish(i)));
    case "latihan":
      return [match(Array.from({ length: 5 }, (_, i) => tok(i))), ...shuffle([tokenRow(topic), tokenRow(topic), tokenRow(topic), readPick(tok(5)), findPick(tok(6))]), tokenRow(topic), match(Array.from({ length: 5 }, (_, i) => tok(i + 7)))];
    case "ucapkan":
      return Array.from({ length: 5 }, (_, i) => [speak(tok(i)), i % 2 ? readPick(tok(i + 5)) : tokenRow(topic)]).flat();
    default:
      return [...shuffle([...Array.from({ length: 8 }, (_, i) => (i % 2 ? readPick(tok(i)) : findPick(tok(i)))), tokenRow(topic), tokenRow(topic)]), ...unitMoments(unitId)];
  }
}

/** Practice from the Huruf tab: weaker letters come up more often, or only `only` (Huruf Bandel). */
export function buildPractice(learned: string[], ctx: BuildContext, only?: string[]): Exercise[] {
  const weighted = only?.length ? only : learned.flatMap((l) => Array(Math.round((1 - (ctx.mastery?.[l] ?? 0)) * 3) + 1).fill(l) as string[]);
  const focus = Array.from({ length: 10 }, () => pick(weighted));
  return [...mixed(focus, learned, ctx, 8), sequence(learned, focus), match(shuffle(learned).slice(0, 5))];
}

/** Latihan Ulang terjadwal: the due letters and syllables first, then the usual practice. */
export function buildReview(due: string[], learned: string[], ctx: BuildContext): Exercise[] {
  const fromDue = due.slice(0, 8).map((key) => (isLetter(key) ? (Math.random() < 0.5 ? soundPick(key, learned) : wordInitial(key, learned)) : Math.random() < 0.5 ? readPick(key) : findPick(key)));
  return [...fromDue, ...buildPractice(learned, ctx).slice(0, Math.max(2, 10 - fromDue.length))];
}

/**
 * Tes Matrikulasi for Level Iqro: letters, then harakat, then the other marks.
 * The player stops at the first stage with two mistakes (ADR-0010).
 */
export function buildPlacement(): Exercise[] {
  const letterIds = allLetters.map((l) => l.id);
  const letterStage = shuffle(letterIds)
    .slice(0, 6)
    .map((l, i) => (i % 2 ? soundPick(l, letterIds) : namePick(l, letterIds)));
  const harakatStage = [...(["sambung", "kasrah", "dhammah", "kasrah", "dhammah"] as const).map((t, i) => (i % 2 ? findPick(makeToken(t)) : readPick(makeToken(t))))];
  const marksStage = (["tanwin", "sukun", "tasydid", "mad"] as const).map((t) => readPick(makeToken(t)));
  return [...letterStage.map((e) => ({ ...e, stage: 0 })), ...harakatStage.map((e) => ({ ...e, stage: 1 })), ...marksStage.map((e) => ({ ...e, stage: 2 }))];
}

/** Where Tes Matrikulasi places the learner, by the first stage not passed. */
export const PLACEMENT_UNITS = ["u1", "u10", "u13", "u17"];

/** Letter ids an exercise tests, for Penguasaan Huruf and Huruf Bandel. Syllable drills test marks, not letters. */
export function exerciseLetters(e: Exercise): string[] {
  switch (e.kind) {
    case "match":
    case "sequence":
      return e.letters.filter(isLetter);
    case "intro":
    case "listen-pick":
    case "word-initial":
    case "sound-pick":
    case "name-pick":
    case "speak":
      return isLetter(e.letter) ? [e.letter] : [];
    default:
      return [];
  }
}

/** Letters and syllables an exercise reviews, for Latihan Ulang terjadwal. */
export function exerciseKeys(e: Exercise): string[] {
  switch (e.kind) {
    case "match":
    case "sequence":
      return e.letters;
    case "listen-pick":
    case "word-initial":
    case "sound-pick":
    case "name-pick":
    case "speak":
    case "find-pick":
    case "word-start":
      return [e.letter];
    default:
      return [];
  }
}
