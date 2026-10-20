"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGame } from "@/lib/store";
import { HomeIcon, LettersIcon, MapIcon, TargetIcon, UserIcon } from "./icons";

const TABS = [
  { href: "/", label: "Belajar", Icon: HomeIcon },
  { href: "/huruf", label: "Huruf", Icon: LettersIcon },
  { href: "/peta", label: "Peta", Icon: MapIcon },
  { href: "/misi", label: "Misi", Icon: TargetIcon },
  { href: "/profil", label: "Profil", Icon: UserIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  const questsReady = useGame((s) => s.quests?.items.some((q) => q.progress >= q.target && !q.claimed));

  return (
    <nav className="sticky bottom-0 z-20 grid grid-cols-5 border-t-2 border-line bg-white pb-[env(safe-area-inset-bottom)]">
      {TABS.map(({ href, label, Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`relative m-1.5 flex flex-col items-center gap-0.5 rounded-xl border-2 py-1.5 text-[11px] font-extrabold uppercase ${active ? "border-blue/40 bg-blue/10 text-blue" : "border-transparent text-muted"}`}
          >
            <Icon className="size-7" />
            {label}
            {href === "/misi" && questsReady && <span className="absolute right-3 top-1 size-2.5 rounded-full bg-red" />}
          </Link>
        );
      })}
    </nav>
  );
}
