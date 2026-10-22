"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { CloseIcon, HeartIcon } from "@/components/icons";
import { Mascot } from "@/components/Mascot";
import { Dialog } from "@/components/Sheet";
import { stopAudio } from "@/lib/audio";
import type { AyahLetters } from "@/lib/ayah-letters";
import { LEVEL_TEST_ID, PLACEMENT_ID, PRACTICE_ID, TROUBLE_ID, challengeUnit, getLesson, learnedLetters, levelTest, unitOf, unitTest, units } from "@/lib/course";
import { dayKey } from "@/lib/dates";
import {
  GRADED,
  PLACEMENT_UNITS,
  buildLesson,
  buildPlacement,
  buildPractice,
  buildReview,
  exerciseKeys,
  exerciseLetters,
  type Exercise,
  type FatihahAyah,
} from "@/lib/exercises";
import type { SurahAyah } from "@/lib/hafalan-exercises";
import { pick } from "@/lib/random";
import { letterSoundUrl, useLetterAudio } from "@/lib/recordings";
import { dueKeys } from "@/lib/review";
import { sfx } from "@/lib/sfx";
import { useGame, type LessonSummary } from "@/lib/store";
import {
  FindPickExercise,
  IntroExercise,
  ListenPickExercise,
  MarkIntroExercise,
  MatchExercise,
  NamePickExercise,
  ReadExercise,
  SequenceExercise,
  SoundPickExercise,
  SpeakExercise,
  WordInitialExercise,
  WordListenExercise,
  WordStartExercise,
  correctAnswerText,
  isCorrect,
} from "./Exercises";
import { AyahListenExercise, MissingWordExercise, NextAyahExercise } from "./HafalanExercises";
import { LessonEnd } from "./LessonEnd";
import { ClipSpeakExercise, RuleCompareExercise, RuleFindExercise, RuleFromAudioExercise, RuleFromTextExercise, RuleIntroExercise } from "./TajweedExercises";

const PRAISE = ["Benar!", "Mantap!", "Bagus sekali!", "Hebat!", "Tepat!"];
const MAX_REPEATS = 2;
const CHALLENGE_LIVES = 3;
const CHALLENGE_SECONDS = 15;

type Item = { exercise: Exercise; key: string; repeat: number };
type Feedback = { correct: boolean; praise: string; timedOut?: boolean } | null;

type Props = {
  lessonId: string;
  /** Shown with its known letters lit when this lesson finishes a letter unit. */
  ayah?: AyahLetters;
  /** Al-Fatihah, for the Bagian Membaca units that read it. */
  fatihah?: FatihahAyah[];
  /** Level Hafalan: every ayah of the surah. */
  surah?: SurahAyah[];
};

export function LessonPlayer({ lessonId, ayah, fatihah, surah }: Props) {
  const audioReady = useLetterAudio((s) => s.ready);
  const [attempt, setAttempt] = useState(0);
  if (!audioReady) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Mascot size={96} className="animate-bounce-soft" />
      </div>
    );
  }
  // A new key builds a fresh question set for "Coba lagi".
  return <Lesson key={attempt} lessonId={lessonId} ayah={ayah} fatihah={fatihah} surah={surah} onRetry={() => setAttempt((a) => a + 1)} />;
}

function Lesson({ lessonId, ayah, fatihah, surah, onRetry }: Props & { onRetry: () => void }) {
  const router = useRouter();
  const trouble = lessonId === TROUBLE_ID;
  const placement = lessonId === PLACEMENT_ID;
  const practice = lessonId === PRACTICE_ID || trouble;
  const challenge = challengeUnit(lessonId);
  const isLevelTest = lessonId === LEVEL_TEST_ID;
  const lesson = getLesson(lessonId) ?? (challenge && unitTest(challenge)) ?? (isLevelTest ? levelTest() : undefined);
  const urls = useLetterAudio((s) => s.urls);
  const completeLesson = useGame((s) => s.completeLesson);
  const skipTo = useGame((s) => s.skipTo);
  const [lives, setLives] = useState(CHALLENGE_LIVES);
  const [failed, setFailed] = useState(false);
  const [stageMistakes, setStageMistakes] = useState<Record<number, number>>({});
  const [placedAt, setPlacedAt] = useState<string | null>(null);
  const [levelTestRead, setLevelTestRead] = useState<number | null>(null);
  // The letter highlight shows the first time a letter unit's test is passed.
  const [highlight] = useState(() => !!lesson && !challenge && lesson.letters.length > 0 && lesson === unitTest(unitOf(lesson.id)) && !useGame.getState().lessons[lesson.id]);

  // Built once per visit; Duolingo also varies questions between attempts.
  const [items, setItems] = useState<Item[]>(() => {
    if (!lesson && !practice && !placement) return [];
    const state = useGame.getState();
    const ctx = { hasSound: (l: string) => !!letterSoundUrl(urls, l), mastery: state.mastery, fatihah, surah };
    const learned = learnedLetters(state.lessons);
    const pool = learned.length ? learned : ["alif", "ba", "ta", "tsa"];
    const exercises = placement
      ? buildPlacement()
      : trouble
        ? buildPractice(pool, ctx, Object.keys(state.troubleLetters))
        : practice
          ? buildReview(dueKeys(state.reviews, dayKey()), pool, ctx)
          : buildLesson(lesson!, ctx);
    return exercises.map((exercise) => ({ exercise, key: exercise.id, repeat: 0 }));
  });
  const total = useMemo(() => new Set(items.map((i) => i.exercise.id)).size, [items]);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [done, setDone] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [showExit, setShowExit] = useState(false);
  const [summary, setSummary] = useState<(LessonSummary & { accuracy: number; seconds: number; perfect: boolean; challenge: boolean }) | null>(null);
  const letterResults = useRef<{ letter: string; correct: boolean }[]>([]);
  const itemResults = useRef<{ key: string; correct: boolean }[]>([]);
  const readAyahs = useRef<string[]>([]);
  const memorized = useRef<string[]>([]);
  const earRight = useRef(0);
  const answers = useRef({ right: 0, total: 0 });
  const [startedAt] = useState(() => Date.now());

  useEffect(() => () => stopAudio(), []);

  if (placedAt) return <PlacementResult unitId={placedAt} />;
  if (levelTestRead !== null) return <LevelTestResult read={levelTestRead} total={lesson?.ayahs?.length ?? 7} />;

  if (!lesson && !practice && !placement) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <Mascot mood="sad" />
        <p className="font-bold">Lesson tidak ditemukan.</p>
        <Button onClick={() => router.push("/")}>Kembali</Button>
      </div>
    );
  }

  if (summary) return <LessonEnd summary={summary} backTo={practice ? "/huruf" : "/"} ayah={highlight ? ayah : undefined} />;

  const item = items[index];
  const exercise = item.exercise;

  const record = (correct: boolean) => {
    answers.current.total += 1;
    if (correct) answers.current.right += 1;
    for (const letter of exerciseLetters(exercise)) letterResults.current.push({ letter, correct });
    for (const key of exerciseKeys(exercise)) itemResults.current.push({ key, correct });
    if (correct) {
      setDone((d) => (d.includes(exercise.id) ? d : [...d, exercise.id]));
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setMaxCombo((m) => Math.max(m, nextCombo));
      if (nextCombo >= 5 && nextCombo % 5 === 0) {
        setToast(`🔥 ${nextCombo} benar berturut-turut!`);
        setTimeout(() => setToast(null), 1800);
      }
    } else {
      setCombo(0);
      setMistakes((m) => m + 1);
      // Mode Tantangan and Tes Matrikulasi do not repeat questions.
      if (!challenge && !placement && item.repeat < MAX_REPEATS) {
        setItems((list) => [...list, { exercise, key: `${exercise.id}-r${item.repeat + 1}`, repeat: item.repeat + 1 }]);
      }
    }
  };

  const check = (timedOut = false) => {
    const correct = !timedOut && isCorrect(exercise, selected);
    record(correct);
    if (correct && exercise.kind === "rule-from-audio") earRight.current += 1;
    if (correct) sfx.correct();
    else {
      sfx.wrong();
      if (challenge) setLives((l) => l - 1);
      if (placement) setStageMistakes((m) => ({ ...m, [exercise.stage!]: (m[exercise.stage!] ?? 0) + 1 }));
    }
    setFeedback({ correct, praise: pick(PRAISE), timedOut });
  };

  // Tes Matrikulasi stops at the first stage with two mistakes and skips everything before it.
  const place = (stage: number) => {
    const unitId = PLACEMENT_UNITS[stage];
    skipTo(unitId);
    sfx.complete();
    setPlacedAt(unitId);
  };

  const next = () => {
    stopAudio();
    // Keep the answered question on screen behind the dialog, so no timer restarts.
    if (challenge && lives <= 0) return setFailed(true);
    if (placement && (stageMistakes[exercise.stage!] ?? 0) >= 2) return place(exercise.stage!);
    const nextIndex = index + 1;
    setFeedback(null);
    setSelected(null);
    if (nextIndex >= items.length) {
      if (placement) place(PLACEMENT_UNITS.length - 1);
      // Tes naik Level gives no XP; it only says whether Tajwid looks ready (ADR-0010).
      else if (isLevelTest) setLevelTestRead(new Set(readAyahs.current).size);
      else finish();
    } else setIndex(nextIndex);
  };

  const finish = () => {
    const perfect = mistakes === 0;
    const xp = (10 + (perfect ? 5 : 0) + Math.min(5, Math.floor(maxCombo / 5))) * (challenge ? 2 : 1);
    const accuracy = Math.round((answers.current.right / Math.max(1, answers.current.total)) * 100);
    const result = completeLesson({
      lessonId,
      xp,
      perfect,
      practice: practice || !!challenge,
      maxCombo,
      letterResults: letterResults.current,
      itemResults: itemResults.current,
      readAyahs: readAyahs.current,
      memorizedAyahs: memorized.current,
      challenge: challenge?.id,
      earRight: earRight.current,
    });
    sfx.complete();
    setSummary({ ...result, accuracy, seconds: Math.round((Date.now() - startedAt) / 1000), perfect, challenge: !!challenge });
  };

  // Exercises that finish on their own (intro, match, speak) skip PERIKSA.
  const selfDone = (correct: boolean, countAsAnswer = true) => {
    if (countAsAnswer) record(correct);
    else setDone((d) => (d.includes(exercise.id) ? d : [...d, exercise.id]));
    if (countAsAnswer) sfx.correct();
    setFeedback({ correct: true, praise: correct ? pick(PRAISE) : "Bagus, terus berlatih!" });
  };

  const choiceState = { selected, checked: feedback !== null };
  const progress = done.length / total;
  const answer = feedback && !feedback.correct ? correctAnswerText(exercise) : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center gap-3 px-4 pt-4">
        <button type="button" onClick={() => setShowExit(true)} aria-label="Keluar" className="text-[#b5b5b5]">
          <CloseIcon />
        </button>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-green transition-all duration-500" style={{ width: `${Math.max(4, progress * 100)}%` }}>
            <div className="mx-2 mt-1 h-1 rounded-full bg-white/40" />
          </div>
        </div>
        {practice && <span className="text-sm font-extrabold text-blue">{trouble ? "Taklukkan" : "Latihan"}</span>}
        {(placement || isLevelTest) && <span className="text-sm font-extrabold text-purple">Tes</span>}
        {challenge && (
          <span className="flex gap-0.5" aria-label={`${lives} nyawa`}>
            {Array.from({ length: CHALLENGE_LIVES }, (_, i) => (
              <HeartIcon key={i} className="size-6" empty={i >= lives} />
            ))}
          </span>
        )}
      </header>
      {challenge && GRADED.includes(exercise.kind) && !feedback && (
        <TimerBar key={`timer-${item.key}`} seconds={CHALLENGE_SECONDS} onTimeout={() => check(true)} />
      )}

      {toast && <div className="mx-auto mt-3 rounded-full bg-orange px-4 py-1 text-sm font-extrabold text-white animate-pop-in">{toast}</div>}
      {combo >= 2 && !toast && <p className="mt-2 text-center text-xs font-extrabold uppercase tracking-wider text-orange">{combo} benar beruntun</p>}

      <main className="flex-1 px-4 pb-48 pt-6" key={item.key}>
        {item.repeat > 0 && <p className="mb-3 text-sm font-extrabold uppercase tracking-wider text-orange">Soal yang tadi salah</p>}
        {exercise.kind === "intro" && <IntroExercise exercise={exercise} />}
        {exercise.kind === "listen-pick" && <ListenPickExercise exercise={exercise} state={choiceState} onSelect={setSelected} />}
        {exercise.kind === "word-initial" && <WordInitialExercise exercise={exercise} state={choiceState} onSelect={setSelected} />}
        {exercise.kind === "sound-pick" && <SoundPickExercise exercise={exercise} state={choiceState} onSelect={setSelected} />}
        {exercise.kind === "name-pick" && <NamePickExercise exercise={exercise} state={choiceState} onSelect={setSelected} />}
        {exercise.kind === "sequence" && <SequenceExercise exercise={exercise} state={choiceState} onSelect={setSelected} />}
        {exercise.kind === "match" && <MatchExercise exercise={exercise} onDone={() => selfDone(true)} />}
        {exercise.kind === "speak" && <SpeakExercise exercise={exercise} onDone={(skipped) => selfDone(true, !skipped)} />}
        {exercise.kind === "mark-intro" && <MarkIntroExercise exercise={exercise} />}
        {exercise.kind === "find-pick" && <FindPickExercise exercise={exercise} state={choiceState} onSelect={setSelected} />}
        {exercise.kind === "word-start" && <WordStartExercise exercise={exercise} state={choiceState} onSelect={setSelected} />}
        {exercise.kind === "word-listen" && <WordListenExercise exercise={exercise} state={choiceState} onSelect={setSelected} />}
        {exercise.kind === "rule-intro" && <RuleIntroExercise exercise={exercise} />}
        {exercise.kind === "rule-compare" && <RuleCompareExercise exercise={exercise} state={choiceState} onSelect={setSelected} />}
        {exercise.kind === "rule-from-text" && <RuleFromTextExercise exercise={exercise} state={choiceState} onSelect={setSelected} />}
        {exercise.kind === "rule-from-audio" && <RuleFromAudioExercise exercise={exercise} state={choiceState} onSelect={setSelected} />}
        {exercise.kind === "rule-find" && <RuleFindExercise exercise={exercise} state={choiceState} onSelect={setSelected} />}
        {exercise.kind === "clip-speak" && <ClipSpeakExercise exercise={exercise} onDone={(skipped) => selfDone(true, !skipped)} />}
        {exercise.kind === "ayah-listen" && <AyahListenExercise exercise={exercise} />}
        {exercise.kind === "missing-word" && <MissingWordExercise exercise={exercise} state={choiceState} onSelect={setSelected} />}
        {exercise.kind === "next-ayah" && <NextAyahExercise exercise={exercise} state={choiceState} onSelect={setSelected} />}
        {exercise.kind === "recite" && (
          <ReadExercise
            exercise={exercise}
            onDone={(recited) => {
              // Recited in Tes hafalan without peeking: "sudah hafal" on the Peta Ayat.
              if (recited && exercise.test) memorized.current.push(...exercise.refs);
              selfDone(true, false);
            }}
          />
        )}
        {exercise.kind === "read" && (
          <ReadExercise
            exercise={exercise}
            onDone={(read) => {
              // An ayah read aloud lights its "bisa dibaca" mark on the Peta Ayat.
              if (read && exercise.ref.split(":").length === 2) readAyahs.current.push(exercise.ref);
              selfDone(true, false);
            }}
          />
        )}
      </main>

      <footer
        className={`fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[430px] border-t-2 px-4 pb-6 pt-4 ${
          !feedback ? "border-line bg-white" : feedback.correct ? "border-transparent bg-[#d7ffb8]" : "border-transparent bg-[#ffdfe0]"
        } ${feedback ? "animate-slide-up" : ""}`}
      >
        {feedback && (
          <div className={`mb-4 ${feedback.correct ? "text-green-dark" : "text-red-dark"}`}>
            <p className="text-2xl font-extrabold">{feedback.correct ? feedback.praise : feedback.timedOut ? "Waktu habis" : "Kurang tepat"}</p>
            {answer && (
              <p className="mt-1 flex items-center gap-2 font-bold">
                Jawaban benar: <span className="arabic-big text-3xl leading-normal">{answer.arabic}</span> {answer.text}
              </p>
            )}
            {!feedback.correct && GRADED.includes(exercise.kind) && !practice && !challenge && !placement && <p className="text-sm">Soal ini akan muncul lagi di akhir.</p>}
          </div>
        )}
        {(exercise.kind === "intro" || exercise.kind === "mark-intro" || exercise.kind === "rule-intro" || exercise.kind === "ayah-listen") && !feedback ? (
          <Button
            onClick={() => {
              setDone((d) => [...d, exercise.id]);
              next();
            }}
          >
            Lanjut
          </Button>
        ) : feedback ? (
          <Button color={feedback.correct ? "green" : "red"} onClick={next}>
            Lanjut
          </Button>
        ) : exercise.kind === "match" || exercise.kind === "speak" || exercise.kind === "read" || exercise.kind === "recite" || exercise.kind === "clip-speak" ? null : (
          <Button disabled={selected === null} onClick={() => check()}>
            Periksa
          </Button>
        )}
      </footer>

      {showExit && (
        <Dialog onClose={() => setShowExit(false)}>
          <Mascot mood="sad" size={96} className="mx-auto" />
          <h2 className="mt-2 text-xl font-extrabold">Yakin mau keluar?</h2>
          <p className="mt-1 text-muted">Progres lesson ini akan hilang.</p>
          <div className="mt-5 space-y-3">
            <Button color="blue" onClick={() => setShowExit(false)}>
              Lanjut belajar
            </Button>
            <Button color="ghost" className="text-red" onClick={() => router.push("/")}>
              Keluar
            </Button>
          </div>
        </Dialog>
      )}

      {failed && (
        <Dialog>
          <div className="flex justify-center gap-1">
            {Array.from({ length: CHALLENGE_LIVES }, (_, i) => (
              <HeartIcon key={i} className="size-8" empty />
            ))}
          </div>
          <h2 className="mt-3 text-xl font-extrabold">Nyawa habis</h2>
          <p className="mt-1 text-muted">Tantangan belum lulus. Tidak apa-apa, coba lagi kapan saja.</p>
          <div className="mt-5 space-y-3">
            <Button color="blue" onClick={onRetry}>
              Coba lagi
            </Button>
            <Button color="ghost" onClick={() => router.push("/")}>
              Kembali
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

/** Where Tes Matrikulasi put the learner. Earlier lessons are skipped: open, but no XP or badges (ADR-0010). */
function PlacementResult({ unitId }: { unitId: string }) {
  const router = useRouter();
  const unit = units.find((u) => u.id === unitId)!;
  return (
    <div className="flex min-h-dvh flex-col px-5 pb-6 pt-10">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <Mascot mood="cheer" size={140} className="animate-pop-in" />
        <h1 className="mt-4 text-2xl font-extrabold">{unit.number === 1 ? "Kita mulai dari huruf pertama" : `Kamu mulai dari Unit ${unit.number}`}</h1>
        <p className="mt-1 text-xl font-extrabold text-green">{unit.title}</p>
        <p className="mt-3 text-muted">
          {unit.number === 1
            ? "Tidak apa-apa, huruf-huruf ini cepat dikenali kok."
            : "Unit sebelumnya terbuka dan bisa diulang kapan saja, tapi tidak memberi XP atau badge karena dilewati lewat tes."}
        </p>
      </div>
      <Button onClick={() => router.push("/")}>Mulai belajar</Button>
    </div>
  );
}

/**
 * Result of Tes naik Level, which opens Tajwid and Hafalan side by side. Not
 * passing only gives advice: "Tetap masuk" still opens the chosen Level, since
 * the gate protects, it does not punish (ADR-0010).
 */
function LevelTestResult({ read, total }: { read: number; total: number }) {
  const router = useRouter();
  const openLevel = useGame((s) => s.openLevel);
  const setLevel = useGame((s) => s.setLevel);
  const passed = read >= total;
  const enter = (level: "tajwid" | "hafalan") => {
    if (passed) openLevel(level === "tajwid" ? "hafalan" : "tajwid");
    openLevel(level);
    router.push("/");
  };
  return (
    <div className="flex min-h-dvh flex-col px-5 pb-6 pt-10">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <Mascot mood={passed ? "cheer" : "think"} size={140} className="animate-pop-in" />
        <h1 className="mt-4 text-2xl font-extrabold">{passed ? "Level Tajwid dan Hafalan terbuka!" : "Hampir!"}</h1>
        <p className="mt-3 text-muted">
          {passed
            ? `Kamu membaca ${read} dari ${total} ayat Al-Fatihah. Mau mulai dari mana: belajar tajwid lewat mendengar, atau menghafal juz amma?`
            : `Kamu membaca ${read} dari ${total} ayat Al-Fatihah. Saran kami, selesaikan dulu Bagian Membaca di Level Iqro supaya lebih mudah diikuti.`}
        </p>
      </div>
      <div className="space-y-3">
        <Button onClick={() => enter("tajwid")}>{passed ? "Mulai Tajwid" : "Tetap masuk Tajwid"}</Button>
        <Button color={passed ? "blue" : "white"} onClick={() => enter("hafalan")}>
          {passed ? "Mulai Hafalan" : "Tetap masuk Hafalan"}
        </Button>
        {!passed && (
          <button
            type="button"
            onClick={() => {
              setLevel("iqro");
              router.push("/");
            }}
            className="block w-full py-2 text-sm font-extrabold uppercase tracking-wide text-muted"
          >
            Kembali ke Iqro
          </button>
        )}
      </div>
    </div>
  );
}

/** Shrinks over `seconds`, then counts the question as wrong. */
function TimerBar({ seconds, onTimeout }: { seconds: number; onTimeout: () => void }) {
  const latest = useRef(onTimeout);
  useEffect(() => {
    latest.current = onTimeout;
  });
  useEffect(() => {
    const id = setTimeout(() => latest.current(), seconds * 1000);
    return () => clearTimeout(id);
  }, [seconds]);
  return (
    <div className="mx-4 mt-3 h-2 overflow-hidden rounded-full bg-line" role="timer" aria-label={`${seconds} detik per soal`}>
      <div className="h-full origin-left rounded-full bg-orange" style={{ animation: `timer-shrink ${seconds}s linear forwards` }} />
    </div>
  );
}
