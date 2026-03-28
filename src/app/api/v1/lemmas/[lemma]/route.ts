// GET /api/v1/lemmas/[lemma]
// Returns a lemma by its Buckwalter form (URI-encoded if needed).
// Also returns the list of words in the Quran that use this lemma.
// Query params: page, per_page (for the word list)

import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ok, notFound, serverError, CORS,
  parsePagination, withPagination, isArabicScript, enrichSegment,
} from "@/lib/api-helpers";
import { arabicToBuckwalter } from "@/lib/buckwalter";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ lemma: string }> },
) {
  try {
    const { lemma: rawLemma } = await params;
    const decoded = decodeURIComponent(rawLemma);

    const bw = isArabicScript(decoded)
      ? arabicToBuckwalter(decoded).replace(/\s+/g, "")
      : decoded;

    const lemma = await prisma.lemma.findUnique({
      where:   { formBuckwalter: bw },
      include: { root: true },
    });
    if (!lemma) return notFound(`Lemma "${decoded}" not found`);

    const sp = req.nextUrl.searchParams;
    const pg = parsePagination(sp);

    const [wordLemmas, total] = await prisma.$transaction([
      prisma.wordLemma.findMany({
        where:   { lemmaId: lemma.id },
        orderBy: { wordId: "asc" },
        skip:    pg.skip,
        take:    pg.take,
        include: {
          word: {
            select: {
              id:              true,
              verseId:         true,
              surahId:         true,
              verseNumber:     true,
              position:        true,
              textUthmani:     true,
              transliteration: true,
              translation:     true,
              segments: {
                where:   { segmentType: "STEM" },
                orderBy: { segmentPosition: "asc" },
              },
            },
          },
        },
      }),
      prisma.wordLemma.count({ where: { lemmaId: lemma.id } }),
    ]);

    const occurrences = wordLemmas.map((wl) => ({
      ...wl.word,
      segments: wl.word.segments.map(enrichSegment),
    }));

    return ok({
      lemma: {
        id:             lemma.id,
        formBuckwalter: lemma.formBuckwalter,
        formArabic:     lemma.formArabic,
        posTag:         lemma.posTag,
        frequency:      lemma.frequency,
        root:           lemma.root,
      },
      occurrences: withPagination(occurrences, total, pg),
    });
  } catch (err) {
    return serverError(err);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
