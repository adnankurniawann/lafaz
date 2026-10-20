"use client";

// One audio element for everything recited (letters, words, ayat, the
// learner's own recordings), so two recitations never play over each other.
// Sound effects call stopAudio() first for the same reason.

let current: HTMLAudioElement | null = null;
let currentDone: (() => void) | null = null;
const listeners = new Set<(playing: string | null) => void>();
let playingSrc: string | null = null;
// Bumped whenever playback is interrupted, so sequences know to stop.
let generation = 0;

function notify(src: string | null) {
  playingSrc = src;
  listeners.forEach((l) => l(src));
}

export function onAudioChange(listener: (playing: string | null) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPlayingSrc() {
  return playingSrc;
}

export function stopAudio() {
  generation++;
  if (current) {
    current.pause();
    current.src = "";
    current = null;
  }
  currentDone?.();
  currentDone = null;
  notify(null);
}

type PlayOptions = { startMs?: number; endMs?: number; rate?: number };

/** Plays a URL and resolves when it ends, is stopped, or fails. */
export function playAudio(src: string, { startMs, endMs, rate = 1 }: PlayOptions = {}): Promise<void> {
  stopAudio();
  const audio = new Audio(src);
  audio.playbackRate = rate;
  current = audio;
  notify(src);

  return new Promise<void>((resolve) => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      audio.removeEventListener("timeupdate", onTime);
      if (current === audio) {
        current = null;
        currentDone = null;
        notify(null);
      }
      resolve();
    };
    const onTime = () => {
      if (endMs !== undefined && audio.currentTime * 1000 >= endMs) {
        audio.pause();
        finish();
      }
    };
    currentDone = finish;
    audio.addEventListener("ended", finish);
    audio.addEventListener("error", finish);
    audio.addEventListener("timeupdate", onTime);
    if (startMs) audio.currentTime = startMs / 1000;
    audio.play().catch(finish);
  });
}

export async function playSequence(srcs: string[], gapMs = 250) {
  for (const src of srcs) {
    const playing = playAudio(src);
    const gen = generation;
    await playing;
    // Stop the chain if something else started or stopped playback.
    if (generation !== gen) return;
    await new Promise((r) => setTimeout(r, gapMs));
    if (generation !== gen) return;
  }
}
