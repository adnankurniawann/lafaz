// Cek Suara: which words of the expected text were heard in the transcript.
// The model writes plain Arabic, the mushaf uses Uthmani spelling, so both are
// reduced to a bare skeleton before comparing.

/** Letters only: no harakat or small signs, one form per letter, no alif (Uthmani often drops it). */
export function skeleton(word: string) {
  return word
    .normalize("NFC")
    .replace(/[\p{M}ـ]/gu, "")
    .replace(/[ٱأإآا]/g, "")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ء/g, "")
    .replace(/[^ء-ي]/g, "");
}

function distance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

/**
 * Close enough: one letter off for longer words, since the model also slips. On a
 * short clip the model also likes to add an ending (the qari's own مَٰلِكِ comes
 * back as مالكين), so a heard word that starts with the expected one counts too.
 */
function same(expected: string, heard: string) {
  return (
    expected === heard ||
    (expected.length >= 2 && heard.startsWith(expected)) ||
    (Math.max(expected.length, heard.length) >= 4 && distance(expected, heard) <= 1)
  );
}

/** For each expected word, whether it shows up in the transcript, in order. */
export function matchWords(expected: string[], transcript: string): boolean[] {
  const e = expected.map(skeleton);
  const h = transcript.split(/\s+/).map(skeleton).filter(Boolean);
  // Longest common subsequence with fuzzy equality, then walk back to mark matches.
  const dp = Array.from({ length: e.length + 1 }, () => new Array<number>(h.length + 1).fill(0));
  for (let i = e.length - 1; i >= 0; i--)
    for (let j = h.length - 1; j >= 0; j--) dp[i][j] = same(e[i], h[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out = e.map(() => false);
  for (let i = 0, j = 0; i < e.length && j < h.length; ) {
    if (same(e[i], h[j]) && dp[i][j] === dp[i + 1][j + 1] + 1) {
      out[i] = true;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return out;
}
