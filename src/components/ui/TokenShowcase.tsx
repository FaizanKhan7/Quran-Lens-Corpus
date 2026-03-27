/**
 * TokenShowcase
 * ─────────────────────────────────────────────────────────────────────────────
 * Visual reference for the entire design token system.
 * Rendered at /design-tokens for development verification.
 *
 * Sections:
 *   1. POS Color System (triple encoding)
 *   2. Surface & Text tokens
 *   3. Typography scale (Arabic + Latin)
 *   4. Spacing scale
 *   5. Border radius scale
 *   6. Motion tokens
 *   7. Shadow/elevation scale
 */

import { POSBadge, PhraseBadge, HiddenNodeBadge } from "@/components/ui/POSBadge";
import type { POSTag } from "@/types/corpus";

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12" dir="ltr">
      <h2 className="latin text-xs font-semibold tracking-widest uppercase text-text-tertiary mb-4 pb-2 border-b border-border-subtle">
        {title}
      </h2>
      {children}
    </section>
  );
}

// ─── Color swatch ─────────────────────────────────────────────────────────────

function Swatch({ label, cssVar, textVar }: { label: string; cssVar: string; textVar?: string }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <div
        className="h-12 w-full rounded-[var(--primitive-radius-4)] border border-border-subtle"
        style={{ backgroundColor: `var(${cssVar})` }}
      />
      <span className="latin text-[11px] text-text-tertiary truncate">{label}</span>
      <span className="latin text-[10px] text-text-disabled font-mono truncate">{cssVar}</span>
      {textVar && (
        <span className="latin text-[10px] text-text-disabled font-mono truncate">{textVar}</span>
      )}
    </div>
  );
}

// ─── POS badge row ────────────────────────────────────────────────────────────

const ALL_POS_TAGS: { tag: POSTag; label: string }[] = [
  { tag: "N",    label: "Noun" },
  { tag: "PN",   label: "Proper Noun" },
  { tag: "ADJ",  label: "Adjective" },
  { tag: "IMPN", label: "Imp. Verbal Noun" },
  { tag: "PRON", label: "Pronoun" },
  { tag: "DEM",  label: "Demonstrative" },
  { tag: "REL",  label: "Relative" },
  { tag: "T",    label: "Time Adverb" },
  { tag: "LOC",  label: "Location Adverb" },
  { tag: "V",    label: "Verb" },
  { tag: "P",    label: "Preposition" },
  { tag: "CONJ", label: "Conjunction" },
  { tag: "NEG",  label: "Negative" },
  { tag: "COND", label: "Conditional" },
  { tag: "INTG", label: "Interrogative" },
  { tag: "FUT",  label: "Future" },
  { tag: "VOC",  label: "Vocative" },
  { tag: "EXP",  label: "Exceptive" },
  { tag: "SUB",  label: "Subordinating" },
  { tag: "ACC",  label: "Accusative" },
  { tag: "CERT", label: "Certainty" },
  { tag: "EMPH", label: "Emphatic" },
  { tag: "INL",  label: "Quranic Initial" },
];

// ─── Spacing swatch ───────────────────────────────────────────────────────────

const SPACING_TOKENS = [
  { label: "word-gap",     cssVar: "--token-space-word-gap",     note: "8px — between words" },
  { label: "card-padding", cssVar: "--token-space-card-padding", note: "16px — card padding" },
  { label: "verse-gap",    cssVar: "--token-space-verse-gap",    note: "24px — between verses" },
  { label: "section-gap",  cssVar: "--token-space-section-gap",  note: "32px — section spacing" },
  { label: "touch-min",    cssVar: "--token-space-touch-min",    note: "48px — min touch target" },
] as const;

// ─── Shadow swatch ────────────────────────────────────────────────────────────

const SHADOW_TOKENS = [
  { label: "shadow-card",    cssVar: "--token-shadow-card" },
  { label: "shadow-raised",  cssVar: "--token-shadow-raised" },
  { label: "shadow-overlay", cssVar: "--token-shadow-overlay" },
] as const;

// ─── Main component ───────────────────────────────────────────────────────────

export function TokenShowcase() {
  return (
    <div className="w-full max-w-content mx-auto px-card-padding py-section-gap" dir="ltr">
      <header className="mb-12">
        <p className="latin text-xs font-semibold tracking-widest uppercase text-text-tertiary mb-1">
          Design System
        </p>
        <h1 className="latin text-3xl font-bold text-text-primary mb-2">Token Reference</h1>
        <p className="latin text-text-secondary text-base max-w-prose">
          Three-tier architecture: Primitive → Semantic → Component.
          All tokens are CSS custom properties. This page shows the semantic layer.
        </p>
      </header>

      {/* 1. POS Color System */}
      <Section title="1. POS Color System — Triple Encoding (spec §8.3)">
        <p className="latin text-sm text-text-secondary mb-6">
          Every POS indicator uses color + text abbreviation + shape simultaneously.
          Never color alone — required for colorblindness accessibility (deuteranopia, protanopia, tritanopia).
        </p>

        <div className="mb-6">
          <h3 className="latin text-xs font-semibold text-text-tertiary mb-3">Nominal — Rectangle</h3>
          <div className="flex flex-wrap gap-2 mb-1">
            {ALL_POS_TAGS.filter(p => ["N","PN","ADJ","IMPN","PRON","DEM","REL","T","LOC"].includes(p.tag)).map(({ tag, label }) => (
              <div key={tag} className="flex flex-col items-center gap-1">
                <POSBadge tag={tag} />
                <span className="latin text-[10px] text-text-tertiary">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="latin text-xs font-semibold text-text-tertiary mb-3">Verbal — Rounded Rect</h3>
          <div className="flex flex-wrap gap-2">
            <div className="flex flex-col items-center gap-1">
              <POSBadge tag="V" />
              <span className="latin text-[10px] text-text-tertiary">Verb</span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="latin text-xs font-semibold text-text-tertiary mb-3">Particle — Pill / Capsule</h3>
          <div className="flex flex-wrap gap-2">
            {ALL_POS_TAGS.filter(p => ["P","CONJ","NEG","COND","INTG","FUT","VOC","EXP","SUB","ACC","CERT","EMPH"].includes(p.tag)).map(({ tag, label }) => (
              <div key={tag} className="flex flex-col items-center gap-1">
                <POSBadge tag={tag} />
                <span className="latin text-[10px] text-text-tertiary">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="latin text-xs font-semibold text-text-tertiary mb-3">Special — Diamond</h3>
          <div className="flex flex-wrap gap-2">
            <div className="flex flex-col items-center gap-1">
              <POSBadge tag="INL" />
              <span className="latin text-[10px] text-text-tertiary">Quranic Initial</span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="latin text-xs font-semibold text-text-tertiary mb-3">Phrase Nodes — Dashed</h3>
          <div className="flex flex-wrap gap-2">
            {["S","NS","VS","CS","PP","SC"].map(tag => (
              <div key={tag} className="flex flex-col items-center gap-1">
                <PhraseBadge tag={tag} />
                <span className="latin text-[10px] text-text-tertiary">{tag}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="latin text-xs font-semibold text-text-tertiary mb-3">Hidden / Pro-drop — Dotted</h3>
          <div className="flex flex-wrap gap-2">
            <div className="flex flex-col items-center gap-1">
              <HiddenNodeBadge />
              <span className="latin text-[10px] text-text-tertiary">(*) pro-drop</span>
            </div>
          </div>
        </div>
      </Section>

      {/* 2. Surface & Text Colors */}
      <Section title="2. Surface & Text Tokens">
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
          <Swatch label="surface-base"     cssVar="--token-surface-base" />
          <Swatch label="surface-raised"   cssVar="--token-surface-raised" />
          <Swatch label="surface-overlay"  cssVar="--token-surface-overlay" />
          <Swatch label="surface-sunken"   cssVar="--token-surface-sunken" />
          <Swatch label="surface-inverse"  cssVar="--token-surface-inverse" />
        </div>
        <div className="flex flex-col gap-2">
          {[
            { label: "text-primary",   cssVar: "--token-text-primary",   sample: "The quick brown fox — النص الرئيسي" },
            { label: "text-secondary", cssVar: "--token-text-secondary",  sample: "Secondary text — نص ثانوي" },
            { label: "text-tertiary",  cssVar: "--token-text-tertiary",   sample: "Tertiary / placeholder — نص ثالثي" },
            { label: "text-disabled",  cssVar: "--token-text-disabled",   sample: "Disabled state — معطل" },
          ].map(({ label, cssVar, sample }) => (
            <div key={label} className="flex items-center gap-4">
              <span className="latin text-[11px] font-mono text-text-tertiary w-36 shrink-0">{label}</span>
              <span style={{ color: `var(${cssVar})` }} className="latin text-sm">{sample}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* 3. Typography Scale */}
      <Section title="3. Typography Scale">
        <div className="mb-8">
          <h3 className="latin text-xs font-semibold text-text-tertiary mb-4">Arabic (Amiri font, min 18px, no bold/italic)</h3>
          <div className="flex flex-col gap-4" dir="rtl">
            {[
              { label: "--token-font-size-arabic-sm (16px)", cssVar: "--token-font-size-arabic-sm", sample: "بِسْمِ ٱللَّهِ" },
              { label: "--token-font-size-arabic-md (18px)", cssVar: "--token-font-size-arabic-md", sample: "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ" },
              { label: "--token-font-size-arabic-lg (24px)", cssVar: "--token-font-size-arabic-lg", sample: "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ" },
              { label: "--token-font-size-arabic-xl (32px)", cssVar: "--token-font-size-arabic-xl", sample: "ٱلْحَمْدُ لِلَّهِ" },
            ].map(({ label, cssVar, sample }) => (
              <div key={label} className="flex flex-col gap-1">
                <span
                  className="arabic"
                  lang="ar"
                  style={{ fontSize: `var(${cssVar})`, lineHeight: "var(--token-leading-arabic)" }}
                >
                  {sample}
                </span>
                <span className="latin text-[10px] text-text-tertiary font-mono" dir="ltr">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="latin text-xs font-semibold text-text-tertiary mb-4">Latin (Inter font, min 16px)</h3>
          <div className="flex flex-col gap-3">
            {[
              { label: "--token-font-size-latin-xs (11px)", cssVar: "--token-font-size-latin-xs", sample: "Part-of-speech labels, badge text" },
              { label: "--token-font-size-latin-sm (14px)", cssVar: "--token-font-size-latin-sm", sample: "Secondary text, captions, morphological detail" },
              { label: "--token-font-size-latin-md (16px)", cssVar: "--token-font-size-latin-md", sample: "Body copy, word glosses, search input" },
              { label: "--token-font-size-latin-lg (20px)", cssVar: "--token-font-size-latin-lg", sample: "Section headings, Surah titles" },
              { label: "--token-font-size-latin-xl (28px)", cssVar: "--token-font-size-latin-xl", sample: "Page headings, hero text" },
            ].map(({ label, cssVar, sample }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="latin" style={{ fontSize: `var(${cssVar})`, color: "var(--token-text-primary)" }}>
                  {sample}
                </span>
                <span className="latin text-[10px] text-text-tertiary font-mono">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* 4. Spacing Scale */}
      <Section title="4. Spacing Tokens (spec §8.5)">
        <div className="flex flex-col gap-3">
          {SPACING_TOKENS.map(({ label, cssVar, note }) => (
            <div key={label} className="flex items-center gap-4">
              <span className="latin text-[11px] font-mono text-text-tertiary w-32 shrink-0">{label}</span>
              <div
                className="bg-pos-verbal rounded-[var(--primitive-radius-2)] shrink-0"
                style={{ width: `var(${cssVar})`, height: "1.5rem" }}
              />
              <span className="latin text-xs text-text-tertiary">{note}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* 5. Shadow / Elevation */}
      <Section title="5. Shadow / Elevation Tokens">
        <div className="flex flex-wrap gap-6">
          {SHADOW_TOKENS.map(({ label, cssVar }) => (
            <div key={label} className="flex flex-col gap-2 items-center">
              <div
                className="w-24 h-16 rounded-[var(--primitive-radius-8)] bg-surface-raised"
                style={{ boxShadow: `var(${cssVar})` }}
              />
              <span className="latin text-[10px] font-mono text-text-tertiary">{label}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* 6. Motion */}
      <Section title="6. Motion Tokens">
        <div className="flex flex-wrap gap-4">
          {[
            { label: "duration-fast (100ms)",   cssVar: "--token-motion-fast" },
            { label: "duration-base (150ms)",   cssVar: "--token-motion-base" },
            { label: "duration-slow (200ms)",   cssVar: "--token-motion-slow" },
            { label: "duration-slower (300ms)", cssVar: "--primitive-duration-slower" },
          ].map(({ label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-pos-verbal" />
              <span className="latin text-sm text-text-secondary">{label}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* 7. Border Radius */}
      <Section title="7. Border Radius Scale">
        <div className="flex flex-wrap gap-4 items-end">
          {[
            { label: "2px",  cssVar: "--primitive-radius-2" },
            { label: "4px",  cssVar: "--primitive-radius-4" },
            { label: "8px",  cssVar: "--primitive-radius-8" },
            { label: "12px", cssVar: "--primitive-radius-12" },
            { label: "16px", cssVar: "--primitive-radius-16" },
            { label: "full", cssVar: "--primitive-radius-full" },
          ].map(({ label, cssVar }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div
                className="w-16 h-16 bg-surface-overlay border border-border-base"
                style={{ borderRadius: `var(${cssVar})` }}
              />
              <span className="latin text-[10px] font-mono text-text-tertiary">{label}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
