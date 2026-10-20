import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <div>
        <h1 className="text-4xl font-extrabold text-primary">Lafaz</h1>
        <p className="mt-2 text-muted">Belajar membaca Al-Qur&apos;an dengan tajwid, sedikit demi sedikit.</p>
      </div>
      <p className="rounded-2xl bg-white px-4 py-3 text-sm text-muted">
        Prototype fase 1. Alur belajar belum tersedia.
      </p>
      <Link href="/debug/tajwid" className="font-bold text-primary underline underline-offset-4">
        Buka halaman debug tajwid
      </Link>
    </main>
  );
}
