"use client";

import { examplesFor, type Harakat } from "@/lib/letters";
import { letterSoundUrl, useLetterAudio } from "@/lib/recordings";
import { AudioButton } from "./AudioButton";

/**
 * Plays the recorded letter sound. Until an ustadz recording exists, plays the
 * first example word from the Qur'an instead and says so.
 */
export function LetterSound({ letter, harakat = "fathah", size = "md", autoPlay = false }: { letter: string; harakat?: Harakat; size?: "sm" | "md" | "lg"; autoPlay?: boolean }) {
  const urls = useLetterAudio((s) => s.urls);
  const url = letterSoundUrl(urls, letter, harakat);
  const fallback = examplesFor(letter)[0];
  return <AudioButton src={url ?? fallback.audio} size={size} autoPlay={autoPlay} label={url ? "Dengar bunyi huruf" : "Dengar contoh kata"} />;
}

export function useHasLetterSound() {
  const urls = useLetterAudio((s) => s.urls);
  return (letter: string, harakat: Harakat = "fathah") => !!letterSoundUrl(urls, letter, harakat);
}
