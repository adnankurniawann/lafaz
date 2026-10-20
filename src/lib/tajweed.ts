import rulesData from "../../data/content/tajweed-rules.json";

export type TajweedRuleId =
  | "hamzah-washal"
  | "huruf-mati"
  | "lam-syamsiyah"
  | "mad-thabii"
  | "mad-aridh"
  | "mad-lazim"
  | "mad-wajib-jaiz"
  | "qalqalah"
  | "ikhfa-syafawi"
  | "ikhfa-haqiqi"
  | "idgham-mimi"
  | "iqlab"
  | "idgham-bighunnah"
  | "idgham-bilaghunnah"
  | "idgham-mutajanisain"
  | "idgham-mutaqaribain"
  | "ghunnah";

export type TajweedRule = {
  code: string;
  id: TajweedRuleId;
  name: string;
  source: string;
  color: string;
  review?: string;
};

export type TajweedSegment = {
  text: string;
  rule: TajweedRuleId | null;
};

export const tajweedRules = rulesData.rules as TajweedRule[];

const ruleByCode = new Map(tajweedRules.map((r) => [r.code, r]));
const ruleById = new Map(tajweedRules.map((r) => [r.id, r]));

export function getRule(id: TajweedRuleId): TajweedRule {
  return ruleById.get(id)!;
}

export class TajweedParseError extends Error {}

// Markup looks like `[h:9421[ٱ]` or `[q[د]`: an opening bracket, a one-letter
// rule code, an optional `:id`, a second bracket, the marked text, then `]`.
const MARKER = /\[([a-z])(?::\d+)?\[([^\[\]]*)\]/g;

/** Parses quran-tajweed markup into segments, keeping the source boundaries. */
export function parseTajweed(raw: string): TajweedSegment[] {
  const segments: TajweedSegment[] = [];
  let last = 0;

  for (const match of raw.matchAll(MARKER)) {
    const [whole, code, text] = match;
    const rule = ruleByCode.get(code);
    if (!rule) throw new TajweedParseError(`Kode tajwid tidak dikenal: "${code}" di "${raw}"`);
    if (match.index > last) segments.push({ text: raw.slice(last, match.index), rule: null });
    segments.push({ text, rule: rule.id });
    last = match.index + whole.length;
  }
  if (last < raw.length) segments.push({ text: raw.slice(last), rule: null });

  for (const s of segments) {
    if (/[\[\]]/.test(s.text)) throw new TajweedParseError(`Markup tidak tertutup di "${raw}"`);
  }
  return segments;
}

export function segmentsToText(segments: TajweedSegment[]): string {
  return segments.map((s) => s.text).join("");
}

const COMBINING_MARK = /\p{Mn}/u;

/**
 * The tajweed edition is encoded slightly differently from quran-uthmani
 * (tatweel before dagger alif, no small iqlab meem, ZWNJ before waqf marks,
 * and so on). We always display the uthmani text, so this aligns the two
 * strings character by character and carries each rule over.
 */
export function projectTajweed(text: string, source: TajweedSegment[]): TajweedSegment[] {
  const src = segmentsToText(source);
  const srcRules: (TajweedRuleId | null)[] = [];
  for (const s of source) for (let k = 0; k < s.text.length; k++) srcRules.push(s.rule);

  if (src === text) return source.map((s) => ({ ...s }));

  // Longest common subsequence table, built from the end.
  const n = text.length;
  const m = src.length;
  const lcs = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = text[i] === src[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const rules: (TajweedRuleId | null)[] = new Array(n).fill(null);
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && text[i] === src[j]) {
      rules[i++] = srcRules[j++];
      continue;
    }
    // Collect one gap: characters only in the uthmani text and characters
    // only in the tajweed text, between two matched characters.
    const gapStart = i;
    const inserted: (TajweedRuleId | null)[] = [];
    const prev = j > 0 ? srcRules[j - 1] : null;
    while ((i < n || j < m) && !(i < n && j < m && text[i] === src[j])) {
      if (j < m && (i >= n || lcs[i][j + 1] >= lcs[i + 1][j])) inserted.push(srcRules[j++]);
      else i++;
    }
    const next = j < m ? srcRules[j] : null;
    for (let k = gapStart; k < i; k++) {
      if (inserted.length > 0) {
        // A substitution, e.g. ى written as ٮ: take the rule of the replacement.
        rules[k] = inserted[Math.min(k - gapStart, inserted.length - 1)];
      } else {
        // Only in uthmani, e.g. a small iqlab meem. A mark belongs to the
        // letter before it; anything else follows the surrounding rule.
        rules[k] = prev === next || COMBINING_MARK.test(text[k]) ? prev : null;
      }
    }
  }

  const out: TajweedSegment[] = [];
  for (let k = 0; k < n; k++) {
    const last = out[out.length - 1];
    if (last && last.rule === rules[k]) last.text += text[k];
    else out.push({ text: text[k], rule: rules[k] });
  }
  return out;
}

/** Tajweed segments over the uthmani text of an ayah. */
export function ayahSegments(ayah: { text: string; tajweed: string }): TajweedSegment[] {
  return projectTajweed(ayah.text, parseTajweed(ayah.tajweed));
}
