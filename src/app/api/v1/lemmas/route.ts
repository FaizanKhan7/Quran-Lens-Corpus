// GET /api/v1/lemmas
// Returns a paginated list of lemmas, ordered by frequency (descending).
// Query params: page, per_page, q (filter), pos (POS tag filter)

import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ok, serverError, CORS,
  parsePagination, withPagination, isArabicScript,
} from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp  = req.nextUrl.searchParams;
    const pg  = parsePagination(sp);
    const q   = sp.get("q")?.trim()   ?? "";
    const pos = sp.get("pos")?.trim() ?? "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (pos) where.posTag = pos;
    if (q) {
      where.OR = isArabicScript(q)
        ? [{ formArabic: { contains: q } }]
        : [{ formBuckwalter: { contains: q, mode: "insensitive" } }];
    }

    const [lemmas, total] = await prisma.$transaction([
      prisma.lemma.findMany({
        where,
        orderBy: { frequency: "desc" },
        skip:    pg.skip,
        take:    pg.take,
        include: { root: { select: { lettersBuckwalter: true, lettersArabic: true } } },
      }),
      prisma.lemma.count({ where }),
    ]);

    return ok(withPagination(lemmas, total, pg));
  } catch (err) {
    return serverError(err);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
