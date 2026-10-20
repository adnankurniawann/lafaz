import type { UnitColor } from "@/lib/course";

export const UNIT_COLORS: Record<UnitColor, { bg: string; border: string; text: string; ring: string }> = {
  green: { bg: "bg-green", border: "border-green-dark", text: "text-green", ring: "ring-green/30" },
  purple: { bg: "bg-purple", border: "border-purple-dark", text: "text-purple", ring: "ring-purple/30" },
  blue: { bg: "bg-blue", border: "border-blue-dark", text: "text-blue", ring: "ring-blue/30" },
  orange: { bg: "bg-orange", border: "border-[#d97a0c]", text: "text-orange", ring: "ring-orange/30" },
  pink: { bg: "bg-pink", border: "border-pink-dark", text: "text-pink", ring: "ring-pink/30" },
  teal: { bg: "bg-teal", border: "border-teal-dark", text: "text-teal", ring: "ring-teal/30" },
  red: { bg: "bg-red", border: "border-red-dark", text: "text-red", ring: "ring-red/30" },
  gold: { bg: "bg-gold", border: "border-gold-dark", text: "text-gold", ring: "ring-gold/30" },
};
