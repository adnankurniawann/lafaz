// Quick checks for branching logic. Run: npm run check
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bestAyah, knownCount, lettersIn, type AyahLetters } from "../src/lib/ayah-letters";
import { dueKeys, updateReviews } from "../src/lib/review";
import { matchWords } from "../src/lib/speech-match";
import { arabicOf, latinOf, variants } from "../src/lib/syllables";
import { TROUBLE_EXIT, updateTrouble } from "../src/lib/trouble";
import { LEVELS, wordLevel } from "./build-reading-data";
import { detectIzharHalqi, detectIzharSyafawi, qalqalahKind } from "./build-tajweed-examples";
import { getClip, getExampleAyah, isClean, marksIn } from "../src/lib/clips";
import { ayahGroups, lessonNodes, nodeStates, sections } from "../src/lib/course";
import { buildLesson } from "../src/lib/exercises";
import { ayahStart, type SurahAyah } from "../src/lib/hafalan-exercises";

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

// Level Tajwid: izhar and qalqalah from the real Teks Utsmani (docs/DATA.md §3).
const surah = (n: number) => JSON.parse(readFileSync(`data/quran/${String(n).padStart(3, "0")}.json`, "utf8"));
const ayahText = (n: number, a: number) => surah(n).ayahs[a - 1].text as string;
const spans = (text: string, found: { start: number; end: number }[]) => found.map((f) => text.slice(f.start, f.end));
assert.deepEqual(spans(ayahText(1, 7), detectIzharHalqi(ayahText(1, 7))), ["نْع"], "nun sukun before 'ain in 1:7");
assert.ok(spans(ayahText(112, 4), detectIzharHalqi(ayahText(112, 4))).includes("وًا أ"), "fathatan, silent alif, then hamzah in 112:4");
assert.deepEqual(detectIzharHalqi(ayahText(112, 1)), [], "a tanwin at the end of the ayah is a stop, not izhar");
assert.ok(spans(ayahText(1, 7), detectIzharSyafawi(ayahText(1, 7))).includes("مْ غ"), "mim sukun before ghain in 1:7");
assert.equal(qalqalahKind(ayahText(112, 4), ayahText(112, 4).lastIndexOf("د") + 1), "qalqalah-kubra", "dal at the end of 112:4");
assert.equal(qalqalahKind("يَقْ رَ", 3), "qalqalah-sughra");

// Every Level starts its own path: the first Tajwid lesson is open with Iqro untouched.
const states = nodeStates({}, []);
assert.equal(states.get("u1-1"), "current");
assert.equal(states.get("t1-1"), "current");
assert.equal(states.get("t1-2"), "locked");

// Tajwid questions: built for every lesson, and every answer holds up.
for (const lesson of lessonNodes.filter((l) => l.rules)) {
  for (let round = 0; round < 5; round++) {
    const exercises = buildLesson(lesson, { hasSound: () => false });
    assert.ok(exercises.length >= 6, `${lesson.id} has enough questions`);
    for (const e of exercises) {
      if (e.kind === "rule-compare") {
        const [target, other] = [getClip(e.clips[e.answer]), getClip(e.clips[1 - e.answer])];
        assert.equal(target.mark.rule, e.rule, `${lesson.id}: the answer clip has the rule`);
        assert.ok(!marksIn(other).some((m) => m.rule === e.rule), `${lesson.id}: the other clip does not`);
      }
      if (e.kind === "rule-from-audio") assert.ok(isClean(getClip(e.clip)), `${lesson.id}: by ear only with one rule of the group`);
      if (e.kind === "rule-from-text" || e.kind === "rule-from-audio") assert.ok(e.options.includes(getClip(e.clip).mark.rule) && e.options.length >= 2);
      if (e.kind === "rule-find") {
        assert.ok(e.answers.length > 0, `${lesson.id}: the ayah has the rule`);
        assert.ok(e.answers.every((w) => w < getExampleAyah(e.ayah).words.length));
      }
    }
  }
}
assert.ok(sections.filter((s) => s.level === "tajwid").length === 4, "nun mati, mim mati, qalqalah, mad");

// Level Hafalan: ayat in groups of 3, never a lone ayah at the end.
assert.deepEqual(ayahGroups(3), [[1, 2, 3]]);
assert.deepEqual(ayahGroups(4), [[1, 2, 3, 4]], "Al-Ikhlas is one group");
assert.deepEqual(ayahGroups(6), [[1, 2, 3], [4, 5, 6]]);
assert.deepEqual(ayahGroups(7), [[1, 2, 3], [4, 5, 6, 7]]);
assert.deepEqual(ayahGroups(8), [[1, 2, 3], [4, 5, 6], [7, 8]]);
assert.equal(states.get("h1-1"), "current", "Level Hafalan starts its own path");
assert.equal(states.get("h114-1"), "locked");

// Hafalan questions from the real surahs: every answer holds up, and options can be told apart.
const surahAyahs = (n: number): SurahAyah[] =>
  surah(n).ayahs.map((a: { number: number; text: string; translation: string; audio: string; words: { text: string }[] }) => ({ ref: `${n}:${a.number}`, text: a.text, translation: a.translation, audio: a.audio, words: a.words.map((w) => w.text) }));
for (const lesson of lessonNodes.filter((l) => l.surah)) {
  const all = surahAyahs(lesson.surah!);
  for (let round = 0; round < 3; round++) {
    const exercises = buildLesson(lesson, { hasSound: () => false, surah: all });
    assert.ok(exercises.some((e) => e.kind === "recite"), `${lesson.id} recites`);
    if (lesson.lessonKind === "uji") {
      const tested = exercises.flatMap((e) => (e.kind === "recite" && e.test ? e.refs : []));
      assert.deepEqual(tested, all.map((a) => a.ref), `${lesson.id}: Tes hafalan covers every ayah once, in order`);
    }
    for (const e of exercises) {
      if (e.kind === "missing-word") assert.ok(e.options.includes(e.words[e.hidden]) && new Set(e.options).size === e.options.length, `${lesson.id}: missing word`);
      if (e.kind === "next-ayah") {
        const i = all.findIndex((a) => a.ref === e.ref);
        assert.equal(e.answer, all[i + 1].ref, `${lesson.id}: the answer comes right after`);
        assert.equal(new Set(e.options.map((o) => o.text)).size, e.options.length, `${lesson.id}: options start differently`);
        assert.ok(e.options.length >= 2);
      }
    }
  }
}
const kafirun = surahAyahs(109);
assert.equal(ayahStart(kafirun[2]), ayahStart(kafirun[4]), "Al-Kafirun 3 and 5 start the same, the case the options guard against");

console.log("ok");
