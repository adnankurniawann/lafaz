import { seededRandom } from "./random";

export type QuestKind = "xp" | "lessons" | "combo" | "perfect" | "record" | "listen";

export type Quest = {
  id: string;
  kind: QuestKind;
  target: number;
  progress: number;
  /** XP given when claimed. */
  xp: number;
  claimed: boolean;
};

const POOL: { kind: QuestKind; targets: number[]; xp: number }[] = [
  { kind: "lessons", targets: [2, 3], xp: 15 },
  { kind: "combo", targets: [5, 10], xp: 15 },
  { kind: "perfect", targets: [1], xp: 20 },
  { kind: "record", targets: [3, 5], xp: 15 },
  { kind: "listen", targets: [10, 20], xp: 10 },
];

export function questTitle(q: Pick<Quest, "kind" | "target">) {
  switch (q.kind) {
    case "xp":
      return `Dapatkan ${q.target} XP`;
    case "lessons":
      return `Selesaikan ${q.target} lesson`;
    case "combo":
      return `Jawab ${q.target} soal benar berturut-turut`;
    case "perfect":
      return "Selesaikan 1 lesson tanpa salah";
    case "record":
      return `Rekam suaramu ${q.target} kali`;
    case "listen":
      return `Dengarkan ${q.target} audio`;
  }
}

export const QUEST_ICON: Record<QuestKind, string> = {
  xp: "⚡",
  lessons: "📖",
  combo: "🔥",
  perfect: "🎯",
  record: "🎙️",
  listen: "🎧",
};

/** Three quests per day: always an XP quest, plus two picked by the date. */
export function questsForDay(day: string, dailyGoal: number): Quest[] {
  const rand = seededRandom(day);
  const pool = [...POOL];
  const picked = [];
  for (let i = 0; i < 2; i++) picked.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  return [
    { id: `${day}-xp`, kind: "xp", target: Math.max(20, dailyGoal), progress: 0, xp: 15, claimed: false },
    ...picked.map((p) => ({
      id: `${day}-${p.kind}`,
      kind: p.kind,
      target: p.targets[Math.floor(rand() * p.targets.length)],
      progress: 0,
      xp: p.xp,
      claimed: false,
    })),
  ];
}
