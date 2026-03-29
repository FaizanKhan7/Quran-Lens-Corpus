/**
 * search-data.ts — server-side search helpers for the /search page.
 *
 * All functions are async and use Prisma directly (server-only).
 * No "use client" — this module must NOT be imported from client components.
 */

import { prisma } from "@/lib/prisma";

// ─── Shared Interfaces ────────────────────────────────────────────────────────

export interface TextResult {
  wordId:          string;
  surahId:         number;
  verseNumber:     number;
  position:        number;
  textUthmani:     string;
  transliteration: string;
  translation:     string;
  posTag?:         string;
  surahNameSimple: string;
}

export interface RootResult {
  id:               number;
  lettersArabic:    string;
  lettersBuckwalter: string;
  frequency:        number;
}

export interface MorphResult {
  wordId:          string;
  surahId:         number;
  verseNumber:     number;
  wordPosition:    number;
  formArabic:      string;
  posTag:          string;
  rootBuckwalter:  string | null;
  gramCase:        string | null;
  verbAspect:      string | null;
  verbMood:        string | null;
  verbVoice:       string | null;
  verbForm:        string | null;
  person:          string | null;
  gender:          string | null;
  number:          string | null;
  surahNameSimple?: string;
}

export interface SearchPageData {
  type:         "text" | "root" | "morphological";
  query:        string;
  total:        number;
  page:         number;
  perPage:      number;
  totalPages:   number;
  textResults?:  TextResult[];
  rootResults?:  RootResult[];
  morphResults?: MorphResult[];
}

// ─── Text Search ──────────────────────────────────────────────────────────────

export async function searchText(
  q:       string,
  page:    number,
  perPage: number,
): Promise<SearchPageData> {
  const skip = (page - 1) * perPage;

  const where = {
    OR: [
      { textUthmani:     { contains: q } },
      { transliteration: { contains: q, mode: "insensitive" as const } },
      { translation:     { contains: q, mode: "insensitive" as const } },
    ],
  };

  const [words, total] = await prisma.$transaction([
    prisma.word.findMany({
      where,
      include: {
        verse: {
          include: {
            surah: { select: { nameSimple: true } },
          },
        },
        segments: {
          where: { segmentType: "STEM" },
          take: 1,
          select: { posTag: true },
        },
      },
      orderBy: [{ surahId: "asc" }, { verseNumber: "asc" }, { position: "asc" }],
      skip,
      take: perPage,
    }),
    prisma.word.count({ where }),
  ]);

  const textResults: TextResult[] = words.map((w) => ({
    wordId:          w.id,
    surahId:         w.surahId,
    verseNumber:     w.verseNumber,
    position:        w.position,
    textUthmani:     w.textUthmani,
    transliteration: w.transliteration,
    translation:     w.translation,
    posTag:          w.segments[0]?.posTag,
    surahNameSimple: w.verse.surah.nameSimple,
  }));

  return {
    type:        "text",
    query:       q,
    total,
    page,
    perPage,
    totalPages:  Math.ceil(total / perPage),
    textResults,
  };
}

// ─── Root Search ──────────────────────────────────────────────────────────────

export async function searchRoot(
  q:       string,
  page:    number,
  perPage: number,
): Promise<SearchPageData> {
  const skip = (page - 1) * perPage;

  const where = {
    OR: [
      { lettersArabic:     { contains: q } },
      { lettersBuckwalter: { contains: q, mode: "insensitive" as const } },
    ],
  };

  const [roots, total] = await prisma.$transaction([
    prisma.root.findMany({
      where,
      orderBy: { frequency: "desc" },
      skip,
      take: perPage,
      select: {
        id:               true,
        lettersArabic:    true,
        lettersBuckwalter: true,
        frequency:        true,
      },
    }),
    prisma.root.count({ where }),
  ]);

  const rootResults: RootResult[] = roots.map((r) => ({
    id:               r.id,
    lettersArabic:    r.lettersArabic,
    lettersBuckwalter: r.lettersBuckwalter,
    frequency:        r.frequency,
  }));

  return {
    type:       "root",
    query:      q,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
    rootResults,
  };
}

// ─── Morphological Search ─────────────────────────────────────────────────────

export async function searchMorphological(
  filters: Record<string, string>,
  page:    number,
  perPage: number,
): Promise<SearchPageData> {
  const skip = (page - 1) * perPage;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { segmentType: "STEM" };

  if (filters.pos)    where.posTag     = filters.pos.toUpperCase();
  if (filters.aspect) where.verbAspect = filters.aspect.toUpperCase();
  if (filters.mood)   where.verbMood   = filters.mood.toUpperCase();
  if (filters.voice)  where.verbVoice  = filters.voice.toUpperCase();
  if (filters.form)   where.verbForm   = filters.form.toUpperCase();
  if (filters.person) where.person     = filters.person;
  if (filters.gender) where.gender     = filters.gender.toUpperCase();
  if (filters.number) where.number     = filters.number.toUpperCase();
  if (filters.case)   where.gramCase   = filters.case.toUpperCase();
  if (filters.state)  where.gramState  = filters.state.toUpperCase();

  const [segments, total] = await prisma.$transaction([
    prisma.segment.findMany({
      where,
      include: {
        word: {
          select: {
            id:          true,
            surahId:     true,
            verseNumber: true,
            position:    true,
            textUthmani: true,
            verse: {
              select: {
                surah: { select: { nameSimple: true } },
              },
            },
          },
        },
      },
      orderBy: [
        { surahId: "asc" },
        { verseNumber: "asc" },
        { wordPosition: "asc" },
      ],
      skip,
      take: perPage,
    }),
    prisma.segment.count({ where }),
  ]);

  const morphResults: MorphResult[] = segments.map((seg) => ({
    wordId:         seg.word.id,
    surahId:        seg.word.surahId,
    verseNumber:    seg.word.verseNumber,
    wordPosition:   seg.wordPosition,
    formArabic:     seg.formArabic,
    posTag:         seg.posTag,
    rootBuckwalter: seg.rootBuckwalter,
    gramCase:       seg.gramCase,
    verbAspect:     seg.verbAspect,
    verbMood:       seg.verbMood,
    verbVoice:      seg.verbVoice,
    verbForm:       seg.verbForm,
    person:         seg.person,
    gender:         seg.gender,
    number:         seg.number,
    surahNameSimple: seg.word.verse.surah.nameSimple,
  }));

  return {
    type:        "morphological",
    query:       "",
    total,
    page,
    perPage,
    totalPages:  Math.ceil(total / perPage),
    morphResults,
  };
}
