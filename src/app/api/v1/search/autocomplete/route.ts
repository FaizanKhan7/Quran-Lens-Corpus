// GET /api/v1/search/autocomplete
// Lightweight autocomplete suggestions for SearchBar.
//
// Query params:
//   q    — search string (required, min 2 chars)
//   type — "text" | "root" (default: "text")
//
// Returns up to 8 suggestions.

import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, serverError, CORS } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp   = req.nextUrl.searchParams;
    const q    = sp.get("q")?.trim() ?? "";
    const type = sp.get("type")?.trim() ?? "text";

    if (q.length < 2) {
      return ok({ type, query: q, suggestions: [] });
    }

    if (type === "text") {
      const words = await prisma.word.findMany({
        where: {
          OR: [
            { textUthmani:     { contains: q } },
            { transliteration: { contains: q, mode: "insensitive" } },
            { translation:     { contains: q, mode: "insensitive" } },
          ],
        },
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
        take: 8,
      });

      const suggestions = words.map((w) => ({
        id:              w.id,
        textUthmani:     w.textUthmani,
        transliteration: w.transliteration,
        translation:     w.translation,
        surahId:         w.surahId,
        verseNumber:     w.verseNumber,
        position:        w.position,
        surahNameSimple: w.verse.surah.nameSimple,
        posTag:          w.segments[0]?.posTag ?? null,
      }));

      return ok({ type: "text", query: q, suggestions });
    }

    if (type === "root") {
      const roots = await prisma.root.findMany({
        where: {
          OR: [
            { lettersArabic:     { contains: q } },
            { lettersBuckwalter: { contains: q, mode: "insensitive" } },
          ],
        },
        orderBy: { frequency: "desc" },
        take: 8,
        select: {
          id:               true,
          lettersArabic:    true,
          lettersBuckwalter: true,
          frequency:        true,
        },
      });

      return ok({ type: "root", query: q, suggestions: roots });
    }

    return badRequest(`Unknown type "${type}". Use "text" or "root"`);
  } catch (err) {
    return serverError(err);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
