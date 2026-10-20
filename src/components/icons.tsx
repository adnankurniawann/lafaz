// Small filled icons, drawn for Lafaz.

type IconProps = { className?: string };

export function FlameIcon({ className = "size-6", lit = true }: IconProps & { lit?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M12 2c1 3.5 5.5 6 5.5 11.2A5.5 5.5 0 0 1 12 19a5.5 5.5 0 0 1-5.5-5.8C6.5 10 9 9 9.5 6c1.6 1.2 2.4 2.7 2.5 4.2C13 8.3 12.8 5 12 2z" fill={lit ? "#ff9a1f" : "#d0d0d0"} />
      <path d="M12 11c.6 1.8 3 3 3 5.2A3 3 0 0 1 12 19a3 3 0 0 1-3-2.8c0-1.6 1.1-2.4 1.6-3.8.6.6.9 1.1 1 1.9.5-1.2.6-2.4.4-3.3z" fill={lit ? "#ffd447" : "#ececec"} />
    </svg>
  );
}

export function HeartIcon({ className = "size-6", empty = false }: IconProps & { empty?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M12 21s-8-5.2-8-11.2A4.6 4.6 0 0 1 12 7a4.6 4.6 0 0 1 8 2.8C20 15.8 12 21 12 21z" fill={empty ? "#d0d0d0" : "#ef4b4b"} />
      {!empty && <path d="M7.5 8.5a2.2 2.2 0 0 1 2.6-.4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.7" />}
    </svg>
  );
}

export function BoltIcon({ className = "size-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M13 2L4 14h7l-1 8 9-12h-7z" fill="#f5b400" />
    </svg>
  );
}

export function StarIcon({ className = "size-8" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.5L12 17.2l-5.9 3.2 1.3-6.5L2.5 9.3l6.6-.8z" fill="currentColor" />
    </svg>
  );
}

export function CheckIcon({ className = "size-8" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function LockIcon({ className = "size-7" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="currentColor" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke="currentColor" strokeWidth="2.4" fill="none" />
    </svg>
  );
}

export function TrophyIcon({ className = "size-8" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M7 3h10v5a5 5 0 0 1-10 0z" fill="currentColor" />
      <path d="M7 5H4a3 3 0 0 0 3 4M17 5h3a3 3 0 0 1-3 4" stroke="currentColor" strokeWidth="2" fill="none" />
      <rect x="10.5" y="12.5" width="3" height="4" fill="currentColor" />
      <rect x="7.5" y="16.5" width="9" height="3.5" rx="1.2" fill="currentColor" />
    </svg>
  );
}

export function ChestIcon({ className = "size-10", open = false }: IconProps & { open?: boolean }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      {open ? (
        <>
          <path d="M6 12l4-7h20l4 7z" fill="#c98a2b" />
          <rect x="6" y="16" width="28" height="18" rx="3" fill="#e0a43a" />
          <circle cx="20" cy="14" r="5" fill="#6cc0ff" />
        </>
      ) : (
        <>
          <path d="M6 16a8 8 0 0 1 8-8h12a8 8 0 0 1 8 8z" fill="#c98a2b" />
          <rect x="6" y="16" width="28" height="18" rx="3" fill="#e0a43a" />
        </>
      )}
      <rect x="6" y="16" width="28" height="3" fill="#a86f1c" />
      <rect x="17" y="17" width="6" height="7" rx="1.5" fill="#f5d36b" />
    </svg>
  );
}

export function MicIcon({ className = "size-8" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="8.5" y="2.5" width="7" height="12" rx="3.5" fill="currentColor" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function CloseIcon({ className = "size-7" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}

export function HomeIcon({ className = "size-7" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M3 11l9-7 9 7v9a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H4.5A1.5 1.5 0 0 1 3 20z" fill="currentColor" />
    </svg>
  );
}

export function LettersIcon({ className = "size-7" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="2.5" y="3" width="19" height="18" rx="4" fill="currentColor" />
      <text x="12" y="17" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff" fontFamily="serif">
        ب
      </text>
    </svg>
  );
}

export function MapIcon({ className = "size-7" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M2 5.5l6.5-2.5 7 2.5L22 3v15.5L15.5 21l-7-2.5L2 21z" fill="currentColor" />
      <path d="M8.5 3v15.5M15.5 5.5V21" stroke="#fff" strokeWidth="1.4" opacity="0.6" />
    </svg>
  );
}

export function TargetIcon({ className = "size-7" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9.5" fill="currentColor" />
      <circle cx="12" cy="12" r="6" fill="#fff" />
      <circle cx="12" cy="12" r="2.8" fill="currentColor" />
    </svg>
  );
}

export function UserIcon({ className = "size-7" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="8" r="4.5" fill="currentColor" />
      <path d="M3.5 21a8.5 8.5 0 0 1 17 0z" fill="currentColor" />
    </svg>
  );
}

export function BookIcon({ className = "size-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z" fill="currentColor" />
      <path d="M4 21.5A2.5 2.5 0 0 1 6.5 19H20v3H6.5" fill="currentColor" opacity="0.6" />
    </svg>
  );
}
