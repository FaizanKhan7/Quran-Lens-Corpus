/**
 * POSBadge
 * ─────────────────────────────────────────────────────────────────────────────
 * Implements POS triple-encoding: color + text abbreviation + shape (spec §8.3)
 *
 * - Nominal  → green  + rectangle border
 * - Verbal   → blue   + rounded-rect border
 * - Particle → red    + pill/capsule border
 * - Special  → purple + diamond (rotated square)
 * - Phrase   → slate  + rounded dashed border
 * - Hidden   → gray   + rounded dotted border
 *
 * Usage:
 *   <POSBadge tag="N" />                   → "N" badge (noun, green rectangle)
 *   <POSBadge tag="V" />                   → "V" badge (verb, blue rounded-rect)
 *   <POSBadge tag="CONJ" />                → "CONJ" pill (particle, red)
 *   <POSBadge tag="INL" />                 → "INL" diamond (special, purple)
 *   <POSBadge tag="NS" category="phrase" /> → "NS" dashed (phrase node)
 *   <POSBadge tag="*" category="hidden" />  → "(*)" dotted (pro-drop)
 */

import { cn } from "@/lib/utils";
import { getPOSCategory, POS_META } from "@/lib/tokens";
import type { POSCategory, POSTag } from "@/types/corpus";

interface POSBadgeProps {
  /** A corpus POS tag (N, V, CONJ …) or phrase/hidden label */
  tag: POSTag | string;
  /** Override category — needed for phrase nodes and hidden nodes not in POSTag union */
  category?: POSCategory | "phrase" | "hidden";
  /** Show the full English description as tooltip */
  showTooltip?: boolean;
  className?: string;
}

const CATEGORY_CLASS: Record<string, string> = {
  nominal:  "pos-badge--nominal",
  verbal:   "pos-badge--verbal",
  particle: "pos-badge--particle",
  special:  "pos-badge--special",
  phrase:   "pos-badge--phrase",
  hidden:   "pos-badge--hidden",
};

export function POSBadge({
  tag,
  category: categoryOverride,
  showTooltip = true,
  className,
}: POSBadgeProps) {
  const meta = POS_META[tag as POSTag];
  const category = categoryOverride ?? (meta ? getPOSCategory(tag as POSTag) : "particle");
  const label = meta?.label ?? tag;
  const description = meta?.description;
  const descriptionArabic = meta?.descriptionArabic;

  const modifierClass = CATEGORY_CLASS[category] ?? "pos-badge--particle";
  const isSpecial = category === "special";

  const tooltip =
    showTooltip && description
      ? `${description}${descriptionArabic ? ` · ${descriptionArabic}` : ""}`
      : undefined;

  return (
    <span
      role="img"
      aria-label={description ?? label}
      title={tooltip}
      className={cn("pos-badge", modifierClass, className)}
    >
      {isSpecial ? <span>{label}</span> : label}
    </span>
  );
}

// ─── Convenience variants ─────────────────────────────────────────────────────

export function PhraseBadge({ tag, className }: { tag: string; className?: string }) {
  return (
    <POSBadge
      tag={tag as POSTag}
      category="phrase"
      showTooltip={false}
      className={className}
    />
  );
}

export function HiddenNodeBadge({ className }: { className?: string }) {
  return (
    <POSBadge
      tag={"*" as POSTag}
      category="hidden"
      showTooltip={false}
      className={className}
    />
  );
}
