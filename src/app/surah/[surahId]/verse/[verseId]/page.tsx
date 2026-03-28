// /surah/[surahId]/verse/[verseId]
// Server component — fetches verse data from Prisma, renders word-by-word grid.
// Spec §9.3: URL structure matches /surah/{id}/verse/{verseNumber}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";
import { VerseWordGrid } from "@/components/ui/VerseWordGrid";
import { getVerseData } from "@/lib/verse-data";

interface Props {
  params: Promise<{ surahId: string; verseId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { surahId, verseId } = await params;
  const data = await getVerseData(Number(surahId), Number(verseId));
  if (!data) return { title: "Verse not found" };
  return {
    title: `${data.verse.surahId}:${data.verse.verseNumber} — Quran Lens`,
    description: data.verse.textUthmani.slice(0, 160),
  };
}

export default async function VersePage({ params }: Props) {
  const { surahId, verseId } = await params;
  const surahNum  = Number(surahId);
  const verseNum  = Number(verseId);

  if (!Number.isInteger(surahNum) || surahNum < 1 || surahNum > 114) notFound();
  if (!Number.isInteger(verseNum) || verseNum < 1) notFound();

  const data = await getVerseData(surahNum, verseNum);
  if (!data) notFound();

  const { verse, words, surahNameSimple } = data;
  const hasPrev = verseNum > 1;
  const hasNext = verseNum < verse.versesCount;

  return (
    <>
      <main className="flex-1 pb-20 md:pb-4" dir="ltr">
        <div
          className="w-full mx-auto py-6 px-4"
          style={{ maxWidth: "var(--token-layout-max-content)" }}
        >

          {/* ── Breadcrumb — spec §9.2 ───────────────────────────────────── */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 latin text-sm"
                style={{ color: "var(--token-text-tertiary)" }}>
              <li>
                <Link
                  href="/"
                  className="inline-link hover:underline"
                  style={{ color: "inherit" }}
                >
                  Home
                </Link>
              </li>
              <li aria-hidden="true">›</li>
              <li>
                <Link
                  href="/surah"
                  className="inline-link hover:underline"
                  style={{ color: "inherit" }}
                >
                  All Surahs
                </Link>
              </li>
              <li aria-hidden="true">›</li>
              <li>
                <Link
                  href={`/surah/${surahNum}`}
                  className="inline-link hover:underline"
                  style={{ color: "inherit" }}
                >
                  {surahNameSimple}
                </Link>
              </li>
              <li aria-hidden="true">›</li>
              <li
                aria-current="page"
                style={{ color: "var(--token-text-primary)" }}
              >
                Verse {verseNum}
              </li>
            </ol>
          </nav>

          {/* ── Verse Arabic text header ─────────────────────────────────── */}
          <header className="mb-8">
            <p
              lang="ar"
              dir="rtl"
              className="verse-arabic mb-3"
              style={{ color: "var(--token-text-primary)" }}
            >
              {verse.textUthmani}
            </p>
            <p
              className="latin text-sm"
              style={{ color: "var(--token-text-tertiary)" }}
            >
              {words.length} word{words.length !== 1 ? "s" : ""}
            </p>
          </header>

          {/* ── Word-by-word grid ────────────────────────────────────────── */}
          <section aria-label="Word-by-word analysis">
            <VerseWordGrid words={words} />
          </section>

          {/* ── Prev / Next verse navigation — spec §11 F10 ─────────────── */}
          <nav
            aria-label="Verse navigation"
            className="flex justify-between items-center mt-10 pt-6 latin"
            style={{ borderTop: "1px solid var(--token-border-subtle)" }}
          >
            {hasPrev ? (
              <Link
                href={`/surah/${surahNum}/verse/${verseNum - 1}`}
                className="verse-nav-btn"
                aria-label={`Previous verse: ${surahNum}:${verseNum - 1}`}
              >
                ← Verse {verseNum - 1}
              </Link>
            ) : (
              <span />
            )}

            <span
              className="text-sm"
              style={{ color: "var(--token-text-tertiary)" }}
            >
              {surahNum}:{verseNum}
            </span>

            {hasNext ? (
              <Link
                href={`/surah/${surahNum}/verse/${verseNum + 1}`}
                className="verse-nav-btn"
                aria-label={`Next verse: ${surahNum}:${verseNum + 1}`}
              >
                Verse {verseNum + 1} →
              </Link>
            ) : (
              <span />
            )}
          </nav>

        </div>
      </main>
      <BottomNav />
    </>
  );
}
