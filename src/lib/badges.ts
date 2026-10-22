export type BadgeId =
  | "kenal-huruf"
  | "lancar-harakat"
  | "ayat-pertama"
  | "bisa-fatihah"
  | "penakluk-bandel"
  | "ahli-nun"
  | "ahli-mim"
  | "ahli-qalqalah"
  | "ahli-mad"
  | "telinga-tajwid"
  | "hafal-fatihah"
  | "tiga-qul"
  | "hafal-10"
  | "hafal-20"
  | "juz-amma"
  | "streak-7"
  | "juara-tantangan";

export const BADGES: { id: BadgeId; icon: string; title: string; how: string }[] = [
  { id: "kenal-huruf", icon: "🔤", title: "Kenal semua huruf", how: "Kuasai 29 huruf hijaiyah" },
  { id: "lancar-harakat", icon: "✏️", title: "Lancar harakat", how: "Selesaikan unit kasrah sampai tasydid" },
  { id: "ayat-pertama", icon: "🌙", title: "Ayat pertama", how: "Baca satu ayat utuh sendiri" },
  { id: "bisa-fatihah", icon: "📖", title: "Bisa baca Al-Fatihah", how: "Baca ketujuh ayat Al-Fatihah sendiri" },
  { id: "penakluk-bandel", icon: "🛡️", title: "Penakluk huruf bandel", how: "Kosongkan koleksi Huruf Bandel" },
  { id: "ahli-nun", icon: "🎧", title: "Ahli nun mati & tanwin", how: "Selesaikan semua unit nun mati dan tanwin" },
  { id: "ahli-mim", icon: "👄", title: "Ahli mim mati", how: "Selesaikan unit mim mati" },
  { id: "ahli-qalqalah", icon: "🏀", title: "Ahli qalqalah", how: "Selesaikan unit qalqalah" },
  { id: "ahli-mad", icon: "〰️", title: "Ahli mad", how: "Selesaikan unit mad" },
  { id: "telinga-tajwid", icon: "👂", title: "Telinga tajwid", how: "Tebak 50 hukum dengan benar hanya dari suara" },
  { id: "hafal-fatihah", icon: "🌱", title: "Hafal Al-Fatihah", how: "Lulus Tes hafalan Al-Fatihah" },
  { id: "tiga-qul", icon: "🌿", title: "Tiga Qul", how: "Hafal Al-Ikhlas, Al-Falaq, dan An-Nas" },
  { id: "hafal-10", icon: "🌳", title: "10 surah", how: "Hafal 10 surah" },
  { id: "hafal-20", icon: "🏔️", title: "20 surah", how: "Hafal 20 surah" },
  { id: "juz-amma", icon: "👑", title: "Juz amma lengkap", how: "Hafal ke-37 surah juz amma" },
  { id: "streak-7", icon: "🔥", title: "Streak 7 hari", how: "Belajar 7 hari berturut-turut" },
  { id: "juara-tantangan", icon: "⚡", title: "Juara tantangan", how: "Selesaikan Mode Tantangan pertamamu" },
];

export function getBadge(id: BadgeId) {
  return BADGES.find((b) => b.id === id)!;
}
