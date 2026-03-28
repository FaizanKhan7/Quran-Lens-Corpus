// GET /api/v1/search
// Unified search across verses, roots, and lemmas.
//
// Query params:
//   q        — search query (required)
//   type     — "text" | "root" | "morphological" (default: "text")
//   page, per_page
//
// Morphological search params (when type=morphological):
//   pos, aspect, mood, voice, form, person, gender, number, case, state
//
// Examples:
//   /api/v1/search?q=رحم&type=root
//   /api/v1/search?q=بسم&type=text
//   /api/v1/search?type=morphological&pos=V&aspect=PERF&person=3&gender=M&number=P

import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ok, badRequest, serverError, CORS,
  parsePagination, withPagination, isArabicScript,
} from "@/lib/api-helpers";
import { arabicToBuckwalter } from "@/lib/buckwalter";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp   = req.nextUrl.searchParams;
    const q    = sp.get("q")?.trim()    ?? "";
    const type = sp.get("type")?.trim() ?? "text";
    const pg   = parsePagination(sp, 50);

    if (type !== "morphological" && !q) {
      return badRequest("Query parameter 'q' is required");
    }

    // ── Text search — search verse Uthmani text ──────────────────────────────
    if (type === "text") {
      const where = { textUthmani: { contains: q } };

      const [verses, total] = await prisma.$transaction([
        prisma.verse.findMany({
          where,
          orderBy: [{ surahId: "asc" }, { verseNumber: "asc" }],
          skip:    pg.skip,
          take:    pg.take,
          select: {
            id:          true,
            surahId:     true,
            verseNumber: true,
            textUthmani: true,
          },
        }),
        prisma.verse.count({ where }),
      ]);

      return ok({
        type: "text",
        query: q,
        ...withPagination(verses, total, pg),
      });
    }

    // ── Root search ──────────────────────────────────────────────────────────
    if (type === "root") {
      const bw = isArabicScript(q)
        ? arabicToBuckwalter(q).replace(/\s+/g, "")
        : q;

      const where = {
        OR: [
          { lettersBuckwalter: { contains: bw,  mode: "insensitive" as const } },
          { lettersArabic:     { contains: q } },
        ],
      };

      const [roots, total] = await prisma.$transaction([
        prisma.root.findMany({
          where,
          orderBy: { frequency: "desc" },
          skip:    pg.skip,
          take:    pg.take,
        }),
        prisma.root.count({ where }),
      ]);

      return ok({
        type: "root",
        query: q,
        ...withPagination(roots, total, pg),
      });
    }

    // ── Morphological search ─────────────────────────────────────────────────
    if (type === "morphological") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = { segmentType: "STEM" };

      const pos    = sp.get("pos");
      const aspect = sp.get("aspect");
      const mood   = sp.get("mood");
      const voice  = sp.get("voice");
      const form   = sp.get("form");
      const person = sp.get("person");
      const gender = sp.get("gender");
      const number = sp.get("number");
      const gcase  = sp.get("case");
      const state  = sp.get("state");

      if (!pos && !aspect && !mood && !voice && !form && !person && !gender && !number && !gcase && !state) {
        return badRequest("Morphological search requires at least one filter (pos, aspect, mood, voice, form, person, gender, number, case, state)");
      }

      if (pos)    where.posTag     = pos.toUpperCase();
      if (aspect) where.verbAspect = aspect.toUpperCase();
      if (mood)   where.verbMood   = mood.toUpperCase();
      if (voice)  where.verbVoice  = voice.toUpperCase();
      if (form)   where.verbForm   = form.toUpperCase();
      if (person) where.person     = person;
      if (gender) where.gender     = gender.toUpperCase();
      if (number) where.number     = number.toUpperCase();
      if (gcase)  where.gramCase   = gcase.toUpperCase();
      if (state)  where.gramState  = state.toUpperCase();

      const [segments, total] = await prisma.$transaction([
        prisma.segment.findMany({
          where,
          orderBy: [{ surahId: "asc" }, { verseNumber: "asc" }, { wordPosition: "asc" }],
          skip:    pg.skip,
          take:    pg.take,
          select: {
            id:             true,
            wordId:         true,
            surahId:        true,
            verseNumber:    true,
            wordPosition:   true,
            formArabic:     true,
            posTag:         true,
            rootBuckwalter: true,
            lemmaBuckwalter: true,
            gramCase:       true,
            verbAspect:     true,
            verbMood:       true,
            verbVoice:      true,
            verbForm:       true,
            person:         true,
            gender:         true,
            number:         true,
          },
        }),
        prisma.segment.count({ where }),
      ]);

      return ok({
        type: "morphological",
        filters: { pos, aspect, mood, voice, form, person, gender, number, case: gcase, state },
        ...withPagination(segments, total, pg),
      });
    }

    return badRequest(`Unknown search type "${type}". Use "text", "root", or "morphological"`);
  } catch (err) {
    return serverError(err);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
