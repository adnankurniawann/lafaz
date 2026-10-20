// Which hijaiyah letters appear in an ayah, for the Peta Ayat and the letter highlight.
import hijaiyah from "../../data/content/hijaiyah.json";

const byChar = new Map<string, string>([
  ...hijaiyah.letters.map((l) => [l.char, l.id] as [string, string]),
  ...Object.entries(hijaiyah.variants as Record<string, string>),
]);

export function letterOf(char: string): string | undefined {
  return byChar.get(char);
}

/** A base character with its harakat and other marks, tagged with its letter. */
export type Cluster = { text: string; letter?: string };

export function clusters(text: string): Cluster[] {
  const out: Cluster[] = [];
  for (const ch of text) {
    if (/\p{M}/u.test(ch) && out.length) out[out.length - 1].text += ch;
    else out.push({ text: ch, letter: letterOf(ch) });
  }
  return out;
}

/** Distinct letters in the text, in order of first appearance. */
export function lettersIn(text: string): string[] {
  return [...new Set(clusters(text).flatMap((c) => (c.letter ? [c.letter] : [])))];
}

export type AyahLetters = { surah: number; ayah: number; text: string; letters: string[] };

export function knownCount(ayah: AyahLetters, known: Set<string>) {
  return ayah.letters.filter((l) => known.has(l)).length;
}

/**
 * The ayah to show after a unit: the largest share of known letters, with at
 * least one of the unit's letters. Ties keep the earlier ayah, so Al-Fatihah wins.
 */
export function bestAyah(ayahs: AyahLetters[], known: Set<string>, unitLetters: string[]): AyahLetters {
  let best = ayahs[0];
  let bestScore = -1;
  for (const a of ayahs) {
    if (!unitLetters.some((l) => a.letters.includes(l))) continue;
    const score = knownCount(a, known) / a.letters.length;
    if (score > bestScore) [best, bestScore] = [a, score];
  }
  return best;
}
