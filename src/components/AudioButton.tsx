"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { getPlayingSrc, onAudioChange, playAudio, playSequence, playSpan, playSpans, spanKey, type AudioSpan } from "@/lib/audio";
import { useGame } from "@/lib/store";

export function usePlayingSrc() {
  return useSyncExternalStore(onAudioChange, getPlayingSrc, () => null);
}

type Props = {
  /** One URL, or several played one after another. */
  src?: string | string[];
  /** A Potongan Ayat, or several played one after another. */
  span?: AudioSpan | AudioSpan[];
  /** Playback speed for a span, e.g. 0.7 to listen slowly. */
  rate?: number;
  children?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  autoPlay?: boolean;
  label?: string;
  className?: string;
};

const SIZES = {
  sm: "size-9 text-base",
  md: "size-14 text-2xl",
  lg: "size-24 text-4xl",
};

export function AudioButton({ src, span, rate = 1, size = "md", autoPlay = false, label = "Putar suara", className = "", children }: Props) {
  const srcs = src === undefined ? [] : Array.isArray(src) ? src : [src];
  const spans = span === undefined ? [] : Array.isArray(span) ? span : [span];
  const keys = spans.length ? spans.map(spanKey) : srcs;
  const playing = usePlayingSrc();
  const isPlaying = playing !== null && keys.includes(playing);
  const questEvent = useGame((s) => s.questEvent);
  const key = keys.join("|");

  const start = () => {
    if (spans.length === 1) void playSpan(spans[0], rate);
    else if (spans.length > 1) void playSpans(spans);
    else if (srcs.length === 1) void playAudio(srcs[0]);
    else void playSequence(srcs);
  };

  const play = () => {
    questEvent("listen");
    start();
  };

  // Play once when the exercise appears, like Duolingo's listening tasks.
  const [autoPlayed, setAutoPlayed] = useState<string | null>(null);
  useEffect(() => {
    if (!autoPlay || autoPlayed === key) return;
    const id = setTimeout(() => {
      setAutoPlayed(key);
      questEvent("listen");
      start();
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, key, autoPlayed, questEvent]);

  return (
    <button
      type="button"
      onClick={play}
      aria-label={label}
      className={`inline-flex shrink-0 items-center justify-center rounded-2xl border-b-4 border-blue-dark bg-blue text-white transition active:translate-y-[2px] active:border-b-2 ${SIZES[size]} ${isPlaying ? "brightness-110" : ""} ${className}`}
    >
      {children ?? <SpeakerIcon playing={isPlaying} />}
    </button>
  );
}

function SpeakerIcon({ playing }: { playing: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-[55%]" fill="currentColor" aria-hidden>
      <path d="M4 9v6h4l5 4V5L8 9H4z" />
      <path d="M16 8.5a5 5 0 0 1 0 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity={playing ? 1 : 0.85} />
      <path d="M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity={playing ? 1 : 0.5} />
    </svg>
  );
}
