import Link from "next/link";
import { surahList } from "@/lib/quran";

export default function TajweedDebugIndex() {
  return (
    <main className="px-4 py-6">
      <Link href="/" className="text-sm text-muted">
        ← Beranda
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold">Debug tajwid</h1>
      <p className="mt-1 text-sm text-muted">Pilih surah untuk melihat hasil parser anotasi tajwid.</p>
      <ul className="mt-4 divide-y divide-stone-200 rounded-2xl bg-white">
        {surahList.map((s) => (
          <li key={s.number}>
            <Link href={`/debug/tajwid/${s.number}`} className="flex items-center gap-3 px-4 py-3">
              <span className="w-8 text-sm font-bold text-muted">{s.number}</span>
              <span className="flex-1 font-semibold">{s.englishName}</span>
              <span className="text-xs text-muted">{s.ayahCount} ayat</span>
              <span dir="rtl" lang="ar" className="font-quran text-xl">
                {s.name}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
