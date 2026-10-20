"use client";

import { create } from "zustand";
import type { Harakat } from "./letters";

// Letter recordings by an ustadz. Two places, checked in this order:
// 1. files shipped in public/audio/huruf/, listed in manifest.json
// 2. recordings made in the in-app studio, kept in this browser's IndexedDB

const DB_NAME = "lafaz";
const STORE = "recordings";

export function recordingKey(letterId: string, harakat: Harakat = "fathah") {
  return `${letterId}-${harakat}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = run(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveRecording(key: string, blob: Blob) {
  await withStore("readwrite", (s) => s.put(blob, key));
}

export async function deleteRecording(key: string) {
  await withStore("readwrite", (s) => s.delete(key));
}

export async function loadRecording(key: string): Promise<Blob | undefined> {
  return withStore("readonly", (s) => s.get(key) as IDBRequest<Blob | undefined>);
}

async function listRecordingKeys(): Promise<string[]> {
  return withStore("readonly", (s) => s.getAllKeys() as IDBRequest<string[]>);
}

type LetterAudioState = {
  ready: boolean;
  /** key -> playable URL (public file or object URL of a studio recording) */
  urls: Record<string, string>;
  /** keys that come from the studio, not from public files */
  studio: string[];
  load: () => Promise<void>;
  setStudio: (key: string, blob: Blob | null) => Promise<void>;
};

export const useLetterAudio = create<LetterAudioState>()((set, get) => ({
  ready: false,
  urls: {},
  studio: [],

  load: async () => {
    if (get().ready) return;
    const urls: Record<string, string> = {};
    const studio: string[] = [];
    try {
      const res = await fetch("/audio/huruf/manifest.json", { cache: "no-store" });
      const manifest: Record<string, string> = res.ok ? await res.json() : {};
      for (const [key, file] of Object.entries(manifest)) urls[key] = `/audio/huruf/${file}`;
    } catch {
      // No shipped recordings yet.
    }
    try {
      for (const key of await listRecordingKeys()) {
        if (urls[key]) continue;
        const blob = await loadRecording(key);
        if (blob) {
          urls[key] = URL.createObjectURL(blob);
          studio.push(key);
        }
      }
    } catch {
      // IndexedDB can be unavailable in private windows.
    }
    set({ ready: true, urls, studio });
  },

  setStudio: async (key, blob) => {
    const { urls, studio } = get();
    if (studio.includes(key)) URL.revokeObjectURL(urls[key]);
    const next = { ...urls };
    let nextStudio = studio.filter((k) => k !== key);
    if (blob) {
      await saveRecording(key, blob);
      next[key] = URL.createObjectURL(blob);
      nextStudio = [...nextStudio, key];
    } else {
      await deleteRecording(key);
      delete next[key];
    }
    set({ urls: next, studio: nextStudio });
  },
}));

export function letterSoundUrl(urls: Record<string, string>, letterId: string, harakat: Harakat = "fathah") {
  return urls[recordingKey(letterId, harakat)];
}
