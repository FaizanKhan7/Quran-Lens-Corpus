"use client";

/**
 * VerseAccordion — spec §10.2
 *
 * Tier 1 (always visible):
 *   Verse number badge · Arabic text · word count
 *
 * Tier 2 (tap to expand — inline, no navigation):
 *   Word-by-word grid loaded lazily on first expand
 *
 * Spec rules enforced:
 *   - Full bar is the clickable trigger (entire <button>)
 *   - No auto-scroll on expansion   — no scrollIntoView
 *   - No auto-collapse of siblings  — state is purely local
 *   - Words fetched once and cached — re-expanding re-uses result
 *   - Link to full verse detail page (Level 2 → Level 3 navigation)
 */

import { useState, useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { VerseWordGrid } from "@/components/ui/VerseWordGrid";
import type { VerseMeta } from "@/lib/surah-data";
import type {
  Word, Segment, MorphologicalFeatures, POSTag, SegmentType,
} from "@/types/corpus";

// ─── API response → frontend type mappers ────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSegment(seg: any): Segment {
  return {
    position:       seg.position       as number,
    type:           seg.type           as SegmentType,
    formBuckwalter: seg.formBuckwalter as string,
    formArabic:     seg.formArabic     as string,
    posTag:         seg.posTag         as POSTag,
    posDescription: (seg.posDescription        ?? "") as string,
    posArabic:      (seg.posDescriptionArabic  ?? "") as string,
    // `features` is the raw JSONB blob — field names match MorphologicalFeatures
    features:       ((seg.features ?? {}) as MorphologicalFeatures),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapWord(w: any, surahId: number): Word {
  const parts   = (w.id as string).split(":");
  const verseNo = parseInt(parts[1] ?? "0", 10);
  return {
    location:         w.id                         as string,
    surah:            surahId,
    verse:            verseNo,
    position:         w.position                   as number,
    textUthmani:      (w.textUthmani     ?? "")    as string,
    transliteration:  (w.transliteration ?? "")    as string,
    translation:      (w.translation     ?? "")    as string,
    audioUrl:         (w.audioUrl        ?? "")    as string,
    segments:         ((w.segments ?? []) as unknown[]).map(mapSegment),
    root:             w.root ?? undefined,
    ontologyConcepts: [],
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface VerseAccordionProps {
  verse:   VerseMeta;
  surahId: number;
}

export function VerseAccordion({ verse, surahId }: VerseAccordionProps) {
  const [expanded, setExpanded] = useState(false);
  const [words, setWords]       = useState<Word[] | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  // Prevents duplicate fetches — cleared only on error (to allow retry)
  const fetchedRef = useRef(false);

  async function loadWords() {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`/api/v1/verses/${verse.id}`);
      const json = await res.json() as { data?: { words?: unknown[] }; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to load verse");
      const apiWords = json.data?.words ?? [];
      setWords(apiWords.map((w) => mapWord(w, surahId)));
    } catch (e) {
      fetchedRef.current = false; // allow retry
      setError(e instanceof Error ? e.message : "Could not load words");
    } finally {
      setLoading(false);
    }
  }

  function handleToggle() {
    const next = !expanded;
    setExpanded(next);
    if (next && !fetchedRef.current) void loadWords();
  }

  function handleRetry() {
    fetchedRef.current = false;
    void loadWords();
  }

  const panelId = `verse-panel-${verse.id}`;

  return (
    <div
      className={cn("verse-accordion", expanded && "verse-accordion--expanded")}
      data-verse={verse.id}
    >
      {/* ── Tier 1 trigger — full bar clickable (spec §10.2) ─────────────── */}
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="verse-accordion__trigger"
      >
        {/* Verse number */}
        <span
          className="verse-accordion__number"
          aria-label={`Verse ${verse.verseNumber}`}
        >
          {verse.verseNumber}
        </span>

        {/* Arabic text — dominant, RTL */}
        <span
          lang="ar"
          dir="rtl"
          className="verse-accordion__arabic arabic"
        >
          {verse.textUthmani}
        </span>

        {/* Word count + link to detail page */}
        <span className="verse-accordion__meta" dir="ltr">
          <span className="latin verse-accordion__word-count">
            {verse.wordCount}w
          </span>
          <Link
            href={`/surah/${surahId}/verse/${verse.verseNumber}`}
            aria-label={`Open full analysis for verse ${verse.verseNumber}`}
            onClick={(e) => e.stopPropagation()}
            className="verse-accordion__detail-link inline-link latin"
          >
            →
          </Link>
        </span>

        {/* Chevron */}
        <span
          className={cn(
            "verse-accordion__chevron",
            expanded && "verse-accordion__chevron--open",
          )}
          aria-hidden="true"
        >
          ›
        </span>
      </button>

      {/* ── Tier 2 — word-by-word grid (spec §10.2) ──────────────────────── */}
      {expanded && (
        <div
          id={panelId}
          role="region"
          aria-label={`Words for verse ${verse.verseNumber}`}
          className="verse-accordion__body"
        >
          {/* Loading skeleton */}
          {loading && (
            <div
              className="verse-accordion__skeleton"
              aria-live="polite"
              aria-busy="true"
              aria-label="Loading words…"
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton-word-card" />
              ))}
            </div>
          )}

          {/* Error + retry */}
          {error && !loading && (
            <div className="verse-accordion__error" dir="ltr">
              <span className="latin text-sm">{error}</span>
              <button
                type="button"
                onClick={handleRetry}
                className="verse-accordion__retry latin"
              >
                Retry
              </button>
            </div>
          )}

          {/* Word grid */}
          {words && !loading && <VerseWordGrid words={words} />}
        </div>
      )}
    </div>
  );
}
