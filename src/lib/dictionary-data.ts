/**
 * dictionary-data.ts — server-side data helpers for /dictionary pages.
 *
 * All functions are async and use Prisma directly (server-only).
 * No "use client" — this module must NOT be imported from client components.
 */

import { prisma } from "@/lib/prisma";

// ─── Shared Interfaces ────────────────────────────────────────────────────────

export interface RootOccurrence {
  wordId:          string;
  surahId:         number;
  surahNameSimple: string;
  surahNameArabic: string;
  verseNumber:     number;
  position:        number;
  textUthmani:     string;
  transliteration: string;
  translation:     string;
  posTag?:         string;
}

export interface LemmaInfo {
  id:             number;
  formArabic:     string;
  formBuckwalter: string;
  posTag:         string;
  frequency:      number;
}

export interface RootPageData {
  root: {
    id:                number;
    lettersArabic:     string;
    lettersBuckwalter: string;
    frequency:         number;
  };
  lemmas:      LemmaInfo[];
  occurrences: RootOccurrence[];
  total:       number;
  page:        number;
  perPage:     number;
  totalPages:  number;
}

export interface DictionaryListData {
  roots: Array<{
    id:                number;
    lettersArabic:     string;
    lettersBuckwalter: string;
    frequency:         number;
  }>;
  total:      number;
  page:       number;
  perPage:    number;
  totalPages: number;
  query:      string;
}

// ─── getRootPageData ──────────────────────────────────────────────────────────

export async function getRootPageData(
  bw:      string,
  page:    number,
  perPage: number,
): Promise<RootPageData | null> {
  const root = await prisma.root.findUnique({
    where: { lettersBuckwalter: bw },
  });

  if (!root) return null;

  const skip = (page - 1) * perPage;

  const [wordRoots, total] = await prisma.$transaction([
    prisma.wordRoot.findMany({
      where: { rootId: root.id },
      orderBy: [
        { word: { surahId:     "asc" } },
        { word: { verseNumber: "asc" } },
        { word: { position:    "asc" } },
      ],
      skip,
      take: perPage,
      include: {
        word: {
          select: {
            id:             true,
            surahId:        true,
            verseNumber:    true,
            position:       true,
            textUthmani:    true,
            transliteration: true,
            translation:    true,
            verse: {
              include: {
                surah: {
                  select: {
                    nameSimple: true,
                    nameArabic: true,
                  },
                },
              },
            },
            segments: {
              where: { segmentType: "STEM" },
              take:  1,
              select: { posTag: true },
            },
          },
        },
      },
    }),
    prisma.wordRoot.count({ where: { rootId: root.id } }),
  ]);

  const lemmas = await prisma.lemma.findMany({
    where:   { rootId: root.id },
    orderBy: { frequency: "desc" },
    take:    20,
    select: {
      id:             true,
      formArabic:     true,
      formBuckwalter: true,
      posTag:         true,
      frequency:      true,
    },
  });

  const occurrences: RootOccurrence[] = wordRoots.map((wr) => ({
    wordId:          wr.word.id,
    surahId:         wr.word.surahId,
    surahNameSimple: wr.word.verse.surah.nameSimple,
    surahNameArabic: wr.word.verse.surah.nameArabic,
    verseNumber:     wr.word.verseNumber,
    position:        wr.word.position,
    textUthmani:     wr.word.textUthmani,
    transliteration: wr.word.transliteration,
    translation:     wr.word.translation,
    posTag:          wr.word.segments[0]?.posTag,
  }));

  return {
    root: {
      id:                root.id,
      lettersArabic:     root.lettersArabic,
      lettersBuckwalter: root.lettersBuckwalter,
      frequency:         root.frequency,
    },
    lemmas: lemmas.map((l) => ({
      id:             l.id,
      formArabic:     l.formArabic,
      formBuckwalter: l.formBuckwalter,
      posTag:         l.posTag,
      frequency:      l.frequency,
    })),
    occurrences,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

// ─── getDictionaryList ────────────────────────────────────────────────────────

export async function getDictionaryList(
  q:       string,
  page:    number,
  perPage: number,
): Promise<DictionaryListData> {
  const skip = (page - 1) * perPage;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = q
    ? {
        OR: [
          { lettersArabic:     { contains: q } },
          { lettersBuckwalter: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [roots, total] = await prisma.$transaction([
    prisma.root.findMany({
      where,
      orderBy: { frequency: "desc" },
      skip,
      take:    perPage,
      select: {
        id:                true,
        lettersArabic:     true,
        lettersBuckwalter: true,
        frequency:         true,
      },
    }),
    prisma.root.count({ where }),
  ]);

  return {
    roots: roots.map((r) => ({
      id:                r.id,
      lettersArabic:     r.lettersArabic,
      lettersBuckwalter: r.lettersBuckwalter,
      frequency:         r.frequency,
    })),
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
    query:      q,
  };
}
