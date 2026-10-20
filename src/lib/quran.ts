import { readFile } from "node:fs/promises";
import path from "node:path";
import quranIndex from "../../data/quran/index.json";
import { lettersIn, type AyahLetters } from "./ayah-letters";

export type Ayah = {
  number: number;
  globalNumber: number;
  juz: number;
  page: number;
  text: string;
  translation: string;
  tajweed: string;
  audio: string;
  words: { position: number; text: string; audio: string }[];
};

export type Surah = {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  ayahCount: number;
  hasBasmalah: boolean;
  ayahs: Ayah[];
};

export const surahList = quranIndex.surahs;
export const basmalah = quranIndex.basmalah;

export function hasSurah(n: number) {
  return surahList.some((s) => s.number === n);
}

export async function getSurah(n: number): Promise<Surah> {
  "use cache";
  const file = path.join(process.cwd(), "data/quran", `${String(n).padStart(3, "0")}.json`);
  return JSON.parse(await readFile(file, "utf8"));
}

/** Every ayah in the app with the letters it contains, Al-Fatihah first. */
export async function allAyahLetters(): Promise<AyahLetters[]> {
  "use cache";
  const surahs = await Promise.all(surahList.map((s) => getSurah(s.number)));
  return surahs.flatMap((s) => s.ayahs.map((a) => ({ surah: s.number, ayah: a.number, text: a.text, letters: lettersIn(a.text) })));
}
