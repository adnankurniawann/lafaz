import { getRule, type TajweedSegment } from "@/lib/tajweed";

type Props = {
  segments: TajweedSegment[];
  className?: string;
};

// One span per segment. Chromium and Firefox shape Arabic across inline
// boundaries, so a colored harakat or a split cluster still joins correctly.
export function TajweedText({ segments, className = "" }: Props) {
  return (
    <p dir="rtl" lang="ar" className={`arabic ${className}`}>
      {segments.map((seg, i) =>
        seg.rule ? (
          <span key={i} style={{ color: getRule(seg.rule).color }} data-rule={seg.rule}>
            {seg.text}
          </span>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </p>
  );
}
