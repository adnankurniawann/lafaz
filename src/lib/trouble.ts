// Huruf Bandel: letters answered wrong, with how many times in a row they have been right since.

/** Right answers in a row that take a letter out of Huruf Bandel. */
export const TROUBLE_EXIT = 3;

export type TroubleLetters = Record<string, number>;

export function updateTrouble(trouble: TroubleLetters, results: { letter: string; correct: boolean }[]) {
  const next = { ...trouble };
  for (const { letter, correct } of results) {
    if (!correct) next[letter] = 0;
    else if (letter in next && ++next[letter] >= TROUBLE_EXIT) delete next[letter];
  }
  // Compare before and after, so a letter that came and went in one lesson is not news.
  return {
    trouble: next,
    added: Object.keys(next).filter((l) => !(l in trouble)),
    cleared: Object.keys(trouble).filter((l) => !(l in next)),
  };
}
