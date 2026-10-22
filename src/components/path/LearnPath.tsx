"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import harakat from "../../../data/content/harakat.json";
import { Button, ButtonLink } from "@/components/Button";
import { ChestIcon, CheckIcon, BoltIcon, HeartIcon, LockIcon, StarIcon, TrophyIcon, BookIcon } from "@/components/icons";
import { LetterGuide } from "@/components/LetterGuide";
import { Mascot } from "@/components/Mascot";
import { Dialog, Sheet } from "@/components/Sheet";
import { AudioButton } from "@/components/AudioButton";
import { clipParts, clipSpan, clipsFor } from "@/lib/clips";
import { LEVEL_TEST_ID, PLACEMENT_ID, challengeId, nodeStates, sections, unitDone, type ChestNode, type NodeState, type PathNode, type Unit } from "@/lib/course";
import { getLetter } from "@/lib/letters";
import { sfx } from "@/lib/sfx";
import { useGame } from "@/lib/store";
import { getLessonRule, groupOf, tajweedLessonsReview, type LessonRuleId } from "@/lib/tajweed-lessons";
import { UNIT_COLORS } from "./unitColors";

const MARKS = harakat.marks as { id: string; explain: string }[];

// Horizontal offsets that make the zig-zag, repeated along each unit.
const OFFSETS = [0, 52, 78, 52, 0, -52, -78, -52];

export function LearnPath() {
  const lessons = useGame((s) => s.lessons);
  const chests = useGame((s) => s.chests);
  const states = useMemo(() => nodeStates(lessons, chests), [lessons, chests]);
  const [selected, setSelected] = useState<string | null>(null);
  const [guide, setGuide] = useState<Unit | null>(null);
  const [chest, setChest] = useState<ChestNode | null>(null);
  const [challenge, setChallenge] = useState<Unit | null>(null);
  const challenges = useGame((s) => s.challenges);
  const levels = useGame((s) => s.levels);
  const setLevel = useGame((s) => s.setLevel);
  const level = useGame((s) => (s.levels.includes(s.level) ? s.level : "iqro"));
  const currentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "center" });
  }, [level]);

  const levelSections = sections.filter((s) => s.level === level);
  const levelNodes = new Set(levelSections.flatMap((s) => s.units.flatMap((u) => u.nodes.map((n) => n.id))));
  const currentLesson = [...states].find(([id, s]) => s === "current" && levelNodes.has(id) && !id.endsWith("-peti"))?.[0];

  return (
    <div className="pb-10">
      {levelSections.map((section) => (
        <section key={section.id}>
          <p className="px-4 pt-4 text-center text-xs font-extrabold uppercase tracking-widest text-muted">
            Bagian {section.number} · {section.title}
          </p>
          {section.id === "membaca" && !lessons["u10-1"] && (
            <div className="mx-4 mt-3 rounded-2xl border-2 border-purple/40 bg-purple/5 p-4 text-center">
              <p className="font-extrabold">Sudah kenal huruf hijaiyah?</p>
              <p className="mt-1 text-sm text-muted">Tes Matrikulasi singkat, paling banyak 15 soal, untuk melompat ke bagian yang pas.</p>
              <ButtonLink href={`/lesson/${PLACEMENT_ID}`} color="purple" className="mt-3">
                Tes lompat
              </ButtonLink>
            </div>
          )}
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
                      <LessonPopover node={node} unit={unit} state={states.get(node.id)!} />
                    )}
                    {i === 2 && <Mascot size={84} mood="happy" className="absolute right-[calc(100%+48px)] top-0" />}
                  </div>
                ))}
                {unitDone(unit, lessons) && (
                  <button
                    type="button"
                    onClick={() => setChallenge(unit)}
                    className="flex items-center gap-1.5 rounded-full border-2 border-b-4 border-orange bg-white px-4 py-2 text-sm font-extrabold uppercase text-orange"
                  >
                    <BoltIcon className="size-5" />
                    {challenges.includes(unit.id) ? "Tantangan lulus · ulangi" : "Mode Tantangan"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </section>
      ))}

      {level === "iqro" && (
        <div className="mx-4 mt-2 rounded-2xl border-2 border-teal/40 bg-teal/5 p-4 text-center">
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted">Level berikutnya</p>
          <p className="mt-1 text-lg font-extrabold">Level Tajwid dan Level Hafalan</p>
          {levels.includes("tajwid") || levels.includes("hafalan") ? (
            <div className="mt-3 space-y-3">
              {(["tajwid", "hafalan"] as const).map((l) =>
                levels.includes(l) ? (
                  <Button key={l} color="blue" onClick={() => setLevel(l)}>
                    Buka Level {l === "tajwid" ? "Tajwid" : "Hafalan"}
                  </Button>
                ) : (
                  <ButtonLink key={l} href={`/lesson/${LEVEL_TEST_ID}`} color="white">
                    Tes naik ke Level {l === "tajwid" ? "Tajwid" : "Hafalan"}
                  </ButtonLink>
                ),
              )}
            </div>
          ) : (
            <>
              <p className="mt-1 text-sm text-muted">Terbuka setelah Al-Fatihah selesai. Sudah bisa membaca? Coba tes naik level: baca Al-Fatihah sendiri.</p>
              <ButtonLink href={`/lesson/${LEVEL_TEST_ID}`} color="blue" className="mt-3">
                Tes naik level
              </ButtonLink>
            </>
          )}
        </div>
      )}

      {guide && (
        <Sheet title={`Panduan Unit ${guide.number}`} onClose={() => setGuide(null)}>
          {guide.rules ? (
            <TajweedGuide rules={guide.rules} />
          ) : guide.surah ? (
            <p className="rounded-2xl border-2 border-line p-4 text-sm leading-relaxed">
              {guide.title}, {guide.description}. Tiap lesson menghafal beberapa ayat dengan tikrar: dengar qari tiga kali sambil mengikuti teks, isi kata yang hilang, lalu baca dari hafalan. Ayat yang sudah hafal disambung dengan ayat sebelumnya. Tes hafalan di akhir unit menandai ayat &quot;sudah hafal&quot; di Peta Ayat.
            </p>
          ) : (
            <>
              <p className="mb-3 text-sm text-muted">{guide.description}. Baca dari kanan ke kiri.</p>
              {guide.topic && <p className="rounded-2xl border-2 border-line p-4 leading-relaxed">{MARKS.find((m) => m.id === guide.topic)?.explain ?? "Baca ayat demi ayat. Dengarkan qari, lalu baca sendiri dan rekam."}</p>}
              <div className="space-y-3">
                {(guide.id === "u9" ? [] : guide.letters).map((id) => (
                  <LetterGuide key={id} id={id} />
                ))}
                {guide.id === "u9" && <SimilarGuide />}
              </div>
            </>
          )}
        </Sheet>
      )}

      {chest && <ChestDialog chest={chest} onClose={() => setChest(null)} />}
      {challenge && <ChallengeDialog unit={challenge} onClose={() => setChallenge(null)} />}
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
        {unit.letters.length > 0 && unit.id !== "u9" && (
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

function LessonPopover({ node, unit, state }: { node: Extract<PathNode, { kind: "lesson" }>; unit: Unit; state: NodeState }) {
  const router = useRouter();
  const color = UNIT_COLORS[unit.color];
  const lessonNumber = unit.nodes.filter((n) => n.kind === "lesson").indexOf(node) + 1;
  const total = unit.nodes.filter((n) => n.kind === "lesson").length;

  return (
    <div className={`absolute top-[84px] z-10 w-64 rounded-2xl p-4 animate-pop-in ${state === "locked" ? "border-2 border-line bg-[#f7f7f7]" : `${color.bg} text-white`}`}>
      <p className="font-extrabold">{node.title}</p>
      <p className={`text-sm ${state === "locked" ? "text-muted" : "opacity-90"}`}>
        {state === "locked" ? "Selesaikan semua level sebelumnya untuk membuka ini." : `Lesson ${lessonNumber} dari ${total}`}
      </p>
      {state !== "locked" && (
        <Button color="white" className={`mt-3 ${color.text}`} onClick={() => router.push(`/lesson/${node.id}`)}>
          {state === "done" ? "Ulangi +10 XP" : "Mulai +10 XP"}
        </Button>
      )}
    </div>
  );
}

function ChallengeDialog({ unit, onClose }: { unit: Unit; onClose: () => void }) {
  const router = useRouter();
  return (
    <Dialog onClose={onClose}>
      <BoltIcon className="mx-auto size-16" />
      <h2 className="mt-2 text-xl font-extrabold">Mode Tantangan · Unit {unit.number}</h2>
      <ul className="mt-3 space-y-1 text-left text-muted">
        <li className="flex items-center gap-2">
          <HeartIcon className="size-5" /> 3 nyawa, salah mengurangi satu
        </li>
        <li>⏱️ 15 detik per soal</li>
        <li>⚡ XP 2x dan badge kalau lulus</li>
      </ul>
      <p className="mt-3 text-sm text-muted">Opsional. Lesson biasa tetap tanpa nyawa.</p>
      <div className="mt-5 space-y-3">
        <Button color="gold" onClick={() => router.push(`/lesson/${challengeId(unit)}`)}>
          Mulai tantangan
        </Button>
        <Button color="ghost" onClick={onClose}>
          Nanti saja
        </Button>
      </div>
    </Dialog>
  );
}

function ChestDialog({ chest, onClose }: { chest: ChestNode; onClose: () => void }) {
  const openChest = useGame((s) => s.openChest);
  const [opened, setOpened] = useState(false);
  return (
    <Dialog>
      <ChestIcon className={`mx-auto size-28 ${opened ? "animate-pop-in" : "animate-bounce-soft"}`} open={opened} />
      {opened ? (
        <>
          <p className="mt-3 flex items-center justify-center gap-2 text-2xl font-extrabold text-gold">
            +{chest.xp} <BoltIcon className="size-7" />
          </p>
          <p className="text-muted">XP bonus, ikut dihitung ke target harian.</p>
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
              openChest(chest.id, chest.xp);
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

/** Unit guide for Level Tajwid: each rule in a few lines, with one clip of the qari. */
function TajweedGuide({ rules }: { rules: LessonRuleId[] }) {
  const group = groupOf(rules[0]);
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">{group.intro}</p>
      {rules.map((id) => {
        const rule = getLessonRule(id);
        const clip = clipsFor(id)[0];
        return (
          <div key={id} className="rounded-2xl border-2 border-line p-4 text-sm">
            <p className="text-lg font-extrabold" style={{ color: rule.color }}>
              {rule.name} <span className="text-sm font-semibold text-muted">· {rule.meaning}</span>
            </p>
            <p className="mt-1">{rule.summary}</p>
            <p className="mt-1 text-muted">{rule.howTo}</p>
            {clip && (
              <div className="mt-2 flex items-center gap-3 rounded-xl bg-[#f7f7f7] px-3">
                <AudioButton span={clipSpan(clip)} size="sm" label={`Dengar contoh ${rule.name}`} />
                <p dir="rtl" lang="ar" className="arabic flex-1 text-2xl">
                  {clipParts(clip).map((p, i) => (
                    <span key={i} style={p.rule ? { color: rule.color } : undefined} className={p.rule ? "font-bold" : ""}>
                      {p.text}
                    </span>
                  ))}
                </p>
              </div>
            )}
            {rule.review && <p className="mt-2 text-[11px] text-amber-700">{rule.review}</p>}
          </div>
        );
      })}
      <p className="text-[11px] text-amber-700">Materi ini {tajweedLessonsReview}.</p>
    </div>
  );
}
