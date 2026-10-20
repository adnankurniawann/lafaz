"use client";

import { useEffect, useRef, useState } from "react";
import { stopAudio } from "./audio";

export type RecorderState = "idle" | "recording" | "done" | "denied" | "unsupported";

/** Records from the microphone with MediaRecorder. Stops itself after `maxMs`. */
export function useRecorder(maxMs = 8000, onRecorded?: (blob: Blob) => void) {
  const [state, setState] = useState<RecorderState>("idle");
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onRecordedRef = useRef(onRecorded);
  useEffect(() => {
    onRecordedRef.current = onRecorded;
  });

  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);

  useEffect(() => () => {
    recorder.current?.stream.getTracks().forEach((t) => t.stop());
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setState("unsupported");
      return;
    }
    stopAudio();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const chunks: Blob[] = [];
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const b = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        if (onRecordedRef.current) {
          onRecordedRef.current(b);
          setState("idle");
          return;
        }
        setBlob(b);
        setUrl(URL.createObjectURL(b));
        setState("done");
      };
      recorder.current = rec;
      rec.start();
      setState("recording");
      timer.current = setTimeout(() => stop(), maxMs);
    } catch {
      setState("denied");
    }
  };

  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    if (recorder.current?.state === "recording") recorder.current.stop();
  };

  const reset = () => {
    setBlob(null);
    setUrl(null);
    setState("idle");
  };

  return { state, blob, url, start, stop, reset };
}
