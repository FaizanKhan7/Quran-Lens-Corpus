// /surah/[surahId]/verse/[verseId]/treebank
// Server component — fetches treebank data, renders interactive D3 diagram.
// Spec §9.3: URL structure /surah/{id}/verse/{v}/treebank
// Spec §10.3: tap node → highlight chain, zoom/pan, layer toggles

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { BottomNav } from "@/components/layout/BottomNav";
import { TreebankViewer } from "@/components/ui/TreebankViewer";
import { getTreebankData } from "@/lib/treebank-data";
import { getVerseData } from "@/lib/verse-data";

interface Props {
  params: Promise<{ surahId: string; verseId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { surahId, verseId } = await params;
  return {
    title: `${surahId}:${verseId} Treebank — Quran Lens`,
    description: `Interactive dependency-tree diagram for verse ${surahId}:${verseId}`,
  };
}

export default async function TreebankPage({ params }: Props) {
  const { surahId, verseId } = await params;
  const surahNum  = Number(surahId);
  const verseNum  = Number(verseId);

  if (!Number.isInteger(surahNum) || surahNum < 1 || surahNum > 114) notFound();
  if (!Number.isInteger(verseNum) || verseNum < 1) notFound();

  const [treebank, verseData] = await Promise.all([
    getTreebankData(surahNum, verseNum),
    getVerseData(surahNum, verseNum),
  ]);

  const surahNameSimple = verseData?.surahNameSimple ?? `Surah ${surahNum}`;
  const verseKey = `${surahNum}:${verseNum}`;

  return (
    <>
      <main className="flex-1 pb-nav" dir="ltr">
        <div
          className="w-full mx-auto py-6 px-4"
          style={{ maxWidth: "var(--token-layout-max-content)" }}
        >
          <Breadcrumb
            items={[
              { label: "Home",          href: "/" },
              { label: "All Surahs",    href: "/surah" },
              { label: surahNameSimple, href: `/surah/${surahNum}` },
              { label: `Verse ${verseNum}`, href: `/surah/${surahNum}/verse/${verseNum}` },
              { label: "Treebank" },
            ]}
          />

          {/* Header */}
          <header className="mb-6">
            <h1
              className="latin text-2xl font-bold mb-1"
              style={{ color: "var(--token-text-primary)" }}
            >
              Dependency Tree
            </h1>
            <p className="latin text-sm" style={{ color: "var(--token-text-tertiary)" }}>
              {surahNameSimple} · verse {verseNum} · {verseKey}
            </p>

            {verseData && (
              <p
                lang="ar"
                dir="rtl"
                className="verse-arabic mt-3"
                style={{ color: "var(--token-text-primary)" }}
              >
                {verseData.verse.textUthmani}
              </p>
            )}
          </header>

          {/* Diagram or empty state */}
          {treebank ? (
            <>
              {!treebank.isComplete && (
                <div className="treebank-incomplete-notice latin">
                  <span>⚠ Partial annotation — some nodes may be missing.</span>
                </div>
              )}
              <TreebankViewer
                nodes={treebank.nodes}
                edges={treebank.edges}
                verseKey={verseKey}
              />
            </>
          ) : (
            <div className="treebank-empty latin">
              <p className="treebank-empty__title">No treebank data for this verse.</p>
              <p className="treebank-empty__hint">
                The Quranic Arabic Corpus treebank covers ~49% of the Quran.
                This verse has not yet been annotated.
              </p>
            </div>
          )}

          {/* Back link */}
          <div className="mt-8">
            <Link
              href={`/surah/${surahNum}/verse/${verseNum}`}
              className="inline-link latin text-sm"
            >
              ← Back to word analysis
            </Link>
          </div>
        </div>
      </main>
      <BottomNav />
    </>
  );
}
