"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { addDays, dayKey, daysBetween, weekKey } from "./dates";
import { questsForDay, type Quest, type QuestKind } from "./quests";

export const MAX_HEARTS = 5;
export const HEART_REFILL_MS = 4 * 60 * 60 * 1000;
export const HEART_REFILL_COST = 100;
export const STARTING_GEMS = 100;

export const DAILY_GOALS = [
  { xp: 10, label: "Santai", minutes: "5 menit / hari" },
  { xp: 20, label: "Biasa", minutes: "10 menit / hari" },
  { xp: 30, label: "Serius", minutes: "15 menit / hari" },
  { xp: 50, label: "Intens", minutes: "20 menit / hari" },
];

type Hearts = { count: number; since: number };

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
  heartGained: boolean;
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
  hearts: Hearts;
  gems: number;
  lessons: Record<string, { times: number; perfect: boolean; lastAt: number }>;
  chests: string[];
  mastery: Record<string, number>;
  quests: { day: string; items: Quest[] } | null;
  stats: { lessons: number; perfectLessons: number; bestCombo: number; recordings: number };

  finishOnboarding: (input: { motivation: string; experience: string; dailyGoal: number }) => void;
  setDailyGoal: (xp: number) => void;
  setSoundEffects: (on: boolean) => void;
  loseHeart: () => void;
  buyHeartRefill: () => boolean;
  completeLesson: (result: LessonResult) => LessonSummary;
  openChest: (id: string, gems: number) => void;
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
  hearts: { count: MAX_HEARTS, since: 0 },
  gems: STARTING_GEMS,
  lessons: {},
  chests: [],
  mastery: {},
  quests: null,
  stats: { lessons: 0, perfectLessons: 0, bestCombo: 0, recordings: 0 },
};

/** Hearts come back one at a time, every HEART_REFILL_MS. */
export function heartsAt(hearts: Hearts, now: number): Hearts {
  if (hearts.count >= MAX_HEARTS) return { count: MAX_HEARTS, since: now };
  const gained = Math.floor((now - hearts.since) / HEART_REFILL_MS);
  if (gained <= 0) return hearts;
  const count = Math.min(MAX_HEARTS, hearts.count + gained);
  return { count, since: count >= MAX_HEARTS ? now : hearts.since + gained * HEART_REFILL_MS };
}

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

function bumpQuests(items: Quest[], kind: QuestKind, amount: number, mode: "add" | "max" = "add") {
  return items.map((q) =>
    q.kind !== kind ? q : { ...q, progress: Math.min(q.target, mode === "max" ? Math.max(q.progress, amount) : q.progress + amount) },
  );
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialState,

      finishOnboarding: ({ motivation, experience, dailyGoal }) =>
        set({ onboarded: true, motivation, experience, dailyGoal }),

      setDailyGoal: (xp) => set({ dailyGoal: xp }),

      setSoundEffects: (on) => set({ soundEffects: on }),

      loseHeart: () => {
        const now = Date.now();
        const hearts = heartsAt(get().hearts, now);
        const count = Math.max(0, hearts.count - 1);
        // Start the refill clock when dropping below full.
        set({ hearts: { count, since: hearts.count >= MAX_HEARTS ? now : hearts.since } });
      },

      buyHeartRefill: () => {
        if (get().gems < HEART_REFILL_COST) return false;
        set((s) => ({ gems: s.gems - HEART_REFILL_COST, hearts: { count: MAX_HEARTS, since: Date.now() } }));
        return true;
      },

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

        // Hearts: practice gives one back.
        let hearts = heartsAt(s.hearts, now);
        const heartGained = result.practice && hearts.count < MAX_HEARTS;
        if (heartGained) hearts = { count: hearts.count + 1, since: hearts.count + 1 >= MAX_HEARTS ? now : hearts.since };

        // Mastery: each correct answer moves a letter up, a mistake moves it down a little.
        const mastery = { ...s.mastery };
        for (const { letter, correct } of result.letterResults) {
          const value = mastery[letter] ?? 0;
          mastery[letter] = Math.max(0, Math.min(1, value + (correct ? 0.08 : -0.05)));
        }

        // Quests
        const quests = freshQuests(s, today);
        let items = bumpQuests(quests.items, "xp", result.xp);
        items = bumpQuests(items, "lessons", 1);
        items = bumpQuests(items, "combo", result.maxCombo, "max");
        if (result.perfect) items = bumpQuests(items, "perfect", 1);

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

        set({
          totalXp: s.totalXp + result.xp,
          xpByDay: { ...s.xpByDay, [today]: goalBefore + result.xp },
          streak: { ...s.streak, count, lastDay: today, freezes, frozenDays },
          hearts,
          mastery,
          lessons,
          quests: { day: today, items },
          stats: {
            ...s.stats,
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
          heartGained,
        };
      },

      openChest: (id, gems) => {
        if (get().chests.includes(id)) return;
        set((s) => ({ chests: [...s.chests, id], gems: s.gems + gems }));
      },

      // Runs on app start: refill hearts, grant the weekly freeze, roll quests.
      ensureDay: () => {
        const s = get();
        const today = dayKey();
        const week = weekKey(today);
        const streak = s.streak.freezeWeek === week ? s.streak : { ...s.streak, freezes: Math.max(s.streak.freezes, 1), freezeWeek: week };
        set({ hearts: heartsAt(s.hearts, Date.now()), streak, quests: freshQuests(s, today) });
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
          gems: s.gems + quest.gems,
          quests: { ...s.quests!, items: s.quests!.items.map((q) => (q.id === id ? { ...q, claimed: true } : q)) },
        });
        return quest.gems;
      },

      resetProgress: () => set({ ...initialState }),
    }),
    { name: "lafaz-game", version: 1 },
  ),
);

/** Hearts right now, for event handlers. */
export function currentHearts() {
  return heartsAt(useGame.getState().hearts, Date.now()).count;
}

/** Hearts for rendering, refreshed every minute. */
export function useHearts() {
  const now = useNow();
  return heartsAt(useGame((s) => s.hearts), now);
}

/** False during server render and until localStorage has been read. */
export function useHydrated() {
  return useSyncExternalStore(
    (cb) => useGame.persist.onFinishHydration(cb),
    () => useGame.persist.hasHydrated(),
    () => false,
  );
}

/** Re-renders every minute so heart refills and the day change show up. */
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
