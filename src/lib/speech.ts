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
    } else useSpeech.setState({ status: "error" });
  };
  return worker;
}

/** Starts the download once. Safe to call on every page. */
export function preloadSpeech() {
  if (typeof Worker === "undefined" || useSpeech.getState().status !== "idle") return;
  useSpeech.setState({ status: "loading" });
  getWorker().postMessage({ type: "load" });
}

/** The model hears 16 kHz mono. */
async function toSamples(blob: Blob) {
  const ctx = new AudioContext({ sampleRate: 16000 });
  try {
    return (await ctx.decodeAudioData(await blob.arrayBuffer())).getChannelData(0);
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
