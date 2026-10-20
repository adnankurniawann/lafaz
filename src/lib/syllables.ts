// Syllable tokens for the Bagian Membaca drills, built from letters and marks.
// These are Iqro-style syllables made by code, not Qur'an text.
//
// A token is one or more parts joined by "+". A part is "letter" (fathah) or
// "letter:mark". Examples: "ba", "ba:kasrah", "alif:fathah+ba:sukun" (ab).

import { getLetter, letters } from "./letters";
import { pick, shuffle } from "./random";

export type Mark =
  | "fathah"
  | "kasrah"
  | "dhammah"
  | "fathatain"
  | "kasratain"
  | "dhammatain"
  | "sukun"
  | "tasydid-fathah"
  | "tasydid-kasrah"
  | "tasydid-dhammah"
  | "mad";

const SIGN: Record<Mark, string> = {
  fathah: "َ",
  kasrah: "ِ",
  dhammah: "ُ",
  fathatain: "ً",
  kasratain: "ٍ",
  dhammatain: "ٌ",
  sukun: "ْ",
  "tasydid-fathah": "َّ",
  "tasydid-kasrah": "ِّ",
  "tasydid-dhammah": "ُّ",
  mad: "",
};

// Marks a learner can confuse with each other, used for wrong options.
const FAMILIES: Mark[][] = [
  ["fathah", "kasrah", "dhammah"],
  ["fathatain", "kasratain", "dhammatain"],
  ["tasydid-fathah", "tasydid-kasrah", "tasydid-dhammah"],
];

type Part = { letter: string; mark: Mark };

export function parts(token: string): Part[] {
  return token.split("+").map((p) => {
    const [letter, mark = "fathah"] = p.split(":");
    return { letter, mark: mark as Mark };
  });
}

const join = (ps: Part[]) => ps.map((p) => (p.mark === "fathah" ? p.letter : `${p.letter}:${p.mark}`)).join("+");

/** A bare letter id, as used by the Huruf Hijaiyah lessons. */
export const isLetter = (token: string) => !token.includes(":") && !token.includes("+");

export const lettersOf = (token: string) => parts(token).map((p) => p.letter);

export function arabicOf(token: string) {
  // Tanwin fathah is followed by an alif, as in the mushaf.
  return parts(token)
    .map(({ letter, mark }) => getLetter(letter).char + SIGN[mark] + (mark === "fathatain" ? "ا" : ""))
    .join("");
}

const consonant = (letter: string) => getLetter(letter).latin.replace(/[ao]$/, "");
// Heavy letters read their fathah as "o" in Iqro style (kho, ro).
const openVowel = (letter: string) => (getLetter(letter).latin.endsWith("o") ? "o" : "a");

export function latinOf(token: string) {
  let out = "";
  for (const { letter, mark } of parts(token)) {
    const c = consonant(letter);
    const a = openVowel(letter);
    switch (mark) {
      case "fathah": out += c + a; break;
      case "kasrah": out += `${c}i`; break;
      case "dhammah": out += `${c}u`; break;
      case "fathatain": out += `${c}${a}n`; break;
      case "kasratain": out += `${c}in`; break;
      case "dhammatain": out += `${c}un`; break;
      case "sukun": out += c; break;
      case "tasydid-fathah": out += c + c + a; break;
      case "tasydid-kasrah": out += `${c}${c}i`; break;
      case "tasydid-dhammah": out += `${c}${c}u`; break;
      // A mad letter stretches the vowel before it.
      case "mad": out += out.slice(-1); break;
    }
  }
  return out;
}

/** A recorded sound key for single letter + harakat tokens, if any. */
export function singleHarakat(token: string): { letter: string; harakat: "fathah" | "kasrah" | "dhammah" } | undefined {
  const ps = parts(token);
  if (ps.length !== 1) return undefined;
  const { letter, mark } = ps[0];
  return mark === "fathah" || mark === "kasrah" || mark === "dhammah" ? { letter, harakat: mark } : undefined;
}

/** Tokens that look or sound close: other marks of the same family, or a similar letter. */
export function variants(token: string): string[] {
  const ps = parts(token);
  const out = new Set<string>();
  ps.forEach((p, i) => {
    const family = FAMILIES.find((f) => f.includes(p.mark));
    for (const m of family ?? []) if (m !== p.mark) out.add(join(ps.map((q, j) => (j === i ? { ...q, mark: m } : q))));
    if (p.mark !== "mad") for (const l of getLetter(p.letter).similar) if (l !== "alif") out.add(join(ps.map((q, j) => (j === i ? { ...q, letter: l } : q))));
  });
  // Reading the row left to right is the classic beginner mistake.
  if (ps.length > 1) out.add(join([...ps].reverse()));
  out.delete(token);
  return [...out].filter((t) => latinOf(t) !== latinOf(token));
}

// Building blocks for each kind of drill.
const ALL = letters.map((l) => l.id);
const CONSONANTS = ALL.filter((l) => l !== "alif" && l !== "hamzah");
const VOWELS = ["fathah", "kasrah", "dhammah"] as const;
const MAD_LETTER = { fathah: "alif", kasrah: "ya", dhammah: "wau" } as const;
// Letters that do not join to the next letter, so they never sit in the middle of a joined drill.
const NON_JOINING = ["alif", "dal", "dzal", "ra", "zai", "wau", "hamzah"];

export type MarkUnit = "sambung" | "kasrah" | "dhammah" | "tanwin" | "sukun" | "tasydid" | "mad";

/** A random drill token for a Bagian Membaca unit. `focus` biases which letter leads. */
export function makeToken(unit: MarkUnit, focus = pick(CONSONANTS)): string {
  const lead = pick(CONSONANTS);
  switch (unit) {
    case "sambung": {
      const middle = shuffle(CONSONANTS.filter((l) => !NON_JOINING.includes(l)));
      return [focus, middle[0], ...(Math.random() < 0.5 ? [middle[1]] : [])].join("+");
    }
    case "kasrah":
      return `${focus}:${Math.random() < 0.7 ? "kasrah" : pick(VOWELS)}`;
    case "dhammah":
      return `${focus}:${Math.random() < 0.6 ? "dhammah" : pick(VOWELS)}`;
    case "tanwin":
      return `${focus}:${pick(["fathatain", "kasratain", "dhammatain"])}`;
    case "sukun":
      return `${lead}:${pick(VOWELS)}+${focus === "wau" || focus === "ya" ? "ba" : focus}:sukun`;
    case "tasydid":
      return `${lead}:${pick(VOWELS)}+${focus}:tasydid-${pick(VOWELS)}`;
    case "mad": {
      const v = pick(VOWELS);
      return `${focus}:${v}+${MAD_LETTER[v]}:mad`;
    }
  }
}

export const DRILL_LETTERS = CONSONANTS;
