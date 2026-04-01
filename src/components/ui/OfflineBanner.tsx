"use client";

/**
 * OfflineBanner — Persistent, non-intrusive status strip.
 *
 * Shows at the very top of the page when the browser reports offline.
 * Disappears automatically when connectivity returns.
 * Spec §13.4: "Persistent subtle banner when offline: 'Browsing cached content'"
 */

import { useEffect, useState } from "react";

type ConnState = "online" | "offline" | "unknown";

export function OfflineBanner() {
  // Lazy initializer reads navigator.onLine on first render (client-only).
  // SSR returns "unknown" so the banner stays hidden until hydration.
  const [conn, setConn] = useState<ConnState>(() => {
    if (typeof window === "undefined") return "unknown";
    return navigator.onLine ? "online" : "offline";
  });

  useEffect(() => {
    const handleOnline  = () => setConn("online");
    const handleOffline = () => setConn("offline");
    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (conn !== "offline") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="You are offline — browsing cached content"
      className="offline-banner"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="offline-banner__icon"
        aria-hidden="true"
      >
        <line x1="1" y1="1" x2="23" y2="23" />
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
        <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
        <line x1="12" y1="20" x2="12.01" y2="20" />
      </svg>
      <span className="offline-banner__text">
        Offline — browsing cached content
      </span>
    </div>
  );
}
