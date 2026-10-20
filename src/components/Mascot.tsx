// Pelita, the Lafaz mascot: a small lantern. Moods change the face and glow.

export type MascotMood = "happy" | "cheer" | "sad" | "think";

export function Mascot({ mood = "happy", size = 120, className = "" }: { mood?: MascotMood; size?: number; className?: string }) {
  const glow = mood === "sad" ? "#ffe9a8" : "#ffd447";
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className} aria-hidden>
      <ellipse cx="60" cy="112" rx="30" ry="5" fill="#000" opacity="0.08" />
      {/* handle */}
      <path d="M44 22 Q60 2 76 22" fill="none" stroke="#2e9a3f" strokeWidth="6" strokeLinecap="round" />
      {/* cap */}
      <rect x="36" y="20" width="48" height="12" rx="6" fill="#3fb950" />
      {/* glass body with light */}
      <rect x="30" y="30" width="60" height="66" rx="22" fill={glow} />
      <rect x="30" y="30" width="60" height="66" rx="22" fill="none" stroke="#2e9a3f" strokeWidth="5" />
      <path d="M40 40 Q36 60 42 80" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.6" />
      {/* base */}
      <rect x="38" y="94" width="44" height="12" rx="6" fill="#3fb950" />
      {/* face */}
      {mood === "sad" ? (
        <>
          <path d="M47 60 q5 -4 10 0" stroke="#3c3c3c" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M63 60 q5 -4 10 0" stroke="#3c3c3c" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M52 78 q8 -7 16 0" stroke="#3c3c3c" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      ) : mood === "cheer" ? (
        <>
          <path d="M46 62 q6 -8 12 0" stroke="#3c3c3c" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M62 62 q6 -8 12 0" stroke="#3c3c3c" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M48 72 q12 16 24 0 z" fill="#c73636" />
          <circle cx="44" cy="74" r="4" fill="#ff9a8a" opacity="0.7" />
          <circle cx="76" cy="74" r="4" fill="#ff9a8a" opacity="0.7" />
        </>
      ) : (
        <>
          <circle cx="51" cy="60" r="5" fill="#3c3c3c" />
          <circle cx="69" cy="60" r="5" fill="#3c3c3c" />
          <circle cx="52.5" cy="58.5" r="1.6" fill="#fff" />
          <circle cx="70.5" cy="58.5" r="1.6" fill="#fff" />
          {mood === "think" ? (
            <path d="M53 77 h14" stroke="#3c3c3c" strokeWidth="4" strokeLinecap="round" />
          ) : (
            <path d="M51 73 q9 9 18 0" stroke="#3c3c3c" strokeWidth="4" fill="none" strokeLinecap="round" />
          )}
          <circle cx="44" cy="72" r="4" fill="#ff9a8a" opacity="0.6" />
          <circle cx="76" cy="72" r="4" fill="#ff9a8a" opacity="0.6" />
        </>
      )}
    </svg>
  );
}

export function SpeechBubble({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative rounded-2xl border-2 border-line bg-white px-4 py-3 text-[15px] font-bold ${className}`}>
      {children}
    </div>
  );
}
