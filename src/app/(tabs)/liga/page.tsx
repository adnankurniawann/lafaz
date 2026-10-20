import { ShieldIcon } from "@/components/icons";

// Rendered on the client after saved progress is read; see the root layout.
export const instant = false;

const LEAGUES = [
  { name: "Perunggu", color: "text-[#c47f3a]" },
  { name: "Perak", color: "text-[#9aa4ad]" },
  { name: "Emas", color: "text-gold" },
  { name: "Safir", color: "text-blue" },
  { name: "Rubi", color: "text-red" },
  { name: "Zamrud", color: "text-green" },
  { name: "Ametis", color: "text-purple" },
  { name: "Mutiara", color: "text-pink" },
  { name: "Obsidian", color: "text-[#3c3c3c]" },
  { name: "Berlian", color: "text-teal" },
];

export default function LeaguePage() {
  return (
    <div className="px-4 pb-8 pt-6 text-center">
      <div className="flex justify-center gap-1">
        {LEAGUES.slice(0, 5).map((l, i) => (
          <ShieldIcon key={l.name} className={`${i === 0 ? "size-14" : "size-9 opacity-40"} ${l.color}`} />
        ))}
      </div>
      <h1 className="mt-4 text-2xl font-extrabold">Liga Perunggu</h1>
      <p className="mt-2 text-muted">Liga mingguan sedang disiapkan. Kumpulkan XP sekarang, nanti kamu bersaing naik dari Perunggu sampai Berlian.</p>
      <ol className="mt-6 space-y-2 text-left">
        {LEAGUES.map((l, i) => (
          <li key={l.name} className="flex items-center gap-3 rounded-2xl border-2 border-line px-4 py-2">
            <ShieldIcon className={`size-7 ${l.color}`} />
            <span className="flex-1 font-bold">{l.name}</span>
            <span className="text-xs text-muted">Tingkat {i + 1}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
