// GET /api/v1/search/morph-count
// Returns just the count for a morphological filter set — used for live
// "Show N results" preview in the filter constructor UI.
//
// Accepts the same filter params as /api/v1/search?type=morphological.

import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, serverError, CORS } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { segmentType: "STEM" };

    const pos    = sp.get("pos");
    const aspect = sp.get("aspect");
    const mood   = sp.get("mood");
    const voice  = sp.get("voice");
    const form   = sp.get("form");
    const person = sp.get("person");
    const gender = sp.get("gender");
    const number = sp.get("number");
    const gcase  = sp.get("case");
    const state  = sp.get("state");

    if (pos)    where.posTag     = pos.toUpperCase();
    if (aspect) where.verbAspect = aspect.toUpperCase();
    if (mood)   where.verbMood   = mood.toUpperCase();
    if (voice)  where.verbVoice  = voice.toUpperCase();
    if (form)   where.verbForm   = form.toUpperCase();
    if (person) where.person     = person;
    if (gender) where.gender     = gender.toUpperCase();
    if (number) where.number     = number.toUpperCase();
    if (gcase)  where.gramCase   = gcase.toUpperCase();
    if (state)  where.gramState  = state.toUpperCase();

    // No filters → return 0 to signal "select at least one filter"
    const hasFilters = [pos, aspect, mood, voice, form, person, gender, number, gcase, state]
      .some(Boolean);

    if (!hasFilters) {
      return ok({ count: 0, hasFilters: false });
    }

    const count = await prisma.segment.count({ where });

    return ok({ count, hasFilters: true });
  } catch (err) {
    return serverError(err);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
