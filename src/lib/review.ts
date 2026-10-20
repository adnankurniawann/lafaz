// Latihan Ulang terjadwal, Leitner style. Each letter or syllable sits in a box;
// a lesson with no mistake on it moves it up a box, a mistake sends it back to box 1.

import { addDays } from "./dates";

/** Days until the next review, for boxes 1 to 5. */
export const REVIEW_DAYS = [1, 2, 4, 8, 16];

export type Reviews = Record<string, { box: number; due: string }>;

export function updateReviews(reviews: Reviews, results: { key: string; correct: boolean }[], today: string): Reviews {
  // One step per lesson: a key answered several times counts as right only if it was always right.
  const outcome = new Map<string, boolean>();
  for (const { key, correct } of results) outcome.set(key, (outcome.get(key) ?? true) && correct);
  const next = { ...reviews };
  for (const [key, correct] of outcome) {
    const box = correct ? Math.min(REVIEW_DAYS.length, (next[key]?.box ?? 0) + 1) : 1;
    next[key] = { box, due: addDays(today, REVIEW_DAYS[box - 1]) };
  }
  return next;
}

/** Keys due today or earlier, the most overdue and lowest box first. */
export function dueKeys(reviews: Reviews, today: string): string[] {
  return Object.entries(reviews)
    .filter(([, r]) => r.due <= today)
    .sort(([, a], [, b]) => a.due.localeCompare(b.due) || a.box - b.box)
    .map(([key]) => key);
}
