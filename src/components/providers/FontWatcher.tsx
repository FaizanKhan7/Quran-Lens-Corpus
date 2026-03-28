"use client";

/**
 * FontWatcher — adds `data-fonts-loaded` to <html> when Amiri has loaded.
 *
 * Why: next/font uses font-display:swap, so on first load users briefly see
 * the size-adjusted fallback serif. Adding a one-time CSS transition (opacity
 * 0.92 → 1) smooths the swap so the reflow is imperceptible.
 *
 * We use the native CSS Font Loading API — no third-party library, no polling.
 * The document.fonts Promise resolves once all previously declared @font-face
 * rules have either loaded or timed out. We then add a single attribute to
 * <html> and let CSS handle the visual transition.
 */

import { useEffect } from "react";

export function FontWatcher() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    // "ready" resolves after all initially-declared fonts have settled
    document.fonts.ready.then(() => {
      document.documentElement.setAttribute("data-fonts-loaded", "true");
    });
  }, []);

  // Renders nothing — side-effect only
  return null;
}
