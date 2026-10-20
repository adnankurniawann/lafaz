import { lettersUpTo, unitOf, type LessonNode } from "./course";
import { examplesFor, getLetter, type WordExample } from "./letters";
import { pick, shuffle } from "./random";

export type Exercise =
  /** New letter card, not graded. */
  | { kind: "intro"; id: string; letter: string }
  /** Hear the letter, pick it. Needs a recording of the letter. */
  | { kind: "listen-pick"; id: string; letter: string; options: string[] }
  /** Hear and see a Qur'an word, pick the letter it starts with. */
  | { kind: "word-initial"; id: string; letter: string; word: WordExample; options: string[] }
  /** See the letter with fathah, pick how it sounds. */
  | { kind: "sound-pick"; id: string; letter: string; options: string[] }
  /** See the letter, pick its name. */
  | { kind: "name-pick"; id: string; letter: string; options: string[] }
  /** Match letters with their sounds. */
  | { kind: "match"; id: string; letters: string[] }
  /** Read a short Iqro-style row such as بَ تَ ثَ, right to left. */
  | { kind: "sequence"; id: string; letters: string[]; options: string[][] }
  /** Record yourself and compare with the example. Self-assessed. */
  | { kind: "speak"; id: string; letter: string };

export type ExerciseKind = Exercise["kind"];

/** Wrong answers on these cost a heart. Matching and speaking never do. */
export const GRADED: ExerciseKind[] = ["listen-pick", "word-initial", "sound-pick", "name-pick", "sequence"];

export type BuildContext = {
  /** Letters that have a recorded sound (from files or the studio). */
  hasSound: (letter: string) => boolean;
  /** For practice: weaker letters come up more often. */
  mastery?: Record<string, number>;
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

const latinOf = (l: string) => getLetter(l).latin;
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

function match(letters: string[]): Exercise {
  // Matching by sound needs every sound to be different (alif and hamzah are both "a").
  const seen = new Set<string>();
  const unique = shuffle(letters).filter((l) => !seen.has(latinOf(l)) && seen.add(latinOf(l)));
  return { kind: "match", id: nextId("match"), letters: unique.slice(0, 5) };
}

/** A row read right to left. Distractors: the same row read left to right, and one letter swapped. */
function sequence(pool: string[], focus: string[]): Exercise {
  const size = pool.length >= 3 && Math.random() < 0.5 ? 3 : 2;
  const row = [pick(focus)];
  for (const l of shuffle(pool)) if (row.length < size && !row.includes(l)) row.push(l);
  const rowList = shuffle(row);

  const options = [rowList, [...rowList].reverse()];
  const swapAt = Math.floor(Math.random() * rowList.length);
  const swapWith = getLetter(rowList[swapAt]).similar.find((l) => pool.includes(l) && !rowList.includes(l)) ?? pool.find((l) => !rowList.includes(l));
  if (swapWith) options.push(rowList.map((l, i) => (i === swapAt ? swapWith : l)));

  const key = (o: string[]) => o.map(latinOf).join(" ");
  const unique = options.filter((o, i) => options.findIndex((x) => key(x) === key(o)) === i);
  return { kind: "sequence", id: nextId("seq"), letters: rowList, options: shuffle(unique) };
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
    case "bedakan": {
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

/** Practice from the Huruf tab: weaker letters come up more often. No hearts lost. */
export function buildPractice(learned: string[], ctx: BuildContext): Exercise[] {
  const weighted = learned.flatMap((l) => Array(Math.round((1 - (ctx.mastery?.[l] ?? 0)) * 3) + 1).fill(l) as string[]);
  const focus = Array.from({ length: 10 }, () => pick(weighted));
  return [...mixed(focus, learned, ctx, 8), sequence(learned, focus), match(shuffle(learned).slice(0, 5))];
}

/** The letters an exercise tests, for the mastery bars. */
export function exerciseLetters(e: Exercise): string[] {
  switch (e.kind) {
    case "match":
    case "sequence":
      return e.letters;
    default:
      return [e.letter];
  }
}
