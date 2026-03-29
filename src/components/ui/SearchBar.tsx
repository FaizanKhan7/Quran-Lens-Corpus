"use client";

/**
 * SearchBar — unified search input with autocomplete (spec §10.4)
 *
 * - Mode tabs: Text | Root | Morphological
 * - Debounced autocomplete after 2+ chars (250ms)
 * - Keyboard navigation: ArrowUp / ArrowDown / Enter / Escape
 * - RTL-friendly: dir="auto" on input, Arabic in suggestions
 * - Click outside closes dropdown
 * - Navigate suggestions → word detail page (text) or search page (root)
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { POSBadge } from "@/components/ui/POSBadge";

// ─── Types ────────────────────────────────────────────────────────────────────

type SearchType = "text" | "root" | "morphological";

interface TextSuggestion {
  id:              string;
  textUthmani:     string;
  transliteration: string;
  translation:     string;
  surahId:         number;
  verseNumber:     number;
  position:        number;
  surahNameSimple: string;
  posTag:          string | null;
}

interface RootSuggestion {
  id:               string;
  lettersArabic:    string;
  lettersBuckwalter: string;
  frequency:        number;
}

type Suggestion = TextSuggestion | RootSuggestion;

function isTextSuggestion(s: Suggestion): s is TextSuggestion {
  return "textUthmani" in s;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface SearchBarProps {
  defaultQuery?: string;
  defaultType?:  SearchType;
}

const TYPE_LABELS: Record<SearchType, string> = {
  text:          "Text",
  root:          "Root",
  morphological: "Morphological",
};

const PLACEHOLDER: Record<SearchType, string> = {
  text:          "Search Arabic, transliteration, or English…",
  root:          "Enter root letters (Arabic or Buckwalter)…",
  morphological: "Use filters below to search morphology…",
};

export function SearchBar({ defaultQuery = "", defaultType = "text" }: SearchBarProps) {
  const router = useRouter();

  const [query,       setQuery]       = useState(defaultQuery);
  const [type,        setType]        = useState<SearchType>(defaultType);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [highlighted, setHighlighted] = useState(-1);

  const inputRef      = useRef<HTMLInputElement>(null);
  const containerRef  = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Close dropdown on outside click ───────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Sync props → state when navigating ────────────────────────────────────
  useEffect(() => { setQuery(defaultQuery); }, [defaultQuery]);
  useEffect(() => { setType(defaultType);   }, [defaultType]);

  // ── Debounced autocomplete fetch ───────────────────────────────────────────
  const fetchSuggestions = useCallback(
    (q: string, t: SearchType) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      if (q.length < 2 || t === "morphological") {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      debounceTimer.current = setTimeout(async () => {
        setLoading(true);
        try {
          const res  = await fetch(
            `/api/v1/search/autocomplete?q=${encodeURIComponent(q)}&type=${t}`,
          );
          const json = await res.json();
          const s: Suggestion[] = json?.data?.suggestions ?? [];
          setSuggestions(s);
          setShowDropdown(s.length > 0);
          setHighlighted(-1);
        } catch {
          setSuggestions([]);
          setShowDropdown(false);
        } finally {
          setLoading(false);
        }
      }, 250);
    },
    [],
  );

  // ── Input change ───────────────────────────────────────────────────────────
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQuery(v);
    fetchSuggestions(v, type);
  }

  // ── Tab change ─────────────────────────────────────────────────────────────
  function handleTypeChange(t: SearchType) {
    setType(t);
    setSuggestions([]);
    setShowDropdown(false);
    setHighlighted(-1);
    if (query.length >= 2) fetchSuggestions(query, t);
    // Update URL to reflect new type (preserve current query if any)
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}&type=${t}`);
    } else if (t === "morphological") {
      router.push(`/search?type=morphological`);
    }
  }

  // ── Keyboard navigation ────────────────────────────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, -1));
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setHighlighted(-1);
    } else if (e.key === "Enter" && highlighted >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[highlighted]);
    }
  }

  // ── Suggestion selection ───────────────────────────────────────────────────
  function selectSuggestion(s: Suggestion) {
    setShowDropdown(false);
    setHighlighted(-1);
    if (isTextSuggestion(s)) {
      router.push(`/surah/${s.surahId}/verse/${s.verseNumber}/word/${s.position}`);
    } else {
      // Root — navigate to search page with root query
      setQuery(s.lettersBuckwalter);
      router.push(
        `/search?q=${encodeURIComponent(s.lettersBuckwalter)}&type=root`,
      );
    }
  }

  // ── Form submit ────────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setShowDropdown(false);
    const q = query.trim();
    if (type === "morphological") {
      router.push("/search?type=morphological");
    } else if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}&type=${type}`);
    }
  }

  const hasDropdown = showDropdown && suggestions.length > 0;

  return (
    <div ref={containerRef} className="search-bar" dir="ltr">

      {/* ── Mode tabs ──────────────────────────────────────────────────── */}
      <div className="search-bar__tabs" role="tablist" aria-label="Search type">
        {(["text", "root", "morphological"] as SearchType[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={type === t}
            className={`search-bar__tab${type === t ? " search-bar__tab--active" : ""}`}
            onClick={() => handleTypeChange(t)}
            type="button"
          >
            {/* Full label on ≥ 400px, abbreviated on smaller screens */}
            <span className="search-bar__tab-label-full">{TYPE_LABELS[t]}</span>
            <span className="search-bar__tab-label-short" aria-hidden="true">
              {t === "morphological" ? "Morph." : TYPE_LABELS[t]}
            </span>
          </button>
        ))}
      </div>

      {/* ── Input ──────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} role="search" aria-label="Search Quran">
        <div className="search-bar__input-wrap">
          <input
            ref={inputRef}
            id="search-input"
            type="search"
            dir="auto"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
            placeholder={PLACEHOLDER[type]}
            disabled={type === "morphological"}
            className="search-bar__input"
            aria-label={PLACEHOLDER[type]}
            aria-autocomplete="list"
            aria-controls={hasDropdown ? "search-suggestions" : undefined}
            aria-activedescendant={
              highlighted >= 0 ? `suggestion-${highlighted}` : undefined
            }
          />
          {loading && <span className="search-bar__spinner" aria-hidden="true" />}
        </div>

        {/* ── Autocomplete dropdown ────────────────────────────────────── */}
        {hasDropdown && (
          <ul
            id="search-suggestions"
            className="search-bar__dropdown"
            role="listbox"
            aria-label="Suggestions"
          >
            {suggestions.map((s, i) => (
              <li
                key={isTextSuggestion(s) ? s.id : s.id}
                id={`suggestion-${i}`}
                role="option"
                aria-selected={highlighted === i}
                className={`search-bar__suggestion${highlighted === i ? " search-bar__suggestion--highlighted" : ""}`}
                onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s); }}
                onMouseEnter={() => setHighlighted(i)}
              >
                {isTextSuggestion(s) ? (
                  <TextSuggestionRow s={s} />
                ) : (
                  <RootSuggestionRow s={s} />
                )}
              </li>
            ))}
          </ul>
        )}
      </form>
    </div>
  );
}

// ─── Suggestion Row Sub-components ───────────────────────────────────────────

function TextSuggestionRow({ s }: { s: TextSuggestion }) {
  return (
    <span className="search-bar__suggestion-inner">
      <span
        lang="ar"
        dir="rtl"
        className="search-bar__suggestion-arabic"
      >
        {s.textUthmani}
      </span>
      <span className="search-bar__suggestion-details">
        <span className="search-bar__suggestion-translit">{s.transliteration}</span>
        <span className="search-bar__suggestion-gloss">{s.translation}</span>
      </span>
      <span className="search-bar__suggestion-badges">
        <span className="search-bar__suggestion-location">
          {s.surahId}:{s.verseNumber}
        </span>
        {s.posTag && <POSBadge tag={s.posTag} showTooltip={false} />}
      </span>
    </span>
  );
}

function RootSuggestionRow({ s }: { s: RootSuggestion }) {
  return (
    <span className="search-bar__suggestion-inner">
      <span
        lang="ar"
        dir="rtl"
        className="search-bar__suggestion-arabic search-bar__suggestion-arabic--root"
      >
        {s.lettersArabic}
      </span>
      <span className="search-bar__suggestion-details">
        <span className="search-bar__suggestion-translit bidi-isolate">
          {s.lettersBuckwalter}
        </span>
      </span>
      <span className="search-bar__suggestion-badges">
        <span className="search-bar__suggestion-freq">
          ×{s.frequency.toLocaleString()}
        </span>
      </span>
    </span>
  );
}
