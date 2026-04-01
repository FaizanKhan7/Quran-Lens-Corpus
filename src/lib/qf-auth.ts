/**
 * qf-auth.ts — Quran Foundation OAuth2 utilities.
 *
 * Two flows (spec §4.1):
 *   1. Client Credentials — server-side Content API token (cached, auto-refreshed)
 *   2. Authorization Code + PKCE — user authentication via QF identity server
 *
 * All functions degrade gracefully when QF credentials are not configured
 * (QF_CLIENT_ID / QF_CLIENT_SECRET env vars absent).
 */

const QF_AUTH_BASE    = process.env.QF_AUTH_URL    ?? "https://oauth2.quran.foundation";
const QF_CLIENT_ID    = process.env.QF_CLIENT_ID   ?? "";
const QF_CLIENT_SECRET = process.env.QF_CLIENT_SECRET ?? "";

// ─── Content API — Client Credentials ────────────────────────────────────────
// Tokens last 1 h; we refresh 5 min early.

let _contentToken: string | null = null;
let _contentTokenExpiry = 0;

export async function getContentApiToken(): Promise<string | null> {
  if (_contentToken && Date.now() < _contentTokenExpiry) return _contentToken;
  if (!QF_CLIENT_ID || !QF_CLIENT_SECRET) return null;

  try {
    const credentials = Buffer.from(`${QF_CLIENT_ID}:${QF_CLIENT_SECRET}`).toString("base64");
    const res = await fetch(`${QF_AUTH_BASE}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type":  "application/x-www-form-urlencoded",
        "Authorization": `Basic ${credentials}`,
      },
      body: "grant_type=client_credentials&scope=content",
      cache: "no-store",
    });

    if (!res.ok) return null;
    const data = await res.json() as { access_token: string; expires_in: number };
    _contentToken       = data.access_token;
    _contentTokenExpiry = Date.now() + (data.expires_in - 300) * 1000;
    return _contentToken;
  } catch {
    return null;
  }
}

/** Returns true when QF credentials are configured. */
export function isQfConfigured(): boolean {
  return Boolean(QF_CLIENT_ID);
}

// ─── PKCE helpers ─────────────────────────────────────────────────────────────

function base64UrlEncode(buf: Uint8Array): string {
  return btoa(String.fromCharCode(...buf))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export function generateCodeVerifier(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoded = new TextEncoder().encode(verifier);
  const hash    = await crypto.subtle.digest("SHA-256", encoded);
  return base64UrlEncode(new Uint8Array(hash));
}

export function generateState(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

// ─── Authorization URL ────────────────────────────────────────────────────────

export function buildAuthorizationUrl(
  redirectUri:    string,
  codeChallenge:  string,
  state:          string,
): string {
  const params = new URLSearchParams({
    response_type:         "code",
    client_id:             QF_CLIENT_ID,
    redirect_uri:          redirectUri,
    scope:                 "openid email profile user bookmark reading_session",
    state,
    code_challenge:        codeChallenge,
    code_challenge_method: "S256",
  });
  return `${QF_AUTH_BASE}/oauth2/auth?${params}`;
}

// ─── Token exchange ───────────────────────────────────────────────────────────

export interface TokenResponse {
  access_token:  string;
  token_type:    string;
  expires_in:    number;
  scope:         string;
  id_token?:     string;
  refresh_token?: string;
}

export async function exchangeCode(
  code:         string,
  codeVerifier: string,
  redirectUri:  string,
): Promise<TokenResponse> {
  const res = await fetch(`${QF_AUTH_BASE}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type:    "authorization_code",
      code,
      client_id:     QF_CLIENT_ID,
      redirect_uri:  redirectUri,
      code_verifier: codeVerifier,
    }).toString(),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Token exchange failed ${res.status}: ${body}`);
  }

  return res.json() as Promise<TokenResponse>;
}

// ─── User info ────────────────────────────────────────────────────────────────

export interface QfUserInfo {
  sub:      string;
  email?:   string;
  name?:    string;
  picture?: string;
}

export async function fetchUserInfo(accessToken: string): Promise<QfUserInfo | null> {
  try {
    const res = await fetch(`${QF_AUTH_BASE}/oauth2/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache:   "no-store",
    });
    if (!res.ok) return null;
    return res.json() as Promise<QfUserInfo>;
  } catch {
    return null;
  }
}
