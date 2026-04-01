/**
 * session.ts — AES-GCM encrypted session cookies.
 *
 * The session payload is encrypted with AES-GCM using a 32-byte key derived
 * from SESSION_SECRET. All crypto uses the Web Crypto API (Node 18+ built-in).
 * The resulting cookie is httpOnly + Secure + SameSite=Lax.
 *
 * Session lifetime matches the OAuth2 token lifetime; the cookie expires when
 * the access token expires.
 */

import { cookies } from "next/headers";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SessionUser {
  id:       string;   // QF OIDC `sub`
  email?:   string;
  name?:    string;
  picture?: string;
}

export interface Session {
  accessToken: string;
  expiresAt:   number;  // unix ms
  user:        SessionUser;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COOKIE_NAME = "ql_session";

/** Pad/trim the env secret to exactly 32 bytes (AES-256 key size). */
function rawKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET ?? "quran-lens-dev-secret-must-be-32";
  const padded = secret.padEnd(32, "0").slice(0, 32);
  return new TextEncoder().encode(padded);
}

// ─── Crypto helpers ───────────────────────────────────────────────────────────

async function importKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    rawKey() as unknown as ArrayBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

async function encrypt(payload: Session): Promise<string> {
  const key  = await importKey();
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify(payload));

  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);

  // Prepend IV to ciphertext, then base64url encode
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.byteLength);

  return btoa(String.fromCharCode(...combined))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

async function decrypt(token: string): Promise<Session | null> {
  try {
    const key    = await importKey();
    const binary = atob(token.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes  = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const iv         = bytes.slice(0, 12);
    const ciphertext = bytes.slice(12);

    const plaintext  = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return JSON.parse(new TextDecoder().decode(plaintext)) as Session;
  } catch {
    return null;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Reads and validates the session from the current request cookies. */
export async function getSession(): Promise<Session | null> {
  const jar    = await cookies();
  const cookie = jar.get(COOKIE_NAME);
  if (!cookie?.value) return null;

  const session = await decrypt(cookie.value);
  if (!session) return null;
  if (Date.now() > session.expiresAt) return null;

  return session;
}

/** Writes an encrypted session cookie. */
export async function setSession(session: Session): Promise<void> {
  const token  = await encrypt(session);
  const maxAge = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));
  const jar    = await cookies();

  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    path:     "/",
    maxAge,
  });
}

/** Clears the session cookie. */
export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}
