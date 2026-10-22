// The learning path: sections, units and the nodes on each unit's path.

import quranIndex from "../../data/quran/index.json";
import type { MarkUnit } from "./syllables";
import { getLessonRule, ruleGroups, type LessonRuleId } from "./tajweed-lessons";

/** Level Iqro, then Level Tajwid and Level Hafalan side by side (ADR-0010). */
export type LevelId = "iqro" | "tajwid" | "hafalan";

export const LEVELS: { id: LevelId; title: string; description: string }[] = [
  { id: "iqro", title: "Iqro", description: "Dari huruf pertama sampai bisa membaca Al-Fatihah" },
  { id: "tajwid", title: "Tajwid", description: "Hukum bacaan, belajar lewat mendengar Potongan Ayat" },
  { id: "hafalan", title: "Hafalan", description: "Al-Fatihah lalu juz amma, ayat demi ayat lewat tikrar" },
];

/** Units 11 to 15 cover the marks; finishing them earns Lancar harakat. */
export const HARAKAT_UNITS = ["u11", "u12", "u13", "u14", "u15"];

export type LessonKind =
  | "kenalan"
  | "dengar"
  | "latihan"
  | "ucapkan"
  | "uji"
  | "bedakan"
  // Level Tajwid (FR-16); "ucapkan" and "uji" are shared.
  | "kenali"
  | "bandingkan"
  | "tebak"
  | "tebak-suara"
  | "cari"
  // Level Hafalan (FR-17); "uji" is Tes hafalan.
  | "hafal";

/** What a Bagian Membaca unit teaches: a mark drill, the special signs, or Al-Fatihah itself. */
export type ReadingTopic = MarkUnit | "khusus" | "fatihah";

export type LessonNode = {
  kind: "lesson";
  id: string;
  title: string;
  lessonKind: LessonKind;
  /** Letters this lesson is about. Empty in Bagian Membaca. */
  letters: string[];
  /** For "bedakan" lessons: groups of easily confused letters. */
  groups?: string[][];
  /** Bagian Membaca: the topic of the lesson. */
  topic?: ReadingTopic;
  /** Al-Fatihah and Level Hafalan lessons: the ayah numbers to read. */
  ayahs?: number[];
  /** Level Tajwid: the rules practised, the new ones first. */
  rules?: LessonRuleId[];
  /** Level Hafalan: the surah memorized. */
  surah?: number;
};

export type ChestNode = { kind: "chest"; id: string; xp: number };

export type PathNode = LessonNode | ChestNode;

export type Unit = {
  id: string;
  number: number;
  title: string;
  description: string;
  color: UnitColor;
  letters: string[];
  /** Bagian Membaca units only. */
  topic?: ReadingTopic;
  /** Level Tajwid units only: the rules taught. */
  rules?: LessonRuleId[];
  /** Level Hafalan units only: the surah memorized. */
  surah?: number;
  nodes: PathNode[];
};

export type Section = { id: string; level: LevelId; number: number; title: string; units: Unit[] };

export type UnitColor = "green" | "purple" | "blue" | "orange" | "pink" | "teal" | "red" | "gold";

const LETTER_UNITS: { letters: string[]; title: string }[] = [
  { letters: ["alif", "ba", "ta", "tsa"], title: "Alif, Ba, Ta, Tsa" },
  { letters: ["jim", "hha", "kha"], title: "Jim, Ḥa, Kho" },
  { letters: ["dal", "dzal", "ra", "zai"], title: "Dal, Dzal, Ro, Zai" },
  { letters: ["sin", "syin", "shod", "dhod"], title: "Sin, Syin, Shod, Dhod" },
  { letters: ["tho", "zho", "ain", "ghoin"], title: "Tho, Zho, 'Ain, Ghoin" },
  { letters: ["fa", "qof", "kaf", "lam"], title: "Fa, Qof, Kaf, Lam" },
  { letters: ["mim", "nun", "wau", "ha"], title: "Mim, Nun, Wau, Ha" },
  { letters: ["hamzah", "ya"], title: "Hamzah, Ya" },
];

// Letters that learners often mix up, by shape or by sound.
export const SIMILAR_GROUPS: { title: string; letters: string[] }[] = [
  { title: "Bentuk mirip", letters: ["ba", "ta", "tsa"] },
  { title: "Bentuk mirip", letters: ["jim", "hha", "kha"] },
  { title: "Bentuk mirip", letters: ["dal", "dzal"] },
  { title: "Bentuk mirip", letters: ["ra", "zai"] },
  { title: "Bentuk mirip", letters: ["sin", "syin"] },
  { title: "Bentuk mirip", letters: ["shod", "dhod"] },
  { title: "Bentuk mirip", letters: ["tho", "zho"] },
  { title: "Bentuk mirip", letters: ["ain", "ghoin"] },
  { title: "Bentuk mirip", letters: ["fa", "qof"] },
  { title: "Bunyi mirip", letters: ["hha", "ha"] },
  { title: "Bunyi mirip", letters: ["ain", "hamzah"] },
  { title: "Bunyi mirip", letters: ["sin", "shod", "tsa"] },
  { title: "Bunyi mirip", letters: ["dzal", "zai", "zho"] },
  { title: "Bunyi mirip", letters: ["ta", "tho"] },
  { title: "Bunyi mirip", letters: ["kaf", "qof"] },
  { title: "Bunyi mirip", letters: ["dal", "dhod"] },
];

const COLORS: UnitColor[] = ["green", "purple", "blue", "orange", "pink", "teal", "red", "gold", "purple"];

function letterUnit(index: number): Unit {
  const { letters, title } = LETTER_UNITS[index];
  const n = index + 1;
  const id = `u${n}`;
  return {
    id,
    number: n,
    title,
    description: "Kenali bunyi dan bentuk huruf dengan fathah",
    color: COLORS[index],
    letters,
    nodes: [
      { kind: "lesson", id: `${id}-1`, title: "Kenalan", lessonKind: "kenalan", letters },
      { kind: "lesson", id: `${id}-2`, title: "Dengar dan pilih", lessonKind: "dengar", letters },
      { kind: "chest", id: `${id}-peti`, xp: 10 + index },
      { kind: "lesson", id: `${id}-3`, title: "Pasangkan dan baca", lessonKind: "latihan", letters },
      { kind: "lesson", id: `${id}-4`, title: "Ucapkan", lessonKind: "ucapkan", letters },
      { kind: "lesson", id: `${id}-5`, title: "Uji unit", lessonKind: "uji", letters },
    ],
  };
}

const shapeGroups = SIMILAR_GROUPS.filter((g) => g.title === "Bentuk mirip").map((g) => g.letters);
const soundGroups = SIMILAR_GROUPS.filter((g) => g.title === "Bunyi mirip").map((g) => g.letters);
const allLetters = LETTER_UNITS.flatMap((u) => u.letters);

const similarUnit: Unit = {
  id: "u9",
  number: 9,
  title: "Huruf yang mirip",
  description: "Bedakan huruf yang bentuk atau bunyinya hampir sama",
  color: COLORS[8],
  letters: allLetters,
  nodes: [
    { kind: "lesson", id: "u9-1", title: "Bentuk mirip", lessonKind: "bedakan", letters: shapeGroups.flat(), groups: shapeGroups },
    { kind: "lesson", id: "u9-2", title: "Bunyi mirip", lessonKind: "bedakan", letters: soundGroups.flat(), groups: soundGroups },
    { kind: "chest", id: "u9-peti", xp: 20 },
    { kind: "lesson", id: "u9-3", title: "Ucapkan", lessonKind: "ucapkan", letters: [...new Set(soundGroups.flat())] },
    { kind: "lesson", id: "u9-4", title: "Uji akhir huruf", lessonKind: "uji", letters: allLetters },
  ],
};

// Bagian Membaca follows Iqro: joined letters first, since every Qur'an word is written joined.
const MARK_UNITS: { topic: MarkUnit; title: string; description: string }[] = [
  { topic: "sambung", title: "Huruf sambung", description: "Baca huruf yang ditulis bersambung" },
  { topic: "kasrah", title: "Kasrah", description: "Huruf dengan bunyi i" },
  { topic: "dhammah", title: "Dhammah", description: "Huruf dengan bunyi u" },
  { topic: "tanwin", title: "Tanwin", description: "Bunyi an, in, un" },
  { topic: "sukun", title: "Sukun", description: "Huruf mati yang menempel ke huruf sebelumnya" },
  { topic: "tasydid", title: "Tasydid", description: "Huruf yang dibaca dobel" },
  { topic: "mad", title: "Mad", description: "Bacaan panjang dua ketukan" },
];

function markUnit(index: number): Unit {
  const { topic, title, description } = MARK_UNITS[index];
  const n = 10 + index;
  const id = `u${n}`;
  const lesson = (k: number, title: string, lessonKind: LessonKind): LessonNode => ({ kind: "lesson", id: `${id}-${k}`, title, lessonKind, letters: [], topic });
  return {
    id,
    number: n,
    title,
    description,
    color: COLORS[(n - 1) % COLORS.length],
    letters: [],
    topic,
    nodes: [
      lesson(1, "Kenalan", "kenalan"),
      lesson(2, "Baca dan pilih", "dengar"),
      { kind: "chest", id: `${id}-peti`, xp: 15 },
      lesson(3, "Rangkaian", "latihan"),
      lesson(4, "Ucapkan", "ucapkan"),
      lesson(5, "Uji unit", "uji"),
    ],
  };
}

const specialUnit: Unit = {
  id: "u17",
  number: 17,
  title: "Tanda khusus",
  description: "Alif washal, alif kecil, dan lam yang tidak dibaca",
  color: "teal",
  letters: [],
  topic: "khusus",
  nodes: [
    { kind: "lesson", id: "u17-1", title: "Kenalan tanda", lessonKind: "kenalan", letters: [], topic: "khusus" },
    { kind: "lesson", id: "u17-2", title: "Dengar dan pilih kata", lessonKind: "dengar", letters: [], topic: "khusus" },
    { kind: "lesson", id: "u17-3", title: "Uji unit", lessonKind: "uji", letters: [], topic: "khusus" },
  ],
};

const fatihahUnit: Unit = {
  id: "u18",
  number: 18,
  title: "Al-Fatihah",
  description: "Baca Al-Fatihah sendiri, ayat demi ayat",
  color: "gold",
  letters: [],
  topic: "fatihah",
  nodes: [
    { kind: "lesson", id: "u18-1", title: "Ayat 1 dan 2", lessonKind: "latihan", letters: [], topic: "fatihah", ayahs: [1, 2] },
    { kind: "lesson", id: "u18-2", title: "Ayat 3 dan 4", lessonKind: "latihan", letters: [], topic: "fatihah", ayahs: [3, 4] },
    { kind: "chest", id: "u18-peti", xp: 20 },
    { kind: "lesson", id: "u18-3", title: "Ayat 5 sampai 7", lessonKind: "latihan", letters: [], topic: "fatihah", ayahs: [5, 6, 7] },
    { kind: "lesson", id: "u18-4", title: "Baca Al-Fatihah", lessonKind: "uji", letters: [], topic: "fatihah", ayahs: [1, 2, 3, 4, 5, 6, 7] },
  ],
};

// Level Tajwid: one unit per rule of nun mati and tanwin, then a review that
// mixes them. Mim mati, qalqalah and mad have few examples in juz 30, so each
// is a single unit that teaches its rules together.
const TAJWID_COLORS: UnitColor[] = ["teal", "blue", "green", "orange", "purple", "red", "pink", "gold", "blue"];

function tajweedUnit(n: number, title: string, description: string, rules: LessonRuleId[], { guess = true, review = false } = {}): Unit {
  const id = `t${n}`;
  let k = 0;
  const lesson = (title: string, lessonKind: LessonKind): LessonNode => ({ kind: "lesson", id: `${id}-${++k}`, title, lessonKind, letters: [], rules });
  const nodes: PathNode[] = review
    ? [lesson("Tebak dari suara", "tebak-suara"), lesson("Dengar dan bandingkan", "bandingkan")]
    : [lesson("Kenali bunyinya", "kenali"), lesson("Dengar dan bandingkan", "bandingkan")];
  nodes.push({ kind: "chest", id: `${id}-peti`, xp: 15 });
  // A unit with one new rule and nothing before it has nothing to tell apart yet.
  if (guess) nodes.push(lesson("Tebak hukumnya", "tebak"));
  nodes.push(lesson("Cari di ayat", "cari"), lesson("Ucapkan potongan", "ucapkan"), lesson("Uji unit", "uji"));
  return { id, number: n, title, description, color: TAJWID_COLORS[(n - 1) % TAJWID_COLORS.length], letters: [], rules, nodes };
}

const group = (id: string) => ruleGroups.find((g) => g.id === id)!;
const nun = group("nun-mati");

const tajweedSections: Section[] = [
  {
    id: nun.id,
    level: "tajwid",
    number: 1,
    title: nun.title,
    units: [
      ...nun.rules.map((r, i) => tajweedUnit(i + 1, getLessonRule(r).name, getLessonRule(r).summary, [r], { guess: i > 0 })),
      tajweedUnit(nun.rules.length + 1, "Ulasan nun mati dan tanwin", "Bedakan kelima hukum dari suaranya", nun.rules, { review: true }),
    ],
  },
  ...["mim-mati", "qalqalah", "mad"].map((id, i): Section => {
    const g = group(id);
    return { id, level: "tajwid", number: i + 2, title: g.title, units: [tajweedUnit(nun.rules.length + 2 + i, g.title, g.intro, g.rules)] };
  }),
];

// Level Hafalan: Al-Fatihah, then juz amma from An-Nas back to An-Naba' (FR-17).
// One unit per surah: a tikrar lesson per few ayat, then Tes hafalan.
export const HAFALAN_SURAHS = [1, ...Array.from({ length: 37 }, (_, i) => 114 - i)];

/** Ayat 1 to n in groups of 3; a lone last ayah joins the group before it. */
export function ayahGroups(n: number): number[][] {
  const groups: number[][] = [];
  for (let a = 1; a <= n; a += 3) groups.push(Array.from({ length: Math.min(3, n - a + 1) }, (_, i) => a + i));
  if (groups.length > 1 && groups.at(-1)!.length === 1) groups.at(-2)!.push(...groups.pop()!);
  return groups;
}

const HAFALAN_COLORS: UnitColor[] = ["gold", "green", "blue", "purple", "teal", "orange", "pink", "red"];

function hafalanUnit(surah: number, n: number): Unit {
  const { englishName, ayahCount } = quranIndex.surahs.find((s) => s.number === surah)!;
  const id = `h${surah}`;
  const groups = ayahGroups(ayahCount);
  const title = (g: number[]) => (g.length === 1 ? `Ayat ${g[0]}` : `Ayat ${g[0]} sampai ${g.at(-1)}`);
  const all = Array.from({ length: ayahCount }, (_, i) => i + 1);
  const nodes: PathNode[] = groups.map((g, i) => ({ kind: "lesson", id: `${id}-${i + 1}`, title: title(g), lessonKind: "hafal", letters: [], surah, ayahs: g }));
  if (groups.length > 1) nodes.push({ kind: "chest", id: `${id}-peti`, xp: 15 });
  nodes.push({ kind: "lesson", id: `${id}-tes`, title: "Tes hafalan", lessonKind: "uji", letters: [], surah, ayahs: all });
  return { id, number: n, title: englishName, description: `${ayahCount} ayat, dihafal lewat tikrar`, color: HAFALAN_COLORS[(n - 1) % HAFALAN_COLORS.length], letters: [], surah, nodes };
}

const hafalanUnits = HAFALAN_SURAHS.map((s, i) => hafalanUnit(s, i + 1));
const hafalanSections: Section[] = [hafalanUnits.slice(0, 1), hafalanUnits.slice(1, 11), hafalanUnits.slice(11, 21), hafalanUnits.slice(21, 31), hafalanUnits.slice(31)].map((list, i) => ({
  id: `hafalan-${i + 1}`,
  level: "hafalan",
  number: i + 1,
  title: list.length === 1 ? list[0].title : `${list[0].title} sampai ${list.at(-1)!.title}`,
  units: list,
}));

export const sections: Section[] = [
  {
    id: "huruf",
    level: "iqro",
    number: 1,
    title: "Huruf Hijaiyah",
    units: [...LETTER_UNITS.map((_, i) => letterUnit(i)), similarUnit],
  },
  {
    id: "membaca",
    level: "iqro",
    number: 2,
    title: "Membaca",
    units: [...MARK_UNITS.map((_, i) => markUnit(i)), specialUnit, fatihahUnit],
  },
  ...tajweedSections,
  ...hafalanSections,
];

export const units = sections.flatMap((s) => s.units);
export const pathNodes = units.flatMap((u) => u.nodes);
export const lessonNodes = pathNodes.filter((n): n is LessonNode => n.kind === "lesson");

export const PRACTICE_ID = "latihan";
/** Practice that only drills the Huruf Bandel. */
export const TROUBLE_ID = "taklukkan";
/** Tes Matrikulasi for Level Iqro (ADR-0010). */
export const PLACEMENT_ID = "matrikulasi";
/** Tes naik Level to Tajwid and Hafalan: the final test of Level Iqro, reading Al-Fatihah (ADR-0010). */
export const LEVEL_TEST_ID = "naik-tajwid";
export const levelTest = (): LessonNode => unitTest(fatihahUnit);
const CHALLENGE_PREFIX = "tantangan-";

export const challengeId = (unit: Unit) => `${CHALLENGE_PREFIX}${unit.id}`;

/** The unit of a Mode Tantangan lesson id, if it is one. */
export function challengeUnit(id: string): Unit | undefined {
  return id.startsWith(CHALLENGE_PREFIX) ? units.find((u) => u.id === id.slice(CHALLENGE_PREFIX.length)) : undefined;
}

/** Mode Tantangan opens once every lesson in the unit is done. */
export function unitDone(unit: Unit, done: Record<string, unknown>) {
  return unit.nodes.every((n) => n.kind === "chest" || done[n.id]);
}

/** The unit test, which Mode Tantangan reuses as its question set. */
export function unitTest(unit: Unit): LessonNode {
  return unit.nodes.filter((n): n is LessonNode => n.kind === "lesson").at(-1)!;
}

export function getLesson(id: string): LessonNode | undefined {
  return lessonNodes.find((l) => l.id === id);
}

export function unitOf(nodeId: string): Unit {
  return units.find((u) => u.nodes.some((n) => n.id === nodeId))!;
}

export function levelOf(unit: Unit): LevelId {
  return sections.find((s) => s.units.includes(unit))!.level;
}

/** Rules taught in Level Tajwid up to and including the given unit. */
export function rulesUpTo(unit: Unit): LessonRuleId[] {
  const index = units.indexOf(unit);
  return [...new Set(units.slice(0, index + 1).flatMap((u) => u.rules ?? []))];
}

/** Letters introduced up to and including the given unit. */
export function lettersUpTo(unit: Unit): string[] {
  const index = units.indexOf(unit);
  return [...new Set(units.slice(0, index + 1).flatMap((u) => u.letters))];
}

/** Letters the learner has met so far, based on completed lessons. */
export function learnedLetters(done: Record<string, unknown>): string[] {
  const out = new Set<string>();
  for (const lesson of lessonNodes) if (done[lesson.id]) lesson.letters.forEach((l) => out.add(l));
  return [...out];
}

export type NodeState = "done" | "current" | "locked";

/** A node unlocks once every lesson before it in its Level is done. Chests never block. */
export function nodeStates(done: Record<string, unknown>, openedChests: string[]): Map<string, NodeState> {
  const states = new Map<string, NodeState>();
  let blocked = false;
  // Every Level starts its own path; whether a Level is open is kept in the store.
  const levelStarts = new Set(LEVELS.map((l) => sections.find((s) => s.level === l.id)!.units[0].nodes[0].id));
  for (const node of pathNodes) {
    if (levelStarts.has(node.id)) blocked = false;
    if (node.kind === "chest") {
      states.set(node.id, openedChests.includes(node.id) ? "done" : blocked ? "locked" : "current");
      continue;
    }
    if (done[node.id]) states.set(node.id, "done");
    else if (!blocked) {
      states.set(node.id, "current");
      blocked = true;
    } else states.set(node.id, "locked");
  }
  return states;
}

export function currentLessonId(done: Record<string, unknown>, level: LevelId = "iqro"): string | undefined {
  return lessonNodes.find((l) => !done[l.id] && levelOf(unitOf(l.id)) === level)?.id;
}
