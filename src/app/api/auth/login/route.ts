// GET /api/auth/login — Initiates OAuth2 Authorization Code + PKCE flow.
//
// 1. Generates code_verifier + code_challenge (S256) + state
// 2. Stores verifier + state in short-lived httpOnly cookies
// 3. Redirects the user to the QF authorization server

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  buildAuthorizationUrl,
  isQfConfigured,
} from "@/lib/qf-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isQfConfigured()) {
    return NextResponse.redirect(
      new URL("/?auth_error=not_configured", req.nextUrl.origin),
    );
  }

  const verifier   = generateCodeVerifier();
  const challenge  = await generateCodeChallenge(verifier);
  const state      = generateState();
  const redirectUri = `${req.nextUrl.origin}/api/auth/callback`;

  // Store PKCE artefacts for 10 minutes
  const jar = await cookies();
  const opts = {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path:     "/",
    maxAge:   600,
  };
  jar.set("ql_pkce_verifier", verifier, opts);
  jar.set("ql_pkce_state",    state,    opts);

  const authUrl = buildAuthorizationUrl(redirectUri, challenge, state);
  return NextResponse.redirect(authUrl);
}
