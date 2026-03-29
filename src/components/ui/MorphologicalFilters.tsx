"use client";

/**
 * MorphologicalFilters — Filter constructor for morphological search (spec §10.5)
 *
 * Features:
 *  - Pending-filter state: UI builds a filter set before applying
 *  - Live result count — debounced fetch from /api/v1/search/morph-count
 *  - "Show N results" Apply button
 *  - Active filter chips row — each chip is removable (×)
 *  - Grouped sections: Part of Speech | Verbal | Agreement | Nominal
 *  - Mood (IND/SUBJ/JUS) and Form (I–X) filters exposed
 *  - Mobile full-screen modal with sticky Apply button
 *  - Filter state stored in URL for sharing
 */

import {
  useState, useEffect, useCallback, useRef,
} from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

// ─── Filter options ────────────────────────────────────────────────────────────

const POS_OPTIONS = [
  { value: "N",    label: "N — Noun" },
  { value: "PN",   label: "PN — Proper Noun" },
  { value: "ADJ",  label: "ADJ — Adjective" },
  { value: "IMPN", label: "IMPN — Imperative Verbal Noun" },
  { value: "PRON", label: "PRON — Personal Pronoun" },
  { value: "DEM",  label: "DEM — Demonstrative" },
  { value: "REL",  label: "REL — Relative Pronoun" },
  { value: "T",    label: "T — Time Adverb" },
  { value: "LOC",  label: "LOC — Location Adverb" },
  { value: "V",    label: "V — Verb" },
  { value: "P",    label: "P — Preposition" },
  { value: "CONJ", label: "CONJ — Conjunction" },
  { value: "NEG",  label: "NEG — Negative" },
  { value: "INTG", label: "INTG — Interrogative" },
  { value: "FUT",  label: "FUT — Future" },
  { value: "CERT", label: "CERT — Certainty" },
  { value: "EMPH", label: "EMPH — Emphatic lām" },
  { value: "IMPV", label: "IMPV — Imperative lām" },
  { value: "PRP",  label: "PRP — Purpose lām" },
  { value: "SUB",  label: "SUB — Subordinating Conj." },
  { value: "ACC",  label: "ACC — Accusative Particle" },
  { value: "AMD",  label: "AMD — Amendment" },
  { value: "ANS",  label: "ANS — Answer" },
  { value: "AVR",  label: "AVR — Aversion" },
  { value: "CAUS", label: "CAUS — Cause" },
  { value: "CIRC", label: "CIRC — Circumstantial" },
  { value: "COM",  label: "COM — Comitative" },
  { value: "COND", label: "COND — Conditional" },
  { value: "EQ",   label: "EQ — Equalization" },
  { value: "EXH",  label: "EXH — Exhortation" },
  { value: "EXL",  label: "EXL — Explanation" },
  { value: "EXP",  label: "EXP — Exceptive" },
  { value: "INC",  label: "INC — Inceptive" },
  { value: "INT",  label: "INT — Interpretation" },
  { value: "PREV", label: "PREV — Preventive" },
  { value: "PRO",  label: "PRO — Prohibition" },
  { value: "REM",  label: "REM — Resumption" },
  { value: "RES",  label: "RES — Restriction" },
  { value: "RET",  label: "RET — Retraction" },
  { value: "RSLT", label: "RSLT — Result" },
  { value: "SUP",  label: "SUP — Supplemental" },
  { value: "SUR",  label: "SUR — Surprise" },
  { value: "VOC",  label: "VOC — Vocative" },
  { value: "INL",  label: "INL — Quranic Initials" },
];

const ASPECT_OPTIONS = [
  { value: "PERF", label: "PERF — Perfect" },
  { value: "IMPF", label: "IMPF — Imperfect" },
  { value: "IMPV", label: "IMPV — Imperative" },
];

const MOOD_OPTIONS = [
  { value: "IND",  label: "IND — Indicative" },
  { value: "SUBJ", label: "SUBJ — Subjunctive" },
  { value: "JUS",  label: "JUS — Jussive" },
];

const VOICE_OPTIONS = [
  { value: "ACT",  label: "ACT — Active" },
  { value: "PASS", label: "PASS — Passive" },
];

const FORM_OPTIONS = [
  { value: "I",    label: "Form I"    },
  { value: "II",   label: "Form II"   },
  { value: "III",  label: "Form III"  },
  { value: "IV",   label: "Form IV"   },
  { value: "V",    label: "Form V"    },
  { value: "VI",   label: "Form VI"   },
  { value: "VII",  label: "Form VII"  },
  { value: "VIII", label: "Form VIII" },
  { value: "IX",   label: "Form IX"   },
  { value: "X",    label: "Form X"    },
];

const PERSON_OPTIONS = [
  { value: "1", label: "1st Person" },
  { value: "2", label: "2nd Person" },
  { value: "3", label: "3rd Person" },
];

const GENDER_OPTIONS = [
  { value: "M", label: "M — Masculine" },
  { value: "F", label: "F — Feminine" },
];

const NUMBER_OPTIONS = [
  { value: "S", label: "S — Singular" },
  { value: "D", label: "D — Dual" },
  { value: "P", label: "P — Plural" },
];

const CASE_OPTIONS = [
  { value: "NOM", label: "NOM — Nominative (مرفوع)" },
  { value: "ACC", label: "ACC — Accusative (منصوب)" },
  { value: "GEN", label: "GEN — Genitive (مجرور)" },
];

const STATE_OPTIONS = [
  { value: "DEF",   label: "DEF — Definite (معرفة)" },
  { value: "INDEF", label: "INDEF — Indefinite (نكرة)" },
];

// Short display labels for chips
const CHIP_LABELS: Record<string, Record<string, string>> = {
  pos:    Object.fromEntries(POS_OPTIONS.map((o) => [o.value, o.value])),
  aspect: Object.fromEntries(ASPECT_OPTIONS.map((o) => [o.value, o.value])),
  mood:   Object.fromEntries(MOOD_OPTIONS.map((o) => [o.value, o.value])),
  voice:  Object.fromEntries(VOICE_OPTIONS.map((o) => [o.value, o.value])),
  form:   Object.fromEntries(FORM_OPTIONS.map((o) => [o.value, `Form ${o.value}`])),
  person: { "1": "1st", "2": "2nd", "3": "3rd" },
  gender: { M: "Masc.", F: "Fem." },
  number: { S: "Sing.", D: "Dual", P: "Plural" },
  case:   { NOM: "NOM", ACC: "ACC", GEN: "GEN" },
  state:  { DEF: "DEF", INDEF: "INDEF" },
};

const GROUP_LABEL: Record<string, string> = {
  pos: "POS", aspect: "Aspect", mood: "Mood", voice: "Voice", form: "Form",
  person: "Person", gender: "Gender", number: "Number", case: "Case", state: "State",
};

const ALL_KEYS = [
  "pos", "aspect", "mood", "voice", "form",
  "person", "gender", "number", "case", "state",
] as const;

type FilterKey = (typeof ALL_KEYS)[number];
type Filters   = Partial<Record<FilterKey, string>>;

function filtersToParams(f: Filters): URLSearchParams {
  const p = new URLSearchParams();
  p.set("type", "morphological");
  ALL_KEYS.forEach((k) => { if (f[k]) p.set(k, f[k]!); });
  return p;
}

// ─── FilterSelect ─────────────────────────────────────────────────────────────

interface FilterSelectProps {
  label:    string;
  name:     FilterKey;
  options:  { value: string; label: string }[];
  value:    string;
  onChange: (name: FilterKey, value: string) => void;
}

function FilterSelect({ label, name, options, value, onChange }: FilterSelectProps) {
  return (
    <div className="mf-select">
      <label htmlFor={`mf-${name}`} className="mf-select__label latin">
        {label}
      </label>
      <select
        id={`mf-${name}`}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        className={`mf-select__control latin${value ? " mf-select__control--active" : ""}`}
      >
        <option value="">Any</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── MorphologicalFilters ─────────────────────────────────────────────────────

interface MorphologicalFiltersProps {
  filters:      Record<string, string>;
  onChange:     (filters: Record<string, string>) => void;
  resultCount?: number;
}

export function MorphologicalFilters({
  filters: appliedFilters,
  resultCount,
}: MorphologicalFiltersProps) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  // Local pending state — user builds filters here before Apply
  const [pending, setPending] = useState<Filters>(() => {
    const init: Filters = {};
    ALL_KEYS.forEach((k) => { const v = appliedFilters[k]; if (v) init[k] = v; });
    return init;
  });

  const [liveCount,    setLiveCount]    = useState<number | null>(resultCount ?? null);
  const [countLoading, setCountLoading] = useState(false);
  const [modalOpen,    setModalOpen]    = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync pending from URL when navigating back/forward
  useEffect(() => {
    const synced: Filters = {};
    ALL_KEYS.forEach((k) => { const v = searchParams.get(k); if (v) synced[k] = v; });
    setPending(synced);
    setLiveCount(resultCount ?? null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  // Debounced live count fetch
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const hasAny = ALL_KEYS.some((k) => Boolean(pending[k]));
    if (!hasAny) {
      setLiveCount(null);
      setCountLoading(false);
      return;
    }

    setCountLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const params = filtersToParams(pending);
        const res  = await fetch(`/api/v1/search/morph-count?${params.toString()}`);
        const json = await res.json();
        setLiveCount(json?.data?.count ?? null);
      } catch {
        // keep previous count on error
      } finally {
        setCountLoading(false);
      }
    }, 350);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(pending)]);

  const handleChange = useCallback((name: FilterKey, value: string) => {
    setPending((prev) => {
      const next = { ...prev };
      if (value) { next[name] = value; } else { delete next[name]; }
      return next;
    });
  }, []);

  const handleApply = useCallback(() => {
    const params = filtersToParams(pending);
    router.push(`${pathname}?${params.toString()}`);
    setModalOpen(false);
  }, [pending, pathname, router]);

  const handleClearAll = useCallback(() => {
    setPending({});
    setLiveCount(null);
    router.push(`${pathname}?type=morphological`);
    setModalOpen(false);
  }, [pathname, router]);

  const removeChip = useCallback((key: FilterKey) => {
    setPending((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const activeKeys  = ALL_KEYS.filter((k) => Boolean(pending[k]));
  const hasFilters  = activeKeys.length > 0;

  const hasUnapplied = ALL_KEYS.some((k) => (appliedFilters[k] ?? "") !== (pending[k] ?? ""));

  const applyLabel = countLoading
    ? "Calculating…"
    : liveCount !== null
      ? `Show ${liveCount.toLocaleString()} result${liveCount !== 1 ? "s" : ""}`
      : hasFilters
        ? "Apply filters"
        : "Select at least one filter";

  // ── Reusable filter panel ────────────────────────────────────────────────
  const filterSections = (
    <div className="mf-sections">
      {/* Active chips */}
      {activeKeys.length > 0 && (
        <div className="mf-chips" role="group" aria-label="Active filters">
          {activeKeys.map((k) => (
            <span key={k} className="mf-chip latin">
              <span className="mf-chip__key">{GROUP_LABEL[k]}</span>
              <span className="mf-chip__val">
                {CHIP_LABELS[k]?.[pending[k]!] ?? pending[k]}
              </span>
              <button
                type="button"
                className="mf-chip__remove"
                onClick={() => removeChip(k)}
                aria-label={`Remove ${GROUP_LABEL[k]} filter`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* POS */}
      <div className="mf-section">
        <h3 className="mf-section__heading latin">Part of Speech</h3>
        <div className="mf-section__row">
          <FilterSelect label="POS" name="pos" options={POS_OPTIONS}
            value={pending.pos ?? ""} onChange={handleChange} />
        </div>
      </div>

      {/* Verbal */}
      <div className="mf-section">
        <h3 className="mf-section__heading latin">Verbal Features</h3>
        <div className="mf-section__row">
          <FilterSelect label="Aspect" name="aspect" options={ASPECT_OPTIONS}
            value={pending.aspect ?? ""} onChange={handleChange} />
          <FilterSelect label="Mood" name="mood" options={MOOD_OPTIONS}
            value={pending.mood ?? ""} onChange={handleChange} />
          <FilterSelect label="Voice" name="voice" options={VOICE_OPTIONS}
            value={pending.voice ?? ""} onChange={handleChange} />
          <FilterSelect label="Form" name="form" options={FORM_OPTIONS}
            value={pending.form ?? ""} onChange={handleChange} />
        </div>
      </div>

      {/* Agreement */}
      <div className="mf-section">
        <h3 className="mf-section__heading latin">Agreement</h3>
        <div className="mf-section__row">
          <FilterSelect label="Person" name="person" options={PERSON_OPTIONS}
            value={pending.person ?? ""} onChange={handleChange} />
          <FilterSelect label="Gender" name="gender" options={GENDER_OPTIONS}
            value={pending.gender ?? ""} onChange={handleChange} />
          <FilterSelect label="Number" name="number" options={NUMBER_OPTIONS}
            value={pending.number ?? ""} onChange={handleChange} />
        </div>
      </div>

      {/* Nominal */}
      <div className="mf-section">
        <h3 className="mf-section__heading latin">Nominal Features</h3>
        <div className="mf-section__row">
          <FilterSelect label="Case" name="case" options={CASE_OPTIONS}
            value={pending.case ?? ""} onChange={handleChange} />
          <FilterSelect label="State" name="state" options={STATE_OPTIONS}
            value={pending.state ?? ""} onChange={handleChange} />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Inline filter constructor (desktop/tablet) ───────────────────── */}
      <div className="mf-root">
        {/* Header */}
        <div className="mf-header">
          <span className="mf-header__title latin">Morphological Filters</span>
          <div className="mf-header__actions">
            {hasUnapplied && hasFilters && (
              <span className="mf-header__unsaved latin" aria-live="polite">
                Unsaved changes
              </span>
            )}
            {/* Mobile trigger */}
            <button
              type="button"
              className="mf-open-modal latin"
              onClick={() => setModalOpen(true)}
            >
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
                <path d="M0 1h14M2 5h10M4 9h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              {hasFilters ? `Filters · ${activeKeys.length}` : "Filters"}
            </button>
          </div>
        </div>

        {/* Sections — hidden on mobile (modal is used instead) */}
        <div className="mf-inline-body">
          {filterSections}
        </div>

        {/* Footer — apply */}
        <div className="mf-footer">
          <button
            type="button"
            onClick={handleApply}
            disabled={!hasFilters || countLoading}
            className={`mf-apply latin${!hasFilters ? " mf-apply--disabled" : ""}${hasUnapplied && hasFilters ? " mf-apply--highlight" : ""}`}
          >
            {countLoading && <span className="mf-apply__spinner" aria-hidden="true" />}
            {applyLabel}
            {hasFilters && !countLoading && <span aria-hidden="true"> →</span>}
          </button>
          {hasFilters && (
            <button
              type="button"
              onClick={handleClearAll}
              className="mf-clear-link latin"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* ── Mobile full-screen modal ─────────────────────────────────────── */}
      {modalOpen && (
        <div
          className="mf-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Morphological filters"
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div className="mf-modal">
            <div className="mf-modal__header">
              <span className="mf-modal__title latin">Filters</span>
              <button
                type="button"
                className="mf-modal__close"
                onClick={() => setModalOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="mf-modal__body">
              {filterSections}
            </div>
            <div className="mf-modal__footer">
              <button
                type="button"
                onClick={handleClearAll}
                className="mf-clear-link latin"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={!hasFilters || countLoading}
                className="mf-apply latin"
              >
                {countLoading && <span className="mf-apply__spinner" aria-hidden="true" />}
                {applyLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
