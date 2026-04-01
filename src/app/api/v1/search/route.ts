// GET /api/v1/search
// Unified search across words, roots, and morphological segments.
//
// Text and root search route through Elasticsearch when ELASTICSEARCH_URL is
// set; fall back to Postgres automatically. Morphological search is always
// Postgres (exact keyword filters are equally fast there).
//
// Query params:
//   q        — search query (required for text/root)
//   type     — "text" | "root" | "morphological" (default: "text")
//   page, per_page
//
// Morphological filters (type=morphological):
//   pos, aspect, mood, voice, form, person, gender, number, case, state
//
// Examples:
//   /api/v1/search?q=رحم&type=text
//   /api/v1/search?q=rHm&type=root
//   /api/v1/search?type=morphological&pos=V&aspect=PERF&person=3&gender=M&number=P

import type { NextRequest } from "next/server";
import {
  ok, badRequest, serverError, CORS, parsePagination, withPagination,
} from "@/lib/api-helpers";
import { searchText, searchRoot, searchMorphological } from "@/lib/search-data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp   = req.nextUrl.searchParams;
    const q    = sp.get("q")?.trim()    ?? "";
    const type = sp.get("type")?.trim() ?? "text";
    const pg   = parsePagination(sp, 50);

    if (type !== "morphological" && !q) {
      return badRequest("Query parameter 'q' is required");
    }

    // ── Text search ───────────────────────────────────────────────────────────
    if (type === "text") {
      const data = await searchText(q, pg.page, pg.perPage);
      return ok({
        type: "text",
        query: q,
        engine: data.esEnabled ? "elasticsearch" : "postgres",
        ...withPagination(data.textResults ?? [], data.total, pg),
      });
    }

    // ── Root search ───────────────────────────────────────────────────────────
    if (type === "root") {
      const data = await searchRoot(q, pg.page, pg.perPage);
      return ok({
        type: "root",
        query: q,
        engine: data.esEnabled ? "elasticsearch" : "postgres",
        ...withPagination(data.rootResults ?? [], data.total, pg),
      });
    }

    // ── Morphological search (always Postgres) ────────────────────────────────
    if (type === "morphological") {
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

      const filters: Record<string, string> = {};
      if (pos)    filters.pos    = pos;
      if (aspect) filters.aspect = aspect;
      if (mood)   filters.mood   = mood;
      if (voice)  filters.voice  = voice;
      if (form)   filters.form   = form;
      if (person) filters.person = person;
      if (gender) filters.gender = gender;
      if (number) filters.number = number;
      if (gcase)  filters.case   = gcase;
      if (state)  filters.state  = state;

      if (Object.keys(filters).length === 0) {
        return badRequest(
          "Morphological search requires at least one filter: pos, aspect, mood, voice, form, person, gender, number, case, state"
        );
      }

      const data = await searchMorphological(filters, pg.page, pg.perPage);
      return ok({
        type: "morphological",
        filters,
        engine: "postgres",
        ...withPagination(data.morphResults ?? [], data.total, pg),
      });
    }

    return badRequest(`Unknown type "${type}". Use "text", "root", or "morphological"`);
  } catch (err) {
    return serverError(err);
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
