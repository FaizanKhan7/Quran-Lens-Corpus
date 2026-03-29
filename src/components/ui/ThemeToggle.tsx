"use client";

/**
 * ThemeToggle — three-way light / dark / system toggle (spec §17.3).
 *
 * Variants:
 *   - "icon"    (default) — compact icon-only button, cycles Light → Dark → System
 *   - "segment" — segmented control with three labelled buttons
 *
 * next-themes handles persistence (localStorage) and SSR-safe hydration.
 * We suppress the hydration mismatch by waiting for `mounted` before rendering
 * the active state, showing a neutral skeleton in the meantime.
 */

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

// ─── SVG icons ────────────────────────────────────────────────────────────────

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SystemIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

// ─── Theme cycle order ────────────────────────────────────────────────────────

const THEMES = ["light", "dark", "system"] as const;
type Theme = typeof THEMES[number];

const THEME_LABELS: Record<Theme, string> = {
  light:  "Light",
  dark:   "Dark",
  system: "System",
};

const THEME_ICON: Record<Theme, React.ReactNode> = {
  light:  <SunIcon  className="w-5 h-5" />,
  dark:   <MoonIcon className="w-5 h-5" />,
  system: <SystemIcon className="w-5 h-5" />,
};

// ─── Icon variant ─────────────────────────────────────────────────────────────

function ThemeToggleIcon() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const current = (theme as Theme) ?? "system";

  function cycle() {
    const idx = THEMES.indexOf(current);
    setTheme(THEMES[(idx + 1) % THEMES.length]);
  }

  // Render an identical-sized placeholder before mount to avoid layout shift
  if (!mounted) {
    return (
      <button
        type="button"
        className="theme-toggle-icon"
        aria-label="Toggle theme"
        disabled
      >
        <span className="w-5 h-5 block" aria-hidden="true" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={cycle}
      className="theme-toggle-icon"
      aria-label={`Theme: ${THEME_LABELS[current]}. Click to switch to ${THEME_LABELS[THEMES[(THEMES.indexOf(current) + 1) % THEMES.length]]}`}
      title={`Current: ${THEME_LABELS[current]}`}
    >
      {THEME_ICON[current]}
    </button>
  );
}

// ─── Segmented variant ────────────────────────────────────────────────────────

function ThemeToggleSegment() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="theme-toggle-segment" aria-hidden="true" />;
  }

  return (
    <div
      className="theme-toggle-segment"
      role="group"
      aria-label="Colour scheme"
    >
      {THEMES.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setTheme(t)}
          className={cn(
            "theme-toggle-segment__btn",
            theme === t && "theme-toggle-segment__btn--active",
          )}
          aria-pressed={theme === t}
        >
          {THEME_ICON[t]}
          <span className="theme-toggle-segment__label">{THEME_LABELS[t]}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Exports ──────────────────────────────────────────────────────────────────

interface ThemeToggleProps {
  variant?: "icon" | "segment";
  className?: string;
}

export function ThemeToggle({ variant = "icon", className }: ThemeToggleProps) {
  return (
    <div className={className}>
      {variant === "segment" ? <ThemeToggleSegment /> : <ThemeToggleIcon />}
    </div>
  );
}
