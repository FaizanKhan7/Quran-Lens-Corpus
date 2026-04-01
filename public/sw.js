/**
 * sw.js — Quran Lens service worker.
 *
 * Vanilla JS; no build tools required (compatible with Next.js 16 + Turbopack).
 *
 * Caching strategies (spec §13.3):
 *   corpus-data-v1  CacheFirst            words, roots, treebank, ontology (immutable)
 *   verse-cache-v1  StaleWhileRevalidate  verse listings
 *   search-cache-v1 NetworkFirst          search results (dynamic)
 *   shell-cache-v1  StaleWhileRevalidate  JS/CSS/font static assets
 */

const VERSION       = "v1";
const CORPUS_CACHE  = `corpus-data-${VERSION}`;
const VERSE_CACHE   = `verse-cache-${VERSION}`;
const SEARCH_CACHE  = `search-cache-${VERSION}`;
const SHELL_CACHE   = `shell-cache-${VERSION}`;

const ALL_CACHES    = [CORPUS_CACHE, VERSE_CACHE, SEARCH_CACHE, SHELL_CACHE];

// App shell — cached on install for instant offline load
const SHELL_URLS = [
  "/",
  "/surah",
  "/search",
  "/dictionary",
  "/ontology",
  "/settings",
  "/bookmarks",
];

// ── Install ──────────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) =>
        // addAll is best-effort; individual failures won't abort install
        Promise.allSettled(SHELL_URLS.map((url) => cache.add(url))),
      )
      .then(() => self.skipWaiting()),
  );
});

// ── Activate — purge stale caches ────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !ALL_CACHES.includes(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET, cross-origin, and browser-internal requests
  if (request.method !== "GET") return;
  if (!request.url.startsWith(self.location.origin)) return;
  if (request.url.includes("_next/webpack-hmr")) return;
  if (request.url.includes("__nextjs")) return;

  const path = new URL(request.url).pathname;

  // ── Corpus API: CacheFirst (immutable corpus data) ──────────────────────
  if (/\/api\/v1\/(words|roots|lemmas|treebank|ontology)/.test(path) ||
      /\/api\/v1\/surahs(\/\d+)?$/.test(path)) {
    event.respondWith(cacheFirst(request, CORPUS_CACHE));
    return;
  }

  // ── Verse content: StaleWhileRevalidate ─────────────────────────────────
  if (/\/api\/v1\/(verses|surahs\/\d+\/verses)/.test(path)) {
    event.respondWith(staleWhileRevalidate(request, VERSE_CACHE));
    return;
  }

  // ── Search results: NetworkFirst ────────────────────────────────────────
  if (path.startsWith("/api\/v1\/search")) {
    event.respondWith(networkFirst(request, SEARCH_CACHE));
    return;
  }

  // ── Next.js static assets: StaleWhileRevalidate ─────────────────────────
  if (path.startsWith("/_next/static") ||
      /\.(js|css|woff2?|svg|png|ico|webmanifest)$/.test(path)) {
    event.respondWith(staleWhileRevalidate(request, SHELL_CACHE));
    return;
  }

  // ── Page navigations: NetworkFirst with shell fallback ──────────────────
  if (request.mode === "navigate") {
    event.respondWith(navigateFetch(request));
    return;
  }
});

// ── Strategy helpers ─────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return offline503(request.url);
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Always kick off a revalidation
  const revalidate = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  // Return stale instantly if available; otherwise await network
  if (cached) return cached;
  return (await revalidate) ?? offline503(request.url);
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached ?? offline503(request.url);
  }
}

async function navigateFetch(request) {
  try {
    return await fetch(request);
  } catch {
    // Try the exact path, then fall back to home shell
    const cache  = await caches.open(SHELL_CACHE);
    const cached = await cache.match(request) ?? await cache.match("/");
    return cached ?? offline503(request.url);
  }
}

function offline503(url) {
  const body = JSON.stringify({ error: "Offline", url });
  return new Response(body, {
    status: 503,
    headers: { "Content-Type": "application/json" },
  });
}
