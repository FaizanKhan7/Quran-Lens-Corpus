// /dictionary/root/[bw] — Root Concordance page
// Server component — full concordance for a single Quranic root.
// Spec §9.3, §10.1 (Tier 4 deep dive — root concordance)

export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";
import { POSBadge } from "@/components/ui/POSBadge";
import { getRootPageData, type RootOccurrence } from "@/lib/dictionary-data";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  params:       Promise<{ bw: string }>;
  searchParams: Promise<{ page?: string }>;
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { bw }   = await params;
  const sp       = await searchParams;
  const decodedBw = decodeURIComponent(bw);
  const page     = Math.max(1, parseInt(sp.page ?? "1", 10));
  const data     = await getRootPageData(decodedBw, page, 50);

  if (!data) {
    return { title: "Root not found — Quran Lens" };
  }

  return {
    title: `${data.root.lettersArabic} (${data.root.lettersBuckwalter}) — Root Concordance — Quran Lens`,
    description: `All ${data.total} occurrences of root ${data.root.lettersArabic} in the Quran.`,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function RootConcordancePage({ params, searchParams }: Props) {
  const { bw }    = await params;
  const sp        = await searchParams;
  const decodedBw = decodeURIComponent(bw);
  const page      = Math.max(1, parseInt(sp.page ?? "1", 10));
  const perPage   = 50;

  const data = await getRootPageData(decodedBw, page, perPage);
  if (!data) notFound();

  const { root, lemmas, occurrences, total, totalPages } = data;

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
              { label: "Dictionary", href: "/dictionary" },
              { label: root.lettersBuckwalter, labelArabic: root.lettersArabic },
            ]}
          />

          {/* ── Root Hero ────────────────────────────────────────────────── */}
          <section aria-label="Root information" className="root-hero mb-6">
            <span
              lang="ar"
              dir="rtl"
              className="root-hero__arabic arabic"
            >
              {root.lettersArabic}
            </span>
            <div className="root-hero__details">
              <bdi className="root-hero__bw latin">{root.lettersBuckwalter}</bdi>
              <span className="root-hero__freq latin">
                Appears {total.toLocaleString()} time{total !== 1 ? "s" : ""} in the Quran
              </span>
            </div>
          </section>

          {/* ── Derived Forms (Lemmas) ───────────────────────────────────── */}
          {lemmas.length > 0 && (
            <section aria-label="Derived forms" className="mb-6">
              <h2
                className="latin mb-3"
                style={{
                  fontSize:   "var(--token-font-size-latin-sm)",
                  fontWeight: 600,
                  color:      "var(--token-text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Derived Forms
              </h2>
              <div className="lemma-chips">
                {lemmas.map((lemma) => (
                  <span key={lemma.id} className="lemma-chip">
                    <span lang="ar" dir="rtl" className="lemma-chip__arabic arabic">
                      {lemma.formArabic}
                    </span>
                    <POSBadge tag={lemma.posTag} showTooltip={false} />
                    <span className="lemma-chip__freq latin">
                      ×{lemma.frequency.toLocaleString()}
                    </span>
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* ── Concordance ──────────────────────────────────────────────── */}
          <section aria-label="Root concordance">
            <div
              className="flex items-center gap-3 mb-4"
              style={{ borderBottom: "1px solid var(--token-border-subtle)", paddingBottom: "0.75rem" }}
            >
              <h2
                className="latin"
                style={{ fontSize: "var(--token-font-size-latin-md)", fontWeight: 600, color: "var(--token-text-primary)" }}
              >
                All Occurrences
              </h2>
              <span
                className="latin"
                style={{
                  fontSize:        "var(--token-font-size-latin-xs)",
                  color:           "var(--token-text-tertiary)",
                  backgroundColor: "var(--token-surface-overlay)",
                  padding:         "2px 8px",
                  borderRadius:    "var(--primitive-radius-full)",
                }}
              >
                {total.toLocaleString()}
              </span>
              {totalPages > 1 && (
                <span
                  className="latin"
                  style={{ fontSize: "var(--token-font-size-latin-xs)", color: "var(--token-text-tertiary)", marginInlineStart: "auto" }}
                >
                  Page {page} of {totalPages}
                </span>
              )}
            </div>

            {occurrences.length > 0 ? (
              <ConcordanceList occurrences={occurrences} />
            ) : (
              <p
                className="latin"
                style={{ color: "var(--token-text-secondary)", fontSize: "var(--token-font-size-latin-sm)" }}
              >
                No occurrences found on this page.
              </p>
            )}
          </section>

          {/* ── Pagination ──────────────────────────────────────────────── */}
          {totalPages > 1 && (
            <RootPagination page={page} totalPages={totalPages} bw={bw} />
          )}

          {/* ── Back link ────────────────────────────────────────────────── */}
          <nav aria-label="Back to dictionary" className="mt-8">
            <Link
              href="/dictionary"
              className="verse-nav-btn latin"
            >
              ← Back to Dictionary
            </Link>
          </nav>

        </div>
      </main>
      <BottomNav />
    </>
  );
}

// ─── ConcordanceList ──────────────────────────────────────────────────────────
// Groups occurrences by surah with dividers

function ConcordanceList({ occurrences }: { occurrences: RootOccurrence[] }) {
  let lastSurahId = -1;

  return (
    <div className="flex flex-col gap-1">
      {occurrences.map((occ) => {
        const showDivider = occ.surahId !== lastSurahId;
        lastSurahId = occ.surahId;

        return (
          <div key={occ.wordId}>
            {showDivider && (
              <div className="concordance-surah-divider">
                <span className="concordance-surah-divider__name latin">
                  {occ.surahNameSimple} ({occ.surahId})
                </span>
                <span
                  lang="ar"
                  dir="rtl"
                  className="concordance-surah-divider__arabic arabic"
                >
                  {occ.surahNameArabic}
                </span>
              </div>
            )}
            <Link
              href={`/surah/${occ.surahId}/verse/${occ.verseNumber}/word/${occ.position}`}
              className="concordance-row"
            >
              <span
                lang="ar"
                dir="rtl"
                className="concordance-row__arabic arabic"
              >
                {occ.textUthmani}
              </span>
              <span className="concordance-row__gloss">
                {occ.transliteration && (
                  <span className="concordance-row__translit latin">{occ.transliteration}</span>
                )}
                {occ.translation && (
                  <span className="concordance-row__translation latin">{occ.translation}</span>
                )}
              </span>
              <span className="concordance-row__ref latin">
                {occ.surahId}:{occ.verseNumber}:{occ.position}
                {occ.posTag && (
                  <span style={{ display: "block", marginTop: "2px" }}>
                    <POSBadge tag={occ.posTag} showTooltip={false} />
                  </span>
                )}
              </span>
            </Link>
          </div>
        );
      })}
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function RootPagination({
  page,
  totalPages,
  bw,
}: {
  page:       number;
  totalPages: number;
  bw:         string;
}) {
  const base = `/dictionary/root/${bw}`;

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-4 mt-8"
      style={{ fontSize: "var(--token-font-size-latin-sm)" }}
    >
      {page > 1 ? (
        <Link href={`${base}?page=${page - 1}`} className="search-pagination__btn latin">
          ← Previous
        </Link>
      ) : (
        <span className="search-pagination__btn search-pagination__btn--disabled latin" aria-disabled="true">
          ← Previous
        </span>
      )}

      <span className="latin" style={{ color: "var(--token-text-secondary)" }}>
        {page} / {totalPages}
      </span>

      {page < totalPages ? (
        <Link href={`${base}?page=${page + 1}`} className="search-pagination__btn latin">
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
