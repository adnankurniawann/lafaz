// Collects examples for Level Tajwid from the fetched data. Run after
// fetch-quran with: npm run build-tajweed-examples
//
// Most rules come from the quran-tajweed annotations. Izhar halqi and izhar
// syafawi are not annotated in the source, so they are detected from the
// Teks Utsmani. Qalqalah is annotated without sughra or kubra, so the kind
// is taken from its position. Detected and uncertain examples are marked for
// review (docs/DATA.md §3).

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ayahSegments, type TajweedRuleId } from "../src/lib/tajweed";
import { groupOf, type LessonRuleId } from "../src/lib/tajweed-lessons";

const DATA_DIR = path.join(process.cwd(), "data/quran");
const OUT_FILE = path.join(process.cwd(), "data/content/tajweed-examples.json");

// Annotated rules used by the lessons, by their id in tajweed-rules.json.
const ANNOTATED: Partial<Record<TajweedRuleId, LessonRuleId>> = {
  "ikhfa-haqiqi": "ikhfa-haqiqi",
  "idgham-bighunnah": "idgham-bighunnah",
  "idgham-bilaghunnah": "idgham-bilaghunnah",
  iqlab: "iqlab",
  "ikhfa-syafawi": "ikhfa-syafawi",
  "idgham-mimi": "idgham-mimi",
  "mad-thabii": "mad-thabii",
  "mad-wajib-jaiz": "mad-wajib-jaiz",
  "mad-aridh": "mad-aridh",
  "mad-lazim": "mad-lazim",
};
// Mappings marked "belum" (not sure) in docs/DATA.md §3.
const UNSURE: LessonRuleId[] = ["mad-thabii", "mad-wajib-jaiz", "mad-aridh"];

type Mark = { rule: LessonRuleId; start: number; end: number; word: number; review?: true };
type Ayah = { text: string; words: [number, number][]; audio: string; timing: [number, number][]; marks: Mark[] };

const NUN = "ن";
const MIM = "م";
const SUKUN = "ْ";
const TANWIN = /[ً-ٍ]/;
const TATWEEL = "ـ";
const HAMZA_ABOVE = "ٔ";
const THROAT = new Set(["ء", "أ", "إ", "ؤ", "ئ", "ه", "ع", "ح", "غ", "خ"]);
// Waqf signs. Reciters may stop there, so a rule across one is not heard reliably.
const WAQF = /[ۖ-ۜ]/;
// Not pronounced between a tanwin and the next letter: small meem and low
// meem signs, the alif after fathatan, alif maqsura, and the word break.
const SKIP_AFTER_TANWIN = new Set(["ۭ", "ۢ", "ا", "ى", " "]);
const BASE_LETTER = /[ء-يٱـ]/;

/** Character range of every quran.com word inside the uthmani ayah text. */
function wordRanges(text: string, count: number, ref: string): [number, number][] {
  const ranges: [number, number][] = [];
  let pendingStart: number | null = null;
  for (const m of text.matchAll(/\S+/g)) {
    const range: [number, number] = [pendingStart ?? m.index, m.index + m[0].length];
    pendingStart = null;
    // A sign written as its own token (waqf sign, rub el hizb ۞) belongs to
    // the word before it, or to the next word at the start of the ayah.
    if (/^[ۖ-ۭ]+$/.test(m[0])) {
      if (ranges.length > 0) ranges[ranges.length - 1][1] = range[1];
      else pendingStart = range[0];
    } else ranges.push(range);
  }
  if (ranges.length !== count) throw new Error(`${ref}: ${ranges.length} kata di teks, ${count} kata di data per kata`);
  return ranges;
}

function wordAt(words: [number, number][], index: number) {
  return words.findIndex(([s, e]) => index >= s && index < e);
}

/** First pronounced letter from `from`, or null when the ayah ends or a waqf sign comes first. */
function nextLetter(text: string, from: number, skip: Set<string>): number | null {
  for (let i = from; i < text.length; i++) {
    const c = text[i];
    if (WAQF.test(c)) return null;
    if (skip.has(c) || !BASE_LETTER.test(c)) continue;
    return i;
  }
  return null;
}

function isThroat(text: string, i: number) {
  // Hamzah written on a tatweel, as in يَنْـَٔوْنَ.
  if (text[i] === TATWEEL) return text.slice(i + 1, i + 3).includes(HAMZA_ABOVE);
  return THROAT.has(text[i]);
}

/** Nun with sukun or a tanwin, followed by a throat letter in the same ayah. */
export function detectIzharHalqi(text: string): { start: number; end: number }[] {
  const out: { start: number; end: number }[] = [];
  for (let i = 0; i < text.length; i++) {
    let start = -1;
    let after = -1;
    if (text[i] === NUN && text[i + 1] === SUKUN) {
      start = i;
      after = i + 2;
    } else if (TANWIN.test(text[i])) {
      // The tanwin sits on the letter before it (possibly after a shadda).
      start = i - 1;
      while (start > 0 && !BASE_LETTER.test(text[start])) start--;
      after = i + 1;
    }
    if (start < 0) continue;
    const next = nextLetter(text, after, SKIP_AFTER_TANWIN);
    if (next !== null && isThroat(text, next)) out.push({ start, end: next + 1 });
  }
  return out;
}

/** Mim with sukun, followed by any letter but mim or ba in the same ayah. */
export function detectIzharSyafawi(text: string): { start: number; end: number }[] {
  const out: { start: number; end: number }[] = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== MIM || text[i + 1] !== SUKUN) continue;
    const next = nextLetter(text, i + 2, new Set([" "]));
    if (next !== null && text[next] !== MIM && text[next] !== "ب") out.push({ start: i, end: next + 1 });
  }
  return out;
}

/**
 * Qalqalah at the end of the ayah is read with a stop (kubra); inside the ayah
 * it is sughra. Just before a waqf sign the qari may stop or not, so skip it.
 */
export function qalqalahKind(text: string, end: number): LessonRuleId | null {
  const rest = text.slice(end);
  if (!BASE_LETTER.test(rest)) return "qalqalah-kubra";
  const beforeNext = rest.slice(0, rest.search(BASE_LETTER));
  return WAQF.test(beforeNext) ? null : "qalqalah-sughra";
}

async function main() {
  const files = (await readdir(DATA_DIR)).filter((f) => /^\d{3}\.json$/.test(f)).sort();
  const ayahs: Record<string, Ayah> = {};
  const counts: Record<string, number> = {};
  const skipped: string[] = [];

  for (const f of files) {
    const surah = JSON.parse(await readFile(path.join(DATA_DIR, f), "utf8"));
    for (const a of surah.ayahs) {
      const ref = `${surah.number}:${a.number}`;
      const words = wordRanges(a.text, a.words.length, ref);
      const timing: [number, number][] = a.timing.segments.map(([, s, e]: number[]) => [s, e]);
      const marks: Mark[] = [];

      const add = (rule: LessonRuleId, start: number, end: number, review: boolean) => {
        const span = a.text.slice(start, end);
        if (WAQF.test(span)) return skipped.push(`${ref} ${rule} melewati tanda waqaf: ${span}`);
        // Two rules of one group on the same letters means a detection went wrong.
        const clash = marks.find((m) => m.start < end && start < m.end && groupOf(m.rule) === groupOf(rule));
        if (clash) return skipped.push(`${ref} ${rule} bertabrakan dengan ${clash.rule}: ${span}`);
        const word = wordAt(words, start);
        const last = wordAt(words, end - 1);
        const [ws, we] = [timing[word], timing[last]];
        if (!ws || !we || ws[0] >= we[1]) return skipped.push(`${ref} ${rule} waktu kata tidak valid`);
        marks.push({ rule, start, end, word, ...(review ? { review: true as const } : {}) });
        counts[rule] = (counts[rule] ?? 0) + 1;
      };

      // Annotated rules, carried over to the uthmani text.
      let pos = 0;
      for (const seg of ayahSegments(a)) {
        const start = pos;
        pos += seg.text.length;
        if (!seg.rule) continue;
        if (seg.rule === "qalqalah") {
          const kind = qalqalahKind(a.text, pos);
          if (kind) add(kind, start, pos, true);
          else skipped.push(`${ref} qalqalah tepat sebelum tanda waqaf: ${seg.text}`);
          continue;
        }
        const rule = ANNOTATED[seg.rule];
        if (rule) add(rule, start, pos, UNSURE.includes(rule));
      }

      for (const { start, end } of detectIzharHalqi(a.text)) add("izhar-halqi", start, end, true);
      for (const { start, end } of detectIzharSyafawi(a.text)) add("izhar-syafawi", start, end, true);

      if (marks.length === 0) continue;
      marks.sort((x, y) => x.start - y.start);
      ayahs[ref] = { text: a.text, words, audio: a.timing.audio, timing, marks };
    }
  }

  for (const [rule, n] of Object.entries(counts).sort()) console.log(`${rule.padEnd(20)} ${n}`);
  if (skipped.length) console.log(`\nDilewati (${skipped.length}):\n${skipped.join("\n")}`);

  await writeFile(
    OUT_FILE,
    JSON.stringify({
      _note:
        "Dibuat otomatis oleh scripts/build-tajweed-examples.ts dari data/quran. Jangan diedit manual. words dan marks adalah rentang karakter [awal, akhir) di text; timing adalah waktu mulai dan selesai tiap kata di audio, dalam milidetik.",
      review: "perlu cek ustadz: izhar dideteksi dari teks, qalqalah sughra/kubra dari posisinya, dan pemetaan mad yang belum yakin ditandai review",
      ayahs,
    }) + "\n",
  );
  console.log(`\n${Object.keys(ayahs).length} ayat disimpan ke ${path.relative(process.cwd(), OUT_FILE)}`);
}

if (process.argv[1]?.endsWith("build-tajweed-examples.ts")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
