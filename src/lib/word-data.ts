/**
 * word-data.ts — server-side data helper for the word detail page (Tier 4).
 *
 * Queries Prisma directly and returns all data needed by the Tier 4 page:
 *   - Full word with all morphological segments
 *   - Primary root + first 20 root concordance words (all Quran occurrences)
 *   - Surah metadata for breadcrumb
 */

import { prisma } from "@/lib/prisma";
import { posLabel } from "@/lib/api-helpers";
import type { Word, Segment, MorphologicalFeatures, POSTag, SegmentType } from "@/types/corpus";

// ─── Root concordance row ─────────────────────────────────────────────────────

export interface RootOccurrence {
  wordId:          string;
  surahId:         number;
  verseNumber:     number;
  position:        number;
  textUthmani:     string;
  transliteration: string;
}

// ─── Return shape ─────────────────────────────────────────────────────────────

export interface WordPageData {
  word:                  Word;
  surahNameSimple:       string;
  surahNameArabic:       string;
  versesCount:           number;
  rootOccurrences:       RootOccurrence[];  // first 20
  rootOccurrenceCount:   number;            // total across all Quran
}

// ─── Segment normaliser ───────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSegment(raw: any): Segment {
  const pos = posLabel(raw.posTag ?? "");
  return {
    position:       raw.segmentPosition as number,
    type:           raw.segmentType     as SegmentType,
    formBuckwalter: raw.formBuckwalter  as string,
    formArabic:     raw.formArabic      as string,
    posTag:         raw.posTag          as POSTag,
    posDescription: pos.description,
    posArabic:      pos.descriptionArabic,
    features:       (raw.features ?? {}) as MorphologicalFeatures,
  };
}

// ─── Main query ───────────────────────────────────────────────────────────────

export async function getWordPageData(
  surahId:     number,
  verseNumber: number,
  wordPos:     number,
): Promise<WordPageData | null> {
  const wordId = `${surahId}:${verseNumber}:${wordPos}`;

  const [wordRow, surah] = await Promise.all([
    prisma.word.findUnique({
      where:   { id: wordId },
      include: {
        segments:  { orderBy: { segmentPosition: "asc" } },
        wordRoots: { include: { root: true } },
      },
    }),
    prisma.surah.findUnique({
      where:  { id: surahId },
      select: { nameSimple: true, nameArabic: true, versesCount: true },
    }),
  ]);

  if (!wordRow || !surah) return null;

  const segments = wordRow.segments.map(toSegment);
  const primaryRoot = wordRow.wordRoots[0]?.root ?? undefined;

  // Root concordance — count + first 20 ordered chronologically
  let rootOccurrences: RootOccurrence[] = [];
  let rootOccurrenceCount = 0;

  if (primaryRoot) {
    const [count, occRows] = await Promise.all([
      prisma.wordRoot.count({ where: { rootId: primaryRoot.id } }),
      prisma.wordRoot.findMany({
        where:   { rootId: primaryRoot.id },
        take:    20,
        orderBy: [
          { word: { surahId:     "asc" } },
          { word: { verseNumber: "asc" } },
          { word: { position:    "asc" } },
        ],
        include: {
          word: {
            select: {
              id:              true,
              surahId:         true,
              verseNumber:     true,
              position:        true,
              textUthmani:     true,
              transliteration: true,
            },
          },
        },
      }),
    ]);

    rootOccurrenceCount = count;
    rootOccurrences = occRows.map((r) => ({
      wordId:          r.wordId,
      surahId:         r.word.surahId,
      verseNumber:     r.word.verseNumber,
      position:        r.word.position,
      textUthmani:     r.word.textUthmani,
      transliteration: r.word.transliteration,
    }));
  }

  const word: Word = {
    location:        wordRow.id,
    surah:           wordRow.surahId,
    verse:           wordRow.verseNumber,
    position:        wordRow.position,
    textUthmani:     wordRow.textUthmani,
    transliteration: wordRow.transliteration,
    translation:     wordRow.translation,
    audioUrl:        wordRow.audioUrl,
    segments,
    root: primaryRoot
      ? {
          lettersBuckwalter: primaryRoot.lettersBuckwalter,
          lettersArabic:     primaryRoot.lettersArabic,
          frequency:         primaryRoot.frequency,
        }
      : undefined,
    ontologyConcepts: [],
  };

  return {
    word,
    surahNameSimple:     surah.nameSimple,
    surahNameArabic:     surah.nameArabic,
    versesCount:         surah.versesCount,
    rootOccurrences,
    rootOccurrenceCount,
  };
}
