"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { addDays, dayKey, daysBetween, weekKey } from "./dates";
import type { BadgeId } from "./badges";
import { HARAKAT_UNITS, levelTest, lessonNodes, pathNodes, sections, unitOf, type LevelId } from "./course";
import { letters } from "./letters";
import { questsForDay, type Quest, type QuestKind } from "./quests";
import { updateReviews, type Reviews } from "./review";
import { updateTrouble, type TroubleLetters } from "./trouble";

const FATIHAH_AYAHS = Array.from({ length: 7 }, (_, i) => `1:${i + 1}`);

/** Correct "tebak dari suara" answers for the Telinga tajwid badge. */
export const EAR_BADGE = 50;

/** Mastery at which a letter counts as dikuasai. */
export const MASTERED = 0.8;

export const DAILY_GOALS = [
  { xp: 10, label: "Santai", minutes: "5 menit / hari" },
  { xp: 20, label: "Biasa", minutes: "10 menit / hari" },
  { xp: 30, label: "Serius", minutes: "15 menit / hari" },
  { xp: 50, label: "Intens", minutes: "20 menit / hari" },
];

type Streak = {
  count: number;
  lastDay: string | null;
  freezes: number;
  freezeWeek: string | null;
  frozenDays: string[];
};

export type LessonResult = {
  lessonId: string;
  xp: number;
  perfect: boolean;
  practice: boolean;
  maxCombo: number;
  letterResults: { letter: string; correct: boolean }[];
  /** Letters and syllables answered, for Latihan Ulang terjadwal. */
  itemResults: { key: string; correct: boolean }[];
  /** Ayat read in a Momen Bisa Baca, as "surah:ayah". */
  readAyahs: string[];
  /** Unit id when this was a passed Mode Tantangan. */
  challenge?: string;
  /** Rules guessed right from the qari's voice alone. */
  earRight?: number;
};

export type LessonSummary = {
  xp: number;
  streakIncreased: boolean;
  streak: number;
  usedFreezes: number;
  goalBefore: number;
  goalAfter: number;
  dailyGoal: number;
  quests: Quest[];
  questsBefore: Quest[];
  troubleAdded: string[];
  troubleCleared: string[];
  newBadges: BadgeId[];
  /** A Level that opened with this lesson. */
  newLevel?: LevelId;
};

type GameState = {
  onboarded: boolean;
  motivation: string | null;
  experience: string | null;
  dailyGoal: number;
  soundEffects: boolean;

  totalXp: number;
  xpByDay: Record<string, number>;
  streak: Streak;
  /** `skipped`: passed over by Tes Matrikulasi, counts as done but earned nothing (ADR-0010). */
  lessons: Record<string, { times: number; perfect: boolean; lastAt: number; skipped?: boolean }>;
  chests: string[];
  mastery: Record<string, number>;
  troubleLetters: TroubleLetters;
  reviews: Reviews;
  /** Ayat the learner has read in a Momen Bisa Baca: "surah:ayah" -> day. */
  readAyahs: Record<string, string>;
  badges: Partial<Record<BadgeId, string>>;
  /** Units whose Mode Tantangan has been passed. */
  challenges: string[];
  quests: { day: string; items: Quest[] } | null;
  stats: { lessons: number; perfectLessons: number; bestCombo: number; recordings: number; earRight: number };
  /** The Level shown on the Belajar tab. */
  level: LevelId;
  /** Levels the learner has opened. Once open, a Level stays open (ADR-0010). */
  levels: LevelId[];

  finishOnboarding: (input: { motivation: string; experience: string; dailyGoal: number; level?: LevelId }) => void;
  setLevel: (level: LevelId) => void;
  openLevel: (level: LevelId) => void;
  setDailyGoal: (xp: number) => void;
  setSoundEffects: (on: boolean) => void;
  completeLesson: (result: LessonResult) => LessonSummary;
  /** Tes Matrikulasi: mark every lesson before the unit as skipped. */
  skipTo: (unitId: string) => void;
  openChest: (id: string, xp: number) => void;
  ensureDay: () => void;
  questEvent: (kind: QuestKind, amount?: number) => void;
  claimQuest: (id: string) => number;
  resetProgress: () => void;
};

const initialState = {
  onboarded: false,
  motivation: null,
  experience: null,
  dailyGoal: 20,
  soundEffects: true,
  totalXp: 0,
  xpByDay: {},
  streak: { count: 0, lastDay: null, freezes: 1, freezeWeek: null, frozenDays: [] },
  lessons: {},
  chests: [],
  mastery: {},
  troubleLetters: {},
  reviews: {},
  readAyahs: {},
  badges: {},
  challenges: [],
  quests: null,
  stats: { lessons: 0, perfectLessons: 0, bestCombo: 0, recordings: 0, earRight: 0 },
  level: "iqro" as LevelId,
  levels: ["iqro"] as LevelId[],
};

/** Streak as shown today. A missed day breaks it unless freezes cover the gap. */
export function streakToday(streak: Streak, today = dayKey()): number {
  if (!streak.lastDay) return 0;
  const gap = daysBetween(streak.lastDay, today);
  if (gap <= 1) return streak.count;
  return streak.freezes >= gap - 1 ? streak.count : 0;
}

function freshQuests(state: Pick<GameState, "quests" | "dailyGoal">, today: string) {
  return state.quests?.day === today ? state.quests : { day: today, items: questsForDay(today, state.dailyGoal) };
}

/** XP outside a lesson (chests, quests) also counts toward the daily goal. */
function addXp(s: Pick<GameState, "totalXp" | "xpByDay">, xp: number) {
  const today = dayKey();
  return { totalXp: s.totalXp + xp, xpByDay: { ...s.xpByDay, [today]: (s.xpByDay[today] ?? 0) + xp } };
}

function bumpQuests(items: Quest[], kind: QuestKind, amount: number, mode: "add" | "max" = "add") {
  return items.map((q) =>
    q.kind !== kind ? q : { ...q, progress: Math.min(q.target, mode === "max" ? Math.max(q.progress, amount) : q.progress + amount) },
  );
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // "Mau mulai dari mana?" is trusted without a test (ADR-0010).
      finishOnboarding: ({ motivation, experience, dailyGoal, level = "iqro" }) =>
        set({ onboarded: true, motivation, experience, dailyGoal, level, levels: level === "iqro" ? ["iqro"] : ["iqro", level] }),

      setLevel: (level) => set((s) => (s.levels.includes(level) ? { level } : {})),

      openLevel: (level) => set((s) => ({ level, levels: s.levels.includes(level) ? s.levels : [...s.levels, level] })),

      setDailyGoal: (xp) => set({ dailyGoal: xp }),

      setSoundEffects: (on) => set({ soundEffects: on }),

      completeLesson: (result) => {
        const s = get();
        const now = Date.now();
        const today = dayKey();

        // Streak
        let { count, freezes } = s.streak;
        const { lastDay } = s.streak;
        let frozenDays = s.streak.frozenDays;
        let usedFreezes = 0;
        let streakIncreased = false;
        if (lastDay !== today) {
          streakIncreased = true;
          const gap = lastDay ? daysBetween(lastDay, today) : 0;
          if (!lastDay) count = 1;
          else if (gap === 1) count += 1;
          else if (gap > 1 && freezes >= gap - 1) {
            usedFreezes = gap - 1;
            freezes -= usedFreezes;
            frozenDays = [...frozenDays, ...Array.from({ length: usedFreezes }, (_, i) => addDays(lastDay, i + 1))];
            count += 1;
          } else count = 1;
        }

        // Mastery: each correct answer moves a letter up, a mistake moves it down a little.
        const mastery = { ...s.mastery };
        for (const { letter, correct } of result.letterResults) {
          const value = mastery[letter] ?? 0;
          mastery[letter] = Math.max(0, Math.min(1, value + (correct ? 0.08 : -0.05)));
        }

        const trouble = updateTrouble(s.troubleLetters, result.letterResults);
        const challenges = result.challenge && !s.challenges.includes(result.challenge) ? [...s.challenges, result.challenge] : s.challenges;
        const readAyahs = { ...Object.fromEntries(result.readAyahs.map((r) => [r, today])), ...s.readAyahs };

        const goalBefore = s.xpByDay[today] ?? 0;
        const lessons = result.practice
          ? s.lessons
          : {
              ...s.lessons,
              [result.lessonId]: {
                times: (s.lessons[result.lessonId]?.times ?? 0) + 1,
                perfect: result.perfect || !!s.lessons[result.lessonId]?.perfect,
                lastAt: now,
              },
            };

        // Finishing the last test of Level Iqro opens Level Tajwid.
        const newLevel = !result.practice && result.lessonId === levelTest().id && !s.levels.includes("tajwid") ? "tajwid" : undefined;
        const earRight = s.stats.earRight + (result.earRight ?? 0);

        // Badges count only lessons actually played, never ones skipped by Tes Matrikulasi.
        const played = (unitId: string) => lessonNodes.filter((l) => unitOf(l.id).id === unitId).every((l) => (lessons[l.id]?.times ?? 0) > 0);
        const sectionPlayed = (id: string) => sections.find((x) => x.id === id)!.units.every((u) => played(u.id));
        const earned: BadgeId[] = [];
        if (letters.every((l) => (mastery[l.id] ?? 0) >= MASTERED)) earned.push("kenal-huruf");
        if (HARAKAT_UNITS.every(played)) earned.push("lancar-harakat");
        if (Object.keys(readAyahs).length) earned.push("ayat-pertama");
        if (FATIHAH_AYAHS.every((r) => readAyahs[r])) earned.push("bisa-fatihah");
        if (trouble.cleared.length && !Object.keys(trouble.trouble).length) earned.push("penakluk-bandel");
        if (count >= 7) earned.push("streak-7");
        if (challenges.length) earned.push("juara-tantangan");
        if (sectionPlayed("nun-mati")) earned.push("ahli-nun");
        if (sectionPlayed("mim-mati")) earned.push("ahli-mim");
        if (sectionPlayed("qalqalah")) earned.push("ahli-qalqalah");
        if (sectionPlayed("mad")) earned.push("ahli-mad");
        if (earRight >= EAR_BADGE) earned.push("telinga-tajwid");
        const newBadges = earned.filter((b) => !s.badges[b]);

        // Quests
        const quests = freshQuests(s, today);
        let items = bumpQuests(quests.items, "xp", result.xp);
        items = bumpQuests(items, "lessons", 1);
        items = bumpQuests(items, "combo", result.maxCombo, "max");
        if (result.perfect) items = bumpQuests(items, "perfect", 1);

        set({
          totalXp: s.totalXp + result.xp,
          xpByDay: { ...s.xpByDay, [today]: goalBefore + result.xp },
          streak: { ...s.streak, count, lastDay: today, freezes, frozenDays },
          mastery,
          troubleLetters: trouble.trouble,
          reviews: updateReviews(s.reviews, result.itemResults, today),
          readAyahs,
          badges: { ...s.badges, ...Object.fromEntries(newBadges.map((b) => [b, today])) },
          challenges,
          lessons,
          quests: { day: today, items },
          ...(newLevel ? { levels: [...s.levels, newLevel] } : {}),
          stats: {
            ...s.stats,
            earRight,
            lessons: s.stats.lessons + 1,
            perfectLessons: s.stats.perfectLessons + (result.perfect ? 1 : 0),
            bestCombo: Math.max(s.stats.bestCombo, result.maxCombo),
          },
        });

        return {
          xp: result.xp,
          streakIncreased,
          streak: count,
          usedFreezes,
          goalBefore,
          goalAfter: goalBefore + result.xp,
          dailyGoal: s.dailyGoal,
          quests: items,
          questsBefore: quests.items,
          troubleAdded: trouble.added,
          troubleCleared: trouble.cleared,
          newBadges,
          newLevel,
        };
      },

      skipTo: (unitId) => {
        const s = get();
        const lessons = { ...s.lessons };
        const now = Date.now();
        for (const node of pathNodes) {
          if (unitOf(node.id).id === unitId) break;
          if (node.kind === "lesson" && !lessons[node.id]) lessons[node.id] = { times: 0, perfect: false, lastAt: now, skipped: true };
        }
        set({ lessons });
      },

      openChest: (id, xp) => {
        if (get().chests.includes(id)) return;
        set((s) => ({ chests: [...s.chests, id], ...addXp(s, xp) }));
      },

      // Runs on app start: grant the weekly freeze, roll quests.
      ensureDay: () => {
        const s = get();
        const today = dayKey();
        const week = weekKey(today);
        const streak = s.streak.freezeWeek === week ? s.streak : { ...s.streak, freezes: Math.max(s.streak.freezes, 1), freezeWeek: week };
        set({ streak, quests: freshQuests(s, today) });
      },

      questEvent: (kind, amount = 1) => {
        const s = get();
        const quests = freshQuests(s, dayKey());
        set({
          quests: { ...quests, items: bumpQuests(quests.items, kind, amount) },
          stats: kind === "record" ? { ...s.stats, recordings: s.stats.recordings + amount } : s.stats,
        });
      },

      claimQuest: (id) => {
        const s = get();
        const quest = s.quests?.items.find((q) => q.id === id);
        if (!quest || quest.claimed || quest.progress < quest.target) return 0;
        set({
          ...addXp(s, quest.xp),
          quests: { ...s.quests!, items: s.quests!.items.map((q) => (q.id === id ? { ...q, claimed: true } : q)) },
        });
        return quest.xp;
      },

      resetProgress: () => set({ ...initialState }),
    }),
    {
      name: "lafaz-game",
      version: 3,
      migrate: (persisted, version) => {
        const state = { ...(persisted as Record<string, unknown>) };
        // v2 drops hearts and gems (ADR-0004, 0006); today's quests are rolled again with XP rewards.
        if (version < 2) {
          delete state.hearts;
          delete state.gems;
          state.quests = null;
        }
        // v3 adds Levels. Whoever already passed the last Iqro test has Tajwid open.
        if (version < 3) {
          const lessons = (state.lessons ?? {}) as Record<string, unknown>;
          state.level = "iqro";
          state.levels = lessons[levelTest().id] ? ["iqro", "tajwid"] : ["iqro"];
          state.stats = { earRight: 0, ...(state.stats as object) };
        }
        return state as GameState;
      },
    },
  ),
);

/** False during server render and until localStorage has been read. */
export function useHydrated() {
  return useSyncExternalStore(
    (cb) => useGame.persist.onFinishHydration(cb),
    () => useGame.persist.hasHydrated(),
    () => false,
  );
}

/** Re-renders every minute so the day change shows up. */
export function useNow(intervalMs = 60_000) {
  return useSyncExternalStore(
    (cb) => {
      const id = setInterval(cb, intervalMs);
      return () => clearInterval(id);
    },
    () => Math.floor(Date.now() / intervalMs) * intervalMs,
    () => 0,
  );
}
