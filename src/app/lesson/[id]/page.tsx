import { Suspense } from "react";
import { AppGate } from "@/components/AppGate";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";
import { bestAyah } from "@/lib/ayah-letters";
import { PLACEMENT_ID, PRACTICE_ID, TROUBLE_ID, challengeId, challengeUnit, getLesson, lessonNodes, lettersUpTo, unitOf, unitTest, units } from "@/lib/course";
import { allAyahLetters, getSurah } from "@/lib/quran";

// Rendered on the client after saved progress is read; see the root layout.
export const instant = false;

export function generateStaticParams() {
  return [...lessonNodes.map((l) => ({ id: l.id })), ...units.map((u) => ({ id: challengeId(u) })), ...[PRACTICE_ID, TROUBLE_ID, PLACEMENT_ID].map((id) => ({ id }))];
}

export default function LessonPage({ params }: PageProps<"/lesson/[id]">) {
  return (
    <AppGate>
      <Suspense>
        <LessonFromParams params={params} />
      </Suspense>
    </AppGate>
  );
}

async function LessonFromParams({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = getLesson(id) ?? (challengeUnit(id) && unitTest(challengeUnit(id)!));
  const unit = lesson && unitOf(lesson.id);

  // A letter unit's test carries an Al-Fatihah ayah for the letter highlight.
  const ayah =
    unit?.letters.length && lesson === unitTest(unit) && !challengeUnit(id)
      ? bestAyah((await allAyahLetters()).filter((a) => a.surah === 1), new Set(lettersUpTo(unit)), unit.letters)
      : undefined;

  // Units 17 and 18 read Al-Fatihah itself.
  const fatihah =
    lesson?.topic === "khusus" || lesson?.topic === "fatihah"
      ? (await getSurah(1)).ayahs.map((a) => ({ number: a.number, text: a.text, audio: a.audio, words: a.words.map((w) => ({ text: w.text, audio: w.audio })) }))
      : undefined;

  return <LessonPlayer lessonId={id} ayah={ayah} fatihah={fatihah} />;
}
