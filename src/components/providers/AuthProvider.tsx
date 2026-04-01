"use client";

/**
 * AuthProvider — fetches the current user from /api/auth/me on mount and
 * exposes it via the AuthContext. Child components read it with useAuth().
 *
 * This is a lightweight client-side only context; no server component needed.
 */

import { createContext, useContext, useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id:       string;
  email:    string | null;
  name:     string | null;
  picture:  string | null;
}

interface AuthState {
  user:      AuthUser | null;
  loading:   boolean;
  /** Call to trigger the QF PKCE login redirect. */
  login:     () => void;
  /** Clears the session via POST /api/auth/logout then resets state. */
  logout:    () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user:    null,
  loading: true,
  login:   () => {},
  logout:  async () => {},
});

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch session on mount
  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setUser(json?.data ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = () => {
    // Store current URL so callback can return here
    document.cookie = `ql_return_to=${encodeURIComponent(window.location.pathname)}; path=/; max-age=600; SameSite=Lax`;
    window.location.href = "/api/auth/login";
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
