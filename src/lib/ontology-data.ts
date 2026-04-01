/**
 * ontology-data.ts — Server-side helpers for the ontology explorer.
 *
 * All functions use Prisma directly (server-only).
 * NOTE: ConceptVerse has no verse/word relations in schema — we join manually.
 */

import type { ConceptVerse } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ConceptSummary {
  id:         string;
  name:       string;
  category:   string;
  parentId:   string | null;
  childCount: number;
  verseCount: number;
}

export interface ConceptRelation {
  predicate:  string;
  objectId:   string;
  objectName: string;
}

export interface ConceptVerseLink {
  verseId:         string;
  wordId:          string | null;
  surahId:         number;
  verseNumber:     number;
  surahName:       string;
  textUthmani?:    string | null;
  transliteration?: string | null;
  translation?:    string | null;
}

export interface ConceptDetail {
  id:         string;
  name:       string;
  category:   string;
  parentId:   string | null;
  parentName: string | null;
  children:   ConceptSummary[];
  relations:  ConceptRelation[];
  verseLinks: ConceptVerseLink[];
}

export interface CategoryGroup {
  category: string;
  concepts: ConceptSummary[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns all concepts grouped by category, with child + verse counts. */
export async function getAllConceptsByCategory(): Promise<CategoryGroup[]> {
  const concepts = await prisma.concept.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          children:       true,
          conceptVerses:  true,
        },
      },
    },
  });

  const grouped = new Map<string, ConceptSummary[]>();

  for (const c of concepts) {
    const entry: ConceptSummary = {
      id:         c.id,
      name:       c.name,
      category:   c.category,
      parentId:   c.parentId,
      childCount: c._count.children,
      verseCount: c._count.conceptVerses,
    };
    if (!grouped.has(c.category)) grouped.set(c.category, []);
    grouped.get(c.category)!.push(entry);
  }

  // Sort: Special first, then alphabetical
  const order = (cat: string) => (cat === "Special" ? "0" : cat);
  return Array.from(grouped.entries())
    .sort(([a], [b]) => order(a).localeCompare(order(b)))
    .map(([category, concepts]) => ({ category, concepts }));
}

/** Returns full detail for a single concept, including children, relations, verse links. */
export async function getConceptDetail(id: string): Promise<ConceptDetail | null> {
  const concept = await prisma.concept.findUnique({
    where: { id },
    include: {
      parent: true,
      children: {
        orderBy: { name: "asc" },
        include: {
          _count: { select: { children: true, conceptVerses: true } },
        },
      },
      subjectRelations: {
        include: { object: true },
      },
      conceptVerses: {
        orderBy: { verseId: "asc" },
      },
    },
  });

  if (!concept) return null;

  // Manually join verse + word data for each ConceptVerse
  const verseLinks: ConceptVerseLink[] = await Promise.all(
    concept.conceptVerses.map(async (cv: ConceptVerse) => {
      const [surahStr, verseStr] = cv.verseId.split(":");
      const surahId     = Number(surahStr);
      const verseNumber = Number(verseStr);

      // Fetch verse surah name
      const verse = await prisma.verse.findUnique({
        where:  { id: cv.verseId },
        select: { surah: { select: { nameSimple: true } } },
      });

      // Fetch word data if wordId is set
      let wordData: { textUthmani: string; transliteration: string; translation: string } | null = null;
      if (cv.wordId) {
        wordData = await prisma.word.findUnique({
          where:  { id: cv.wordId },
          select: { textUthmani: true, transliteration: true, translation: true },
        });
      }

      return {
        verseId:         cv.verseId,
        wordId:          cv.wordId,
        surahId,
        verseNumber,
        surahName:       verse?.surah.nameSimple ?? `Surah ${surahId}`,
        textUthmani:     wordData?.textUthmani ?? null,
        transliteration: wordData?.transliteration ?? null,
        translation:     wordData?.translation ?? null,
      };
    }),
  );

  type ChildRow = (typeof concept.children)[number];
  const children: ConceptSummary[] = concept.children.map((c: ChildRow) => ({
    id:         c.id,
    name:       c.name,
    category:   c.category,
    parentId:   c.parentId,
    childCount: c._count.children,
    verseCount: c._count.conceptVerses,
  }));

  type RelationRow = (typeof concept.subjectRelations)[number];
  const relations: ConceptRelation[] = concept.subjectRelations.map((r: RelationRow) => ({
    predicate:  r.predicate,
    objectId:   r.objectId,
    objectName: r.object.name,
  }));

  return {
    id:         concept.id,
    name:       concept.name,
    category:   concept.category,
    parentId:   concept.parentId,
    parentName: concept.parent?.name ?? null,
    children,
    relations,
    verseLinks,
  };
}
