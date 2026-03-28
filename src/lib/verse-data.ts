/**
 * verse-data.ts — server-side data helpers for verse pages.
 *
 * Queries Prisma directly (no extra HTTP hop) and normalises DB rows
 * into the canonical frontend Word[] type used by WordCard.
 */

import { prisma } from "@/lib/prisma";
import { posLabel } from "@/lib/api-helpers";
import type { Word, Segment, MorphologicalFeatures, POSTag, SegmentType } from "@/types/corpus";

// ─── Verse summary returned alongside words ───────────────────────────────────

export interface VerseSummary {
  id:          string;
  surahId:     number;
  verseNumber: number;
  textUthmani: string;
  versesCount: number; // total verses in surah, for prev/next nav
}

// ─── Segment normaliser ───────────────────────────────────────────────────────

// Converts a raw Prisma Segment row into the typed Segment shape.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSegment(raw: any): Segment {
  const pos = posLabel(raw.posTag ?? "");
  // The JSONB features blob has the same field names as MorphologicalFeatures
  const features = (raw.features ?? {}) as MorphologicalFeatures;

  return {
    position:       raw.segmentPosition as number,
    type:           raw.segmentType    as SegmentType,
    formBuckwalter: raw.formBuckwalter as string,
    formArabic:     raw.formArabic     as string,
    posTag:         raw.posTag         as POSTag,
    posDescription: pos.description,
    posArabic:      pos.descriptionArabic,
    features,
  };
}

// ─── Main query ───────────────────────────────────────────────────────────────

export interface VerseData {
  verse:           VerseSummary;
  surahNameSimple: string;
  surahNameArabic: string;
  words:           Word[];
}

/**
 * Loads a single verse with all words + morphological segments.
 * Returns null when the verse key does not exist in the DB.
 */
export async function getVerseData(
  surahId: number,
  verseNumber: number,
): Promise<VerseData | null> {
  const verseId = `${surahId}:${verseNumber}`;

  const [verse, surah] = await Promise.all([
    prisma.verse.findUnique({
      where: { id: verseId },
      include: {
        words: {
          orderBy: { position: "asc" },
          include: {
            segments:  { orderBy: { segmentPosition: "asc" } },
            wordRoots: { include: { root: { select: { lettersBuckwalter: true, lettersArabic: true, frequency: true } } } },
          },
        },
      },
    }),
    prisma.surah.findUnique({
      where:  { id: surahId },
      select: { versesCount: true, nameSimple: true, nameArabic: true },
    }),
  ]);

  if (!verse) return null;

  const words: Word[] = verse.words.map((w) => ({
    location:        w.id,
    surah:           w.surahId,
    verse:           w.verseNumber,
    position:        w.position,
    textUthmani:     w.textUthmani,
    transliteration: w.transliteration,
    translation:     w.translation,
    audioUrl:        w.audioUrl,
    segments:        w.segments.map(toSegment),
    root:            w.wordRoots[0]?.root ?? undefined,
    ontologyConcepts: [],
  }));

  return {
    verse: {
      id:          verse.id,
      surahId:     verse.surahId,
      verseNumber: verse.verseNumber,
      textUthmani: verse.textUthmani,
      versesCount: surah?.versesCount ?? 0,
    },
    surahNameSimple: surah?.nameSimple ?? `Surah ${surahId}`,
    surahNameArabic: surah?.nameArabic ?? "",
    words,
  };
}
