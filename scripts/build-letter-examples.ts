// Picks example Qur'an words for every hijaiyah letter from the fetched data,
// plus the qari's recitation of the single-letter muqatta'at (ص ق ن).
// Run after fetch-quran with: npm run build-letter-examples
//
// Words are chosen by a rule, not by hand: the word must start with the
// letter, preferably carrying a fathah (Iqro 1 reads every letter with
// fathah), and shorter words from well-known surahs come first.

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import hijaiyah from "../data/content/hijaiyah.json";

const DATA_DIR = path.join(process.cwd(), "data/quran");
const OUT_FILE = path.join(process.cwd(), "data/content/letter-examples.json");
const PER_LETTER = 4;
const FAMILIAR_SURAHS = [1, 112, 113, 114, 108, 103, 110, 111, 109, 107, 106, 105];

// Which first characters count as which letter. Alif with a hamzah on top
// stands for alif (Iqro reads اَ as "a"); hamzah under alif or a bare hamzah
// stands for hamzah. Words starting with hamzat wasl (ٱ) are skipped because
// that alif is silent when joined.
const FIRST_CHAR: Record<string, string[]> = {
  alif: ["أ"],
  hamzah: ["ء", "إ"],
};

const FATHAH = "\u064E";
const SHADDA = "\u0651";
const BASE_LETTER = /[\u0621-\u064A\u0671]/g;
// Small Qur'anic signs (waqf marks, small high zero, small meem, ...) that a
// beginner has not met yet.
const SPECIAL_MARK = /[\u06D6-\u06ED]/;

type Candidate = { text: string; audio: string; ref: string; surah: number; fathah: boolean; length: number; skeleton: string; special: boolean };

async function main() {
  const files = (await readdir(DATA_DIR)).filter((f) => /^\d{3}\.json$/.test(f));
  const candidates: Candidate[] = [];
  for (const f of files) {
    const surah = JSON.parse(await readFile(path.join(DATA_DIR, f), "utf8"));
    for (const ayah of surah.ayahs) {
      for (const w of ayah.words) {
        const second = w.text[1] === SHADDA ? w.text[2] : w.text[1];
        candidates.push({
          text: w.text,
          audio: w.audio,
          ref: `${surah.number}:${ayah.number}:${w.position}`,
          surah: surah.number,
          fathah: second === FATHAH,
          length: (w.text.match(BASE_LETTER) ?? []).length,
          skeleton: (w.text.match(BASE_LETTER) ?? []).join(""),
          special: SPECIAL_MARK.test(w.text),
        });
      }
    }
  }

  const rank = (c: Candidate) => {
    const familiar = FAMILIAR_SURAHS.indexOf(c.surah);
    // Prefer plain words: no special signs, and no waqf mark ("word ۜ").
    return [c.fathah ? 0 : 1, c.special || c.text.includes(" ") ? 1 : 0, Math.max(c.length, 3), familiar === -1 ? 99 : familiar, c.surah];
  };
  const compare = (a: Candidate, b: Candidate) => {
    const ra = rank(a);
    const rb = rank(b);
    for (let i = 0; i < ra.length; i++) if (ra[i] !== rb[i]) return ra[i] - rb[i];
    return 0;
  };

  const examples: Record<string, { text: string; audio: string; ref: string }[]> = {};
  for (const letter of hijaiyah.letters) {
    const starts = FIRST_CHAR[letter.id] ?? [letter.char];
    const seen = new Set<string>();
    const picked = candidates
      .filter((c) => starts.includes(c.text[0]))
      .sort(compare)
      .filter((c) => !seen.has(c.skeleton) && seen.add(c.skeleton))
      .slice(0, PER_LETTER)
      .map(({ text, audio, ref }) => ({ text, audio, ref }));
    if (picked.length === 0) throw new Error(`Tidak ada contoh kata untuk huruf ${letter.id}`);
    examples[letter.id] = picked;
    console.log(`${letter.name.padEnd(7)} ${picked.map((p) => p.text).join("  ")}`);
  }

  // Single-letter muqatta'at: the qari pronounces the letter's name.
  const muqattaat: Record<string, { text: string; audio: string; ref: string }> = {};
  for (const [id, key] of [["shod", "38:1"], ["qof", "50:1"], ["nun", "68:1"]]) {
    const res = await fetch(`https://api.quran.com/api/v4/verses/by_key/${key}?words=true&word_fields=text_uthmani`);
    if (!res.ok) throw new Error(`quran.com ${key}: HTTP ${res.status}`);
    const word = (await res.json()).verse.words[0];
    const letter = hijaiyah.letters.find((l) => l.id === id)!;
    if (!word?.text_uthmani?.startsWith(letter.char) || !word.audio_url) throw new Error(`${key}: data muqatta'ah tidak sesuai`);
    muqattaat[id] = { text: word.text_uthmani, audio: `https://audio.qurancdn.com/${word.audio_url}`, ref: `${key}:1` };
  }

  await writeFile(
    OUT_FILE,
    JSON.stringify(
      {
        _note: "Dibuat otomatis oleh scripts/build-letter-examples.ts dari data/quran. Jangan diedit manual; ubah aturan di script lalu jalankan ulang.",
        review: "perlu cek ustadz: pastikan contoh kata cocok untuk mengenalkan huruf",
        examples,
        muqattaat,
      },
      null,
      1,
    ) + "\n",
  );
  console.log(`\nDisimpan ke ${path.relative(process.cwd(), OUT_FILE)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
