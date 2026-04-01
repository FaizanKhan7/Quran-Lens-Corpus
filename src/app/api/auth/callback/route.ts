// GET /api/auth/callback — OAuth2 authorization code callback.
//
// 1. Validates state parameter against stored cookie
// 2. Exchanges authorization code for access token (using code_verifier)
// 3. Fetches user info from /userinfo endpoint
// 4. Writes encrypted session cookie
// 5. Redirects to home page (or stored redirect destination)

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCode, fetchUserInfo } from "@/lib/qf-auth";
import { setSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code  = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // QF rejected the request
  if (error) {
    return NextResponse.redirect(
      new URL(`/?auth_error=${encodeURIComponent(error)}`, origin),
    );
  }

  const jar          = await cookies();
  const storedState  = jar.get("ql_pkce_state")?.value;
  const codeVerifier = jar.get("ql_pkce_verifier")?.value;

  // Clean up PKCE cookies regardless of outcome
  jar.delete("ql_pkce_state");
  jar.delete("ql_pkce_verifier");

  if (!code || !state || state !== storedState || !codeVerifier) {
    return NextResponse.redirect(new URL("/?auth_error=invalid_state", origin));
  }

  try {
    const redirectUri = `${origin}/api/auth/callback`;
    const tokens      = await exchangeCode(code, codeVerifier, redirectUri);
    const user        = await fetchUserInfo(tokens.access_token);

    if (!user) throw new Error("userinfo fetch failed");

    await setSession({
      accessToken: tokens.access_token,
      expiresAt:   Date.now() + tokens.expires_in * 1000,
      user: {
        id:      user.sub,
        email:   user.email,
        name:    user.name,
        picture: user.picture,
      },
    });

    // Redirect to the page the user was on before login, or home
    const returnTo = jar.get("ql_return_to")?.value ?? "/";
    jar.delete("ql_return_to");
    return NextResponse.redirect(new URL(returnTo, origin));
  } catch (err) {
    console.error("[auth/callback]", err);
    return NextResponse.redirect(new URL("/?auth_error=token_exchange_failed", origin));
  }
}
