// /ontology — Concept browser: all categories + top-level concepts
// Spec §9.1 — Ontology Explorer (F13)

import type { Metadata } from "next";
import Link from "next/link";
import { BottomNav } from "@/components/layout/BottomNav";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { getAllConceptsByCategory, type ConceptSummary } from "@/lib/ontology-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ontology Explorer",
};

// ── Category icon map ─────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, string> = {
  "Special":             "✦",
  "Living Creation":     "🌿",
  "Location":            "📍",
  "Event":               "📅",
  "Holy Book":           "📖",
  "Physical Attribute":  "⚡",
  "Physical Substance":  "💧",
  "Astronomical Body":   "🌙",
  "Artifact":            "🏺",
  "Religion":            "☪",
  "False Deity":         "🪆",
  "Language":            "🔤",
  "Weather Phenomena":   "⛅",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function OntologyPage() {
  let groups: Awaited<ReturnType<typeof getAllConceptsByCategory>> = [];
  try {
    groups = await getAllConceptsByCategory();
  } catch {
    // DB unavailable — render empty state
  }

  const totalConcepts = groups.reduce((sum, g) => sum + g.concepts.length, 0);

  return (
    <>
      <main className="flex-1 pb-nav ontology-page" dir="ltr">
        <div
          className="w-full mx-auto py-6 px-4"
          style={{ maxWidth: "var(--token-layout-max-content)" }}
        >
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Ontology" },
            ]}
          />

          {/* Header */}
          <div className="ontology-header">
            <div>
              <h1 className="ontology-header__title">Ontology Explorer</h1>
              <p className="ontology-header__subtitle">
                {totalConcepts > 0
                  ? `${totalConcepts} concepts across ${groups.length} categories`
                  : "Semantic concepts and themes from the Quran"}
              </p>
            </div>
          </div>

          {/* Category grid */}
          {groups.length === 0 ? (
            <div className="ontology-empty">
              <p className="ontology-empty__title">No concepts seeded yet</p>
              <p className="ontology-empty__hint">
                Run <code>npm run db:seed:ontology</code> to populate the ontology.
              </p>
            </div>
          ) : (
            <div className="ontology-categories">
              {groups.map((group) => (
                <CategorySection
                  key={group.category}
                  category={group.category}
                  concepts={group.concepts}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </>
  );
}

// ─── Category Section ─────────────────────────────────────────────────────────

function CategorySection({
  category,
  concepts,
}: {
  category: string;
  concepts: ConceptSummary[];
}) {
  const icon = CATEGORY_ICONS[category] ?? "◆";

  return (
    <section className="ontology-category" aria-labelledby={`cat-${category}`}>
      <div className="ontology-category__header">
        <span className="ontology-category__icon" aria-hidden="true">{icon}</span>
        <h2 id={`cat-${category}`} className="ontology-category__name">
          {category}
        </h2>
        <span className="ontology-category__count">{concepts.length}</span>
      </div>

      <div className="ontology-concept-grid">
        {concepts.map((concept) => (
          <ConceptCard key={concept.id} concept={concept} />
        ))}
      </div>
    </section>
  );
}

// ─── Concept Card ─────────────────────────────────────────────────────────────

function ConceptCard({ concept }: { concept: ConceptSummary }) {
  return (
    <Link href={`/ontology/${concept.id}`} className="ontology-concept-card">
      <span className="ontology-concept-card__name">{concept.name}</span>
      <span className="ontology-concept-card__meta">
        {concept.childCount > 0 && (
          <span className="ontology-concept-card__badge ontology-concept-card__badge--children">
            {concept.childCount} sub
          </span>
        )}
        {concept.verseCount > 0 && (
          <span className="ontology-concept-card__badge ontology-concept-card__badge--verses">
            {concept.verseCount} verse{concept.verseCount !== 1 ? "s" : ""}
          </span>
        )}
      </span>
    </Link>
  );
}
