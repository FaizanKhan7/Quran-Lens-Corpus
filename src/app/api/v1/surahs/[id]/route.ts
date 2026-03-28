// GET /api/v1/surahs/[id]
// Returns a single surah by its number (1–114).

import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, notFound, badRequest, serverError, CORS } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
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

    return ok(surah);
  } catch (err) {
    return serverError(err);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
