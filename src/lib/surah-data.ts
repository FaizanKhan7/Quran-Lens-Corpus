/**
 * surah-data.ts — server-side data helpers for surah pages.
 *
 * Queries Prisma directly and returns typed metadata.
 * Verse word counts are included via Prisma _count so no extra joins are needed.
 */

import { prisma } from "@/lib/prisma";

// ─── Public types ─────────────────────────────────────────────────────────────

export interface SurahMeta {
  id:              number;
  nameArabic:      string;
  nameSimple:      string;
  nameComplex:     string;
  translatedName:  string;
  revelationPlace: string; // "makkah" | "madinah"
  revelationOrder: number;
  versesCount:     number;
  bismillahPre:    boolean;
}

export interface VerseMeta {
  id:          string;   // "{surahId}:{verseNumber}"
  verseNumber: number;
  textUthmani: string;
  wordCount:   number;
}

export interface SurahData {
  surah:  SurahMeta;
  verses: VerseMeta[];
}

// ─── Query ────────────────────────────────────────────────────────────────────

/** Returns all 114 surahs ordered by id — used by the surah listing and home pages. */
export async function getAllSurahs(): Promise<SurahMeta[]> {
  const rows = await prisma.surah.findMany({ orderBy: { id: "asc" } });
  return rows.map((r) => ({
    id:              r.id,
    nameArabic:      r.nameArabic,
    nameSimple:      r.nameSimple,
    nameComplex:     r.nameComplex,
    translatedName:  r.translatedName,
    revelationPlace: r.revelationPlace,
    revelationOrder: r.revelationOrder,
    versesCount:     r.versesCount,
    bismillahPre:    r.bismillahPre,
  }));
}

export async function getSurahData(surahId: number): Promise<SurahData | null> {
  const row = await prisma.surah.findUnique({
    where:   { id: surahId },
    include: {
      verses: {
        orderBy: { verseNumber: "asc" },
        include: { _count: { select: { words: true } } },
      },
    },
  });

  if (!row) return null;

  return {
    surah: {
      id:              row.id,
      nameArabic:      row.nameArabic,
      nameSimple:      row.nameSimple,
      nameComplex:     row.nameComplex,
      translatedName:  row.translatedName,
      revelationPlace: row.revelationPlace,
      revelationOrder: row.revelationOrder,
      versesCount:     row.versesCount,
      bismillahPre:    row.bismillahPre,
    },
    verses: row.verses.map((v) => ({
      id:          v.id,
      verseNumber: v.verseNumber,
      textUthmani: v.textUthmani,
      wordCount:   v._count.words,
    })),
  };
}
