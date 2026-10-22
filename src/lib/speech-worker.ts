// Runs the Cek Suara model off the main thread, so lessons never stutter (ADR-0008).
import { env, pipeline, type AutomaticSpeechRecognitionPipeline } from "@huggingface/transformers";

// Built by scripts/convert-speech-model.py into public/models/. Set
// NEXT_PUBLIC_SPEECH_MODEL to a Hugging Face repo id to load it from there instead.
const REMOTE = process.env.NEXT_PUBLIC_SPEECH_MODEL;
const MODEL = REMOTE ?? "tarteel-ai/whisper-base-ar-quran";
env.allowRemoteModels = !!REMOTE;
env.allowLocalModels = !REMOTE;
env.localModelPath = "/models/";

let asr: Promise<AutomaticSpeechRecognitionPipeline> | null = null;

function load() {
  asr ??= pipeline("automatic-speech-recognition", MODEL, {
    dtype: "q8",
    device: "wasm",
    progress_callback: (p) => {
      if (p.status === "progress_total") postMessage({ type: "progress", progress: p.progress });
    },
  }) as Promise<AutomaticSpeechRecognitionPipeline>;
  return asr;
}

self.onmessage = async (e: MessageEvent<{ type: "load" } | { type: "transcribe"; id: number; audio: Float32Array }>) => {
  const msg = e.data;
  try {
    if (msg.type === "load") {
      await load();
      postMessage({ type: "ready" });
    } else {
      // Whisper hears 30 seconds at a time; a longer Tes hafalan recitation goes in overlapping pieces.
      const long = msg.audio.length > 30 * 16000 ? { chunk_length_s: 30, stride_length_s: 5 } : {};
      const output = await (await load())(msg.audio, long);
      postMessage({ type: "result", id: msg.id, text: output.text });
    }
  } catch (err) {
    asr = null;
    postMessage({ type: "error", id: msg.type === "transcribe" ? msg.id : undefined, message: String(err) });
  }
};
