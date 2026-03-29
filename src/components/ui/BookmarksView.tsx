"use client";

/**
 * BookmarksView — client component that reads and renders localStorage bookmarks.
 * Split from the page so the page itself can export static Metadata.
 */

import Link from "next/link";
import { useBookmarks } from "@/hooks/useBookmarks";
import type { Bookmark } from "@/lib/bookmarks";

// ─── Icons ────────────────────────────────────────────────────────────────────

function EmptyBookmarkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="bookmarks-empty__icon"
      aria-hidden="true"
    >
      <path d="M5 3a2 2 0 0 0-2 2v16l7-3 7 3V5a2 2 0 0 0-2-2H5z" />
    </svg>
  );
}

function RemoveIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className="w-4 h-4"
      aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function bookmarkHref(b: Bookmark): string {
  if (b.type === "word" && b.wordPosition != null) {
    return `/surah/${b.surahId}/verse/${b.verseNumber}/word/${b.wordPosition}`;
  }
  return `/surah/${b.surahId}/verse/${b.verseNumber}`;
}

function bookmarkRef(b: Bookmark): string {
  if (b.type === "word" && b.wordPosition != null) {
    return `${b.surahId}:${b.verseNumber}:${b.wordPosition}`;
  }
  return `${b.surahId}:${b.verseNumber}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BookmarksView() {
  const { bookmarks, removeBookmark, clearAllBookmarks } = useBookmarks();

  if (bookmarks.length === 0) {
    return (
      <div className="bookmarks-empty" role="status">
        <EmptyBookmarkIcon />
        <p className="bookmarks-empty__title">No bookmarks yet</p>
        <p className="bookmarks-empty__hint">
          Tap the bookmark icon on any word or verse to save it here.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Toolbar */}
      <div className="bookmarks-toolbar">
        <span className="bookmarks-toolbar__count">
          {bookmarks.length} saved
        </span>
        <button
          type="button"
          className="bookmarks-clear-btn"
          onClick={() => {
            if (confirm("Remove all bookmarks?")) clearAllBookmarks();
          }}
        >
          Clear all
        </button>
      </div>

      {/* List */}
      <ul className="bookmarks-list" role="list">
        {bookmarks.map((b) => (
          <li key={b.id} className="flex items-center gap-2">
            {/* Navigate to the bookmarked item */}
            <Link href={bookmarkHref(b)} className="bookmark-item flex-1">
              <div className="bookmark-item__content">
                {/* Arabic text */}
                <span
                  lang="ar"
                  dir="rtl"
                  className="bookmark-item__arabic arabic"
                >
                  {b.textUthmani}
                </span>

                {/* Meta row */}
                <div className="bookmark-item__meta">
                  <span className="bookmark-item__ref latin">
                    {b.surahNameSimple} · {bookmarkRef(b)}
                  </span>
                  <span className="bookmark-item__type-badge latin">
                    {b.type}
                  </span>
                  {b.translation && (
                    <span className="bookmark-item__gloss latin">
                      {b.translation}
                    </span>
                  )}
                </div>
              </div>
            </Link>

            {/* Remove button — separate element so entire row click → navigate */}
            <button
              type="button"
              className="bookmark-item__remove"
              onClick={() => removeBookmark(b.id)}
              aria-label={`Remove bookmark for ${b.textUthmani}`}
            >
              <RemoveIcon />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
