"use client";

// Cek Suara: the model downloads in the background after onboarding. Until it
// is ready, speaking stays Nilai Sendiri. Audio never leaves the device (ADR-0008).

import { create } from "zustand";

type SpeechState = { status: "idle" | "loading" | "ready" | "error"; progress: number };

export const useSpeech = create<SpeechState>(() => ({ status: "idle", progress: 0 }));

let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, { resolve: (text: string) => void; reject: (err: Error) => void }>();

type WorkerMessage =
  | { type: "progress"; progress: number }
  | { type: "ready" }
  | { type: "result"; id: number; text: string }
  | { type: "error"; id?: number; message: string };

function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL("./speech-worker.ts", import.meta.url), { type: "module" });
  worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
    const m = e.data;
    if (m.type === "progress") useSpeech.setState({ status: "loading", progress: m.progress });
    else if (m.type === "ready") useSpeech.setState({ status: "ready", progress: 100 });
    else if (m.type === "result") {
      pending.get(m.id)?.resolve(m.text);
      pending.delete(m.id);
    } else if (m.id !== undefined) {
      pending.get(m.id)?.reject(new Error(m.message));
      pending.delete(m.id);
    } else {
      console.error("Cek Suara:", m.message);
      useSpeech.setState({ status: "error" });
    }
  };
  // A crash inside the worker (e.g. the browser cannot run the model) never posts a message.
  worker.onerror = (e) => {
    console.error("Cek Suara worker:", e.message);
    for (const p of pending.values()) p.reject(new Error(e.message));
    pending.clear();
    useSpeech.setState({ status: "error" });
  };
  return worker;
}

// Bump whenever scripts/convert-speech-model.py produces a new model. Browsers keep
// model files in Cache Storage and would otherwise run the old ones forever.
const MODEL_VERSION = "2026-10-20b";
const VERSION_KEY = "lafaz-speech-model";

async function dropStaleModel() {
  try {
    if (localStorage.getItem(VERSION_KEY) === MODEL_VERSION) return;
    await caches.delete("transformers-cache");
    localStorage.setItem(VERSION_KEY, MODEL_VERSION);
  } catch {
    // No Cache Storage (private window): nothing cached to drop.
  }
}

/** Starts the download once. Safe to call on every page. */
export function preloadSpeech() {
  if (typeof Worker === "undefined" || useSpeech.getState().status !== "idle") return;
  useSpeech.setState({ status: "loading" });
  void dropStaleModel().then(() => getWorker().postMessage({ type: "load" }));
}

/** The model hears 16 kHz mono. A quiet recording is raised so its loudest point is near full scale. */
async function toSamples(blob: Blob) {
  const ctx = new AudioContext({ sampleRate: 16000 });
  try {
    const samples = (await ctx.decodeAudioData(await blob.arrayBuffer())).getChannelData(0);
    let peak = 0;
    for (const s of samples) peak = Math.max(peak, Math.abs(s));
    if (peak > 0.001 && peak < 0.9) for (let i = 0; i < samples.length; i++) samples[i] *= 0.9 / peak;
    return samples;
  } finally {
    void ctx.close();
  }
}

export async function transcribe(blob: Blob): Promise<string> {
  const audio = await toSamples(blob);
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ type: "transcribe", id, audio }, [audio.buffer]);
  });
}
