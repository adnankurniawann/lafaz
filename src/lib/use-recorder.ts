"use client";

import { useEffect, useRef, useState } from "react";
import { stopAudio } from "./audio";

export type RecorderState = "idle" | "recording" | "done" | "denied" | "unsupported";

/**
 * Laptop mics in the browser come in weak; a voice memo app lifts them. Same here:
 * a compressor holds loud speech under clipping, then gain lifts quiet speech
 * (about -40 dB in comes out near -20 dB, normal speech near -8 dB).
 * Stopping the returned stream's tracks also releases the mic.
 */
function boost(mic: MediaStream): MediaStream {
  const ctx = new AudioContext();
  const compressor = new DynamicsCompressorNode(ctx, { threshold: -30, knee: 10, ratio: 6, attack: 0.005, release: 0.2 });
  const gain = new GainNode(ctx, { gain: 10 });
  const out = ctx.createMediaStreamDestination();
  ctx.createMediaStreamSource(mic).connect(compressor).connect(gain).connect(out);
  const [track] = out.stream.getAudioTracks();
  const stopOut = track.stop.bind(track);
  track.stop = () => {
    stopOut();
    mic.getTracks().forEach((t) => t.stop());
    // Stop can run twice (stop, then unmount); a second close only rejects.
    ctx.close().catch(() => {});
  };
  return out.stream;
}

/**
 * Records from the microphone with MediaRecorder. Stops itself after `maxMs`.
 * `onRecorded` takes the recording instead of keeping it; `onDone` runs after it is kept.
 */
export function useRecorder(maxMs = 8000, onRecorded?: (blob: Blob) => void, onDone?: (blob: Blob) => void) {
  const [state, setState] = useState<RecorderState>("idle");
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onRecordedRef = useRef(onRecorded);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onRecordedRef.current = onRecorded;
    onDoneRef.current = onDone;
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
      // Raw input, like a voice memo. Echo cancellation and noise suppression switch
      // Safari to call-style voice processing, which makes the recording very quiet.
      const mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      const stream = boost(mic);
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
        onDoneRef.current?.(b);
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
