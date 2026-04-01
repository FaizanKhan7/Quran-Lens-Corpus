"use client";

/**
 * BookmarksView — shows bookmarks from the server (when logged in) or
 * localStorage (when logged out). Seamlessly merges on login.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { useBookmarks } from "@/hooks/useBookmarks";
import type { Bookmark } from "@/lib/bookmarks";

// ─── Server bookmark shape (from /api/v1/bookmarks) ──────────────────────────

interface ServerBookmark {
  id:       number;
  verseId:  string;   // "surah:verse"
  wordId:   string | null;
  type:     "verse" | "word";
  createdAt: string;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function EmptyBookmarkIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round"
      className="bookmarks-empty__icon" aria-hidden="true">
      <path d="M5 3a2 2 0 0 0-2 2v16l7-3 7 3V5a2 2 0 0 0-2-2H5z" />
    </svg>
  );
}

function RemoveIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round"
      className="w-4 h-4" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function localBookmarkHref(b: Bookmark): string {
  return b.type === "word" && b.wordPosition != null
    ? `/surah/${b.surahId}/verse/${b.verseNumber}/word/${b.wordPosition}`
    : `/surah/${b.surahId}/verse/${b.verseNumber}`;
}

function localBookmarkRef(b: Bookmark): string {
  return b.type === "word" && b.wordPosition != null
    ? `${b.surahId}:${b.verseNumber}:${b.wordPosition}`
    : `${b.surahId}:${b.verseNumber}`;
}

function serverBookmarkHref(b: ServerBookmark): string {
  if (b.wordId) {
    const pos = b.wordId.split(":")[2];
    const [surah, verse] = b.verseId.split(":");
    return `/surah/${surah}/verse/${verse}/word/${pos}`;
  }
  const [surah, verse] = b.verseId.split(":");
  return `/surah/${surah}/verse/${verse}`;
}

function serverBookmarkRef(b: ServerBookmark): string {
  return b.wordId ?? b.verseId;
}

// ─── Logged-out view (localStorage) ──────────────────────────────────────────

function LocalBookmarks() {
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
      <div className="bookmarks-toolbar">
        <span className="bookmarks-toolbar__count">{bookmarks.length} saved</span>
        <button type="button" className="bookmarks-clear-btn"
          onClick={() => { if (confirm("Remove all bookmarks?")) clearAllBookmarks(); }}>
          Clear all
        </button>
      </div>
      <ul className="bookmarks-list" role="list">
        {bookmarks.map((b) => (
          <li key={b.id} className="flex items-center gap-2">
            <Link href={localBookmarkHref(b)} className="bookmark-item flex-1">
              <div className="bookmark-item__content">
                <span lang="ar" dir="rtl" className="bookmark-item__arabic arabic">
                  {b.textUthmani}
                </span>
                <div className="bookmark-item__meta">
                  <span className="bookmark-item__ref latin">
                    {b.surahNameSimple} · {localBookmarkRef(b)}
                  </span>
                  <span className="bookmark-item__type-badge latin">{b.type}</span>
                  {b.translation && (
                    <span className="bookmark-item__gloss latin">{b.translation}</span>
                  )}
                </div>
              </div>
            </Link>
            <button type="button" className="bookmark-item__remove"
              onClick={() => removeBookmark(b.id)}
              aria-label={`Remove bookmark for ${b.textUthmani}`}>
              <RemoveIcon />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

// ─── Logged-in view (server DB) ───────────────────────────────────────────────

function ServerBookmarks() {
  const [bookmarks, setBookmarks] = useState<ServerBookmark[]>([]);
  const [loading,   setLoading]   = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/v1/bookmarks", { cache: "no-store" });
      const json = await res.json() as { data?: ServerBookmark[] };
      setBookmarks(json.data ?? []);
    } catch {
      setBookmarks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const remove = useCallback(async (id: number) => {
    await fetch(`/api/v1/bookmarks/${id}`, { method: "DELETE" });
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  if (loading) {
    return (
      <div className="bookmarks-empty" role="status" aria-busy="true">
        <p className="bookmarks-empty__hint">Loading bookmarks…</p>
      </div>
    );
  }

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
      <div className="bookmarks-toolbar">
        <span className="bookmarks-toolbar__count">{bookmarks.length} saved</span>
      </div>
      <ul className="bookmarks-list" role="list">
        {bookmarks.map((b) => (
          <li key={b.id} className="flex items-center gap-2">
            <Link href={serverBookmarkHref(b)} className="bookmark-item flex-1">
              <div className="bookmark-item__content">
                <div className="bookmark-item__meta">
                  <span className="bookmark-item__ref latin">{serverBookmarkRef(b)}</span>
                  <span className="bookmark-item__type-badge latin">{b.type}</span>
                </div>
              </div>
            </Link>
            <button type="button" className="bookmark-item__remove"
              onClick={() => remove(b.id)}
              aria-label={`Remove bookmark ${b.verseId}`}>
              <RemoveIcon />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────

export function BookmarksView() {
  const { user, loading, login } = useAuth();

  if (loading) {
    return <div className="bookmarks-empty" aria-busy="true">
      <p className="bookmarks-empty__hint">Loading…</p>
    </div>;
  }

  if (!user) {
    return (
      <>
        {/* Sign-in prompt */}
        <div className="bookmarks-signin-prompt">
          <p className="bookmarks-signin-prompt__text">
            Sign in to sync bookmarks across devices.
          </p>
          <button type="button" onClick={login} className="bookmarks-signin-btn">
            Sign in with Quran Foundation
          </button>
        </div>
        {/* Local bookmarks still shown below */}
        <LocalBookmarks />
      </>
    );
  }

  return <ServerBookmarks />;
}
