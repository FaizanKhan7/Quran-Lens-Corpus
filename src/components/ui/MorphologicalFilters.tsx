"use client";

/**
 * MorphologicalFilters — client component for morphological search filters.
 *
 * Shows select dropdowns for: POS, Aspect, Voice, Person, Gender, Number, Case, State.
 * Calls onChange with the updated filter map whenever a value changes.
 * "Clear all" resets to empty record.
 */

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

// ─── Filter definitions ───────────────────────────────────────────────────────

const POS_OPTIONS = [
  // Nominals
  { value: "N",    label: "N — Noun" },
  { value: "PN",   label: "PN — Proper Noun" },
  { value: "ADJ",  label: "ADJ — Adjective" },
  { value: "IMPN", label: "IMPN — Imperative Verbal Noun" },
  { value: "PRON", label: "PRON — Personal Pronoun" },
  { value: "DEM",  label: "DEM — Demonstrative Pronoun" },
  { value: "REL",  label: "REL — Relative Pronoun" },
  { value: "T",    label: "T — Time Adverb" },
  { value: "LOC",  label: "LOC — Location Adverb" },
  // Verbal
  { value: "V",    label: "V — Verb" },
  // Particles
  { value: "P",    label: "P — Preposition" },
  { value: "EMPH", label: "EMPH — Emphatic lām" },
  { value: "IMPV", label: "IMPV — Imperative lām" },
  { value: "PRP",  label: "PRP — Purpose lām" },
  { value: "CONJ", label: "CONJ — Coordinating Conjunction" },
  { value: "SUB",  label: "SUB — Subordinating Conjunction" },
  { value: "ACC",  label: "ACC — Accusative Particle" },
  { value: "AMD",  label: "AMD — Amendment" },
  { value: "ANS",  label: "ANS — Answer" },
  { value: "AVR",  label: "AVR — Aversion" },
  { value: "CAUS", label: "CAUS — Cause" },
  { value: "CERT", label: "CERT — Certainty" },
  { value: "CIRC", label: "CIRC — Circumstantial" },
  { value: "COM",  label: "COM — Comitative" },
  { value: "COND", label: "COND — Conditional" },
  { value: "EQ",   label: "EQ — Equalization" },
  { value: "EXH",  label: "EXH — Exhortation" },
  { value: "EXL",  label: "EXL — Explanation" },
  { value: "EXP",  label: "EXP — Exceptive" },
  { value: "FUT",  label: "FUT — Future" },
  { value: "INC",  label: "INC — Inceptive" },
  { value: "INT",  label: "INT — Interpretation" },
  { value: "INTG", label: "INTG — Interrogative" },
  { value: "NEG",  label: "NEG — Negative" },
  { value: "PREV", label: "PREV — Preventive" },
  { value: "PRO",  label: "PRO — Prohibition" },
  { value: "REM",  label: "REM — Resumption" },
  { value: "RES",  label: "RES — Restriction" },
  { value: "RET",  label: "RET — Retraction" },
  { value: "RSLT", label: "RSLT — Result" },
  { value: "SUP",  label: "SUP — Supplemental" },
  { value: "SUR",  label: "SUR — Surprise" },
  { value: "VOC",  label: "VOC — Vocative" },
  // Special
  { value: "INL",  label: "INL — Quranic Initials" },
];

const ASPECT_OPTIONS = [
  { value: "PERF", label: "PERF — Perfect" },
  { value: "IMPF", label: "IMPF — Imperfect" },
  { value: "IMPV", label: "IMPV — Imperative" },
];

const VOICE_OPTIONS = [
  { value: "ACT",  label: "ACT — Active" },
  { value: "PASS", label: "PASS — Passive" },
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

// ─── Component ────────────────────────────────────────────────────────────────

interface MorphologicalFiltersProps {
  filters:   Record<string, string>;
  onChange:  (filters: Record<string, string>) => void;
  resultCount?: number;
}

interface FilterSelectProps {
  label:    string;
  name:     string;
  options:  { value: string; label: string }[];
  value:    string;
  onChange: (name: string, value: string) => void;
}

function FilterSelect({ label, name, options, value, onChange }: FilterSelectProps) {
  return (
    <div className="search-filter-select">
      <label htmlFor={`filter-${name}`} className="search-filter-select__label">
        {label}
      </label>
      <select
        id={`filter-${name}`}
        name={name}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        className="search-filter-select__select"
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

export function MorphologicalFilters({
  filters,
  onChange,
  resultCount,
}: MorphologicalFiltersProps) {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  const hasActiveFilters = Object.values(filters).some(Boolean);

  const handleChange = useCallback(
    (name: string, value: string) => {
      const next = { ...filters, [name]: value };
      // Remove empty values
      Object.keys(next).forEach((k) => { if (!next[k]) delete next[k]; });
      onChange(next);

      // Update URL
      const params = new URLSearchParams(searchParams.toString());
      params.set("type", "morphological");
      // Reset all morph filter params
      ["pos", "aspect", "voice", "person", "gender", "number", "case", "state"].forEach(
        (k) => params.delete(k),
      );
      Object.entries(next).forEach(([k, v]) => { if (v) params.set(k, v); });
      router.push(`${pathname}?${params.toString()}`);
    },
    [filters, onChange, pathname, router, searchParams],
  );

  const handleClear = useCallback(() => {
    onChange({});
    const params = new URLSearchParams();
    params.set("type", "morphological");
    router.push(`${pathname}?${params.toString()}`);
  }, [onChange, pathname, router]);

  return (
    <div className="search-filters" dir="ltr">
      <div className="search-filters__header">
        <span className="search-filters__title">Morphological Filters</span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClear}
            className="search-filters__clear"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="search-filters__row">
        <FilterSelect
          label="POS"
          name="pos"
          options={POS_OPTIONS}
          value={filters.pos ?? ""}
          onChange={handleChange}
        />
        <FilterSelect
          label="Aspect"
          name="aspect"
          options={ASPECT_OPTIONS}
          value={filters.aspect ?? ""}
          onChange={handleChange}
        />
        <FilterSelect
          label="Voice"
          name="voice"
          options={VOICE_OPTIONS}
          value={filters.voice ?? ""}
          onChange={handleChange}
        />
        <FilterSelect
          label="Person"
          name="person"
          options={PERSON_OPTIONS}
          value={filters.person ?? ""}
          onChange={handleChange}
        />
        <FilterSelect
          label="Gender"
          name="gender"
          options={GENDER_OPTIONS}
          value={filters.gender ?? ""}
          onChange={handleChange}
        />
        <FilterSelect
          label="Number"
          name="number"
          options={NUMBER_OPTIONS}
          value={filters.number ?? ""}
          onChange={handleChange}
        />
        <FilterSelect
          label="Case"
          name="case"
          options={CASE_OPTIONS}
          value={filters.case ?? ""}
          onChange={handleChange}
        />
        <FilterSelect
          label="State"
          name="state"
          options={STATE_OPTIONS}
          value={filters.state ?? ""}
          onChange={handleChange}
        />
      </div>

      {resultCount !== undefined && (
        <p className="search-filters__count" dir="ltr">
          {hasActiveFilters
            ? `${resultCount.toLocaleString()} result${resultCount !== 1 ? "s" : ""}`
            : "Select filters to search"}
        </p>
      )}
    </div>
  );
}
