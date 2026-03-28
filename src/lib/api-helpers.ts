/**
 * API Helpers — shared utilities for /api/v1 route handlers.
 */

import { POS_META } from "@/lib/tokens";

// ─── CORS headers (all corpus data is public) ─────────────────────────────────

export const CORS: HeadersInit = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// ─── Response helpers ─────────────────────────────────────────────────────────

export function ok<T>(data: T, status = 200): Response {
  return Response.json({ data }, { status, headers: CORS });
}

export function notFound(message = "Not found"): Response {
  return Response.json({ error: message }, { status: 404, headers: CORS });
}

export function badRequest(message: string): Response {
  return Response.json({ error: message }, { status: 400, headers: CORS });
}

export function serverError(err: unknown): Response {
  console.error("[api]", err);
  return Response.json({ error: "Internal server error" }, { status: 500, headers: CORS });
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface Pagination {
  page:    number;
  perPage: number;
  skip:    number;
  take:    number;
}

export function parsePagination(sp: URLSearchParams, maxPerPage = 100): Pagination {
  const page    = Math.max(1, parseInt(sp.get("page")     ?? "1",  10));
  const perPage = Math.min(maxPerPage, Math.max(1, parseInt(sp.get("per_page") ?? "20", 10)));
  return { page, perPage, skip: (page - 1) * perPage, take: perPage };
}

export function withPagination<T>(
  items:    T[],
  total:    number,
  { page, perPage }: Pagination,
) {
  return {
    items,
    pagination: {
      page,
      per_page:    perPage,
      total,
      total_pages: Math.ceil(total / perPage),
    },
  };
}

// ─── Morphological label lookups ──────────────────────────────────────────────

export function posLabel(tag: string): { description: string; descriptionArabic: string } {
  const meta = POS_META[tag as keyof typeof POS_META];
  if (meta) return { description: meta.description, descriptionArabic: meta.descriptionArabic };
  return { description: tag, descriptionArabic: tag };
}

export const GRAM_CASE_AR: Record<string, string> = {
  NOM: "مرفوع",
  ACC: "منصوب",
  GEN: "مجرور",
};

export const GRAM_CASE_EN: Record<string, string> = {
  NOM: "Nominative",
  ACC: "Accusative",
  GEN: "Genitive",
};

export const GRAM_STATE_AR: Record<string, string> = {
  DEF:   "معرفة",
  INDEF: "نكرة",
};

export const GRAM_STATE_EN: Record<string, string> = {
  DEF:   "Definite",
  INDEF: "Indefinite",
};

export const VERB_ASPECT_AR: Record<string, string> = {
  PERF: "فعل ماضٍ",
  IMPF: "فعل مضارع",
  IMPV: "فعل أمر",
};

export const VERB_MOOD_AR: Record<string, string> = {
  IND:  "مرفوع",
  SUBJ: "منصوب",
  JUS:  "مجزوم",
};

export const VERB_VOICE_AR: Record<string, string> = {
  ACT:  "معلوم",
  PASS: "مجهول",
};

// ─── Segment enrichment ───────────────────────────────────────────────────────

// Raw DB segment → enriched API shape (safe for JSON serialization)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function enrichSegment(seg: any) {
  const pos = posLabel(seg.posTag);
  return {
    id:                    seg.id,
    position:              seg.segmentPosition,
    type:                  seg.segmentType,
    formBuckwalter:        seg.formBuckwalter,
    formArabic:            seg.formArabic,
    posTag:                seg.posTag,
    posDescription:        pos.description,
    posDescriptionArabic:  pos.descriptionArabic,

    // Grammatical features (hot-path columns)
    rootBuckwalter:        seg.rootBuckwalter  ?? null,
    lemmaBuckwalter:       seg.lemmaBuckwalter ?? null,
    gramCase:              seg.gramCase        ?? null,
    gramCaseArabic:        seg.gramCase ? (GRAM_CASE_AR[seg.gramCase] ?? null) : null,
    gramState:             seg.gramState       ?? null,
    gramStateArabic:       seg.gramState ? (GRAM_STATE_AR[seg.gramState] ?? null) : null,
    verbAspect:            seg.verbAspect      ?? null,
    verbAspectArabic:      seg.verbAspect ? (VERB_ASPECT_AR[seg.verbAspect] ?? null) : null,
    verbMood:              seg.verbMood        ?? null,
    verbMoodArabic:        seg.verbMood ? (VERB_MOOD_AR[seg.verbMood] ?? null) : null,
    verbVoice:             seg.verbVoice       ?? null,
    verbVoiceArabic:       seg.verbVoice ? (VERB_VOICE_AR[seg.verbVoice] ?? null) : null,
    verbForm:              seg.verbForm        ?? null,
    person:                seg.person          ?? null,
    gender:                seg.gender          ?? null,
    number:                seg.number          ?? null,

    // Full JSONB features blob
    features:              seg.features,
  };
}

// ─── Arabic ↔ Buckwalter detection ───────────────────────────────────────────

// Returns true if the string contains Arabic Unicode characters
export function isArabicScript(s: string): boolean {
  return /[\u0600-\u06FF]/.test(s);
}
