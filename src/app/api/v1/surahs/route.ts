// GET /api/v1/surahs
// Returns all 114 surahs.

import { prisma } from "@/lib/prisma";
import { ok, serverError, CORS } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const surahs = await prisma.surah.findMany({
      orderBy: { id: "asc" },
    });
    return ok(surahs);
  } catch (err) {
    return serverError(err);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
