"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { BoltIcon, ChestIcon } from "@/components/icons";
import { Mascot } from "@/components/Mascot";
import { Dialog } from "@/components/Sheet";
import { dayKey } from "@/lib/dates";
import { QUEST_ICON, questTitle } from "@/lib/quests";
import { sfx } from "@/lib/sfx";
import { useGame } from "@/lib/store";

export function QuestsScreen() {
  const quests = useGame((s) => s.quests);
  const claim = useGame((s) => s.claimQuest);
  const xpToday = useGame((s) => s.xpByDay[dayKey()] ?? 0);
  const goal = useGame((s) => s.dailyGoal);
  const [reward, setReward] = useState<number | null>(null);

  const hoursLeft = 24 - new Date().getHours();

  return (
    <div className="px-4 pb-8 pt-5">
      <div className="flex items-center gap-4 rounded-2xl bg-purple p-4 text-white">
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold">Misi harian</h1>
          <p className="opacity-90">Selesaikan misi untuk dapat XP bonus. Berganti dalam {hoursLeft} jam.</p>
        </div>
        <Mascot size={80} mood="cheer" />
      </div>

      <div className="mt-5 rounded-2xl border-2 border-line p-4">
        <p className="font-extrabold">Target harian</p>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-4 flex-1 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-gold" style={{ width: `${Math.min(100, (xpToday / goal) * 100)}%` }} />
          </div>
          <span className="text-sm font-bold text-muted">
            {Math.min(xpToday, goal)}/{goal} XP
          </span>
        </div>
      </div>

      <ul className="mt-4 space-y-3">
        {quests?.items.map((q) => {
          const complete = q.progress >= q.target;
          return (
            <li key={q.id} className="flex items-center gap-3 rounded-2xl border-2 border-line p-4">
              <span className="text-3xl">{QUEST_ICON[q.kind]}</span>
              <div className="flex-1">
                <p className="font-extrabold">{questTitle(q)}</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-4 flex-1 overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${(q.progress / q.target) * 100}%` }} />
                  </div>
                  <span className="text-xs font-bold text-muted">
                    {q.progress}/{q.target}
                  </span>
                </div>
              </div>
              {q.claimed ? (
                <ChestIcon className="size-11 opacity-50" open />
              ) : complete ? (
                <button
                  type="button"
                  className="animate-bounce-soft"
                  aria-label="Buka peti"
                  onClick={() => {
                    const xp = claim(q.id);
                    if (xp) {
                      sfx.chest();
                      setReward(xp);
                    }
                  }}
                >
                  <ChestIcon className="size-12" />
                </button>
              ) : (
                <ChestIcon className="size-11 grayscale opacity-60" />
              )}
            </li>
          );
        })}
      </ul>

      {reward !== null && (
        <Dialog onClose={() => setReward(null)}>
          <ChestIcon className="mx-auto size-28 animate-pop-in" open />
          <p className="mt-3 flex items-center justify-center gap-2 text-2xl font-extrabold text-gold">
            +{reward} <BoltIcon className="size-7" />
          </p>
          <p className="text-muted">XP bonus, ikut dihitung ke target harian.</p>
          <Button className="mt-5" onClick={() => setReward(null)}>
            Mantap
          </Button>
        </Dialog>
      )}
    </div>
  );
}
