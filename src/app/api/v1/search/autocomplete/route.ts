// GET /api/v1/search/autocomplete
// Lightweight autocomplete suggestions for SearchBar.
//
// Routes through Elasticsearch (search_as_you_type) when available,
// falls back to Prisma LIKE queries.
//
// Query params:
//   q    — search string (required, min 2 chars)
//   type — "text" | "root" (default: "text")
//
// Returns up to 8 suggestions.

import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, serverError, CORS } from "@/lib/api-helpers";
import { esAutocompleteWords, esAutocompleteRoots } from "@/lib/es-search";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp   = req.nextUrl.searchParams;
    const q    = sp.get("q")?.trim() ?? "";
    const type = sp.get("type")?.trim() ?? "text";

    if (q.length < 2) {
      return ok({ type, query: q, suggestions: [] });
    }

    // ── Text autocomplete ──────────────────────────────────────────────────────

    if (type === "text") {
      // Try ES search_as_you_type first
      const esSuggestions = await esAutocompleteWords(q, 8);
      if (esSuggestions) {
        return ok({ type: "text", query: q, suggestions: esSuggestions, engine: "elasticsearch" });
      }

      // Prisma fallback — diacritics-aware for Arabic
      const DIACRITICS = "ًٌٍَُِّْٰٖٜٟٗ٘ٙٚٛٝٞ";
      const isArabic   = /[\u0600-\u06FF]/.test(q);

      if (isArabic) {
        const qNorm = q.replace(/[ًٌٍَُِّْٰٖٜٟٗ٘ٙٚٛٝٞ]/g, "").trim();
        type Row = {
          id: string; textUthmani: string; transliteration: string; translation: string;
          surahId: number; verseNumber: number; position: number; nameSimple: string;
        };
        const words = await prisma.$queryRawUnsafe<Row[]>(
          `SELECT w.id, w."textUthmani", w.transliteration, w.translation,
                  w."surahId", w."verseNumber", w.position,
                  s."nameSimple"
           FROM   words w
           JOIN   surahs s ON s.id = w."surahId"
           WHERE  translate(w."textUthmani", $1, '') ILIKE $2
           ORDER  BY w."surahId", w."verseNumber", w.position
           LIMIT  8`,
          DIACRITICS, `%${qNorm}%`,
        );
        const suggestions = words.map((w) => ({
          id:              w.id,
          textUthmani:     w.textUthmani,
          transliteration: w.transliteration,
          translation:     w.translation,
          surahId:         w.surahId,
          verseNumber:     w.verseNumber,
          position:        w.position,
          surahNameSimple: w.nameSimple,
          posTag:          null,
        }));
        return ok({ type: "text", query: q, suggestions, engine: "postgres" });
      }

      // Latin fallback
      const words = await prisma.word.findMany({
        where: {
          OR: [
            { transliteration: { contains: q, mode: "insensitive" } },
            { translation:     { contains: q, mode: "insensitive" } },
          ],
        },
        include: {
          verse: { include: { surah: { select: { nameSimple: true } } } },
          segments: { where: { segmentType: "STEM" }, take: 1, select: { posTag: true } },
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

      return ok({ type: "text", query: q, suggestions, engine: "postgres" });
    }

    // ── Root autocomplete ──────────────────────────────────────────────────────

    if (type === "root") {
      const esRoots = await esAutocompleteRoots(q, 8);
      if (esRoots) {
        return ok({ type: "root", query: q, suggestions: esRoots, engine: "elasticsearch" });
      }

      const roots = await prisma.root.findMany({
        where: {
          OR: [
            { lettersArabic:     { contains: q } },
            { lettersBuckwalter: { contains: q, mode: "insensitive" } },
          ],
        },
        orderBy: { frequency: "desc" },
        take: 8,
        select: { id: true, lettersArabic: true, lettersBuckwalter: true, frequency: true },
      });

      return ok({ type: "root", query: q, suggestions: roots, engine: "postgres" });
    }

    return badRequest(`Unknown type "${type}". Use "text" or "root"`);
  } catch (err) {
    return serverError(err);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
