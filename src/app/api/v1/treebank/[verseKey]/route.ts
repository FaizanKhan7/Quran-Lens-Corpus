// GET /api/v1/treebank/[verseKey]
// Returns treebank nodes + edges for a verse.
// Key format: "surah:verse" (e.g. "1:2").

import type { NextRequest } from "next/server";
import { ok, notFound, badRequest, serverError, CORS } from "@/lib/api-helpers";
import { getTreebankData } from "@/lib/treebank-data";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ verseKey: string }> },
) {
  try {
    const { verseKey } = await params;

    if (!/^\d+:\d+$/.test(verseKey)) {
      return badRequest("Verse key must be in the format {surah}:{verse} (e.g. 1:2)");
    }

    const [surahStr, verseStr] = verseKey.split(":");
    const surahId     = Number(surahStr);
    const verseNumber = Number(verseStr);

    if (surahId < 1 || surahId > 114 || verseNumber < 1) {
      return badRequest("Invalid surah or verse number");
    }

    const data = await getTreebankData(surahId, verseNumber);
    if (!data) return notFound(`No treebank data for verse ${verseKey}`);

    return ok(data);
  } catch (err) {
    return serverError(err);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
