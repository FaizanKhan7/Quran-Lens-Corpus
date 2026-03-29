"use client";

/**
 * BookmarkButton — toggle bookmark for a word or verse (spec §11 F14).
 *
 * Variants:
 *   "icon"   — compact star icon, suitable for card headers / verse headers
 *   "pill"   — labelled pill button, suitable for inline action rows
 */

import { useBookmarks } from "@/hooks/useBookmarks";
import { makeBookmarkId, toggleBookmark, type Bookmark, type BookmarkType } from "@/lib/bookmarks";
import { cn } from "@/lib/utils";

// ─── Icons ────────────────────────────────────────────────────────────────────

function BookmarkFilledIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 3a2 2 0 0 0-2 2v16l7-3 7 3V5a2 2 0 0 0-2-2H5z" />
    </svg>
  );
}

function BookmarkOutlineIcon({ className }: { className?: string }) {
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
      <path d="M5 3a2 2 0 0 0-2 2v16l7-3 7 3V5a2 2 0 0 0-2-2H5z" />
    </svg>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface BookmarkButtonProps {
  type:             BookmarkType;
  surahId:          number;
  verseNumber:      number;
  wordPosition?:    number;
  textUthmani:      string;
  translation?:     string;
  transliteration?: string;
  surahNameSimple:  string;
  variant?:         "icon" | "pill";
  className?:       string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BookmarkButton({
  type,
  surahId,
  verseNumber,
  wordPosition,
  textUthmani,
  translation,
  transliteration,
  surahNameSimple,
  variant = "icon",
  className,
}: BookmarkButtonProps) {
  const { isBookmarkedId } = useBookmarks();

  const id      = makeBookmarkId(type, surahId, verseNumber, wordPosition);
  const saved   = isBookmarkedId(id);
  const label   = saved ? "Remove bookmark" : "Add bookmark";

  const bookmarkData: Omit<Bookmark, "savedAt"> = {
    id,
    type,
    surahId,
    verseNumber,
    wordPosition,
    textUthmani,
    translation,
    transliteration,
    surahNameSimple,
  };

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    toggleBookmark(bookmarkData);
  }

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn("bookmark-btn-pill", saved && "bookmark-btn-pill--saved", className)}
        aria-label={label}
        aria-pressed={saved}
      >
        {saved
          ? <BookmarkFilledIcon className="w-3.5 h-3.5" />
          : <BookmarkOutlineIcon className="w-3.5 h-3.5" />}
        <span>{saved ? "Saved" : "Bookmark"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn("bookmark-btn", saved && "bookmark-btn--saved", className)}
      aria-label={label}
      aria-pressed={saved}
      title={label}
    >
      {saved
        ? <BookmarkFilledIcon className="w-4 h-4" />
        : <BookmarkOutlineIcon className="w-4 h-4" />}
    </button>
  );
}
