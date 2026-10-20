"use client";

import { stopAudio } from "./audio";
import { useGame } from "./store";

// Short game sounds made with the Web Audio API, so there are no audio files
// to license. Never played on top of a recitation: stopAudio() runs first.

let ctx: AudioContext | null = null;

function context() {
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, duration: number, type: OscillatorType = "sine", volume = 0.18) {
  const c = context();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, c.currentTime + start);
  gain.gain.linearRampToValueAtTime(volume, c.currentTime + start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(c.currentTime + start);
  osc.stop(c.currentTime + start + duration + 0.05);
}

function play(notes: [freq: number, start: number, duration: number, type?: OscillatorType][]) {
  if (typeof window === "undefined" || !useGame.getState().soundEffects) return;
  stopAudio();
  try {
    notes.forEach(([f, s, d, t]) => tone(f, s, d, t));
  } catch {
    // Audio is a nice-to-have; ignore browsers that refuse it.
  }
}

export const sfx = {
  correct: () =>
    play([
      [880, 0, 0.12, "triangle"],
      [1320, 0.09, 0.22, "triangle"],
    ]),
  wrong: () => {
    play([
      [220, 0, 0.18, "square"],
      [180, 0.12, 0.25, "square"],
    ]);
    navigator.vibrate?.(120);
  },
  combo: () =>
    play([
      [988, 0, 0.1, "triangle"],
      [1319, 0.08, 0.1, "triangle"],
      [1568, 0.16, 0.2, "triangle"],
    ]),
  complete: () =>
    play([
      [523, 0, 0.15, "triangle"],
      [659, 0.12, 0.15, "triangle"],
      [784, 0.24, 0.15, "triangle"],
      [1047, 0.36, 0.4, "triangle"],
    ]),
  chest: () =>
    play([
      [660, 0, 0.1, "sine"],
      [880, 0.08, 0.1, "sine"],
      [1175, 0.16, 0.1, "sine"],
      [1760, 0.24, 0.35, "sine"],
    ]),
  tap: () => play([[600, 0, 0.05, "sine"]]),
};
