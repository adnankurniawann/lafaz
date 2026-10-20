import { AyahMapScreen } from "@/components/screens/AyahMapScreen";
import { allAyahLetters } from "@/lib/quran";

// Rendered on the client after saved progress is read; see the root layout.
export const instant = false;

export default async function AyahMapPage() {
  return <AyahMapScreen ayahs={await allAyahLetters()} />;
}
