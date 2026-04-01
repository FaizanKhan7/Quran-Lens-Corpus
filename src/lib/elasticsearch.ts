/**
 * elasticsearch.ts — Singleton Elasticsearch client.
 *
 * The client is created once per Node.js process. In development, it is
 * attached to `globalThis` to survive Next.js hot-reloads.
 *
 * If ELASTICSEARCH_URL is not set, `esClient` is null and all search code
 * falls back to the Postgres/Prisma implementation automatically.
 */

import { Client } from "@elastic/elasticsearch";

// ─── Index names (versioned so a mapping change doesn't corrupt live data) ───

export const IDX_WORDS  = "quran-words-v1";
export const IDX_ROOTS  = "quran-roots-v1";
export const IDX_VERSES = "quran-verses-v1";

// ─── Client factory ───────────────────────────────────────────────────────────

function createClient(): Client | null {
  const url = process.env.ELASTICSEARCH_URL;
  if (!url) return null;

  return new Client({
    node: url,
    requestTimeout: 5_000,
    // Retry once on transient errors (connection refused during startup)
    maxRetries: 1,
  });
}

// ─── Singleton ────────────────────────────────────────────────────────────────

const g = globalThis as unknown as { _esClient?: Client | null };

export const esClient: Client | null =
  g._esClient !== undefined ? g._esClient : (g._esClient = createClient());

if (process.env.NODE_ENV !== "production") {
  g._esClient = esClient;
}

// ─── Health check ─────────────────────────────────────────────────────────────

/** Returns true if Elasticsearch is reachable. Used by the health API. */
export async function isEsHealthy(): Promise<boolean> {
  if (!esClient) return false;
  try {
    const health = await esClient.cluster.health({ timeout: "3s" });
    return health.status !== "red";
  } catch {
    return false;
  }
}
