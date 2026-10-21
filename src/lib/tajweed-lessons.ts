// Material for Level Tajwid, from data/content/tajweed-lessons.json.
// Still to be checked by an ustadz.

import lessonsData from "../../data/content/tajweed-lessons.json";

export type LessonRuleId =
  | "izhar-halqi"
  | "idgham-bighunnah"
  | "idgham-bilaghunnah"
  | "iqlab"
  | "ikhfa-haqiqi"
  | "izhar-syafawi"
  | "idgham-mimi"
  | "ikhfa-syafawi"
  | "qalqalah-sughra"
  | "qalqalah-kubra"
  | "mad-thabii"
  | "mad-wajib-jaiz"
  | "mad-aridh"
  | "mad-lazim";

export type LessonRule = {
  id: LessonRuleId;
  name: string;
  meaning: string;
  letters: string[];
  summary: string;
  howTo: string;
  listenFor: string;
  color: string;
  /** Examples are detected from the text or position, not annotated in the source. */
  detected?: boolean;
  /** Why the source annotation is not fully trusted. */
  review?: string;
};

export type RuleGroup = { id: string; title: string; intro: string; rules: LessonRuleId[] };

export const tajweedLessonsReview = lessonsData.review;
export const ruleGroups = lessonsData.groups as RuleGroup[];
export const lessonRules = lessonsData.rules as LessonRule[];

const ruleById = new Map(lessonRules.map((r) => [r.id, r]));

export function getLessonRule(id: LessonRuleId): LessonRule {
  const rule = ruleById.get(id);
  if (!rule) throw new Error(`Hukum tajwid tidak dikenal: ${id}`);
  return rule;
}

export function groupOf(rule: LessonRuleId): RuleGroup {
  return ruleGroups.find((g) => g.rules.includes(rule))!;
}
