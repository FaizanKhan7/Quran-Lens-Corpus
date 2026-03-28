"use client";

/**
 * VerseWordGrid — RTL word-by-word grid of WordCard components.
 *
 * Spec §10.2 / §11 F01:
 *   - Words flow right-to-left (Arabic reading order)
 *   - Each word is a WordCard with Tier 1-2 disclosure
 *   - No auto-collapse when a sibling expands (local state per card)
 *   - Responsive: wraps at narrower viewports
 */

import { WordCard } from "@/components/ui/WordCard";
import type { Word } from "@/types/corpus";

interface VerseWordGridProps {
  words: Word[];
}

export function VerseWordGrid({ words }: VerseWordGridProps) {
  if (words.length === 0) {
    return (
      <p
        dir="ltr"
        className="latin text-sm"
        style={{ color: "var(--token-text-tertiary)" }}
      >
        No words found for this verse.
      </p>
    );
  }

  return (
    <div
      dir="rtl"
      role="list"
      aria-label="Word-by-word analysis"
      className="verse-word-grid"
    >
      {words.map((word) => (
        <div key={word.location} role="listitem">
          <WordCard word={word} />
        </div>
      ))}
    </div>
  );
}
