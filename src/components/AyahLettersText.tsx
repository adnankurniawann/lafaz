import { clusters } from "@/lib/ayah-letters";

// Known letters in green, the rest faded. Each letter keeps its harakat in the same span.
export function AyahLettersText({ text, known, className = "" }: { text: string; known: Set<string>; className?: string }) {
  return (
    <p dir="rtl" lang="ar" className={`arabic ${className}`}>
      {clusters(text).map((c, i) =>
        c.letter ? (
          <span key={i} className={known.has(c.letter) ? "text-green" : "text-[#b0b0b0]"}>
            {c.text}
          </span>
        ) : (
          <span key={i}>{c.text}</span>
        ),
      )}
    </p>
  );
}
