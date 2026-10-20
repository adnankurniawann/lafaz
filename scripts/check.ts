// Quick checks for branching logic. Run: npm run check
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bestAyah, knownCount, lettersIn, type AyahLetters } from "../src/lib/ayah-letters";
import { dueKeys, updateReviews } from "../src/lib/review";
import { matchWords } from "../src/lib/speech-match";
import { arabicOf, latinOf, variants } from "../src/lib/syllables";
import { TROUBLE_EXIT, updateTrouble } from "../src/lib/trouble";
import { LEVELS, wordLevel } from "./build-reading-data";

// Huruf Bandel: a wrong answer adds the letter, TROUBLE_EXIT right answers in a row take it out.
const wrong = (letter: string) => ({ letter, correct: false });
const right = (letter: string) => ({ letter, correct: true });

let r = updateTrouble({}, [right("ba"), wrong("ba")]);
assert.deepEqual(r.trouble, { ba: 0 });
assert.deepEqual(r.added, ["ba"]);

r = updateTrouble({ ba: 1 }, [right("ba"), wrong("ba"), right("ba")]);
assert.deepEqual(r.trouble, { ba: 1 }, "a mistake resets the run");

r = updateTrouble({ ba: TROUBLE_EXIT - 1 }, [right("ba")]);
assert.deepEqual(r.trouble, {});
assert.deepEqual(r.cleared, ["ba"]);

r = updateTrouble({ ta: TROUBLE_EXIT - 1 }, [right("ta"), wrong("ta")]);
assert.deepEqual([r.added, r.cleared, r.trouble], [[], [], { ta: 0 }], "out and back in is still in, not new");

r = updateTrouble({}, [wrong("ta"), ...Array(TROUBLE_EXIT).fill(right("ta"))]);
assert.deepEqual([r.added, r.cleared, r.trouble], [[], [], {}], "in and out in one lesson is not news");

// Letters in an ayah, read from the real data.
const fatihah = JSON.parse(readFileSync("data/quran/001.json", "utf8"));
const ayahs: AyahLetters[] = fatihah.ayahs.map((a: { number: number; text: string }) => ({ surah: 1, ayah: a.number, text: a.text, letters: lettersIn(a.text) }));
assert.deepEqual(ayahs[0].letters, ["ba", "sin", "mim", "alif", "lam", "ha", "ra", "hha", "nun", "ya"], "1:1 with alif wasla as alif");
assert.ok(ayahs.every((a) => a.letters.length > 0));

const known = new Set(["alif", "ba", "ta", "tsa"]);
const best = bestAyah(ayahs, known, ["ba", "ta"]);
assert.ok(best.letters.some((l) => l === "ba" || l === "ta"), "the chosen ayah has a letter from the unit");
assert.ok(ayahs.every((a) => knownCount(a, known) / a.letters.length <= knownCount(best, known) / best.letters.length || !a.letters.some((l) => l === "ba" || l === "ta")));

// Syllable tokens: how drills are written and read.
assert.equal(latinOf("ba:kasrah"), "bi");
assert.equal(latinOf("kha:dhammah"), "khu");
assert.equal(latinOf("ra"), "ro", "heavy letters read fathah as o");
assert.equal(latinOf("alif:fathah+ba:sukun"), "ab");
assert.equal(latinOf("alif:fathah+ba:tasydid-fathah"), "abba");
assert.equal(latinOf("ba:kasrah+ya:mad"), "bii");
assert.equal(latinOf("ba:fathatain"), "ban");
assert.equal(arabicOf("ba:fathatain"), "بًا", "tanwin fathah carries an alif");
assert.ok(variants("ba:kasrah").every((v) => latinOf(v) !== "bi"), "distractors never sound like the answer");

// Reading level of real words: the first Bagian Membaca unit after which they can be read.
const level = (text: string) => LEVELS[wordLevel(text)] ?? "never";
const fatihahWords = fatihah.ayahs.flatMap((a: { words: { text: string }[] }) => a.words.map((w) => w.text));
assert.equal(level(fatihahWords[0]), "u14", "bismi needs sukun");
assert.equal(level("لَكَ"), "u10", "fathah only, joined");
assert.equal(level("رَبِّ"), "u15", "tasydid");
assert.equal(level(fatihahWords[1]), "u17", "Allah: alif washal and silent lam");

// Cek Suara: Uthmani spelling vs the model's plain spelling, word by word.
assert.deepEqual(matchWords(["بِسْمِ", "ٱللَّهِ", "ٱلرَّحْمَٰنِ", "ٱلرَّحِيمِ"], "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ"), [true, true, true, true]);
assert.deepEqual(matchWords(["مَـٰلِكِ", "يَوْمِ", "ٱلدِّينِ"], "مالك يوم"), [true, true, false], "a missing word is marked");
assert.deepEqual(matchWords(["قُلْ", "هُوَ"], ""), [false, false]);
assert.deepEqual(matchWords(["مَـٰلِكِ"], "مَالِكِينَ"), [true], "the model adds an ending to a short clip of the qari");
assert.deepEqual(matchWords(["لَكَ"], "مَعَ"), [false], "a different word still fails");

// Latihan Ulang terjadwal: right moves up a box, wrong goes back to box 1.
let reviews = updateReviews({}, [{ key: "ba", correct: true }], "2026-10-20");
assert.deepEqual(reviews.ba, { box: 1, due: "2026-10-21" });
reviews = updateReviews(reviews, [{ key: "ba", correct: true }, { key: "ba", correct: true }], "2026-10-21");
assert.deepEqual(reviews.ba, { box: 2, due: "2026-10-23" }, "one step per lesson");
reviews = updateReviews(reviews, [{ key: "ba", correct: true }, { key: "ba", correct: false }], "2026-10-23");
assert.deepEqual(reviews.ba, { box: 1, due: "2026-10-24" });
assert.deepEqual(dueKeys(reviews, "2026-10-23"), []);
assert.deepEqual(dueKeys(reviews, "2026-10-24"), ["ba"]);

console.log("ok");
