"use client";

/**
 * Breadcrumb — spec §9.2
 *
 * Desktop: full chain  Home › All Surahs › Al-Baqarah (2) › Verse 255 › ٱللَّهُ
 * Mobile:  first + "…" button + last (intermediate items hidden until expanded)
 *
 * Accessibility:
 *   - <nav aria-label="Breadcrumb"> wrapping <ol role="list">
 *   - aria-current="page" on final item
 *   - aria-expanded on ellipsis button
 *   - Separators aria-hidden
 */

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  /** Latin label (always shown) */
  label: string;
  /** Arabic text shown alongside or instead of label for Arabic-primary crumbs */
  labelArabic?: string;
  /** href — if omitted, item renders as current-page (non-linked) */
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  const [expanded, setExpanded] = useState(false);

  // Items 1..n-2 are "middle" — collapsed on mobile when not expanded
  const hasMiddle = items.length > 3;

  return (
    <nav aria-label="Breadcrumb" className={cn("breadcrumb", className)}>
      <ol className="breadcrumb__list" role="list">
        {items.map((item, idx) => {
          const isFirst   = idx === 0;
          const isLast    = idx === items.length - 1;
          const isMiddle  = !isFirst && !isLast;

          return (
            <li
              key={idx}
              className={cn(
                "breadcrumb__item",
                isMiddle && hasMiddle && !expanded && "breadcrumb__item--collapsed",
              )}
              aria-current={isLast ? "page" : undefined}
            >
              {/* Separator — hidden for first item */}
              {!isFirst && (
                <span className="breadcrumb__sep" aria-hidden="true">›</span>
              )}

              {/* Ellipsis trigger — inserted after first item when middle items are collapsed */}
              {idx === 1 && hasMiddle && !expanded && (
                <>
                  <button
                    type="button"
                    className="breadcrumb__ellipsis"
                    onClick={() => setExpanded(true)}
                    aria-label="Show full breadcrumb path"
                    aria-expanded={false}
                  >
                    …
                  </button>
                  <span className="breadcrumb__sep" aria-hidden="true">›</span>
                </>
              )}

              {/* The item itself */}
              {item.href ? (
                <Link href={item.href} className="breadcrumb__link">
                  {item.labelArabic ? (
                    <>
                      <span lang="ar" dir="rtl" className="breadcrumb__arabic arabic">
                        {item.labelArabic}
                      </span>
                      {item.label && (
                        <span className="breadcrumb__latin">{item.label}</span>
                      )}
                    </>
                  ) : (
                    item.label
                  )}
                </Link>
              ) : (
                <span className="breadcrumb__current">
                  {item.labelArabic ? (
                    <span lang="ar" dir="rtl" className="breadcrumb__arabic arabic">
                      {item.labelArabic}
                    </span>
                  ) : (
                    item.label
                  )}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
