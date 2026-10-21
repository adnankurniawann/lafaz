"use client";

// One audio element for everything recited (letters, words, ayat, the
// learner's own recordings), so two recitations never play over each other.
// Sound effects call stopAudio() first for the same reason.

let current: HTMLAudioElement | null = null;
let currentDone: (() => void) | null = null;
const listeners = new Set<(playing: string | null) => void>();
let playingKey: string | null = null;
// Bumped whenever playback is interrupted, so sequences know to stop.
let generation = 0;

/** Part of a longer recording, such as a Potongan Ayat cut from the full ayah audio. */
export type AudioSpan = { src: string; startMs: number; endMs: number };

function notify(key: string | null) {
  playingKey = key;
  listeners.forEach((l) => l(key));
}

export function onAudioChange(listener: (playing: string | null) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The src, or spanKey, of what is playing now. */
export function getPlayingSrc() {
  return playingKey;
}

export function spanKey(span: AudioSpan) {
  return `${span.src}#${span.startMs}-${span.endMs}`;
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

type PlayOptions = { startMs?: number; endMs?: number; rate?: number; key?: string };

/** Plays a URL and resolves when it ends, is stopped, or fails. */
export function playAudio(src: string, { startMs, endMs, rate = 1, key = src }: PlayOptions = {}): Promise<void> {
  stopAudio();
  const audio = new Audio(src);
  audio.preload = "auto";
  current = audio;
  notify(key);

  return new Promise<void>((resolve) => {
    let finished = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    const finish = () => {
      if (finished) return;
      finished = true;
      if (timer) clearInterval(timer);
      if (current === audio) {
        audio.pause();
        current = null;
        currentDone = null;
        notify(null);
      }
      resolve();
    };
    currentDone = finish;
    audio.addEventListener("ended", finish);
    audio.addEventListener("error", finish);

    const start = () => {
      if (finished) return;
      if (startMs) audio.currentTime = startMs / 1000;
      audio.playbackRate = rate;
      // timeupdate fires only every ~250 ms, too late to stop between two words.
      if (endMs !== undefined) timer = setInterval(() => audio.currentTime * 1000 >= endMs && finish(), 15);
      audio.play().catch(finish);
    };
    // Seeking before the metadata is in can be ignored, so wait for it.
    if (startMs && audio.readyState < HTMLMediaElement.HAVE_METADATA) audio.addEventListener("loadedmetadata", start, { once: true });
    else start();
  });
}

/** Plays a Potongan Ayat. `rate` below 1 plays it slowly, at the same pitch. */
export function playSpan(span: AudioSpan, rate = 1) {
  return playAudio(span.src, { startMs: span.startMs, endMs: span.endMs, rate, key: spanKey(span) });
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

/** Plays spans one after another with a pause between, e.g. "A" then "B". */
export async function playSpans(spans: AudioSpan[], gapMs = 700) {
  for (const span of spans) {
    const playing = playSpan(span);
    const gen = generation;
    await playing;
    if (generation !== gen) return;
    await new Promise((r) => setTimeout(r, gapMs));
    if (generation !== gen) return;
  }
}
