// GET /api/v1/words/[key]
// Returns full morphological analysis of a single word.
// Key format: "surah:verse:word" (e.g. "1:1:1").
//
// Response shape matches Appendix B of the project spec.

import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ok, notFound, badRequest, serverError, CORS,
  enrichSegment, GRAM_CASE_EN, GRAM_CASE_AR,
} from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  try {
    const { key } = await params;

    if (!/^\d+:\d+:\d+$/.test(key)) {
      return badRequest("Word key must be in the format {surah}:{verse}:{word} (e.g. 1:1:1)");
    }

    const word = await prisma.word.findUnique({
      where: { id: key },
      include: {
        segments:   { orderBy: { segmentPosition: "asc" } },
        wordRoots:  { include: { root: true } },
        wordLemmas: { include: { lemma: true } },
      },
    });

    if (!word) return notFound(`Word "${key}" not found`);

    // Derive primary root and lemma from the STEM segment
    const stemSeg = word.segments.find((s) => s.segmentType === "STEM");
    const primaryRoot  = word.wordRoots[0]?.root  ?? null;
    const primaryLemma = word.wordLemmas[0]?.lemma ?? null;

    // Derive syntactic role from STEM features JSONB (if available)
    const syntacticRole = stemSeg?.gramCase
      ? GRAM_CASE_EN[stemSeg.gramCase] ?? stemSeg.gramCase
      : null;
    const syntacticRoleArabic = stemSeg?.gramCase
      ? GRAM_CASE_AR[stemSeg.gramCase] ?? null
      : null;

    const response = {
      id:              word.id,
      surahId:         word.surahId,
      verseId:         word.verseId,
      verseNumber:     word.verseNumber,
      position:        word.position,
      textUthmani:     word.textUthmani,
      transliteration: word.transliteration,
      translation:     word.translation,
      audioUrl:        word.audioUrl,

      segments: word.segments.map(enrichSegment),

      root:  primaryRoot
        ? {
            id:                primaryRoot.id,
            lettersBuckwalter: primaryRoot.lettersBuckwalter,
            lettersArabic:     primaryRoot.lettersArabic,
            frequency:         primaryRoot.frequency,
          }
        : null,

      lemma: primaryLemma
        ? {
            id:             primaryLemma.id,
            formBuckwalter: primaryLemma.formBuckwalter,
            formArabic:     primaryLemma.formArabic,
            posTag:         primaryLemma.posTag,
            frequency:      primaryLemma.frequency,
          }
        : null,

      syntacticRole,
      syntacticRoleArabic,
      ontologyConcepts: [],  // Ontology populated in Phase 2
    };

    return ok(response);
  } catch (err) {
    return serverError(err);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
