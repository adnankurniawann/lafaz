import { Suspense } from "react";
import { AppGate } from "@/components/AppGate";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";
import { PRACTICE_ID, lessonNodes } from "@/lib/course";

// Rendered on the client after saved progress is read; see the root layout.
export const instant = false;

export function generateStaticParams() {
  return [...lessonNodes.map((l) => ({ id: l.id })), { id: PRACTICE_ID }];
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
  return <LessonPlayer lessonId={id} />;
}
