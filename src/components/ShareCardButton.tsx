"use client";

import { useState } from "react";
import quranIndex from "../../data/quran/index.json";
import { Button } from "./Button";

const W = 1080;
const H = 1350;

/** Splits words into right-to-left lines that fit the card. */
function wrap(ctx: CanvasRenderingContext2D, words: string[], maxWidth: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** Kartu Pamer: the ayah, its surah and number, and "Aku sekarang bisa baca ini" (FR-13). */
async function drawCard(text: string, surah: number, ayah: number): Promise<Blob> {
  const arabicFont = getComputedStyle(document.documentElement).getPropertyValue("--font-amiri-quran").trim() || "serif";
  const latinFont = getComputedStyle(document.documentElement).getPropertyValue("--font-nunito").trim() || "sans-serif";
  await document.fonts.load(`72px ${arabicFont}`, text);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#f5b400";
  ctx.fillRect(0, 0, W, 24);
  ctx.textAlign = "center";

  // The ayah, as large as fits in at most six lines.
  ctx.direction = "rtl";
  ctx.fillStyle = "#2b2b2b";
  let size = 96;
  let lines: string[];
  do {
    ctx.font = `${size}px ${arabicFont}`;
    lines = wrap(ctx, text.split(" "), W - 160);
    size -= 6;
  } while (lines.length > 6 && size > 40);
  const lineHeight = size * 2.1;
  const top = 560 - (lines.length * lineHeight) / 2;
  lines.forEach((l, i) => ctx.fillText(l, W / 2, top + (i + 1) * lineHeight));

  ctx.direction = "ltr";
  const name = quranIndex.surahs.find((s) => s.number === surah)?.englishName ?? `Surah ${surah}`;
  ctx.fillStyle = "#8a8f98";
  ctx.font = `700 40px ${latinFont}`;
  ctx.fillText(`QS ${name} (${surah}): ${ayah}`, W / 2, 1000);
  ctx.fillStyle = "#2e9a3f";
  ctx.font = `800 64px ${latinFont}`;
  ctx.fillText("Aku sekarang bisa baca ini", W / 2, 1120);
  ctx.fillStyle = "#8a8f98";
  ctx.font = `700 34px ${latinFont}`;
  ctx.fillText("Lafaz · belajar membaca Al-Qur'an", W / 2, 1260);

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Gagal membuat gambar"))), "image/png"));
}

export function ShareCardButton({ surah, ayah, text }: { surah: number; ayah: number; text: string }) {
  const [busy, setBusy] = useState(false);

  const share = async () => {
    setBusy(true);
    try {
      const file = new File([await drawCard(text, surah, ayah)], `lafaz-${surah}-${ayah}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: "Aku sekarang bisa baca ini" });
      } else {
        const url = URL.createObjectURL(file);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // Closing the share sheet throws; nothing to do.
    }
    setBusy(false);
  };

  return (
    <Button color="gold" disabled={busy} onClick={() => void share()}>
      {busy ? "Membuat kartu..." : "Buat Kartu Pamer"}
    </Button>
  );
}
