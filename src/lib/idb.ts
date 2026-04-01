/**
 * idb.ts — IndexedDB helpers for the Quran Lens offline corpus cache.
 *
 * Tracks which surahs have been proactively pre-fetched into the SW cache.
 * The actual HTTP responses live in Cache Storage (managed by the SW);
 * IDB just records metadata so the UI can show "saved / not saved" state.
 *
 * Spec §13.4: Progressive caching — download per-surah as user visits.
 */

import { openDB, type IDBPDatabase } from "idb";

// ─── Schema ──────────────────────────────────────────────────────────────────

interface QuranLensDB {
  "offline-surahs": {
    key: number;
    value: {
      surahId:   number;
      cachedAt:  number; // unix ms
      wordCount: number;
    };
  };
}

const DB_NAME    = "quran-lens";
const DB_VERSION = 1;

// ─── DB singleton ─────────────────────────────────────────────────────────────

let _db: IDBPDatabase<QuranLensDB> | null = null;

async function getDB(): Promise<IDBPDatabase<QuranLensDB>> {
  if (_db) return _db;
  _db = await openDB<QuranLensDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore("offline-surahs", { keyPath: "surahId" });
    },
  });
  return _db;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Returns true if the user's browser supports IndexedDB (not SSR). */
export function isIDBAvailable(): boolean {
  return typeof window !== "undefined" && "indexedDB" in window;
}

/** Returns all surah IDs that have been saved for offline. */
export async function getCachedSurahIds(): Promise<number[]> {
  if (!isIDBAvailable()) return [];
  const db  = await getDB();
  const all = await db.getAll("offline-surahs");
  return all.map((r) => r.surahId);
}

/** Returns true if a specific surah has been saved for offline. */
export async function isSurahCached(surahId: number): Promise<boolean> {
  if (!isIDBAvailable()) return false;
  const db  = await getDB();
  const rec = await db.get("offline-surahs", surahId);
  return rec !== undefined;
}

/** Marks a surah as cached in IDB metadata. Called after pre-fetch succeeds. */
export async function markSurahCached(surahId: number, wordCount: number): Promise<void> {
  if (!isIDBAvailable()) return;
  const db = await getDB();
  await db.put("offline-surahs", { surahId, cachedAt: Date.now(), wordCount });
}

/** Removes a surah from the cached list. Does NOT clear SW Cache Storage. */
export async function unmarkSurahCached(surahId: number): Promise<void> {
  if (!isIDBAvailable()) return;
  const db = await getDB();
  await db.delete("offline-surahs", surahId);
}

/** Clears all IDB offline metadata. */
export async function clearAllCached(): Promise<void> {
  if (!isIDBAvailable()) return;
  const db = await getDB();
  await db.clear("offline-surahs");
}

// ─── Pre-fetch helper ─────────────────────────────────────────────────────────

/**
 * Pre-fetches all key API endpoints for a surah so the service worker
 * stores them in Cache Storage. Reports progress via the callback.
 */
export async function prefetchSurah(
  surahId:  number,
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const urls = [
    `/api/v1/surahs/${surahId}`,
    `/api/v1/surahs/${surahId}/verses?words=true`,
  ];

  // Add verse-level word detail URLs for each verse (surah 1 = 7 verses, etc.)
  // We load the surah first to get the verse count, then prefetch words.
  let wordCount = 0;

  for (let i = 0; i < urls.length; i++) {
    try {
      const res = await fetch(urls[i]);
      if (res.ok) {
        const json = await res.json();
        // Count words from the verses response
        if (urls[i].includes("/verses")) {
          const verses = json?.data?.verses ?? json?.data ?? [];
          if (Array.isArray(verses)) {
            wordCount = verses.reduce(
              (sum: number, v: { words?: unknown[] }) => sum + (v.words?.length ?? 0),
              0,
            );
          }
        }
      }
    } catch {
      // Gracefully skip failed fetches
    }
    onProgress?.(i + 1, urls.length);
  }

  await markSurahCached(surahId, wordCount);
}

/**
 * Pre-fetches all 114 surahs sequentially with progress reporting.
 * This is the "Download entire corpus for offline" action.
 */
export async function prefetchAllSurahs(
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  for (let surahId = 1; surahId <= 114; surahId++) {
    await prefetchSurah(surahId);
    onProgress?.(surahId, 114);
  }
}
