"use client";

/**
 * OfflineDownload — "Save for offline" button for a surah or the full corpus.
 *
 * Pre-fetches API endpoints into Cache Storage via the service worker.
 * Tracks state in IndexedDB so the button shows "Saved" after caching.
 *
 * Spec §13.4:
 *   - "Progressive caching: download per-surah as user visits"
 *   - "Option: 'Download entire corpus for offline use'"
 */

import { useEffect, useState, useCallback, useRef } from "react";
import {
  isSurahCached,
  prefetchSurah,
  prefetchAllSurahs,
  clearAllCached,
  getCachedSurahIds,
  isIDBAvailable,
} from "@/lib/idb";

// ─── Per-surah button ─────────────────────────────────────────────────────────

interface SurahDownloadProps {
  surahId: number;
}

type DownloadState = "idle" | "loading" | "cached" | "unavailable";

export function SurahOfflineButton({ surahId }: SurahDownloadProps) {
  // Lazy initializer: if IDB is unavailable (SSR or unsupported browser),
  // start in "unavailable" so we never render the button at all.
  const [state, setState]       = useState<DownloadState>(() =>
    isIDBAvailable() ? "idle" : "unavailable",
  );
  const [progress, setProgress] = useState(0);
  const mountedRef              = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (state === "unavailable") return;
    isSurahCached(surahId).then((cached) => {
      if (mountedRef.current) setState(cached ? "cached" : "idle");
    });
    return () => { mountedRef.current = false; };
  }, [surahId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = useCallback(async () => {
    if (state !== "idle") return;
    setState("loading");
    setProgress(0);

    try {
      await prefetchSurah(surahId, (done, total) => {
        if (mountedRef.current) setProgress(Math.round((done / total) * 100));
      });
      if (mountedRef.current) setState("cached");
    } catch {
      if (mountedRef.current) setState("idle");
    }
  }, [state, surahId]);

  if (state === "unavailable") return null;

  return (
    <button
      type="button"
      onClick={handleSave}
      disabled={state === "loading" || state === "cached"}
      className={`offline-dl-btn ${state === "cached" ? "offline-dl-btn--saved" : ""} ${state === "loading" ? "offline-dl-btn--loading" : ""}`}
      aria-label={
        state === "cached"  ? "Surah saved for offline use"   :
        state === "loading" ? `Saving… ${progress}%`          :
                              "Save this surah for offline use"
      }
    >
      {state === "cached" ? (
        <>
          <SavedIcon />
          <span>Saved offline</span>
        </>
      ) : state === "loading" ? (
        <>
          <SpinnerIcon />
          <span>Saving… {progress}%</span>
        </>
      ) : (
        <>
          <DownloadIcon />
          <span>Save offline</span>
        </>
      )}
    </button>
  );
}

// ─── Full-corpus download panel ───────────────────────────────────────────────

export function CorpusOfflinePanel() {
  const [cachedCount, setCachedCount] = useState<number | null>(null);
  const [state, setState]             = useState<"idle" | "loading" | "done">("idle");
  const [progress, setProgress]       = useState(0);
  const mountedRef                    = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (!isIDBAvailable()) return;
    getCachedSurahIds().then((ids) => {
      if (mountedRef.current) setCachedCount(ids.length);
    });
    return () => { mountedRef.current = false; };
  }, []);

  const handleDownloadAll = useCallback(async () => {
    if (state === "loading") return;
    setState("loading");
    setProgress(0);

    try {
      await prefetchAllSurahs((done) => {
        if (mountedRef.current) {
          setProgress(done);
          setCachedCount(done);
        }
      });
      if (mountedRef.current) setState("done");
    } catch {
      if (mountedRef.current) setState("idle");
    }
  }, [state]);

  const handleClear = useCallback(async () => {
    await clearAllCached();
    if (mountedRef.current) {
      setCachedCount(0);
      setState("idle");
      setProgress(0);
    }
  }, []);

  if (!isIDBAvailable()) return null;

  const allCached = cachedCount === 114;

  return (
    <div className="corpus-offline-panel">
      <div className="corpus-offline-panel__header">
        <div>
          <p className="corpus-offline-panel__title">Offline Corpus</p>
          <p className="corpus-offline-panel__subtitle">
            {cachedCount === null
              ? "Checking…"
              : allCached
              ? "All 114 surahs saved"
              : `${cachedCount ?? 0} of 114 surahs saved`}
          </p>
        </div>

        {state !== "loading" && (
          <div className="flex gap-2">
            {!allCached && (
              <button
                type="button"
                onClick={handleDownloadAll}
                className="offline-dl-btn"
                aria-label="Download all 114 surahs for offline use"
              >
                <DownloadIcon />
                <span>Download all</span>
              </button>
            )}
            {(cachedCount ?? 0) > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="offline-dl-btn offline-dl-btn--clear"
                aria-label="Clear offline cache"
              >
                Clear cache
              </button>
            )}
          </div>
        )}
      </div>

      {/* Progress bar */}
      {state === "loading" && (
        <div className="corpus-offline-panel__progress">
          <div
            className="corpus-offline-panel__progress-fill"
            style={{ width: `${Math.round((progress / 114) * 100)}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={114}
            aria-label={`Downloading surah ${progress} of 114`}
          />
        </div>
      )}
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function DownloadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      className="offline-dl-btn__icon" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function SavedIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      className="offline-dl-btn__icon" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      className="offline-dl-btn__icon offline-dl-btn__icon--spin" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
