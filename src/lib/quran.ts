import { readFile } from "node:fs/promises";
import path from "node:path";
import quranIndex from "../../data/quran/index.json";

export type Ayah = {
  number: number;
  globalNumber: number;
  juz: number;
  page: number;
  text: string;
  translation: string;
  tajweed: string;
  audio: string;
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
