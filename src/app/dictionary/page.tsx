// /dictionary — Root Dictionary index page
// Server component — reads searchParams, fetches data with Prisma, renders root grid.
// Spec §9.3 — URL: /dictionary

export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { BottomNav } from "@/components/layout/BottomNav";
import { getDictionaryList } from "@/lib/dictionary-data";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Root Dictionary — Quran Lens",
  description: "Browse all roots in the Quran, organised by frequency, with concordance for each.",
};

// ─── Page Props ───────────────────────────────────────────────────────────────

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DictionaryPage({ searchParams }: Props) {
  const sp      = await searchParams;
  const q       = sp.q?.trim() ?? "";
  const page    = Math.max(1, parseInt(sp.page ?? "1", 10));
  const perPage = 60;

  let data;
  try {
    data = await getDictionaryList(q, page, perPage);
  } catch {
    data = { roots: [], total: 0, page: 1, perPage, totalPages: 0, query: q };
  }

  const { roots, total, totalPages } = data;

  return (
    <>
      <main className="flex-1 pb-nav" dir="ltr">
        <div
          className="w-full mx-auto py-6 px-4"
          style={{ maxWidth: "var(--token-layout-max-content)" }}
        >

          {/* ── Breadcrumb ───────────────────────────────────────────────── */}
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Dictionary" },
            ]}
          />

          {/* ── Heading ──────────────────────────────────────────────────── */}
          <div className="mb-6">
            <h1
              className="latin"
              style={{
                fontSize:    "var(--token-font-size-latin-xl)",
                fontWeight:  700,
                color:       "var(--token-text-primary)",
                marginBottom: "0.25rem",
              }}
            >
              Root Dictionary
            </h1>
            <p
              className="latin"
              style={{ fontSize: "var(--token-font-size-latin-sm)", color: "var(--token-text-secondary)" }}
            >
              Browse all {total.toLocaleString()} roots in the Quran
            </p>
          </div>

          {/* ── Search form ──────────────────────────────────────────────── */}
          <form action="/dictionary" method="GET" className="dict-search-form mb-6">
            <input
              type="search"
              name="q"
              defaultValue={q}
              dir="auto"
              placeholder="Search roots — Arabic or Buckwalter"
              className="dict-search-input"
              aria-label="Search roots"
              autoComplete="off"
            />
            <button type="submit" className="dict-search-btn latin">
              Search
            </button>
          </form>

          {/* ── Active query label ───────────────────────────────────────── */}
          {q && (
            <div
              className="mb-4 flex items-center gap-3"
              style={{ fontSize: "var(--token-font-size-latin-sm)", color: "var(--token-text-secondary)" }}
            >
              <span>
                <strong style={{ color: "var(--token-text-primary)" }}>{total.toLocaleString()}</strong>{" "}
                root{total !== 1 ? "s" : ""} matching &ldquo;<bdi>{q}</bdi>&rdquo;
              </span>
              <Link
                href="/dictionary"
                className="inline-link"
                style={{ color: "var(--token-pos-particle)" }}
              >
                Clear
              </Link>
            </div>
          )}

          {/* ── Root grid ───────────────────────────────────────────────── */}
          {roots.length > 0 ? (
            <div className="dict-root-grid">
              {roots.map((root) => (
                <Link
                  key={root.id}
                  href={`/dictionary/root/${encodeURIComponent(root.lettersBuckwalter)}`}
                  className="dict-root-card"
                >
                  <span
                    lang="ar"
                    dir="rtl"
                    className="dict-root-card__arabic arabic"
                  >
                    {root.lettersArabic}
                  </span>
                  <span className="dict-root-card__bw latin">
                    {root.lettersBuckwalter}
                  </span>
                  <span className="dict-root-card__freq latin">
                    ×{root.frequency.toLocaleString()}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div
              className="flex flex-col items-center gap-2 py-12 text-center"
              style={{ color: "var(--token-text-secondary)" }}
            >
              <p
                className="latin"
                style={{ fontSize: "var(--token-font-size-latin-lg)", fontWeight: 600, color: "var(--token-text-primary)" }}
              >
                No roots found
              </p>
              <p
                className="latin"
                style={{ fontSize: "var(--token-font-size-latin-sm)", maxWidth: "36ch" }}
              >
                {q
                  ? `No roots match "${q}". Try Arabic script or Buckwalter transliteration.`
                  : "The root dictionary could not be loaded."}
              </p>
              {q && (
                <Link href="/dictionary" className="inline-link" style={{ color: "var(--token-pos-verbal)" }}>
                  Browse all roots →
                </Link>
              )}
            </div>
          )}

          {/* ── Pagination ──────────────────────────────────────────────── */}
          {totalPages > 1 && (
            <DictionaryPagination page={page} totalPages={totalPages} q={q} />
          )}

        </div>
      </main>
      <BottomNav />
    </>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function DictionaryPagination({
  page,
  totalPages,
  q,
}: {
  page:       number;
  totalPages: number;
  q:          string;
}) {
  function buildHref(p: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", String(p));
    return `/dictionary?${params.toString()}`;
  }

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-4 mt-8"
      style={{ fontSize: "var(--token-font-size-latin-sm)" }}
    >
      {page > 1 ? (
        <Link href={buildHref(page - 1)} className="search-pagination__btn latin">
          ← Previous
        </Link>
      ) : (
        <span className="search-pagination__btn search-pagination__btn--disabled latin" aria-disabled="true">
          ← Previous
        </span>
      )}

      <span
        className="latin"
        style={{ color: "var(--token-text-secondary)" }}
      >
        {page} / {totalPages}
      </span>

      {page < totalPages ? (
        <Link href={buildHref(page + 1)} className="search-pagination__btn latin">
          Next →
        </Link>
      ) : (
        <span className="search-pagination__btn search-pagination__btn--disabled latin" aria-disabled="true">
          Next →
        </span>
      )}
    </nav>
  );
}
