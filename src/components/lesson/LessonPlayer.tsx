"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { CloseIcon, GemIcon, HeartIcon } from "@/components/icons";
import { Mascot } from "@/components/Mascot";
import { Dialog } from "@/components/Sheet";
import { stopAudio } from "@/lib/audio";
import { PRACTICE_ID, getLesson, learnedLetters } from "@/lib/course";
import { GRADED, buildLesson, buildPractice, exerciseLetters, type Exercise } from "@/lib/exercises";
import { pick } from "@/lib/random";
import { letterSoundUrl, useLetterAudio } from "@/lib/recordings";
import { sfx } from "@/lib/sfx";
import { HEART_REFILL_COST, currentHearts, useGame, useHearts, type LessonSummary } from "@/lib/store";
import {
  IntroExercise,
  ListenPickExercise,
  MatchExercise,
  NamePickExercise,
  SequenceExercise,
  SoundPickExercise,
  SpeakExercise,
  WordInitialExercise,
  correctAnswerText,
  correctValue,
} from "./Exercises";
import { LessonEnd } from "./LessonEnd";

const PRAISE = ["Benar!", "Mantap!", "Bagus sekali!", "Hebat!", "Tepat!"];
const MAX_REPEATS = 2;

type Item = { exercise: Exercise; key: string; repeat: number };
type Feedback = { correct: boolean; praise: string } | null;

export function LessonPlayer({ lessonId }: { lessonId: string }) {
  const audioReady = useLetterAudio((s) => s.ready);
  if (!audioReady) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Mascot size={96} className="animate-bounce-soft" />
      </div>
    );
  }
  return <Lesson lessonId={lessonId} />;
}

function Lesson({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const practice = lessonId === PRACTICE_ID;
  const lesson = getLesson(lessonId);
  const urls = useLetterAudio((s) => s.urls);
  const loseHeart = useGame((s) => s.loseHeart);
  const completeLesson = useGame((s) => s.completeLesson);
  const buyHeartRefill = useGame((s) => s.buyHeartRefill);
  const gems = useGame((s) => s.gems);
  const hearts = useHearts().count;

  // Built once per visit; Duolingo also varies questions between attempts.
  const [items, setItems] = useState<Item[]>(() => {
    if (!lesson && !practice) return [];
    const state = useGame.getState();
    const ctx = { hasSound: (l: string) => !!letterSoundUrl(urls, l), mastery: state.mastery };
    const exercises = practice ? buildPractice(learnedLetters(state.lessons).length ? learnedLetters(state.lessons) : ["alif", "ba", "ta", "tsa"], ctx) : buildLesson(lesson!, ctx);
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
  const [showNoHearts, setShowNoHearts] = useState(false);
  const [summary, setSummary] = useState<(LessonSummary & { accuracy: number; seconds: number; perfect: boolean }) | null>(null);
  const letterResults = useRef<{ letter: string; correct: boolean }[]>([]);
  const answers = useRef({ right: 0, total: 0 });
  const [startedAt] = useState(() => Date.now());

  useEffect(() => () => stopAudio(), []);

  if (!lesson && !practice) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <Mascot mood="sad" />
        <p className="font-bold">Lesson tidak ditemukan.</p>
        <Button onClick={() => router.push("/")}>Kembali</Button>
      </div>
    );
  }

  if (summary) return <LessonEnd summary={summary} practice={practice} />;

  const item = items[index];
  const exercise = item.exercise;

  const record = (correct: boolean) => {
    answers.current.total += 1;
    if (correct) answers.current.right += 1;
    for (const letter of exerciseLetters(exercise)) letterResults.current.push({ letter, correct });
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
      if (item.repeat < MAX_REPEATS) {
        setItems((list) => [...list, { exercise, key: `${exercise.id}-r${item.repeat + 1}`, repeat: item.repeat + 1 }]);
      }
    }
  };

  const check = () => {
    const correct = selected === correctValue(exercise);
    record(correct);
    if (correct) sfx.correct();
    else {
      sfx.wrong();
      if (!practice && GRADED.includes(exercise.kind)) loseHeart();
    }
    setFeedback({ correct, praise: pick(PRAISE) });
  };

  const next = () => {
    const nextIndex = index + 1;
    setFeedback(null);
    setSelected(null);
    stopAudio();
    if (nextIndex >= items.length) {
      finish();
      return;
    }
    if (!practice && currentHearts() <= 0) {
      setShowNoHearts(true);
      return;
    }
    setIndex(nextIndex);
  };

  const finish = () => {
    const perfect = mistakes === 0;
    const xp = 10 + (perfect ? 5 : 0) + Math.min(5, Math.floor(maxCombo / 5));
    const accuracy = Math.round((answers.current.right / Math.max(1, answers.current.total)) * 100);
    const result = completeLesson({ lessonId, xp, perfect, practice, maxCombo, letterResults: letterResults.current });
    sfx.complete();
    setSummary({ ...result, accuracy, seconds: Math.round((Date.now() - startedAt) / 1000), perfect });
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
        {practice ? (
          <span className="text-sm font-extrabold text-blue">Latihan</span>
        ) : (
          <span className="flex items-center gap-1 font-extrabold text-red">
            <HeartIcon />
            {hearts}
          </span>
        )}
      </header>

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
      </main>

      <footer
        className={`fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[430px] border-t-2 px-4 pb-6 pt-4 ${
          !feedback ? "border-line bg-white" : feedback.correct ? "border-transparent bg-[#d7ffb8]" : "border-transparent bg-[#ffdfe0]"
        } ${feedback ? "animate-slide-up" : ""}`}
      >
        {feedback && (
          <div className={`mb-4 ${feedback.correct ? "text-green-dark" : "text-red-dark"}`}>
            <p className="text-2xl font-extrabold">{feedback.correct ? feedback.praise : "Kurang tepat"}</p>
            {answer && (
              <p className="mt-1 flex items-center gap-2 font-bold">
                Jawaban benar: <span className="arabic-big text-3xl leading-normal">{answer.arabic}</span> {answer.text}
              </p>
            )}
            {!feedback.correct && GRADED.includes(exercise.kind) && !practice && <p className="text-sm">Soal ini akan muncul lagi di akhir.</p>}
          </div>
        )}
        {exercise.kind === "intro" && !feedback ? (
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
        ) : exercise.kind === "match" || exercise.kind === "speak" ? null : (
          <Button disabled={selected === null} onClick={check}>
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

      {showNoHearts && (
        <Dialog>
          <div className="flex justify-center gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <HeartIcon key={i} className="size-8" empty />
            ))}
          </div>
          <h2 className="mt-3 text-xl font-extrabold">Hatimu habis</h2>
          <p className="mt-1 text-muted">Isi hati untuk melanjutkan lesson ini, atau latihan dulu untuk mendapatkan hati.</p>
          <div className="mt-5 space-y-3">
            <Button
              color="blue"
              disabled={gems < HEART_REFILL_COST}
              onClick={() => {
                if (buyHeartRefill()) {
                  setShowNoHearts(false);
                  setIndex(index + 1);
                }
              }}
            >
              Isi penuh · <GemIcon className="size-5" /> {HEART_REFILL_COST}
            </Button>
            <Button color="white" onClick={() => router.push(`/lesson/${PRACTICE_ID}`)}>
              Latihan, dapat +1 hati
            </Button>
            <Button color="ghost" className="text-red" onClick={() => router.push("/")}>
              Akhiri lesson
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
