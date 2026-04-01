/**
 * es-indices.ts — Elasticsearch index settings and mappings for Quran Lens.
 *
 * Three indices:
 *   quran-words-v1   Primary search surface — one document per Quranic word
 *   quran-roots-v1   Root concordance — one document per trilateral root
 *   quran-verses-v1  Verse-level full-text search
 *
 * Arabic analyzer pipeline:
 *   standard tokenizer → arabic_normalization → lowercase
 *   (no aggressive stemming — Quranic Arabic needs precise root-form matches)
 *
 * search_as_you_type fields (n-gram prefix matching) for autocomplete on:
 *   textUthmani, transliteration, translation, lettersArabic
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MappingProperty = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IndicesIndexSettings = Record<string, any>;

// ─── Shared analyzer settings ─────────────────────────────────────────────────

const ARABIC_SETTINGS: IndicesIndexSettings = {
  analysis: {
    analyzer: {
      arabic_quran: {
        type:        "custom",
        tokenizer:   "standard",
        filter:      ["arabic_normalization", "lowercase"],
      },
      arabic_quran_search: {
        type:        "custom",
        tokenizer:   "standard",
        filter:      ["arabic_normalization", "lowercase"],
      },
      // Latin analyzer for transliteration + English translation
      latin_search: {
        type:        "custom",
        tokenizer:   "standard",
        filter:      ["lowercase", "asciifolding"],
      },
    },
  },
};

// ─── quran-words-v1 ───────────────────────────────────────────────────────────

export const WORDS_SETTINGS = ARABIC_SETTINGS;

export const WORDS_MAPPINGS: Record<string, MappingProperty> = {
  // Identity
  id:              { type: "keyword" },
  surahId:         { type: "integer" },
  verseNumber:     { type: "integer" },
  position:        { type: "integer" },
  surahNameSimple: { type: "keyword" },

  // Arabic text — primary search field
  textUthmani: {
    type:     "text",
    analyzer: "arabic_quran",
    search_analyzer: "arabic_quran_search",
    fields: {
      // Autocomplete via search_as_you_type (prefix-tree n-grams)
      suggest: { type: "search_as_you_type", analyzer: "arabic_quran" } as MappingProperty,
      // Exact keyword for aggregations / dedup
      raw:     { type: "keyword" } as MappingProperty,
    },
  },

  // Latin fields
  transliteration: {
    type:     "text",
    analyzer: "latin_search",
    fields: {
      suggest: { type: "search_as_you_type", analyzer: "latin_search" } as MappingProperty,
      raw:     { type: "keyword" } as MappingProperty,
    },
  },
  translation: {
    type:     "text",
    analyzer: "latin_search",
    fields: {
      suggest: { type: "search_as_you_type", analyzer: "latin_search" } as MappingProperty,
    },
  },

  // Morphological filter fields (keyword — exact match)
  posTag:          { type: "keyword" },
  rootBuckwalter:  { type: "keyword" },
  lemmaBuckwalter: { type: "keyword" },
  verbAspect:  { type: "keyword" },
  verbMood:    { type: "keyword" },
  verbVoice:   { type: "keyword" },
  verbForm:    { type: "keyword" },
  gramCase:    { type: "keyword" },
  gramState:   { type: "keyword" },
  person:      { type: "keyword" },
  gender:      { type: "keyword" },
  number:      { type: "keyword" },
};

// ─── quran-roots-v1 ───────────────────────────────────────────────────────────

export const ROOTS_SETTINGS = ARABIC_SETTINGS;

export const ROOTS_MAPPINGS: Record<string, MappingProperty> = {
  id:               { type: "integer" },
  lettersBuckwalter: { type: "keyword" },
  lettersArabic: {
    type:     "text",
    analyzer: "arabic_quran",
    fields: {
      suggest: { type: "search_as_you_type", analyzer: "arabic_quran" } as MappingProperty,
      raw:     { type: "keyword" } as MappingProperty,
    },
  },
  frequency: { type: "integer" },
};

// ─── quran-verses-v1 ─────────────────────────────────────────────────────────

export const VERSES_SETTINGS = ARABIC_SETTINGS;

export const VERSES_MAPPINGS: Record<string, MappingProperty> = {
  id:              { type: "keyword" },
  surahId:         { type: "integer" },
  verseNumber:     { type: "integer" },
  surahNameSimple: { type: "keyword" },
  textUthmani: {
    type:     "text",
    analyzer: "arabic_quran",
    search_analyzer: "arabic_quran_search",
    fields: {
      raw: { type: "keyword" } as MappingProperty,
    },
  },
  textSimple: {
    type:     "text",
    analyzer: "arabic_quran",
    search_analyzer: "arabic_quran_search",
  },
};
