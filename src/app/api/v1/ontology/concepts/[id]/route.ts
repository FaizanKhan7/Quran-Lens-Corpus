// GET /api/v1/ontology/concepts/[id]
// Returns full concept detail: parent, children, relations, verse links.

import type { NextRequest } from "next/server";
import { ok, notFound, serverError, CORS } from "@/lib/api-helpers";
import { getConceptDetail } from "@/lib/ontology-data";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const concept = await getConceptDetail(id);
    if (!concept) return notFound(`Concept "${id}" not found`);
    return ok(concept);
  } catch (err) {
    return serverError(err);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
