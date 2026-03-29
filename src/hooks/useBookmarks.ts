"use client";

/**
 * useBookmarks — reactive bookmark state.
 *
 * Re-renders when:
 *   - This tab modifies bookmarks (CHANGE_EVENT custom event)
 *   - Another tab modifies bookmarks (window 'storage' event)
 */

import { useState, useEffect, useCallback } from "react";
import {
  getBookmarks,
  isBookmarked,
  addBookmark,
  removeBookmark,
  toggleBookmark,
  clearAllBookmarks,
  CHANGE_EVENT,
  type Bookmark,
} from "@/lib/bookmarks";

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  const sync = useCallback(() => setBookmarks(getBookmarks()), []);

  useEffect(() => {
    sync();
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage",    sync); // cross-tab sync
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage",    sync);
    };
  }, [sync]);

  return {
    bookmarks,
    isBookmarked,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    clearAllBookmarks,
    /** Reactive check — triggers re-render when bookmark list changes */
    isBookmarkedId: (id: string) => bookmarks.some((b) => b.id === id),
  };
}
