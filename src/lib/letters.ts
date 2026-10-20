import hijaiyah from "../../data/content/hijaiyah.json";
import letterExamples from "../../data/content/letter-examples.json";

export type Letter = {
  id: string;
  char: string;
  fathah: string;
  name: string;
  latin: string;
  makhraj: string;
  similar: string[];
};

export type WordExample = { text: string; audio: string; ref: string };

export type Harakat = "fathah" | "kasrah" | "dhammah";

export const HARAKAT: { id: Harakat; name: string; mark: string }[] = [
  { id: "fathah", name: "Fathah", mark: "\u064E" },
  { id: "kasrah", name: "Kasrah", mark: "\u0650" },
  { id: "dhammah", name: "Dhammah", mark: "\u064F" },
];

export const letters = hijaiyah.letters as Letter[];
export const lettersReview = hijaiyah.review;

const byId = new Map(letters.map((l) => [l.id, l]));

export function getLetter(id: string): Letter {
  const letter = byId.get(id);
  if (!letter) throw new Error(`Huruf tidak dikenal: ${id}`);
  return letter;
}

export function withHarakat(letter: Letter, harakat: Harakat) {
  return letter.char + HARAKAT.find((h) => h.id === harakat)!.mark;
}

const examples = letterExamples.examples as Record<string, WordExample[]>;
const muqattaat = letterExamples.muqattaat as Record<string, WordExample>;

export function examplesFor(id: string): WordExample[] {
  return examples[id] ?? [];
}

/** The qari reciting the letter's name, for ص ق ن only (38:1, 50:1, 68:1). */
export function muqattaahFor(id: string): WordExample | undefined {
  return muqattaat[id];
}

export function refLabel(ref: string) {
  const [surah, ayah] = ref.split(":");
  return `QS ${surah}:${ayah}`;
}
