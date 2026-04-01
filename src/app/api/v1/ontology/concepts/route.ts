// GET /api/v1/ontology/concepts
// Returns all concepts grouped by category.

import type { NextRequest } from "next/server";
import { ok, serverError, CORS } from "@/lib/api-helpers";
import { getAllConceptsByCategory } from "@/lib/ontology-data";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const groups = await getAllConceptsByCategory();
    return ok(groups);
  } catch (err) {
    return serverError(err);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
