// GET /api/v1/roots
// Returns a paginated list of all roots, ordered by frequency (descending).
// Query params: page, per_page, q (filter by Buckwalter or Arabic letters)

import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ok, serverError, CORS,
  parsePagination, withPagination, isArabicScript,
} from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const pg = parsePagination(sp);
    const q  = sp.get("q")?.trim() ?? "";

    const where = q
      ? isArabicScript(q)
        ? { lettersArabic: { contains: q } }
        : { lettersBuckwalter: { contains: q, mode: "insensitive" as const } }
      : {};

    const [roots, total] = await prisma.$transaction([
      prisma.root.findMany({
        where,
        orderBy: { frequency: "desc" },
        skip:    pg.skip,
        take:    pg.take,
      }),
      prisma.root.count({ where }),
    ]);

    return ok(withPagination(roots, total, pg));
  } catch (err) {
    return serverError(err);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
