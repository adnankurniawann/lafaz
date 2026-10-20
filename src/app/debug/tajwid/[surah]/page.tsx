import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { TajweedText } from "@/components/TajweedText";
import { getSurah, hasSurah, surahList } from "@/lib/quran";
import { ayahSegments, getRule, parseTajweed, type TajweedRuleId } from "@/lib/tajweed";

export function generateStaticParams() {
  return surahList.map((s) => ({ surah: String(s.number) }));
}

export default function TajweedDebugSurah({ params }: PageProps<"/debug/tajwid/[surah]">) {
  return (
    <Suspense fallback={<main className="px-4 py-6 text-sm text-muted">Memuat surah…</main>}>
      <SurahDetail params={params} />
    </Suspense>
  );
}

async function SurahDetail({ params }: { params: Promise<{ surah: string }> }) {
  const n = Number((await params).surah);
  if (!hasSurah(n)) notFound();
  const surah = await getSurah(n);

  const ayahs = surah.ayahs.map((a) => ({ ...a, segments: ayahSegments(a) }));

  const counts = new Map<TajweedRuleId, number>();
  for (const a of ayahs) {
    for (const s of parseTajweed(a.tajweed)) if (s.rule) counts.set(s.rule, (counts.get(s.rule) ?? 0) + 1);
  }

  const i = surahList.findIndex((s) => s.number === n);
  const prev = surahList[i - 1];
  const next = surahList[i + 1];

  return (
    <main className="px-4 py-6">
      <nav className="flex justify-between text-sm text-muted">
        <Link href="/debug/tajwid">← Daftar surah</Link>
        <span className="flex gap-4">
          {prev && <Link href={`/debug/tajwid/${prev.number}`}>‹ {prev.englishName}</Link>}
          {next && <Link href={`/debug/tajwid/${next.number}`}>{next.englishName} ›</Link>}
        </span>
      </nav>

      <header className="mt-4 text-center">
        <p dir="rtl" lang="ar" className="font-quran text-4xl leading-loose">
          {surah.name}
        </p>
        <h1 className="text-xl font-extrabold">
          {surah.number}. {surah.englishName}
        </h1>
        <p className="text-sm text-muted">{surah.ayahCount} ayat</p>
      </header>

      <section className="mt-6 rounded-2xl bg-white p-4">
        <h2 className="text-sm font-bold">Hukum yang ditandai di surah ini</h2>
        <ul className="mt-2 grid grid-cols-1 gap-1.5 text-sm">
          {[...counts].map(([id, count]) => {
            const rule = getRule(id);
            return (
              <li key={id} className="flex items-start gap-2">
                <span className="mt-1.5 size-3 shrink-0 rounded-full" style={{ background: rule.color }} />
                <span className="flex-1">
                  {rule.name} <span className="text-muted">({count})</span>
                  {rule.review && <span className="ml-1 text-xs text-amber-700">· perlu cek</span>}
                </span>
                <code className="text-xs text-muted">[{rule.code}</code>
              </li>
            );
          })}
        </ul>
      </section>

      <ol className="mt-6 space-y-4">
        {ayahs.map((a) => (
          <li key={a.number} className="rounded-2xl bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {a.number}
              </span>
              <audio controls preload="none" src={a.audio} className="h-8 w-48" />
            </div>
            <TajweedText segments={a.segments} className="mt-2" />
            <p className="mt-1 text-sm text-muted">{a.translation}</p>
            <details className="mt-3 text-xs">
              <summary className="cursor-pointer text-muted">Data mentah</summary>
              <p className="mt-2 font-bold">Markup sumber</p>
              <p dir="rtl" lang="ar" className="break-words rounded bg-stone-100 p-2 font-mono">
                {a.tajweed}
              </p>
              <p className="mt-2 font-bold">Segmen di teks utsmani</p>
              <ul className="mt-1 space-y-1">
                {a.segments
                  .filter((s) => s.rule)
                  .map((s, k) => (
                    <li key={k} className="flex items-center justify-between gap-2">
                      <span style={{ color: getRule(s.rule!).color }}>{getRule(s.rule!).name}</span>
                      <span dir="rtl" lang="ar" className="font-quran text-lg">
                        {s.text}
                      </span>
                    </li>
                  ))}
              </ul>
            </details>
          </li>
        ))}
      </ol>
    </main>
  );
}
