"use client";

import Link from "next/link";
import { useState } from "react";
import { AppGate } from "@/components/AppGate";
import { AudioButton } from "@/components/AudioButton";
import { Button } from "@/components/Button";
import { MicIcon } from "@/components/icons";
import { HARAKAT, letters, withHarakat, type Harakat, type Letter } from "@/lib/letters";
import { loadRecording, recordingKey, useLetterAudio } from "@/lib/recordings";
import { useRecorder } from "@/lib/use-recorder";

export function StudioScreen() {
  return (
    <AppGate requireOnboarding={false}>
      <Studio />
    </AppGate>
  );
}

function Studio() {
  const studio = useLetterAudio((s) => s.studio);
  const urls = useLetterAudio((s) => s.urls);
  const [exporting, setExporting] = useState(false);
  const total = letters.length * HARAKAT.length;
  const recorded = Object.keys(urls).length;

  const exportAll = async () => {
    setExporting(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      const manifest: Record<string, string> = {};
      for (const key of studio) {
        const blob = await loadRecording(key);
        if (!blob) continue;
        const ext = blob.type.includes("ogg") ? "ogg" : blob.type.includes("mp4") ? "m4a" : "webm";
        const file = `${key}.${ext}`;
        zip.file(file, blob);
        manifest[key] = file;
      }
      zip.file("manifest.json", JSON.stringify(manifest, null, 2) + "\n");
      const out = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(out);
      a.download = "lafaz-suara-huruf.zip";
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="px-4 pb-10 pt-4">
      <Link href="/profil" className="text-sm font-bold text-muted">
        ← Profil
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold">Studio rekam suara huruf</h1>
      <div className="mt-3 space-y-2 rounded-2xl bg-blue/10 p-4 text-sm leading-relaxed">
        <p>Halaman ini untuk ustadz atau ustadzah. Rekam tiap huruf dengan harakatnya, misalnya &quot;ba&quot;, &quot;bi&quot;, &quot;bu&quot;, satu per satu dengan jelas di tempat yang tenang.</p>
        <p>Rekaman langsung dipakai di app pada perangkat ini. Untuk dipakai semua pengguna, tekan &quot;Ekspor&quot; lalu taruh isi file zip ke folder <code>public/audio/huruf/</code>.</p>
      </div>
      <p className="mt-4 font-bold">
        {recorded} dari {total} rekaman
      </p>
      <Button color="blue" className="mt-2" disabled={studio.length === 0 || exporting} onClick={exportAll}>
        {exporting ? "Menyiapkan..." : `Ekspor ${studio.length} rekaman (.zip)`}
      </Button>

      <ul className="mt-5 space-y-3">
        {letters.map((l) => (
          <li key={l.id} className="rounded-2xl border-2 border-line p-3">
            <p className="font-extrabold">
              {l.name} <span className="arabic-big text-2xl">{l.char}</span>
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {HARAKAT.map((h) => (
                <RecordCell key={h.id} letter={l} harakat={h.id} />
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RecordCell({ letter, harakat }: { letter: Letter; harakat: Harakat }) {
  const key = recordingKey(letter.id, harakat);
  const url = useLetterAudio((s) => s.urls[key]);
  const fromStudio = useLetterAudio((s) => s.studio.includes(key));
  const setStudio = useLetterAudio((s) => s.setStudio);
  const recorder = useRecorder(4000, (blob) => void setStudio(key, blob));

  const recording = recorder.state === "recording";
  return (
    <div className={`flex flex-col items-center gap-1 rounded-xl p-2 ${url ? "bg-green/10" : "bg-[#f7f7f7]"}`}>
      <span className="arabic-big text-4xl leading-[1.6]">{withHarakat(letter, harakat)}</span>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={recording ? recorder.stop : recorder.start}
          aria-label={recording ? "Berhenti" : "Rekam"}
          className={`flex size-9 items-center justify-center rounded-xl border-b-4 text-white ${recording ? "animate-pulse-ring border-red-dark bg-red" : "border-blue-dark bg-blue"}`}
        >
          <MicIcon className="size-5" />
        </button>
        {url && <AudioButton src={url} size="sm" />}
      </div>
      {fromStudio && (
        <button type="button" onClick={() => void setStudio(key, null)} className="text-[11px] font-bold text-red">
          Hapus
        </button>
      )}
      {!fromStudio && url && <span className="text-[11px] font-bold text-green-dark">dari file</span>}
      {recorder.state === "denied" && <span className="text-[11px] text-red">Mikrofon ditolak</span>}
    </div>
  );
}
