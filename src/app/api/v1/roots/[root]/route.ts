// GET /api/v1/roots/[root]
// Returns details for a single root.
// The [root] param can be Buckwalter (e.g. "smw") or Arabic (URI-encoded, e.g. "سمو").

import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, notFound, serverError, CORS, isArabicScript } from "@/lib/api-helpers";
import { arabicToBuckwalter } from "@/lib/buckwalter";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ root: string }> },
) {
  try {
    const { root: rawRoot } = await params;
    const decoded = decodeURIComponent(rawRoot);

    // Normalise to Buckwalter
    const bw = isArabicScript(decoded)
      ? arabicToBuckwalter(decoded).replace(/\s+/g, "")
      : decoded;

    const root = await prisma.root.findUnique({
      where:   { lettersBuckwalter: bw },
      include: { lemmas: { orderBy: { frequency: "desc" }, take: 10 } },
    });

    if (!root) return notFound(`Root "${decoded}" not found`);

    return ok(root);
  } catch (err) {
    return serverError(err);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
