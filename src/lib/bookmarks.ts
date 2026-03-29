/**
 * Bookmarks — localStorage persistence (spec §11 F14)
 *
 * Pure functions — no React, no side-effects beyond localStorage.
 * Dispatches a custom DOM event after every write so React hooks
 * can re-sync within the same tab.
 */

const STORAGE_KEY   = "quran-lens-bookmarks";
export const CHANGE_EVENT = "quran-lens-bookmarks-change";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BookmarkType = "word" | "verse";

export interface Bookmark {
  /** Stable unique key: `word:2:255:3` or `verse:2:255` */
  id:               string;
  type:             BookmarkType;
  surahId:          number;
  verseNumber:      number;
  /** Only set for word bookmarks */
  wordPosition?:    number;
  textUthmani:      string;
  translation?:     string;
  transliteration?: string;
  surahNameSimple:  string;
  savedAt:          number; // Date.now()
}

// ─── ID helpers ───────────────────────────────────────────────────────────────

export function makeBookmarkId(
  type:          BookmarkType,
  surahId:       number,
  verseNumber:   number,
  wordPosition?: number,
): string {
  return type === "word"
    ? `word:${surahId}:${verseNumber}:${wordPosition}`
    : `verse:${surahId}:${verseNumber}`;
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export function getBookmarks(): Bookmark[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Bookmark[]) : [];
  } catch {
    return [];
  }
}

export function isBookmarked(id: string): boolean {
  return getBookmarks().some((b) => b.id === id);
}

// ─── Write ────────────────────────────────────────────────────────────────────

function persist(bookmarks: Bookmark[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function addBookmark(bookmark: Omit<Bookmark, "savedAt">): void {
  const existing = getBookmarks();
  if (existing.some((b) => b.id === bookmark.id)) return; // idempotent
  persist([{ ...bookmark, savedAt: Date.now() }, ...existing]);
}

export function removeBookmark(id: string): void {
  persist(getBookmarks().filter((b) => b.id !== id));
}

export function toggleBookmark(bookmark: Omit<Bookmark, "savedAt">): void {
  isBookmarked(bookmark.id)
    ? removeBookmark(bookmark.id)
    : addBookmark(bookmark);
}

export function clearAllBookmarks(): void {
  persist([]);
}
