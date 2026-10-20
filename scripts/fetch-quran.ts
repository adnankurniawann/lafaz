// Downloads surah text, translation and tajweed markup from api.alquran.cloud
// and writes them to data/quran/. Run with: npm run fetch-quran
//
// Nothing here is typed by hand. If an endpoint fails or returns something
// unexpected, the script stops instead of writing partial data.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseTajweed, projectTajweed, segmentsToText } from "../src/lib/tajweed";

// Al-Fatihah plus all of juz 30 (78 to 114), so lessons can pick examples
// from any short surah without refetching.
const SURAHS = [1, ...Array.from({ length: 114 - 78 + 1 }, (_, i) => 78 + i)];

const API = "https://api.alquran.cloud/v1/surah";
const EDITIONS = {
  text: "quran-uthmani",
  translation: "id.indonesian",
  tajweed: "quran-tajweed",
} as const;

const VERSE_AUDIO = "https://everyayah.com/data/Alafasy_128kbps";
const WORD_AUDIO = "https://audio.qurancdn.com/wbw";

// quran.com gives per-word text, word audio, and the start/end time of every
// word inside its own Alafasy verse recording (recitation 7).
const QURAN_COM = "https://api.quran.com/api/v4/verses/by_chapter";
const QURAN_COM_AUDIO = "https://verses.quran.com";
const QURAN_COM_WORD_AUDIO = "https://audio.qurancdn.com";

const OUT_DIR = path.join(process.cwd(), "data/quran");

type ApiAyah = {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  page: number;
};

type ApiSurah = {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  numberOfAyahs: number;
  ayahs: ApiAyah[];
};

const pad3 = (n: number) => String(n).padStart(3, "0");

export function verseAudioUrl(surah: number, ayah: number) {
  return `${VERSE_AUDIO}/${pad3(surah)}${pad3(ayah)}.mp3`;
}

async function fetchEdition(surah: number, edition: string): Promise<ApiSurah> {
  const url = `${API}/${surah}/${edition}`;
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      if (body.code !== 200 || !body.data?.ayahs) throw new Error(`format tidak sesuai: ${JSON.stringify(body).slice(0, 200)}`);
      const data = body.data as ApiSurah;
      if (data.number !== surah) throw new Error(`nomor surah ${data.number}, harusnya ${surah}`);
      if (data.ayahs.length !== data.numberOfAyahs) throw new Error(`jumlah ayat ${data.ayahs.length} != ${data.numberOfAyahs}`);
      data.ayahs.forEach((a, i) => {
        if (a.numberInSurah !== i + 1) throw new Error(`urutan ayat salah di indeks ${i}`);
        if (typeof a.text !== "string" || !a.text.trim()) throw new Error(`teks kosong di ayat ${i + 1}`);
        // 1:1 arrives with a byte order mark in front; it is not part of the text.
        a.text = a.text.replace(/^\uFEFF/, "");
      });
      return data;
    } catch (err) {
      if (attempt >= 3) throw new Error(`${url}: ${(err as Error).message}`);
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

type QuranComVerse = {
  verse_number: number;
  words: { position: number; char_type_name: string; text_uthmani: string; audio_url: string | null }[];
  audio: { url: string; segments: number[][] };
};

export type Word = { position: number; text: string; audio: string };
export type Timing = { audio: string; segments: [position: number, startMs: number, endMs: number][] };

async function fetchJson(url: string) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (attempt >= 3) throw new Error(`${url}: ${(err as Error).message}`);
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

async function fetchWords(surah: number): Promise<Map<number, { words: Word[]; timing: Timing }>> {
  const verses: QuranComVerse[] = [];
  for (let page = 1; page; ) {
    const body = await fetchJson(`${QURAN_COM}/${surah}?words=true&word_fields=text_uthmani&audio=7&per_page=50&page=${page}`);
    if (!Array.isArray(body.verses)) throw new Error(`quran.com surah ${surah}: format tidak sesuai`);
    verses.push(...body.verses);
    page = body.pagination?.next_page ?? 0;
  }

  const out = new Map<number, { words: Word[]; timing: Timing }>();
  for (const v of verses) {
    const key = `${surah}:${v.verse_number}`;
    const words = v.words
      .filter((w) => w.char_type_name === "word")
      .map((w) => {
        if (!w.audio_url || !w.text_uthmani) throw new Error(`${key}: kata ${w.position} tanpa teks atau audio`);
        return { position: w.position, text: w.text_uthmani, audio: `${QURAN_COM_WORD_AUDIO}/${w.audio_url}` };
      });
    words.forEach((w, i) => {
      if (w.position !== i + 1) throw new Error(`${key}: urutan kata salah`);
    });

    // Segments come as [index, index + 1, startMs, endMs], one per word.
    const segs = v.audio?.segments;
    if (!v.audio?.url || !Array.isArray(segs) || segs.length !== words.length) {
      throw new Error(`${key}: jumlah segmen audio (${segs?.length}) tidak sama dengan jumlah kata (${words.length})`);
    }
    const segments = segs.map((seg, i): [number, number, number] => {
      const [from, to, start, end] = seg;
      if (seg.length !== 4 || from !== i || to !== i + 1 || !(end > start)) throw new Error(`${key}: format segmen tidak dikenal ${JSON.stringify(seg)}`);
      return [i + 1, start, end];
    });
    out.set(v.verse_number, { words, timing: { audio: `${QURAN_COM_AUDIO}/${v.audio.url}`, segments } });
  }
  return out;
}

async function urlWorks(url: string) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok && (res.headers.get("content-type") ?? "").includes("audio");
  } catch {
    return false;
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  // The uthmani edition prefixes ayah 1 of every surah except 1 and 9 with the
  // basmalah; the tajweed edition does not. Take the exact string from 1:1 and
  // strip it so both editions describe the same ayah.
  const fatihah = await fetchEdition(1, EDITIONS.text);
  const basmalah = fatihah.ayahs[0].text;

  const index = [];
  const notes: string[] = [];
  let encodingDiffs = 0;

  for (const n of SURAHS) {
    const [text, translation, tajweed, wordData] = await Promise.all([
      fetchEdition(n, EDITIONS.text),
      fetchEdition(n, EDITIONS.translation),
      fetchEdition(n, EDITIONS.tajweed),
      fetchWords(n),
    ]);
    if (wordData.size !== text.numberOfAyahs) throw new Error(`Surah ${n}: jumlah ayat quran.com berbeda`);
    if (translation.numberOfAyahs !== text.numberOfAyahs || tajweed.numberOfAyahs !== text.numberOfAyahs) {
      throw new Error(`Surah ${n}: jumlah ayat antar edisi berbeda`);
    }

    const ayahs = text.ayahs.map((a, i) => {
      let arabic = a.text;
      if (n !== 1 && n !== 9 && i === 0) {
        // In a few surahs (95, 97) the prefix carries an extra shadda on the
        // ba. Allow that one difference, refuse anything else.
        const words = arabic.split(" ");
        const prefix = words.slice(0, 4).join(" ");
        const noShadda = (s: string) => s.replace(/\u0651/g, "");
        if (noShadda(prefix) !== noShadda(basmalah)) throw new Error(`Surah ${n}: ayat 1 tidak diawali basmalah seperti yang diharapkan`);
        if (prefix !== basmalah) notes.push(`${n}:1 awalan basmalah di edisi utsmani berbeda tasydid ("${prefix}"), sudah dibuang`);
        arabic = words.slice(4).join(" ");
      }

      // Make sure every rule in the tajweed edition survives the projection
      // onto the uthmani text we display.
      const rawTajweed = tajweed.ayahs[i].text;
      const source = parseTajweed(rawTajweed);
      const projected = projectTajweed(arabic, source);
      if (segmentsToText(projected) !== arabic) throw new Error(`${n}:${i + 1} proyeksi tajwid mengubah teks`);
      const rulesIn = (segs: typeof source) => new Set(segs.map((s) => s.rule).filter(Boolean));
      const kept = rulesIn(projected);
      for (const rule of rulesIn(source)) {
        if (!kept.has(rule)) notes.push(`${n}:${i + 1} hukum ${rule} hilang saat diproyeksikan ke teks utsmani`);
      }
      if (segmentsToText(source) !== arabic) encodingDiffs++;

      return {
        number: a.numberInSurah,
        globalNumber: a.number,
        juz: a.juz,
        page: a.page,
        text: arabic,
        translation: translation.ayahs[i].text,
        tajweed: rawTajweed,
        audio: verseAudioUrl(n, a.numberInSurah),
        words: wordData.get(a.numberInSurah)!.words,
        timing: wordData.get(a.numberInSurah)!.timing,
      };
    });

    // Check the first and last ayah audio of every surah actually resolves.
    for (const a of [ayahs[0], ayahs[ayahs.length - 1]]) {
      for (const url of [a.audio, a.timing.audio, a.words[0].audio]) {
        if (!(await urlWorks(url))) throw new Error(`Audio tidak bisa diakses: ${url}`);
      }
    }

    const surah = {
      number: n,
      name: text.name,
      englishName: text.englishName,
      englishNameTranslation: text.englishNameTranslation,
      revelationType: text.revelationType,
      ayahCount: text.numberOfAyahs,
      hasBasmalah: n !== 1 && n !== 9,
      ayahs,
    };
    await writeFile(path.join(OUT_DIR, `${pad3(n)}.json`), JSON.stringify(surah, null, 1) + "\n");
    index.push({ number: n, name: text.name, englishName: text.englishName, ayahCount: text.numberOfAyahs });
    console.log(`Surah ${n} ${text.englishName}: ${ayahs.length} ayat`);
  }

  const wordAudioSample = `${WORD_AUDIO}/001_001_001.mp3`;
  const wordAudio = await urlWorks(wordAudioSample);

  await writeFile(
    path.join(OUT_DIR, "index.json"),
    JSON.stringify(
      {
        fetchedAt: new Date().toISOString(),
        sources: {
          text: `${API}/{n}/${EDITIONS.text}`,
          translation: `${API}/{n}/${EDITIONS.translation}`,
          tajweed: `${API}/{n}/${EDITIONS.tajweed}`,
          verseAudio: `${VERSE_AUDIO}/{SSS}{AAA}.mp3`,
          wordAudio: wordAudio ? `${WORD_AUDIO}/{sss}_{aaa}_{www}.mp3` : null,
          words: `${QURAN_COM}/{n}?words=true&word_fields=text_uthmani&audio=7`,
          timedVerseAudio: `${QURAN_COM_AUDIO}/Alafasy/mp3/{SSS}{AAA}.mp3`,
        },
        basmalah,
        surahs: index,
      },
      null,
      1,
    ) + "\n",
  );

  console.log(`\nAudio per kata: ${wordAudio ? "bisa diakses" : "TIDAK bisa diakses"}`);
  console.log(`${encodingDiffs} ayat dengan encoding tajwid berbeda dari teks utsmani (diselaraskan otomatis)`);
  console.log(`${notes.length} catatan, lihat data/quran/text-notes.txt`);
  await writeFile(path.join(OUT_DIR, "text-notes.txt"), notes.join("\n") + "\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
