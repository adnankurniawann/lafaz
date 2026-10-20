"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { ChestIcon, CheckIcon, GemIcon, HeartIcon, LockIcon, StarIcon, TrophyIcon, BookIcon } from "@/components/icons";
import { LetterGuide } from "@/components/LetterGuide";
import { Mascot } from "@/components/Mascot";
import { Dialog, Sheet } from "@/components/Sheet";
import { nodeStates, sections, type NodeState, type PathNode, type Unit } from "@/lib/course";
import { getLetter } from "@/lib/letters";
import { sfx } from "@/lib/sfx";
import { currentHearts, useGame } from "@/lib/store";
import { UNIT_COLORS } from "./unitColors";

// Horizontal offsets that make the zig-zag, repeated along each unit.
const OFFSETS = [0, 52, 78, 52, 0, -52, -78, -52];

export function LearnPath() {
  const lessons = useGame((s) => s.lessons);
  const chests = useGame((s) => s.chests);
  const states = useMemo(() => nodeStates(lessons, chests), [lessons, chests]);
  const [selected, setSelected] = useState<string | null>(null);
  const [guide, setGuide] = useState<Unit | null>(null);
  const [chest, setChest] = useState<{ id: string; gems: number } | null>(null);
  const currentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "center" });
  }, []);

  const currentLesson = [...states].find(([id, s]) => s === "current" && !id.endsWith("-peti"))?.[0];

  return (
    <div className="pb-10">
      {sections.map((section) => (
        <section key={section.id}>
          <p className="px-4 pt-4 text-center text-xs font-extrabold uppercase tracking-widest text-muted">
            Bagian {section.number} · {section.title}
          </p>
          {section.units.map((unit) => (
            <div key={unit.id}>
              <UnitBanner unit={unit} onGuide={() => setGuide(unit)} />
              <div className="relative flex flex-col items-center gap-5 py-8">
                {unit.nodes.map((node, i) => (
                  <div
                    key={node.id}
                    ref={node.id === currentLesson ? currentRef : undefined}
                    className={`relative flex flex-col items-center ${selected === node.id ? "z-30" : ""}`}
                    style={{ transform: `translateX(${OFFSETS[i % OFFSETS.length]}px)` }}
                  >
                    <PathNodeButton
                      node={node}
                      unit={unit}
                      state={states.get(node.id)!}
                      isCurrentLesson={node.id === currentLesson}
                      onClick={() => {
                        sfx.tap();
                        if (node.kind === "chest" && states.get(node.id) === "current") setChest(node);
                        else setSelected(selected === node.id ? null : node.id);
                      }}
                    />
                    {selected === node.id && node.kind === "lesson" && (
                      <LessonPopover node={node} unit={unit} state={states.get(node.id)!} onClose={() => setSelected(null)} />
                    )}
                    {i === 2 && <Mascot size={84} mood="happy" className="absolute right-[calc(100%+48px)] top-0" />}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      ))}

      <p className="px-6 text-center text-sm text-muted">Bagian Tajwid lewat dengar menyusul di fase berikutnya.</p>

      {guide && (
        <Sheet title={`Panduan Unit ${guide.number}`} onClose={() => setGuide(null)}>
          <p className="mb-3 text-sm text-muted">{guide.description}. Baca dari kanan ke kiri.</p>
          <div className="space-y-3">
            {(guide.number === 9 ? [] : guide.letters).map((id) => (
              <LetterGuide key={id} id={id} />
            ))}
            {guide.number === 9 && <SimilarGuide />}
          </div>
        </Sheet>
      )}

      {chest && <ChestDialog chest={chest} onClose={() => setChest(null)} />}
    </div>
  );
}

function UnitBanner({ unit, onGuide }: { unit: Unit; onGuide: () => void }) {
  const color = UNIT_COLORS[unit.color];
  return (
    <div className={`mx-4 mt-4 flex items-center justify-between rounded-2xl border-b-4 ${color.bg} ${color.border} p-4 text-white`}>
      <div>
        <p className="text-xs font-extrabold uppercase tracking-wider opacity-80">Unit {unit.number}</p>
        <p className="text-lg font-extrabold leading-tight">{unit.title}</p>
        {unit.number < 9 && (
          <p className="arabic-big mt-1 text-3xl leading-normal">{unit.letters.map((l) => getLetter(l).fathah).join("  ")}</p>
        )}
      </div>
      <button type="button" onClick={onGuide} className="flex flex-col items-center gap-1 rounded-xl border-2 border-white/40 px-3 py-2 text-xs font-extrabold uppercase">
        <BookIcon />
        Panduan
      </button>
    </div>
  );
}

function PathNodeButton({ node, unit, state, isCurrentLesson, onClick }: { node: PathNode; unit: Unit; state: NodeState; isCurrentLesson: boolean; onClick: () => void }) {
  const color = UNIT_COLORS[unit.color];
  if (node.kind === "chest") {
    return (
      <button type="button" onClick={onClick} className={`flex size-20 items-center justify-center ${state === "current" ? "animate-bounce-soft" : state === "locked" ? "grayscale opacity-60" : ""}`} aria-label="Peti hadiah">
        <ChestIcon className="size-16" open={state === "done"} />
      </button>
    );
  }
  const isTrophy = node.lessonKind === "uji";
  const active = state !== "locked";
  return (
    <div className="relative">
      {isCurrentLesson && (
        <div className={`absolute -top-12 left-1/2 -translate-x-1/2 animate-bounce-soft whitespace-nowrap rounded-xl border-2 border-line bg-white px-3 py-1.5 text-sm font-extrabold uppercase ${color.text}`}>
          Mulai
          <span className="absolute -bottom-2 left-1/2 size-3 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-line bg-white" />
        </div>
      )}
      <button
        type="button"
        onClick={onClick}
        aria-label={node.title}
        className={`flex size-[72px] items-center justify-center rounded-full border-b-[6px] transition active:translate-y-1 active:border-b-2 ${
          active ? `${color.bg} ${color.border} text-white` : "border-[#c9c9c9] bg-line text-[#b5b5b5]"
        } ${isCurrentLesson ? `ring-8 ${color.ring}` : ""}`}
      >
        {state === "done" ? <CheckIcon className="size-9" /> : isTrophy ? <TrophyIcon className="size-9" /> : state === "locked" ? <LockIcon className="size-7" /> : <StarIcon className="size-9" />}
      </button>
    </div>
  );
}

function LessonPopover({ node, unit, state, onClose }: { node: Extract<PathNode, { kind: "lesson" }>; unit: Unit; state: NodeState; onClose: () => void }) {
  const router = useRouter();
  const color = UNIT_COLORS[unit.color];
  const lessonNumber = unit.nodes.filter((n) => n.kind === "lesson").indexOf(node) + 1;
  const total = unit.nodes.filter((n) => n.kind === "lesson").length;
  const [noHearts, setNoHearts] = useState(false);

  const start = () => {
    if (currentHearts() <= 0) setNoHearts(true);
    else router.push(`/lesson/${node.id}`);
  };

  return (
    <>
      <div className={`absolute top-[84px] z-10 w-64 rounded-2xl p-4 animate-pop-in ${state === "locked" ? "border-2 border-line bg-[#f7f7f7]" : `${color.bg} text-white`}`}>
        <p className="font-extrabold">{node.title}</p>
        <p className={`text-sm ${state === "locked" ? "text-muted" : "opacity-90"}`}>
          {state === "locked" ? "Selesaikan semua level sebelumnya untuk membuka ini." : `Lesson ${lessonNumber} dari ${total}`}
        </p>
        {state !== "locked" && (
          <Button color="white" className={`mt-3 ${color.text}`} onClick={start}>
            {state === "done" ? "Ulangi +10 XP" : "Mulai +10 XP"}
          </Button>
        )}
      </div>
      {noHearts && <NoHeartsDialog onClose={() => { setNoHearts(false); onClose(); }} />}
    </>
  );
}

export function NoHeartsDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const gems = useGame((s) => s.gems);
  const buy = useGame((s) => s.buyHeartRefill);
  return (
    <Dialog onClose={onClose}>
      <div className="flex justify-center gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <HeartIcon key={i} className="size-8" empty />
        ))}
      </div>
      <h2 className="mt-3 text-xl font-extrabold">Hatimu habis</h2>
      <p className="mt-1 text-muted">Hati terisi lagi 1 tiap 4 jam. Atau dapatkan hati dengan latihan ulang huruf.</p>
      <div className="mt-5 space-y-3">
        <Button color="blue" onClick={() => router.push("/lesson/latihan")}>
          Latihan, dapat +1 hati
        </Button>
        <Button color="white" disabled={gems < 100} onClick={() => buy() && onClose()}>
          Isi penuh · <GemIcon className="size-5" /> 100
        </Button>
        <Button color="ghost" onClick={onClose}>
          Nanti saja
        </Button>
      </div>
    </Dialog>
  );
}

function ChestDialog({ chest, onClose }: { chest: { id: string; gems: number }; onClose: () => void }) {
  const openChest = useGame((s) => s.openChest);
  const [opened, setOpened] = useState(false);
  return (
    <Dialog>
      <ChestIcon className={`mx-auto size-28 ${opened ? "animate-pop-in" : "animate-bounce-soft"}`} open={opened} />
      {opened ? (
        <>
          <p className="mt-3 flex items-center justify-center gap-2 text-2xl font-extrabold text-blue">
            +{chest.gems} <GemIcon className="size-7" />
          </p>
          <p className="text-muted">Gems bisa dipakai untuk mengisi hati.</p>
          <Button className="mt-5" onClick={onClose}>
            Lanjut
          </Button>
        </>
      ) : (
        <>
          <p className="mt-3 text-xl font-extrabold">Peti hadiah!</p>
          <Button
            className="mt-5"
            onClick={() => {
              openChest(chest.id, chest.gems);
              sfx.chest();
              setOpened(true);
            }}
          >
            Buka
          </Button>
        </>
      )}
    </Dialog>
  );
}

function SimilarGuide() {
  return (
    <div className="rounded-2xl border-2 border-line p-4 text-sm">
      <p className="font-bold">Huruf yang sering tertukar</p>
      <p className="mt-1 text-muted">Perhatikan titik untuk huruf yang bentuknya mirip, dan tempat keluarnya suara untuk huruf yang bunyinya mirip.</p>
      <ul className="mt-3 space-y-2">
        {[
          ["hha", "ha"],
          ["ain", "hamzah"],
          ["sin", "shod"],
          ["dzal", "zai", "zho"],
          ["ta", "tho"],
          ["kaf", "qof"],
        ].map((group) => (
          <li key={group.join()} className="flex items-center justify-between gap-2 rounded-xl bg-[#f7f7f7] px-3 py-2">
            <span className="arabic-big text-3xl">{group.map((l) => getLetter(l).fathah).join("  ")}</span>
            <span className="text-right text-xs text-muted">{group.map((l) => `${getLetter(l).name}: ${getLetter(l).makhraj.split(".")[0]}`).join(" · ")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
