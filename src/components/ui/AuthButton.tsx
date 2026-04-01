"use client";

/**
 * AuthButton — Login / user avatar + logout button.
 *
 * - Loading: skeleton pill
 * - Logged out: "Sign in" button (navigates to PKCE flow)
 * - Logged in: avatar (initials or picture) + name + logout dropdown
 */

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";

export function AuthButton() {
  const { user, loading, login, logout } = useAuth();
  const [open, setOpen]     = useState(false);
  const menuRef             = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (loading) {
    return <div className="auth-btn-skeleton" aria-hidden="true" />;
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={login}
        className="auth-signin-btn"
        aria-label="Sign in with Quran Foundation"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
          className="w-4 h-4" aria-hidden="true">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
        Sign in
      </button>
    );
  }

  const initials = user.name
    ? user.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
    : user.email?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="auth-avatar-wrapper" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="auth-avatar-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user.name ?? user.email ?? "user"}`}
      >
        {user.picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.picture} alt="" className="auth-avatar-img" />
        ) : (
          <span className="auth-avatar-initials">{initials}</span>
        )}
      </button>

      {open && (
        <div className="auth-menu" role="menu">
          <div className="auth-menu__header">
            <span className="auth-menu__name">{user.name ?? "User"}</span>
            {user.email && (
              <span className="auth-menu__email">{user.email}</span>
            )}
          </div>
          <button
            type="button"
            role="menuitem"
            className="auth-menu__item auth-menu__item--danger"
            onClick={async () => {
              setOpen(false);
              await logout();
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
