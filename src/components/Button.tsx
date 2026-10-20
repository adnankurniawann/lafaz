import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

// Chunky buttons with a darker bottom edge that presses down, like Duolingo.

export type ButtonColor = "green" | "blue" | "red" | "gold" | "purple" | "white" | "ghost";

const COLORS: Record<ButtonColor, string> = {
  green: "bg-green text-white border-green-dark",
  blue: "bg-blue text-white border-blue-dark",
  red: "bg-red text-white border-red-dark",
  gold: "bg-gold text-white border-gold-dark",
  purple: "bg-purple text-white border-purple-dark",
  white: "bg-white text-blue border-line border-2",
  ghost: "bg-transparent text-blue border-transparent",
};

const BASE =
  "inline-flex w-full items-center justify-center gap-2 rounded-2xl border-b-4 px-5 py-3 text-[15px] font-extrabold uppercase tracking-wide transition active:translate-y-[2px] active:border-b-2 disabled:pointer-events-none disabled:border-line disabled:bg-line disabled:text-muted";

type Props = { color?: ButtonColor; children: ReactNode; className?: string };

export function Button({ color = "green", className = "", ...props }: Props & ComponentProps<"button">) {
  return <button type="button" className={`${BASE} ${COLORS[color]} ${className}`} {...props} />;
}

export function ButtonLink({ color = "green", className = "", ...props }: Props & ComponentProps<typeof Link>) {
  return <Link className={`${BASE} ${COLORS[color]} ${className}`} {...props} />;
}
