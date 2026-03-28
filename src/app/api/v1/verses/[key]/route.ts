// GET /api/v1/verses/[key]
// Returns a single verse by key (format: "surah:verse", e.g. "2:255").
// Includes all words with their morphological segments.

import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, notFound, badRequest, serverError, CORS, enrichSegment } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  try {
    const { key } = await params;

    // Validate key format: "surah:verse"
    if (!/^\d+:\d+$/.test(key)) {
      return badRequest("Verse key must be in the format {surah}:{verse} (e.g. 2:255)");
    }

    const verse = await prisma.verse.findUnique({
      where: { id: key },
      include: {
        words: {
          orderBy: { position: "asc" },
          include: {
            segments:   { orderBy: { segmentPosition: "asc" } },
            wordRoots:  { include: { root: true } },
            wordLemmas: { include: { lemma: true } },
          },
        },
      },
    });

    if (!verse) return notFound(`Verse "${key}" not found`);

    const response = {
      id:          verse.id,
      surahId:     verse.surahId,
      verseNumber: verse.verseNumber,
      textUthmani: verse.textUthmani,
      textSimple:  verse.textSimple,
      pageNumber:  verse.pageNumber,
      juzNumber:   verse.juzNumber,
      hizbNumber:  verse.hizbNumber,
      wordCount:   verse.words.length,
      words: verse.words.map((w) => ({
        id:              w.id,
        position:        w.position,
        textUthmani:     w.textUthmani,
        transliteration: w.transliteration,
        translation:     w.translation,
        audioUrl:        w.audioUrl,
        root:  w.wordRoots[0]?.root  ?? null,
        lemma: w.wordLemmas[0]?.lemma ?? null,
        segments: w.segments.map(enrichSegment),
      })),
    };

    return ok(response);
  } catch (err) {
    return serverError(err);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
