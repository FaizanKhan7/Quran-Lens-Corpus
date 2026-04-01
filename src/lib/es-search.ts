/**
 * es-search.ts — Elasticsearch-backed search functions.
 *
 * Each function mirrors its Prisma counterpart in search-data.ts so the
 * search page can swap implementations transparently. Morphological search
 * stays on Postgres (exact keyword filters are equally fast there).
 *
 * All functions return null if ES is unavailable, letting the caller fall
 * back to the Prisma implementation.
 */

import { esClient, IDX_WORDS, IDX_ROOTS, IDX_VERSES } from "@/lib/elasticsearch";
import type { TextResult, RootResult, SearchPageData } from "@/lib/search-data";
import { isArabicScript } from "@/lib/api-helpers";

// ─── Suggestion types (ES autocomplete) ──────────────────────────────────────

export interface WordSuggestion {
  id:              string;
  textUthmani:     string;
  transliteration: string;
  translation:     string;
  surahId:         number;
  verseNumber:     number;
  position:        number;
  surahNameSimple: string;
  posTag:          string | null;
  score:           number;
}

export interface RootSuggestion {
  id:               number;
  lettersArabic:    string;
  lettersBuckwalter: string;
  frequency:        number;
}

// ─── Helper — map ES source to TextResult ─────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hitToTextResult(source: any): TextResult {
  return {
    wordId:          source.id,
    surahId:         source.surahId,
    verseNumber:     source.verseNumber,
    position:        source.position,
    textUthmani:     source.textUthmani,
    transliteration: source.transliteration ?? "",
    translation:     source.translation ?? "",
    posTag:          source.posTag ?? undefined,
    surahNameSimple: source.surahNameSimple ?? "",
  };
}

// ─── Text search ──────────────────────────────────────────────────────────────

/**
 * Full-text search across Arabic text, transliteration, and English translation.
 * Arabic queries are boosted against textUthmani; Latin queries are boosted
 * against transliteration and translation.
 */
export async function esSearchText(
  q:       string,
  page:    number,
  perPage: number,
): Promise<SearchPageData | null> {
  if (!esClient) return null;

  const from = (page - 1) * perPage;
  const arabic = isArabicScript(q);

  try {
    const res = await esClient.search({
      index: IDX_WORDS,
      from,
      size:  perPage,
      query: {
        bool: {
          should: arabic
            ? [
                // Primary: match Arabic text with higher boost
                { match: { textUthmani:     { query: q, boost: 4, fuzziness: "AUTO" } } },
                // Secondary: Arabic root/lemma
                { match: { rootArabic:      { query: q, boost: 2 } } },
                { match: { lemmaArabic:     { query: q, boost: 1.5 } } },
              ]
            : [
                // Latin query: transliteration + English translation
                { match: { transliteration: { query: q, boost: 3, fuzziness: "AUTO" } } },
                { match: { translation:     { query: q, boost: 2, fuzziness: "AUTO" } } },
                // Allow Buckwalter root match for research queries
                { term:  { rootBuckwalter:  { value: q.toLowerCase(), boost: 1.5 } } },
              ],
          minimum_should_match: 1,
        },
      },
      highlight: {
        fields: {
          textUthmani:    { number_of_fragments: 1 },
          transliteration: { number_of_fragments: 1 },
          translation:    { number_of_fragments: 1 },
        },
      },
      _source: [
        "id", "surahId", "verseNumber", "position",
        "textUthmani", "transliteration", "translation",
        "posTag", "surahNameSimple",
      ],
    });

    const total =
      typeof res.hits.total === "number"
        ? res.hits.total
        : (res.hits.total?.value ?? 0);

    const textResults = res.hits.hits.map((h) =>
      hitToTextResult(h._source as Record<string, unknown>)
    );

    return {
      type:        "text",
      query:       q,
      total,
      page,
      perPage,
      totalPages:  Math.ceil(total / perPage),
      textResults,
    };
  } catch (err) {
    console.error("[es-search] text search failed:", err);
    return null;
  }
}

// ─── Root search ──────────────────────────────────────────────────────────────

export async function esSearchRoot(
  q:       string,
  page:    number,
  perPage: number,
): Promise<SearchPageData | null> {
  if (!esClient) return null;

  const from = (page - 1) * perPage;

  try {
    const res = await esClient.search({
      index: IDX_ROOTS,
      from,
      size:  perPage,
      query: {
        bool: {
          should: [
            // Arabic input: match against Arabic letters field
            { match: { lettersArabic:    { query: q, boost: 3 } } },
            // Buckwalter input — case-sensitive (uppercase H, S, D, T, Z, E etc. are distinct)
            { term:   { lettersBuckwalter: { value: q, boost: 4 } } },
            { prefix: { lettersBuckwalter: { value: q, boost: 2 } } },
          ],
          minimum_should_match: 1,
        },
      },
      sort: [
        { _score: { order: "desc" } },
        { frequency: { order: "desc" } },
      ],
      _source: ["id", "lettersArabic", "lettersBuckwalter", "frequency"],
    });

    const total =
      typeof res.hits.total === "number"
        ? res.hits.total
        : (res.hits.total?.value ?? 0);

    const rootResults: RootResult[] = res.hits.hits.map((h) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s = h._source as any;
      return {
        id:               Number(s.id),
        lettersArabic:    s.lettersArabic,
        lettersBuckwalter: s.lettersBuckwalter,
        frequency:        s.frequency,
      };
    });

    return {
      type:       "root",
      query:      q,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
      rootResults,
    };
  } catch (err) {
    console.error("[es-search] root search failed:", err);
    return null;
  }
}

// ─── Autocomplete (search_as_you_type) ───────────────────────────────────────

export async function esAutocompleteWords(
  q: string,
  limit = 8,
): Promise<WordSuggestion[] | null> {
  if (!esClient) return null;

  const arabic = isArabicScript(q);

  try {
    const res = await esClient.search({
      index: IDX_WORDS,
      size:  limit,
      query: {
        multi_match: {
          query: q,
          type:  "bool_prefix",
          fields: arabic
            ? ["textUthmani", "textUthmani._2gram", "textUthmani._3gram"]
            : [
                "transliteration", "transliteration._2gram", "transliteration._3gram",
                "translation",     "translation._2gram",     "translation._3gram",
              ],
        },
      },
      _source: [
        "id", "surahId", "verseNumber", "position",
        "textUthmani", "transliteration", "translation",
        "posTag", "surahNameSimple",
      ],
    });

    return res.hits.hits.map((h) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s = h._source as any;
      return {
        id:              s.id,
        textUthmani:     s.textUthmani,
        transliteration: s.transliteration ?? "",
        translation:     s.translation ?? "",
        surahId:         s.surahId,
        verseNumber:     s.verseNumber,
        position:        s.position,
        surahNameSimple: s.surahNameSimple ?? "",
        posTag:          s.posTag ?? null,
        score:           h._score ?? 0,
      };
    });
  } catch (err) {
    console.error("[es-search] autocomplete words failed:", err);
    return null;
  }
}

export async function esAutocompleteRoots(
  q: string,
  limit = 8,
): Promise<RootSuggestion[] | null> {
  if (!esClient) return null;

  try {
    const res = await esClient.search({
      index: IDX_ROOTS,
      size:  limit,
      query: {
        multi_match: {
          query: q,
          type:  "bool_prefix",
          fields: [
            "lettersArabic", "lettersArabic._2gram", "lettersArabic._3gram",
          ],
        },
      },
      sort: [
        { _score: { order: "desc" } },
        { frequency: { order: "desc" } },
      ],
      _source: ["id", "lettersArabic", "lettersBuckwalter", "frequency"],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return res.hits.hits.map((h: any) => ({
      id:               Number(h._source.id),
      lettersArabic:    h._source.lettersArabic,
      lettersBuckwalter: h._source.lettersBuckwalter,
      frequency:        h._source.frequency,
    }));
  } catch (err) {
    console.error("[es-search] autocomplete roots failed:", err);
    return null;
  }
}

// ─── Verse full-text search (ES-only, not in Prisma layer) ───────────────────

export interface VerseSearchResult {
  id:          string;
  surahId:     number;
  verseNumber: number;
  surahNameSimple: string;
  textUthmani: string;
  highlight?:  string;
}

export async function esSearchVerses(
  q:       string,
  page:    number,
  perPage: number,
): Promise<{ results: VerseSearchResult[]; total: number } | null> {
  if (!esClient) return null;

  const from = (page - 1) * perPage;

  try {
    const res = await esClient.search({
      index: IDX_VERSES,
      from,
      size:  perPage,
      query: {
        multi_match: {
          query: q,
          fields:    ["textUthmani^2", "textSimple"],
          type:      "best_fields",
          fuzziness: "AUTO",
        },
      },
      highlight: {
        fields: { textUthmani: { number_of_fragments: 1, fragment_size: 200 } },
      },
      _source: ["id", "surahId", "verseNumber", "surahNameSimple", "textUthmani"],
    });

    const total =
      typeof res.hits.total === "number"
        ? res.hits.total
        : (res.hits.total?.value ?? 0);

    const results = res.hits.hits.map((h) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s = h._source as any;
      const hl = h.highlight?.textUthmani?.[0];
      return {
        id:          s.id,
        surahId:     s.surahId,
        verseNumber: s.verseNumber,
        surahNameSimple: s.surahNameSimple ?? "",
        textUthmani: s.textUthmani,
        highlight:   hl,
      };
    });

    return { results, total };
  } catch (err) {
    console.error("[es-search] verse search failed:", err);
    return null;
  }
}
