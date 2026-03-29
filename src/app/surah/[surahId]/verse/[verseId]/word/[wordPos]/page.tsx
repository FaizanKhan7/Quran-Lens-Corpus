/**
 * Tier 4 — Word Detail Page (spec §10.1)
 *
 * Full linguistic deep-dive for a single word:
 *   - Hero: large Arabic word, transliteration, gloss, location
 *   - Root block: Arabic letters, Buckwalter, frequency
 *   - Full segment breakdown (prefix / stem / suffix with all features)
 *   - Root concordance: first 20 occurrences + total count
 */

export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";
import { POSBadge } from "@/components/ui/POSBadge";
import { getWordPageData } from "@/lib/word-data";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import type { Segment } from "@/types/corpus";

// ─── Feature label maps (same as Drawer) ─────────────────────────────────────

const CASE_LABEL: Record<string, string> = {
  NOM: "Nominative (marfūʿ)",
  ACC: "Accusative (manṣūb)",
  GEN: "Genitive (majrūr)",
};
const STATE_LABEL: Record<string, string>  = { DEF: "Definite", INDEF: "Indefinite" };
const ASPECT_LABEL: Record<string, string> = { PERF: "Perfect", IMPF: "Imperfect", IMPV: "Imperative" };
const MOOD_LABEL: Record<string, string>   = { IND: "Indicative", SUBJ: "Subjunctive", JUS: "Jussive" };
const VOICE_LABEL: Record<string, string>  = { ACT: "Active", PASS: "Passive" };
const NUMBER_LABEL: Record<string, string> = { S: "Singular", D: "Dual", P: "Plural" };
const GENDER_LABEL: Record<string, string> = { M: "Masculine", F: "Feminine" };
const PERSON_LABEL: Record<string, string> = { "1": "1st", "2": "2nd", "3": "3rd" };

// ─── Segment row ──────────────────────────────────────────────────────────────

function SegmentBreakdownRow({ seg }: { seg: Segment }) {
  const f = seg.features;
  const features: { label: string; value: string }[] = [];

  if (f.root)        features.push({ label: "Root",    value: `${f.rootArabic ? f.rootArabic + " · " : ""}${f.root}` });
  if (f.lemma)       features.push({ label: "Lemma",   value: `${f.lemmaArabic ? f.lemmaArabic + " · " : ""}${f.lemma}` });
  if (f.verbAspect)  features.push({ label: "Aspect",  value: ASPECT_LABEL[f.verbAspect]  ?? f.verbAspect });
  if (f.verbMood)    features.push({ label: "Mood",    value: MOOD_LABEL[f.verbMood]      ?? f.verbMood });
  if (f.verbVoice)   features.push({ label: "Voice",   value: VOICE_LABEL[f.verbVoice]   ?? f.verbVoice });
  if (f.verbForm)    features.push({ label: "Form",    value: `Form ${f.verbForm}` });
  if (f.derivation)  features.push({ label: "Deriv.",  value: f.derivation });
  if (f.person)      features.push({ label: "Person",  value: PERSON_LABEL[f.person]      ?? f.person });
  if (f.gender)      features.push({ label: "Gender",  value: GENDER_LABEL[f.gender]      ?? f.gender });
  if (f.number)      features.push({ label: "Number",  value: NUMBER_LABEL[f.number]      ?? f.number });
  if (f.gramCase)    features.push({ label: "Case",    value: CASE_LABEL[f.gramCase]      ?? f.gramCase });
  if (f.gramState)   features.push({ label: "State",   value: STATE_LABEL[f.gramState]    ?? f.gramState });

  const rowClass = `segment-breakdown__row segment-breakdown__row--${seg.type.toLowerCase()}`;

  return (
    <div className={rowClass}>
      {/* Arabic form */}
      <span lang="ar" dir="rtl" className="segment-breakdown__arabic arabic">
        {seg.formArabic || seg.formBuckwalter}
      </span>

      {/* POS info */}
      <div>
        <div className="segment-breakdown__label">{seg.type}</div>
        <div className="flex items-center gap-1 mt-1 flex-wrap">
          <POSBadge tag={seg.posTag} showTooltip={false} />
          <span className="segment-breakdown__pos latin">{seg.posDescription}</span>
        </div>
        {seg.posArabic && (
          <span
            lang="ar"
            dir="rtl"
            className="arabic block mt-1"
            style={{ fontSize: "var(--token-font-size-arabic-sm)", color: "var(--token-text-secondary)" }}
          >
            {seg.posArabic}
          </span>
        )}
      </div>

      {/* Features grid */}
      <div className="morphology-table" style={{ gridTemplateColumns: "1fr" }}>
        {features.map(({ label, value }) => (
          <div key={label} className="morphology-table__cell">
            <span className="morphology-table__label">{label}</span>
            <bdi className="morphology-table__value">{value}</bdi>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ surahId: string; verseId: string; wordPos: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { surahId, verseId, wordPos } = await params;
  const data = await getWordPageData(Number(surahId), Number(verseId), Number(wordPos));
  if (!data) return { title: "Word not found — Quran Lens" };
  const { word, surahNameSimple } = data;
  return {
    title: `${word.textUthmani} — ${surahNameSimple} ${surahId}:${verseId} — Quran Lens`,
    description: `Linguistic analysis of ${word.textUthmani} (${word.transliteration}) — ${word.translation}`,
  };
}

export default async function WordDetailPage({ params }: Props) {
  const { surahId, verseId, wordPos } = await params;
  const surahNum = Number(surahId);
  const verseNum = Number(verseId);
  const wordNum  = Number(wordPos);

  if (!Number.isInteger(surahNum) || surahNum < 1 || surahNum > 114) notFound();
  if (!Number.isInteger(verseNum) || verseNum < 1) notFound();
  if (!Number.isInteger(wordNum)  || wordNum  < 1) notFound();

  const data = await getWordPageData(surahNum, verseNum, wordNum);
  if (!data) notFound();

  const {
    word,
    surahNameSimple,
    surahNameArabic,
    rootOccurrences,
    rootOccurrenceCount,
  } = data;

  const stem = word.segments.find((s) => s.type === "STEM");
  const verseUrl = `/surah/${surahNum}/verse/${verseNum}`;

  return (
    <>
      <main className="flex-1 pb-nav" dir="ltr">
        <div
          className="w-full mx-auto py-6 px-4 word-detail-page"
          style={{ maxWidth: "var(--token-layout-max-content)" }}
        >

          {/* ── Breadcrumb ────────────────────────────────────────────────── */}
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "All Surahs", href: "/surah" },
              { label: surahNameSimple, href: `/surah/${surahNum}` },
              { label: `Verse ${verseNum}`, href: verseUrl },
              { label: `Word ${wordNum}`, labelArabic: word.textUthmani },
            ]}
          />

          {/* ── Hero ──────────────────────────────────────────────────────── */}
          <header className="word-detail-hero" dir="rtl">
            <span lang="ar" className="word-detail-hero__arabic arabic">
              {word.textUthmani}
            </span>
            {word.transliteration && (
              <span className="word-detail-hero__transliteration latin" dir="ltr">
                {word.transliteration}
              </span>
            )}
            {word.translation && (
              <span className="word-detail-hero__gloss latin" dir="ltr">
                {word.translation}
              </span>
            )}
            <span className="word-detail-hero__location latin" dir="ltr">
              {surahNameSimple} ({surahNum}:{verseNum}:{wordNum}) · {surahNameArabic}
            </span>
            {stem?.posTag && (
              <div dir="ltr">
                <POSBadge tag={stem.posTag} showTooltip />
              </div>
            )}
          </header>

          {/* ── Root block ────────────────────────────────────────────────── */}
          {word.root && (
            <section aria-label="Root analysis">
              <div className="word-detail-card">
                <div className="word-detail-card__header">
                  <h2 className="word-detail-card__title latin">Root</h2>
                  <span className="word-detail-card__count latin">
                    {rootOccurrenceCount} occurrence{rootOccurrenceCount !== 1 ? "s" : ""} in the Quran
                  </span>
                </div>
                <div className="word-detail-card__body">
                  <div className="root-info">
                    <span lang="ar" dir="rtl" className="root-info__arabic arabic">
                      {word.root.lettersArabic}
                    </span>
                    <div className="root-info__details">
                      <bdi className="root-info__buckwalter">{word.root.lettersBuckwalter}</bdi>
                      <span className="root-info__freq latin">
                        Appears {word.root.frequency.toLocaleString()} times across {rootOccurrenceCount} words
                      </span>
                    </div>
                  </div>
                  {stem?.features.lemma && (
                    <div
                      className="mt-4"
                      style={{
                        fontSize: "var(--token-font-size-latin-sm)",
                        color: "var(--token-text-secondary)",
                        borderTop: "1px solid var(--token-border-subtle)",
                        paddingTop: "0.75rem",
                      }}
                    >
                      <span className="latin" style={{ color: "var(--token-text-tertiary)" }}>Lemma: </span>
                      <bdi>
                        {stem.features.lemmaArabic ? `${stem.features.lemmaArabic} · ` : ""}
                        {stem.features.lemma}
                      </bdi>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ── Segment breakdown ─────────────────────────────────────────── */}
          {word.segments.length > 0 && (
            <section aria-label="Morphological segments">
              <div className="word-detail-card">
                <div className="word-detail-card__header">
                  <h2 className="word-detail-card__title latin">Morphological Analysis</h2>
                  <span className="word-detail-card__count latin">
                    {word.segments.length} segment{word.segments.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="word-detail-card__body">
                  <div className="segment-breakdown">
                    {word.segments.map((seg) => (
                      <SegmentBreakdownRow key={seg.position} seg={seg} />
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ── Root concordance ──────────────────────────────────────────── */}
          {rootOccurrences.length > 0 && (
            <section aria-label="Root concordance">
              <div className="word-detail-card">
                <div className="word-detail-card__header">
                  <h2 className="word-detail-card__title latin">
                    Root Concordance
                    {word.root && (
                      <bdi
                        lang="ar"
                        className="arabic ms-2"
                        style={{ fontSize: "var(--token-font-size-arabic-sm)" }}
                      >
                        {word.root.lettersArabic}
                      </bdi>
                    )}
                  </h2>
                  <span className="word-detail-card__count latin">
                    {rootOccurrenceCount} total
                  </span>
                </div>
                <div className="word-detail-card__body">
                  <div className="root-concordance">
                    {rootOccurrences.map((occ) => {
                      const isCurrent =
                        occ.surahId === surahNum &&
                        occ.verseNumber === verseNum &&
                        occ.position === wordNum;
                      return (
                        <Link
                          key={occ.wordId}
                          href={`/surah/${occ.surahId}/verse/${occ.verseNumber}/word/${occ.position}`}
                          className={`root-concordance__item${isCurrent ? " root-concordance__item--current" : ""}`}
                          aria-current={isCurrent ? "page" : undefined}
                        >
                          <span
                            lang="ar"
                            dir="rtl"
                            className="root-concordance__arabic arabic"
                          >
                            {occ.textUthmani}
                          </span>
                          <span className="root-concordance__ref latin">
                            {occ.surahId}:{occ.verseNumber}:{occ.position}
                          </span>
                        </Link>
                      );
                    })}

                    {rootOccurrenceCount > rootOccurrences.length && word.root && (
                      <Link
                        href={`/dictionary/root/${encodeURIComponent(word.root.lettersBuckwalter)}`}
                        className="root-concordance__more latin"
                      >
                        View all {rootOccurrenceCount.toLocaleString()} occurrences →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ── Back to verse ─────────────────────────────────────────────── */}
          <nav aria-label="Word navigation" className="flex justify-start">
            <Link
              href={verseUrl}
              className="verse-nav-btn latin"
            >
              ← Back to verse {surahNum}:{verseNum}
            </Link>
          </nav>

        </div>
      </main>
      <BottomNav />
    </>
  );
}
