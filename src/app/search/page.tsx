// /search
// Server component — reads searchParams, fetches data with Prisma, renders results.
// Spec §10.4 — unified search: Text | Root | Morphological

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { SearchBar } from "@/components/ui/SearchBar";
import { MorphologicalFilters } from "@/components/ui/MorphologicalFilters";
import { POSBadge } from "@/components/ui/POSBadge";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import {
  searchText,
  searchRoot,
  searchMorphological,
  type TextResult,
  type RootResult,
  type MorphResult,
  type SearchPageData,
} from "@/lib/search-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search",
};

// ─── Page Props ───────────────────────────────────────────────────────────────

interface PageSearchParams {
  q?:      string;
  type?:   string;
  page?:   string;
  pos?:    string;
  aspect?: string;
  mood?:   string;
  voice?:  string;
  form?:   string;
  person?: string;
  gender?: string;
  number?: string;
  case?:   string;
  state?:  string;
}

interface Props {
  searchParams: Promise<PageSearchParams>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SearchPage({ searchParams }: Props) {
  const sp      = await searchParams;
  const q       = sp.q?.trim() ?? "";
  const rawType = sp.type?.trim() ?? "text";
  const type    = (["text", "root", "morphological"].includes(rawType)
    ? rawType
    : "text") as "text" | "root" | "morphological";
  const page    = Math.max(1, parseInt(sp.page ?? "1", 10));
  const perPage = 20;

  // Morphological filters from URL
  const morphFilters: Record<string, string> = {};
  if (sp.pos)    morphFilters.pos    = sp.pos;
  if (sp.aspect) morphFilters.aspect = sp.aspect;
  if (sp.mood)   morphFilters.mood   = sp.mood;
  if (sp.voice)  morphFilters.voice  = sp.voice;
  if (sp.form)   morphFilters.form   = sp.form;
  if (sp.person) morphFilters.person = sp.person;
  if (sp.gender) morphFilters.gender = sp.gender;
  if (sp.number) morphFilters.number = sp.number;
  if (sp.case)   morphFilters.case   = sp.case;
  if (sp.state)  morphFilters.state  = sp.state;
  const hasMorphFilters = Object.keys(morphFilters).length > 0;

  // Fetch results
  let data: SearchPageData | null = null;

  try {
    if (type === "text" && q) {
      data = await searchText(q, page, perPage);
    } else if (type === "root" && q) {
      data = await searchRoot(q, page, perPage);
    } else if (type === "morphological" && hasMorphFilters) {
      data = await searchMorphological(morphFilters, page, perPage);
    }
  } catch {
    // Render empty state on DB error during SSR
    data = null;
  }

  return (
    <>
      <main className="flex-1 pb-nav search-page" dir="ltr">
        <div
          className="w-full mx-auto py-6 px-4"
          style={{ maxWidth: "var(--token-layout-max-content)" }}
        >

          {/* ── Breadcrumb ─────────────────────────────────────────────── */}
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Search" },
            ]}
          />

          {/* ── Search Bar ─────────────────────────────────────────────── */}
          <div className="mb-6">
            <Suspense>
              <SearchBar defaultQuery={q} defaultType={type} />
            </Suspense>
          </div>

          {/* ── Morphological Filters ───────────────────────────────────── */}
          {type === "morphological" && (
            <div className="mb-6">
              <Suspense>
                <MorphologicalFilters
                  filters={morphFilters}
                  onChange={() => {
                    // onChange is handled client-side via router.push inside the component
                  }}
                  resultCount={data?.total}
                />
              </Suspense>
            </div>
          )}

          {/* ── Results ────────────────────────────────────────────────── */}
          <SearchResults
            data={data}
            type={type}
            q={q}
            page={page}
            morphFilters={morphFilters}
            hasMorphFilters={hasMorphFilters}
          />

        </div>
      </main>
      <BottomNav />
    </>
  );
}

// ─── SearchResults ────────────────────────────────────────────────────────────

interface SearchResultsProps {
  data:            SearchPageData | null;
  type:            "text" | "root" | "morphological";
  q:               string;
  page:            number;
  morphFilters:    Record<string, string>;
  hasMorphFilters: boolean;
}

function SearchResults({
  data,
  type,
  q,
  page,
  morphFilters,
  hasMorphFilters,
}: SearchResultsProps) {
  // ── No query / no filters — show prompt ───────────────────────────────────
  if (!data) {
    if (type === "morphological" && !hasMorphFilters) {
      return (
        <div className="search-empty">
          <p className="search-empty__title">Select Morphological Filters</p>
          <p className="search-empty__subtitle">
            Use the filters above to search the corpus by POS, aspect, voice, case, and more.
          </p>
        </div>
      );
    }
    if (type !== "morphological" && !q) {
      return (
        <div className="search-empty">
          <p className="search-empty__title">Search the Quran Corpus</p>
          <p className="search-empty__subtitle">
            {type === "text"
              ? "Type Arabic text, transliteration, or English translation to find words."
              : "Enter root letters (Arabic script or Buckwalter) to find roots."}
          </p>
        </div>
      );
    }
    return null;
  }

  // ── Zero results ───────────────────────────────────────────────────────────
  if (data.total === 0) {
    const label = type === "morphological" ? "the selected filters" : `"${q}"`;
    return (
      <div className="search-empty">
        <p className="search-empty__title">No results for {label}</p>
        <p className="search-empty__subtitle">
          Try broadening your search or adjusting the filters.
        </p>
      </div>
    );
  }

  // ── Results header ─────────────────────────────────────────────────────────
  const label =
    type === "morphological"
      ? Object.entries(morphFilters)
          .map(([k, v]) => `${k}=${v}`)
          .join(", ")
      : q;

  return (
    <div className="search-results">
      <div className="search-results__header">
        <span>
          {data.total.toLocaleString()} result{data.total !== 1 ? "s" : ""} for{" "}
          <strong>{label}</strong>
        </span>
        {data.totalPages > 1 && (
          <span className="search-results__page-info">
            Page {page} of {data.totalPages}
          </span>
        )}
      </div>

      {/* Text results */}
      {type === "text" && data.textResults && (
        <div className="search-results__list">
          {data.textResults.map((r) => (
            <TextResultCard key={r.wordId} result={r} />
          ))}
        </div>
      )}

      {/* Root results */}
      {type === "root" && data.rootResults && (
        <div className="search-results__root-grid">
          {data.rootResults.map((r) => (
            <RootResultCard key={r.id} result={r} />
          ))}
        </div>
      )}

      {/* Morphological results */}
      {type === "morphological" && data.morphResults && (
        <div className="search-results__morph-table">
          <MorphResultTable results={data.morphResults} />
        </div>
      )}

      {/* Pagination */}
      {data.totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={data.totalPages}
          type={type}
          q={q}
          morphFilters={morphFilters}
        />
      )}
    </div>
  );
}

// ─── Text Result Card ─────────────────────────────────────────────────────────

function TextResultCard({ result }: { result: TextResult }) {
  const href = `/surah/${result.surahId}/verse/${result.verseNumber}/word/${result.position}`;
  return (
    <Link href={href} className="search-result-card">
      <span
        lang="ar"
        dir="rtl"
        className="search-result-card__arabic"
      >
        {result.textUthmani}
      </span>
      <span className="search-result-card__body">
        <span className="search-result-card__translit">
          {result.transliteration}
        </span>
        <span className="search-result-card__gloss">
          {result.translation}
        </span>
      </span>
      <span className="search-result-card__meta">
        <span className="search-result-card__location">
          {result.surahNameSimple} {result.surahId}:{result.verseNumber}
        </span>
        {result.posTag && (
          <POSBadge tag={result.posTag} showTooltip={false} />
        )}
      </span>
    </Link>
  );
}

// ─── Root Result Card ─────────────────────────────────────────────────────────

function RootResultCard({ result }: { result: RootResult }) {
  const href = `/dictionary/root/${encodeURIComponent(result.lettersBuckwalter)}`;
  return (
    <Link href={href} className="root-result-card">
      <span
        lang="ar"
        dir="rtl"
        className="root-result-card__arabic"
      >
        {result.lettersArabic}
      </span>
      <span className="root-result-card__bw bidi-isolate">
        {result.lettersBuckwalter}
      </span>
      <span className="root-result-card__freq">
        ×{result.frequency.toLocaleString()}
      </span>
    </Link>
  );
}

// ─── Morphological Result Table ───────────────────────────────────────────────

function MorphResultTable({ results }: { results: MorphResult[] }) {
  return (
    <table className="morph-result-table">
      <thead>
        <tr>
          <th scope="col">Word</th>
          <th scope="col">POS</th>
          <th scope="col">Root</th>
          <th scope="col">Aspect</th>
          <th scope="col">Mood</th>
          <th scope="col">Voice</th>
          <th scope="col">Form</th>
          <th scope="col">Case</th>
          <th scope="col">P/G/N</th>
          <th scope="col">Location</th>
        </tr>
      </thead>
      <tbody>
        {results.map((r, i) => (
          <MorphResultRow key={`${r.wordId}-${i}`} result={r} />
        ))}
      </tbody>
    </table>
  );
}

function MorphResultRow({ result }: { result: MorphResult }) {
  const href = `/surah/${result.surahId}/verse/${result.verseNumber}/word/${result.wordPosition}`;
  const pgn  = [result.person, result.gender, result.number].filter(Boolean).join("");
  return (
    <tr className="morph-result-row">
      <td>
        <Link href={href} className="inline-link">
          <span lang="ar" dir="rtl">{result.formArabic}</span>
        </Link>
      </td>
      <td>
        <POSBadge tag={result.posTag} showTooltip={false} />
      </td>
      <td>
        {result.rootBuckwalter ? (
          <span className="bidi-isolate">{result.rootBuckwalter}</span>
        ) : (
          <span className="text-[var(--token-text-tertiary)]">—</span>
        )}
      </td>
      <td>{result.verbAspect ?? "—"}</td>
      <td>{result.verbMood  ?? "—"}</td>
      <td>{result.verbVoice ?? "—"}</td>
      <td>{result.verbForm  ?? "—"}</td>
      <td>{result.gramCase  ?? "—"}</td>
      <td>{pgn || "—"}</td>
      <td>
        <Link
          href={`/surah/${result.surahId}/verse/${result.verseNumber}`}
          className="inline-link text-[var(--token-pos-verbal)]"
        >
          {result.surahNameSimple} {result.surahId}:{result.verseNumber}
        </Link>
      </td>
    </tr>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

interface PaginationProps {
  page:         number;
  totalPages:   number;
  type:         string;
  q:            string;
  morphFilters: Record<string, string>;
}

function Pagination({ page, totalPages, type, q, morphFilters }: PaginationProps) {
  function buildHref(p: number) {
    const params = new URLSearchParams();
    params.set("type", type);
    if (q) params.set("q", q);
    Object.entries(morphFilters).forEach(([k, v]) => { if (v) params.set(k, v); });
    params.set("page", String(p));
    return `/search?${params.toString()}`;
  }

  return (
    <nav
      className="search-pagination"
      aria-label="Pagination"
    >
      {page > 1 ? (
        <Link href={buildHref(page - 1)} className="search-pagination__btn">
          ← Previous
        </Link>
      ) : (
        <span className="search-pagination__btn search-pagination__btn--disabled" aria-disabled="true">
          ← Previous
        </span>
      )}

      <span className="search-pagination__info">
        {page} / {totalPages}
      </span>

      {page < totalPages ? (
        <Link href={buildHref(page + 1)} className="search-pagination__btn">
          Next →
        </Link>
      ) : (
        <span className="search-pagination__btn search-pagination__btn--disabled" aria-disabled="true">
          Next →
        </span>
      )}
    </nav>
  );
}
