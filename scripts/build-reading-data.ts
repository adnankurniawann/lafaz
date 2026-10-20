// Picks Qur'an words for Bagian Membaca from the fetched data:
// - qari words that start with a letter + kasrah or dhammah, as sound examples
// - for each unit, words (and the first ayah) a learner can read after it
// - Al-Fatihah words that show each special sign of unit 17
// Run after fetch-quran with: npm run build-reading-data
//
// Nothing is typed by hand: a word's reading level comes from its marks.

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import hijaiyah from "../data/content/hijaiyah.json";

const DATA_DIR = path.join(process.cwd(), "data/quran");
const OUT_FILE = path.join(process.cwd(), "data/content/reading.json");
const FAMILIAR_SURAHS = [1, 112, 113, 114, 108, 103, 110, 111, 109, 107, 106, 105];

// Unit order of Bagian Membaca. A word's level is the first unit after which it can be read.
export const LEVELS = ["u10", "u11", "u12", "u13", "u14", "u15", "u16", "u17"] as const;
const [SAMBUNG, KASRAH, DHAMMAH, TANWIN, SUKUN, TASYDID, MAD, KHUSUS] = LEVELS.map((_, i) => i);

const M = {
  fathah: "َ",
  kasrah: "ِ",
  dhammah: "ُ",
  fathatain: "ً",
  kasratain: "ٍ",
  dhammatain: "ٌ",
  sukun: "ْ",
  shadda: "ّ",
  dagger: "ٰ",
  wasla: "ٱ",
  tatweel: "ـ",
};
// Pause signs sit on words but do not change how the word is read.
const WAQF = /[ۖ-ۜ]/g;

const letterChars = new Map<string, string>([
  ...hijaiyah.letters.map((l) => [l.char, l.id] as [string, string]),
  ...Object.entries(hijaiyah.variants as Record<string, string>),
]);

type Cluster = { base: string; marks: string };

function clusters(text: string): Cluster[] {
  const out: Cluster[] = [];
  for (const ch of text.replace(WAQF, "").trim()) {
    if (/\p{M}/u.test(ch) && out.length) out[out.length - 1].marks += ch;
    else out.push({ base: ch, marks: "" });
  }
  return out;
}

/** Index into LEVELS of the first unit that covers every sign in the word, or Infinity. */
export function wordLevel(text: string): number {
  const cs = clusters(text);
  let level = SAMBUNG;
  let prev = "";
  for (let i = 0; i < cs.length; i++) {
    const { base, marks } = cs[i];
    const need = (n: number) => (level = Math.max(level, n));
    if (base === M.wasla || marks.includes(M.dagger)) {
      need(KHUSUS);
      prev = M.fathah;
      continue;
    }
    if (!letterChars.has(base) || /[^ً-ْ]/.test(marks)) return Infinity;
    const vowel = [M.fathah, M.kasrah, M.dhammah].find((v) => marks.includes(v)) ?? "";
    if (marks.includes(M.shadda)) need(TASYDID);
    if ([M.fathatain, M.kasratain, M.dhammatain].some((t) => marks.includes(t))) need(TANWIN);
    else if (marks.includes(M.sukun)) need(SUKUN);
    else if (vowel === M.kasrah) need(KASRAH);
    else if (vowel === M.dhammah) need(DHAMMAH);
    else if (!vowel) {
      const mad = (base === "ا" && prev === M.fathah) || ((base === "ي" || base === "ى") && prev === M.kasrah) || (base === "و" && prev === M.dhammah);
      const tanwinAlif = base === "ا" && prev === M.fathatain;
      const silentLam = base === "ل" && cs[i + 1]?.marks.includes(M.shadda) && cs[i - 1]?.base === M.wasla;
      if (mad) need(MAD);
      else if (silentLam) need(KHUSUS);
      else if (!tanwinAlif) return Infinity;
    }
    prev = marks.includes(M.fathatain) ? M.fathatain : vowel;
  }
  return level;
}

type Word = { text: string; audio: string; ref: string };
type Ayah = { surah: number; number: number; text: string; audio: string; words: { position: number; text: string; audio: string }[] };

const familiarity = (surah: number) => {
  const i = FAMILIAR_SURAHS.indexOf(surah);
  return i === -1 ? 99 : i;
};
const letterCount = (text: string) => clusters(text).filter((c) => letterChars.has(c.base)).length;

async function main() {
  const surahs = new Map<number, Ayah[]>();
  for (const f of (await readdir(DATA_DIR)).filter((f) => /^\d{3}\.json$/.test(f))) {
    const s = JSON.parse(await readFile(path.join(DATA_DIR, f), "utf8"));
    surahs.set(s.number, s.ayahs.map((a: Omit<Ayah, "surah">) => ({ ...a, surah: s.number })));
  }
  const ayahs = [...surahs.values()].flat().sort((a, b) => familiarity(a.surah) - familiarity(b.surah) || a.surah - b.surah || a.number - b.number);
  const words = ayahs.flatMap((a) => a.words.map((w) => ({ text: w.text, audio: w.audio, ref: `${a.surah}:${a.number}:${w.position}`, surah: a.surah, level: wordLevel(w.text) })));

  // Short words from well-known surahs first, one per spelling. A word that starts
  // with a tasydid only makes sense joined to the word before it.
  const best = (list: typeof words, n: number): Word[] => {
    const seen = new Set<string>();
    return list
      .filter((w) => !w.text.includes(" ") && !clusters(w.text)[0]?.marks.includes(M.shadda))
      .sort((a, b) => Math.max(letterCount(a.text), 2) - Math.max(letterCount(b.text), 2) || familiarity(a.surah) - familiarity(b.surah))
      .filter((w) => !seen.has(w.text) && seen.add(w.text))
      .slice(0, n)
      .map(({ text, audio, ref }) => ({ text, audio, ref }));
  };

  // 1. Qari words starting with letter + kasrah / dhammah.
  const syllableWords: Record<string, Word[]> = {};
  for (const l of hijaiyah.letters) {
    for (const [mark, sign] of [["kasrah", M.kasrah], ["dhammah", M.dhammah]] as const) {
      const found = best(words.filter((w) => clusters(w.text)[0]?.base === l.char && clusters(w.text)[0].marks.replace(M.shadda, "") === sign), 3);
      if (found.length) syllableWords[`${l.id}:${mark}`] = found;
    }
  }

  // 2. What becomes readable after each unit: new words, and the first whole ayah.
  const usedAyahs = new Set<string>();
  const moments = LEVELS.map((unit, level) => {
    const ayah = ayahs.find((a) => !usedAyahs.has(`${a.surah}:${a.number}`) && a.words.every((w) => wordLevel(w.text) <= level));
    if (ayah) usedAyahs.add(`${ayah.surah}:${ayah.number}`);
    return {
      unit,
      words: best(words.filter((w) => w.level === level), 3),
      ayah: ayah && { ref: `${ayah.surah}:${ayah.number}`, text: ayah.text, audio: ayah.audio, words: ayah.words.map((w) => w.text) },
    };
  });

  // 3. Al-Fatihah words that show each special sign.
  const fatihah = words.filter((w) => w.surah === 1);
  const special = {
    wasla: best(fatihah.filter((w) => w.text.startsWith(M.wasla) && !clusters(w.text)[2]?.marks.includes(M.shadda)), 3),
    dagger: best(fatihah.filter((w) => w.text.includes(M.dagger)), 3),
    silentLam: best(fatihah.filter((w) => w.text.startsWith(M.wasla) && clusters(w.text)[2]?.marks.includes(M.shadda)), 3),
  };

  await writeFile(
    OUT_FILE,
    JSON.stringify(
      {
        _note: "Dibuat otomatis oleh scripts/build-reading-data.ts dari data/quran. Jangan diedit manual. Level baca tiap kata dihitung dari tandanya.",
        review: "perlu cek ustadz: pastikan kata dan ayat ini memang bisa dibaca dengan materi sampai unit tersebut",
        syllableWords,
        moments,
        special,
      },
      null,
      1,
    ) + "\n",
  );
  for (const m of moments) console.log(m.unit, m.words.map((w) => w.text).join("  "), "|", m.ayah?.ref ?? "-");
  console.log("special", Object.entries(special).map(([k, v]) => `${k}: ${v.map((w) => w.text).join(" ")}`).join(" | "));
  console.log(`suku kata dengan contoh: ${Object.keys(syllableWords).length}`);
  console.log(`\nDisimpan ke ${path.relative(process.cwd(), OUT_FILE)}`);
}

if (process.argv[1]?.endsWith("build-reading-data.ts")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
