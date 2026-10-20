export type BadgeId = "kenal-huruf" | "lancar-harakat" | "ayat-pertama" | "bisa-fatihah" | "penakluk-bandel" | "streak-7" | "juara-tantangan";

export const BADGES: { id: BadgeId; icon: string; title: string; how: string }[] = [
  { id: "kenal-huruf", icon: "🔤", title: "Kenal semua huruf", how: "Kuasai 29 huruf hijaiyah" },
  { id: "lancar-harakat", icon: "✏️", title: "Lancar harakat", how: "Selesaikan unit kasrah sampai tasydid" },
  { id: "ayat-pertama", icon: "🌙", title: "Ayat pertama", how: "Baca satu ayat utuh sendiri" },
  { id: "bisa-fatihah", icon: "📖", title: "Bisa baca Al-Fatihah", how: "Baca ketujuh ayat Al-Fatihah sendiri" },
  { id: "penakluk-bandel", icon: "🛡️", title: "Penakluk huruf bandel", how: "Kosongkan koleksi Huruf Bandel" },
  { id: "streak-7", icon: "🔥", title: "Streak 7 hari", how: "Belajar 7 hari berturut-turut" },
  { id: "juara-tantangan", icon: "⚡", title: "Juara tantangan", how: "Selesaikan Mode Tantangan pertamamu" },
];

export function getBadge(id: BadgeId) {
  return BADGES.find((b) => b.id === id)!;
}
