// GET  /api/v1/bookmarks  — list bookmarks for the authenticated user
// POST /api/v1/bookmarks  — create a bookmark
//
// Auth: session cookie required. QF OAuth2 provides the userId (OIDC sub).
// Data is stored in our local PostgreSQL bookmarks table.

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ok, CORS } from "@/lib/api-helpers";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ── GET — list bookmarks ──────────────────────────────────────────────────────

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401, headers: CORS });

  const bookmarks = await prisma.bookmark.findMany({
    where:   { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return ok(bookmarks);
}

// ── POST — create a bookmark ──────────────────────────────────────────────────

interface CreateBody {
  verseId:  string;   // "{surah}:{verse}"
  wordId?:  string;   // "{surah}:{verse}:{position}" — optional
  type?:    "verse" | "word";
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401, headers: CORS });

  let body: CreateBody;
  try {
    body = await req.json() as CreateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: CORS });
  }

  if (!body.verseId || !/^\d+:\d+$/.test(body.verseId)) {
    return NextResponse.json({ error: "Invalid verseId" }, { status: 400, headers: CORS });
  }

  // findFirst + create — Prisma upsert doesn't handle null in composite unique keys well
  const wordId = body.wordId ?? null;
  const existing = await prisma.bookmark.findFirst({
    where: { userId: session.user.id, verseId: body.verseId, wordId },
  });
  const bookmark = existing ?? await prisma.bookmark.create({
    data: {
      userId:  session.user.id,
      verseId: body.verseId,
      wordId,
      type:    body.type === "word" ? "word" : "verse",
    },
  });

  return NextResponse.json({ data: bookmark }, { status: 201, headers: CORS });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
