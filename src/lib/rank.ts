// Rank: a personal title from total XP. It never goes down (ADR-0010).

export const RANKS = [
  { name: "Percikan", xp: 0 },
  { name: "Nyala", xp: 100 },
  { name: "Pelita", xp: 300 },
  { name: "Lentera", xp: 700 },
  { name: "Suar", xp: 1500 },
  { name: "Cahaya", xp: 3000 },
];

export function rankFor(totalXp: number) {
  const index = RANKS.findLastIndex((r) => totalXp >= r.xp);
  return { ...RANKS[index], index, next: RANKS[index + 1] };
}
