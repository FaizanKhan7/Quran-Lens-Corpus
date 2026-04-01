// GET /api/auth/me — Returns the current session user, or 401.
//
// Used by client components to bootstrap auth state on mount.

import { ok, CORS } from "@/lib/api-helpers";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Unauthenticated" },
      { status: 401, headers: CORS },
    );
  }

  return ok({
    id:      session.user.id,
    email:   session.user.email ?? null,
    name:    session.user.name  ?? null,
    picture: session.user.picture ?? null,
  });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}
