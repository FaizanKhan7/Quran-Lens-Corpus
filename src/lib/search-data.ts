/**
 * search-data.ts — server-side search helpers for the /search page.
 *
 * Routes text and root search through Elasticsearch when ELASTICSEARCH_URL is
 * configured; falls back to the Postgres/Prisma implementation automatically.
 * Morphological search always uses Prisma (exact keyword filters are equally
 * fast there and don't need full-text capabilities).
 */

import { prisma } from "@/lib/prisma";
import { esSearchText, esSearchRoot } from "@/lib/es-search";
import { isArabicScript } from "@/lib/api-helpers";

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
  /** True when results came from Elasticsearch (for UI indicator) */
  esEnabled?:    boolean;
}

// ─── Text Search — ES → Prisma fallback ──────────────────────────────────────

export async function searchText(
  q:       string,
  page:    number,
  perPage: number,
): Promise<SearchPageData> {
  // Try Elasticsearch first
  const esResult = await esSearchText(q, page, perPage);
  if (esResult) return { ...esResult, esEnabled: true };

  // Postgres fallback — strip diacritics for Arabic text matching
  const skip = (page - 1) * perPage;
  const arabic = isArabicScript(q);

  // Arabic diacritics characters for Postgres translate()
  const DIACRITICS = "ًٌٍَُِّْٰٖٜٟٗ٘ٙٚٛٝٞ";
  const qNorm = q.replace(/[ًٌٍَُِّْٰٖٜٟٗ٘ٙٚٛٝٞ]/g, "").trim();

  if (arabic && qNorm) {
    // Use raw SQL to strip diacritics at query time
    const likePattern = `%${qNorm}%`;

    type WRow = {
      id: string; surahId: number; verseNumber: number; position: number;
      textUthmani: string; transliteration: string; translation: string;
      surahNameSimple: string;
    };
    type CRow = { cnt: bigint };

    const [rows, countRows] = await Promise.all([
      prisma.$queryRawUnsafe<WRow[]>(
        `SELECT w.id, w."surahId", w."verseNumber", w.position,
                w."textUthmani", w.transliteration, w.translation,
                s."nameSimple" AS "surahNameSimple"
         FROM   words w
         JOIN   verses v ON v.id = w."verseId"
         JOIN   surahs s ON s.id = w."surahId"
         WHERE  translate(w."textUthmani", $1, '') ILIKE $2
         ORDER  BY w."surahId", w."verseNumber", w.position
         LIMIT  $3 OFFSET $4`,
        DIACRITICS, likePattern, perPage, skip,
      ),
      prisma.$queryRawUnsafe<CRow[]>(
        `SELECT COUNT(*) AS cnt
         FROM words w
         WHERE translate(w."textUthmani", $1, '') ILIKE $2`,
        DIACRITICS, likePattern,
      ),
    ]);

    const total = Number(countRows[0].cnt);
    const textResults: TextResult[] = rows.map((r) => ({
      wordId:          r.id,
      surahId:         r.surahId,
      verseNumber:     r.verseNumber,
      position:        r.position,
      textUthmani:     r.textUthmani,
      transliteration: r.transliteration,
      translation:     r.translation,
      surahNameSimple: r.surahNameSimple,
    }));

    return { type: "text", query: q, total, page, perPage, totalPages: Math.ceil(total / perPage), textResults };
  }

  // Latin / English fallback
  const where = {
    OR: [
      { transliteration: { contains: q, mode: "insensitive" as const } },
      { translation:     { contains: q, mode: "insensitive" as const } },
    ],
  };

  const [words, total] = await prisma.$transaction([
    prisma.word.findMany({
      where,
      include: {
        verse: { include: { surah: { select: { nameSimple: true } } } },
        segments: { where: { segmentType: "STEM" }, take: 1, select: { posTag: true } },
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

  return { type: "text", query: q, total, page, perPage, totalPages: Math.ceil(total / perPage), textResults };
}

// ─── Root Search — ES → Prisma fallback ──────────────────────────────────────

export async function searchRoot(
  q:       string,
  page:    number,
  perPage: number,
): Promise<SearchPageData> {
  const esResult = await esSearchRoot(q, page, perPage);
  if (esResult) return { ...esResult, esEnabled: true };

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
      select: { id: true, lettersArabic: true, lettersBuckwalter: true, frequency: true },
    }),
    prisma.root.count({ where }),
  ]);

  const rootResults: RootResult[] = roots.map((r) => ({
    id:               r.id,
    lettersArabic:    r.lettersArabic,
    lettersBuckwalter: r.lettersBuckwalter,
    frequency:        r.frequency,
  }));

  return { type: "root", query: q, total, page, perPage, totalPages: Math.ceil(total / perPage), rootResults };
}

// ─── Morphological Search — always Prisma ────────────────────────────────────

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
            verse: { select: { surah: { select: { nameSimple: true } } } },
          },
        },
      },
      orderBy: [{ surahId: "asc" }, { verseNumber: "asc" }, { wordPosition: "asc" }],
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
