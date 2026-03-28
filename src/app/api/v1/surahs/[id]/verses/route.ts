// GET /api/v1/surahs/[id]/verses
// Returns all verses in a surah.
// Query params: page, per_page, words (boolean — include word list per verse)

import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ok, notFound, badRequest, serverError, CORS,
  parsePagination, withPagination,
} from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const num = parseInt(id, 10);
    if (isNaN(num) || num < 1 || num > 114) {
      return badRequest("Surah id must be a number between 1 and 114");
    }

    const surah = await prisma.surah.findUnique({ where: { id: num } });
    if (!surah) return notFound(`Surah ${num} not found`);

    const sp       = req.nextUrl.searchParams;
    const pg       = parsePagination(sp, 300);
    const withWords = sp.get("words") === "true";

    const [verses, total] = await prisma.$transaction([
      prisma.verse.findMany({
        where:   { surahId: num },
        orderBy: { verseNumber: "asc" },
        skip:    pg.skip,
        take:    pg.take,
        include: withWords ? { words: { orderBy: { position: "asc" } } } : undefined,
      }),
      prisma.verse.count({ where: { surahId: num } }),
    ]);

    return ok(withPagination(verses, total, pg));
  } catch (err) {
    return serverError(err);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
