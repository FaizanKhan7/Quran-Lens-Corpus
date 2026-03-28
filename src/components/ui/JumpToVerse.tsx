"use client";

/**
 * JumpToVerse — compact form that navigates directly to a verse number.
 * Spec §11 F10: "Verse navigation (prev/next, jump-to)"
 */

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

interface JumpToVerseProps {
  surahId:     number;
  versesCount: number;
}

export function JumpToVerse({ surahId, versesCount }: JumpToVerseProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const router = useRouter();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const n = parseInt(value, 10);
    if (!Number.isFinite(n) || n < 1 || n > versesCount) {
      setError(true);
      return;
    }
    setError(false);
    router.push(`/surah/${surahId}/verse/${n}`);
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
