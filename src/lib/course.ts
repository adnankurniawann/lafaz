// The learning path: sections, units and the nodes on each unit's path.

export type LessonKind = "kenalan" | "dengar" | "latihan" | "ucapkan" | "uji" | "bedakan";

export type LessonNode = {
  kind: "lesson";
  id: string;
  title: string;
  lessonKind: LessonKind;
  /** Letters this lesson is about. */
  letters: string[];
  /** For "bedakan" lessons: groups of easily confused letters. */
  groups?: string[][];
};

export type ChestNode = { kind: "chest"; id: string; gems: number };

export type PathNode = LessonNode | ChestNode;

export type Unit = {
  id: string;
  number: number;
  title: string;
  description: string;
  color: UnitColor;
  letters: string[];
  nodes: PathNode[];
};

export type Section = { id: string; number: number; title: string; units: Unit[] };

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
      { kind: "chest", id: `${id}-peti`, gems: 15 + index * 2 },
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
    { kind: "chest", id: "u9-peti", gems: 40 },
    { kind: "lesson", id: "u9-3", title: "Ucapkan", lessonKind: "ucapkan", letters: [...new Set(soundGroups.flat())] },
    { kind: "lesson", id: "u9-4", title: "Uji akhir huruf", lessonKind: "uji", letters: allLetters },
  ],
};

export const sections: Section[] = [
  {
    id: "huruf",
    number: 1,
    title: "Huruf Hijaiyah",
    units: [...LETTER_UNITS.map((_, i) => letterUnit(i)), similarUnit],
  },
];

export const units = sections.flatMap((s) => s.units);
export const pathNodes = units.flatMap((u) => u.nodes);
export const lessonNodes = pathNodes.filter((n): n is LessonNode => n.kind === "lesson");

export const PRACTICE_ID = "latihan";

export function getLesson(id: string): LessonNode | undefined {
  return lessonNodes.find((l) => l.id === id);
}

export function unitOf(nodeId: string): Unit {
  return units.find((u) => u.nodes.some((n) => n.id === nodeId))!;
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

/** A node unlocks once every lesson before it is done. Chests never block. */
export function nodeStates(done: Record<string, unknown>, openedChests: string[]): Map<string, NodeState> {
  const states = new Map<string, NodeState>();
  let blocked = false;
  for (const node of pathNodes) {
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

export function currentLessonId(done: Record<string, unknown>): string | undefined {
  return lessonNodes.find((l) => !done[l.id])?.id;
}
