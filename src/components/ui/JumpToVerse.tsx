"use client";

/**
 * JumpToVerse — compact form that navigates to a verse number in-page.
 * Spec §11 F10: "Verse navigation (prev/next, jump-to)"
 *
 * Uses hash-based navigation (#verse-N) so the user stays on the surah
 * listing page. VerseAccordion listens for the hashchange event and opens
 * the matching accordion, scrolling it into view.
 */

import { useState, type FormEvent } from "react";

interface JumpToVerseProps {
  surahId:     number;
  versesCount: number;
}

export function JumpToVerse({ surahId: _surahId, versesCount }: JumpToVerseProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const n = parseInt(value, 10);
    if (!Number.isFinite(n) || n < 1 || n > versesCount) {
      setError(true);
      return;
    }
    setError(false);
    // Update the hash — triggers hashchange, which VerseAccordion listens for.
    // history.pushState preserves a back-navigation entry.
    const { pathname, search } = window.location;
    history.pushState(null, "", `${pathname}${search}#verse-${n}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="jump-to-verse"
      aria-label="Jump to verse"
    >
      <label
        htmlFor="jump-verse-input"
        className="jump-to-verse__label latin"
      >
        Jump to verse
      </label>
      <div className="jump-to-verse__controls">
        <input
          id="jump-verse-input"
          type="number"
          dir="auto"
          min={1}
          max={versesCount}
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(false); }}
          placeholder={`1–${versesCount}`}
          aria-invalid={error}
          aria-describedby={error ? "jump-verse-error" : undefined}
          className="jump-to-verse__input latin"
        />
        <button type="submit" className="jump-to-verse__btn latin">
          Go
        </button>
      </div>
      {error && (
        <p
          id="jump-verse-error"
          role="alert"
          className="jump-to-verse__error latin"
        >
          Enter a number between 1 and {versesCount}
        </p>
      )}
    </form>
  );
}
