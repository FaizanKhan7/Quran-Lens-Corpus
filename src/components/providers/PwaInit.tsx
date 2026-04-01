"use client";

/**
 * PwaInit — registers the service worker once the app is mounted.
 *
 * - Only registers in production (NODE_ENV !== "development") to avoid
 *   conflicts with Next.js hot-reload.
 * - Listens for SW updates and prompts the user to reload.
 * - Renders nothing visible.
 */

import { useEffect } from "react";

export function PwaInit() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    // Disabled in development to prevent SW interfering with hot-reload
    if (process.env.NODE_ENV !== "production") return;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });

        // Check for updates every time the page gains focus
        const handleFocus = () => registration.update().catch(() => null);
        window.addEventListener("focus", handleFocus);

        // Notify on update available
        registration.addEventListener("updatefound", () => {
          const newSW = registration.installing;
          if (!newSW) return;

          newSW.addEventListener("statechange", () => {
            // A new SW has taken control — flag so the banner can prompt reload
            if (
              newSW.state === "activated" &&
              navigator.serviceWorker.controller
            ) {
              window.dispatchEvent(new CustomEvent("sw-updated"));
            }
          });
        });

        return () => window.removeEventListener("focus", handleFocus);
      } catch (err) {
        console.warn("[PwaInit] SW registration failed:", err);
      }
    };

    register();
  }, []);

  return null;
}
