// /ontology/[conceptId] — Concept detail: hierarchy, relations, verse links
// Spec §9.1 — Ontology Explorer (F13)

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { getConceptDetail, type ConceptSummary, type ConceptVerseLink } from "@/lib/ontology-data";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ conceptId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { conceptId } = await params;
  return { title: conceptId };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ConceptPage({ params }: Props) {
  const { conceptId } = await params;
  const concept = await getConceptDetail(conceptId);
  if (!concept) notFound();

  return (
    <>
      <main className="flex-1 pb-nav concept-page" dir="ltr">
        <div
          className="w-full mx-auto py-6 px-4"
          style={{ maxWidth: "var(--token-layout-max-content)" }}
        >
          <Breadcrumb
            items={[
              { label: "Home",     href: "/" },
              { label: "Ontology", href: "/ontology" },
              ...(concept.parentId && concept.parentName
                ? [{ label: concept.parentName, href: `/ontology/${concept.parentId}` }]
                : []),
              { label: concept.name },
            ]}
          />

          {/* Concept header */}
          <div className="concept-header">
            <div>
              <span className="concept-header__category">{concept.category}</span>
              <h1 className="concept-header__name">{concept.name}</h1>
            </div>
            {concept.verseLinks.length > 0 && (
              <span className="concept-header__verse-count">
                {concept.verseLinks.length} verse reference{concept.verseLinks.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="concept-layout">
            {/* Left column: hierarchy + relations */}
            <div className="concept-layout__sidebar">

              {/* Parent concept */}
              {concept.parentId && concept.parentName && (
                <div className="concept-panel">
                  <h2 className="concept-panel__heading">Parent Concept</h2>
                  <Link
                    href={`/ontology/${concept.parentId}`}
                    className="concept-relation-link"
                  >
                    {concept.parentName}
                  </Link>
                </div>
              )}

              {/* Sub-concepts / children */}
              {concept.children.length > 0 && (
                <div className="concept-panel">
                  <h2 className="concept-panel__heading">
                    Sub-concepts
                    <span className="concept-panel__count">{concept.children.length}</span>
                  </h2>
                  <div className="concept-children-grid">
                    {concept.children.map((child) => (
                      <ChildCard key={child.id} concept={child} />
                    ))}
                  </div>
                </div>
              )}

              {/* Semantic relations */}
              {concept.relations.length > 0 && (
                <div className="concept-panel">
                  <h2 className="concept-panel__heading">Semantic Relations</h2>
                  <ul className="concept-relations-list">
                    {concept.relations.map((rel, i) => (
                      <li key={i} className="concept-relation-item">
                        <span className="concept-relation-item__predicate">{rel.predicate}</span>
                        <Link
                          href={`/ontology/${rel.objectId}`}
                          className="concept-relation-link"
                        >
                          {rel.objectName}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Right column: verse links */}
            <div className="concept-layout__main">
              {concept.verseLinks.length === 0 ? (
                <div className="concept-no-verses">
                  <p className="concept-no-verses__title">No verse references linked</p>
                  <p className="concept-no-verses__hint">
                    Verse links are added as the ontology is enriched.
                  </p>
                </div>
              ) : (
                <div className="concept-panel">
                  <h2 className="concept-panel__heading">
                    Quranic References
                    <span className="concept-panel__count">{concept.verseLinks.length}</span>
                  </h2>
                  <div className="concept-verse-list">
                    {concept.verseLinks.map((vl, i) => (
                      <VerseLinkCard key={`${vl.verseId}-${i}`} link={vl} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
      <BottomNav />
    </>
  );
}

// ─── ChildCard ────────────────────────────────────────────────────────────────

function ChildCard({ concept }: { concept: ConceptSummary }) {
  return (
    <Link href={`/ontology/${concept.id}`} className="concept-child-card">
      <span className="concept-child-card__name">{concept.name}</span>
      <span className="concept-child-card__counts">
        {concept.childCount > 0 && <span>{concept.childCount} sub</span>}
        {concept.verseCount > 0 && <span>{concept.verseCount}v</span>}
      </span>
    </Link>
  );
}

// ─── VerseLinkCard ────────────────────────────────────────────────────────────

function VerseLinkCard({ link }: { link: ConceptVerseLink }) {
  const verseHref = `/surah/${link.surahId}/verse/${link.verseNumber}`;
  const wordHref  = link.wordId
    ? `/surah/${link.surahId}/verse/${link.verseNumber}/word/${link.wordId.split(":")[2]}`
    : null;

  return (
    <div className="concept-verse-card">
      {/* Word highlight (if word-level link) */}
      {link.textUthmani && (
        <div className="concept-verse-card__word">
          <span lang="ar" dir="rtl" className="concept-verse-card__arabic">
            {link.textUthmani}
          </span>
          {link.transliteration && (
            <span className="concept-verse-card__translit">{link.transliteration}</span>
          )}
          {link.translation && (
            <span className="concept-verse-card__gloss">{link.translation}</span>
          )}
        </div>
      )}

      {/* Location */}
      <div className="concept-verse-card__footer">
        <Link href={verseHref} className="concept-verse-card__location inline-link">
          {link.surahName} {link.surahId}:{link.verseNumber}
        </Link>
        {wordHref && (
          <Link href={wordHref} className="concept-verse-card__word-link inline-link">
            View word →
          </Link>
        )}
      </div>
    </div>
  );
}
