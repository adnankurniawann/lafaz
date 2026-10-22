// Soal for Level Hafalan (FR-17), built from the surah's own ayat: tikrar per
// ayah (hear it again and again, fill a missing word, recite it from memory),
// then the ayat joined, and Tes hafalan that recites the whole surah.

import { ayahGroups, type LessonNode } from "./course";
import type { Exercise } from "./exercises";
import { pick, shuffle } from "./random";

export type SurahAyah = { ref: string; text: string; translation: string; audio: string; words: string[] };

let counter = 0;
const nextId = (kind: string) => `${kind}-${++counter}`;

/** The start of an ayah, enough to tell it apart in "ayat sesudahnya". */
export const ayahStart = (a: SurahAyah) => a.words.slice(0, 4).join(" ") + (a.words.length > 4 ? " …" : "");

export function buildHafalan(lesson: LessonNode, all: SurahAyah[]): Exercise[] {
  const ayahs = all.filter((a) => lesson.ayahs!.includes(Number(a.ref.split(":")[1])));

  const listen = (a: SurahAyah): Exercise => ({ kind: "ayah-listen", id: nextId("ayah-listen"), ref: a.ref, text: a.text, translation: a.translation, audio: a.audio });

  const recite = (list: SurahAyah[], hide: boolean, test = false): Exercise => ({
    kind: "recite",
    id: nextId("recite"),
    refs: list.map((a) => a.ref),
    words: list.flatMap((a) => a.words),
    audio: list.map((a) => a.audio),
    hide,
    test,
  });

  // A one-word ayah has nothing to fill in.
  const missing = (a: SurahAyah): Exercise | undefined => {
    if (a.words.length < 2) return undefined;
    const hidden = Math.floor(Math.random() * a.words.length);
    const answer = a.words[hidden];
    const others = shuffle([...new Set(all.flatMap((x) => x.words))].filter((w) => w !== answer)).slice(0, 2);
    return { kind: "missing-word", id: nextId("missing"), ref: a.ref, words: a.words, hidden, options: shuffle([answer, ...others]), audio: a.audio };
  };

  // Ayat that start the same (Al-Kafirun 3 and 5) never stand next to each other as options.
  const next = (a: SurahAyah): Exercise | undefined => {
    const answer = all[all.indexOf(a) + 1];
    if (!answer) return undefined;
    const starts = new Set([ayahStart(answer)]);
    const others = shuffle(all.filter((x) => x !== a && x !== answer)).filter((x) => !starts.has(ayahStart(x)) && starts.add(ayahStart(x)));
    const options = shuffle([answer, ...others.slice(0, 2)]).map((x) => ({ ref: x.ref, text: ayahStart(x) }));
    return { kind: "next-ayah", id: nextId("next"), ref: a.ref, text: a.text, audio: a.audio, options, answer: answer.ref };
  };

  const list = (items: (Exercise | undefined)[]) => items.filter((e): e is Exercise => !!e);

  if (lesson.lessonKind === "uji") {
    // A few questions to warm up, then every group of ayat from memory.
    const groups = ayahGroups(all.length).map((g) => all.filter((a) => g.includes(Number(a.ref.split(":")[1]))));
    const warmUp = [...shuffle(all.slice(0, -1)).slice(0, 3).map(next), ...shuffle(all).slice(0, 2).map(missing)];
    return list([...shuffle(list(warmUp)), ...groups.map((g) => recite(g, true, true))]);
  }

  // Tikrar: each ayah heard, filled in and recited, then joined to the ones before.
  const before = all[all.indexOf(ayahs[0]) - 1];
  return list([
    before && next(before),
    ...ayahs.flatMap((a, i) => [listen(a), missing(a) ?? (i > 0 ? next(ayahs[i - 1]) : undefined), recite([a], true), i > 0 ? recite(ayahs.slice(0, i + 1), true) : undefined]),
    ayahs.length > 1 ? next(pick(ayahs.slice(0, -1))) : undefined,
  ]);
}
