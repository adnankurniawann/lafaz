"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useLetterAudio } from "@/lib/recordings";
import { useGame, useHydrated } from "@/lib/store";
import { Mascot } from "./Mascot";

/**
 * Everything is stored in the browser, so pages wait until saved progress is
 * read before rendering. `requireOnboarding` sends new users to onboarding.
 */
export function AppGate({ children, requireOnboarding = true }: { children: ReactNode; requireOnboarding?: boolean }) {
  const hydrated = useHydrated();
  const onboarded = useGame((s) => s.onboarded);
  const ensureDay = useGame((s) => s.ensureDay);
  const loadAudio = useLetterAudio((s) => s.load);
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    ensureDay();
    void loadAudio();
    if (requireOnboarding && !onboarded) router.replace("/onboarding");
  }, [hydrated, onboarded, requireOnboarding, ensureDay, loadAudio, router]);

  if (!hydrated || (requireOnboarding && !onboarded)) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Mascot size={96} className="animate-bounce-soft" />
      </div>
    );
  }
  return <>{children}</>;
}
