"use client";

/**
 * WordCard — progressive-disclosure word analysis card (spec §10.1)
 *
 * Tier 1 — Glance (always visible):
 *   Arabic word · English gloss · POS badge
 *
 * Tier 2 — Expanded (tap to toggle):
 *   Transliteration · Root (Arabic + Buckwalter) · Lemma · Person/Gender/Number/Case
 *
 * Spec requirements met:
 *   - Full bar clickable (not just icon)         — the entire card is a <button>
 *   - No auto-scroll on expansion                — no scrollIntoView called
 *   - No auto-collapse of siblings               — state is purely local
 *   - 48px min touch target                      — enforced via CSS
 *   - RTL-first, Arabic/Latin dual layout        — dir + font classes
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { POSBadge } from "@/components/ui/POSBadge";
import type { Word, Segment, POSTag } from "@/types/corpus";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns the primary STEM segment for a word, or undefined. */
function stemSegment(segments: Segment[]): Segment | undefined {
  return segments.find((s) => s.type === "STEM");
}

const CASE_LABEL: Record<string, string> = {
  NOM: "Nom.",
  ACC: "Acc.",
  GEN: "Gen.",
};

const ASPECT_LABEL: Record<string, string> = {
  PERF: "Perfect",
  IMPF: "Imperfect",
  IMPV: "Imperative",
};

const NUMBER_LABEL: Record<string, string> = {
  S: "Sing.",
  D: "Dual",
  P: "Pl.",
};

const GENDER_LABEL: Record<string, string> = {
  M: "Masc.",
  F: "Fem.",
};

const PERSON_LABEL: Record<string, string> = {
  "1": "1st",
  "2": "2nd",
  "3": "3rd",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span
        className="text-text-tertiary shrink-0"
        style={{ fontSize: "var(--token-font-size-latin-xs)" }}
      >
        {label}
      </span>
      <span
        className="text-text-secondary"
        style={{ fontSize: "var(--token-font-size-latin-sm)" }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface WordCardProps {
  word: Word;
  /** Tier 2 starts expanded. Useful for focused/detail views. */
  defaultExpanded?: boolean;
  /** Called when the card is expanded — e.g. to trigger Tier 3 fetch. */
  onExpand?: (word: Word) => void;
  className?: string;
}

export function WordCard({
  word,
  defaultExpanded = false,
  onExpand,
  className,
}: WordCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const stem = stemSegment(word.segments);
  const posTag = stem?.posTag as POSTag | undefined;
  const features = stem?.features ?? {};

  // Collect visible morphological detail rows for Tier 2
  const details: { label: string; value: string }[] = [];

  if (word.transliteration) {
    details.push({ label: "Translit.", value: word.transliteration });
  }
  if (features.root) {
    const rootDisplay = features.rootArabic
      ? `${features.rootArabic} · ${features.root}`
      : features.root;
    details.push({ label: "Root", value: rootDisplay });
  }
  if (features.lemma) {
    const lemmaDisplay = features.lemmaArabic
      ? `${features.lemmaArabic} · ${features.lemma}`
      : features.lemma;
    details.push({ label: "Lemma", value: lemmaDisplay });
  }
  if (features.verbAspect) {
    details.push({ label: "Aspect", value: ASPECT_LABEL[features.verbAspect] ?? features.verbAspect });
  }
  if (features.person) {
    details.push({ label: "Person", value: PERSON_LABEL[features.person] ?? features.person });
  }
  if (features.gender) {
    details.push({ label: "Gender", value: GENDER_LABEL[features.gender] ?? features.gender });
  }
  if (features.number) {
    details.push({ label: "Number", value: NUMBER_LABEL[features.number] ?? features.number });
  }
  if (features.gramCase) {
    details.push({ label: "Case", value: CASE_LABEL[features.gramCase] ?? features.gramCase });
  }
  if (features.gramState) {
    details.push({ label: "State", value: features.gramState === "DEF" ? "Definite" : "Indefinite" });
  }

  function handleToggle() {
    const next = !expanded;
    setExpanded(next);
    if (next && onExpand) onExpand(word);
  }

  return (
    <div
      className={cn(
        "word-card",
        expanded && "word-card--expanded",
        className,
      )}
      data-location={word.location}
    >
      {/* ── Tier 1 trigger — full bar is the button (spec §10.1) ─────────── */}
      <button
        type="button"
        aria-expanded={expanded}
        aria-label={`${word.textUthmani} — ${word.translation ?? ""}. ${expanded ? "Collapse" : "Expand"} word details`}
        onClick={handleToggle}
        className="word-card__trigger"
      >
        {/* Arabic word */}
        <span
          lang="ar"
          dir="rtl"
          className="word-card__arabic arabic"
        >
          {word.textUthmani}
        </span>

        {/* English gloss */}
        {word.translation && (
          <span
            dir="ltr"
            className="word-card__gloss latin"
          >
            {word.translation}
          </span>
        )}

        {/* POS badge */}
        {posTag && (
          <POSBadge
            tag={posTag}
            showTooltip={false}
            className="word-card__pos-badge"
          />
        )}

        {/* Expand chevron */}
        <span
          className={cn("word-card__chevron", expanded && "word-card__chevron--open")}
          aria-hidden="true"
        >
          ›
        </span>
      </button>

      {/* ── Tier 2 — expanded details (inline accordion, spec §10.1) ────── */}
      {expanded && details.length > 0 && (
        <div
          className="word-card__details"
          dir="ltr"
          role="region"
          aria-label={`Details for ${word.textUthmani}`}
        >
          {details.map(({ label, value }) => (
            <DetailRow key={label} label={label} value={value} />
          ))}

          {/* Prefix segments */}
          {word.segments.filter((s) => s.type === "PREFIX").length > 0 && (
            <div className="word-card__segments">
              <span
                className="text-text-tertiary"
                style={{ fontSize: "var(--token-font-size-latin-xs)" }}
              >
                Segments
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {word.segments.map((seg, i) => (
                  <span
                    key={i}
                    lang="ar"
                    dir="rtl"
                    title={`${seg.posDescription} (${seg.type.toLowerCase()})`}
                    className="arabic"
                    style={{
                      fontSize: "var(--token-font-size-arabic-sm)",
                      padding: "0 2px",
                      borderBottom: seg.type === "STEM" ? "2px solid var(--token-pos-verbal)" : undefined,
                    }}
                  >
                    {seg.formArabic || seg.formBuckwalter}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
