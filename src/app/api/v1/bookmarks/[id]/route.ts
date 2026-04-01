// DELETE /api/v1/bookmarks/[id] — Remove a single bookmark.
// Auth required; ownership is verified (userId must match session).

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ok, notFound, CORS } from "@/lib/api-helpers";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401, headers: CORS });

  const { id } = await params;
  const numId  = parseInt(id, 10);
  if (isNaN(numId)) return NextResponse.json({ error: "Invalid id" }, { status: 400, headers: CORS });

  const bookmark = await prisma.bookmark.findUnique({ where: { id: numId } });
  if (!bookmark || bookmark.userId !== session.user.id) {
    return notFound("Bookmark not found");
  }

  await prisma.bookmark.delete({ where: { id: numId } });
  return ok({ deleted: numId });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
