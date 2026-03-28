// GET /api/v1/roots/[root]/words
// Returns all words in the Quran that use this root (concordance).
// Query params: page, per_page

import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ok, notFound, serverError, CORS,
  parsePagination, withPagination, isArabicScript,
} from "@/lib/api-helpers";
import { arabicToBuckwalter } from "@/lib/buckwalter";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ root: string }> },
) {
  try {
    const { root: rawRoot } = await params;
    const decoded = decodeURIComponent(rawRoot);

    const bw = isArabicScript(decoded)
      ? arabicToBuckwalter(decoded).replace(/\s+/g, "")
      : decoded;

    const root = await prisma.root.findUnique({ where: { lettersBuckwalter: bw } });
    if (!root) return notFound(`Root "${decoded}" not found`);

    const sp = req.nextUrl.searchParams;
    const pg = parsePagination(sp);

    const [wordRoots, total] = await prisma.$transaction([
      prisma.wordRoot.findMany({
        where:   { rootId: root.id },
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
            },
          },
        },
      }),
      prisma.wordRoot.count({ where: { rootId: root.id } }),
    ]);

    const words = wordRoots.map((wr) => wr.word);
    return ok(withPagination(words, total, pg));
  } catch (err) {
    return serverError(err);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
