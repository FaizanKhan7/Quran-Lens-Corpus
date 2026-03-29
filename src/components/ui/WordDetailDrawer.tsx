"use client";

/**
 * WordDetailDrawer — Tier 3 bottom-sheet for word analysis (spec §10.1)
 *
 * Uses native <dialog> for top-layer rendering, focus-trap, and backdrop.
 * Mobile: slides up from bottom. Desktop: centered modal.
 *
 * Shows:
 *   - Full segment-by-segment breakdown with POS badge per segment
 *   - All morphological features (case, number, gender, person, aspect, etc.)
 *   - Root + lemma block
 *   - Link to Tier 4 full page
 */

import { useEffect, useRef } from "react";
import Link from "next/link";
import { POSBadge } from "@/components/ui/POSBadge";
import type { Word, Segment } from "@/types/corpus";

// ─── Feature label maps ───────────────────────────────────────────────────────

const CASE_LABEL: Record<string, string> = {
  NOM: "Nominative (marfūʿ)",
  ACC: "Accusative (manṣūb)",
  GEN: "Genitive (majrūr)",
};

const STATE_LABEL: Record<string, string> = {
  DEF: "Definite",
  INDEF: "Indefinite",
};

const ASPECT_LABEL: Record<string, string> = {
  PERF: "Perfect",
  IMPF: "Imperfect",
  IMPV: "Imperative",
};

const MOOD_LABEL: Record<string, string> = {
  IND: "Indicative",
  SUBJ: "Subjunctive",
  JUS: "Jussive",
};

const VOICE_LABEL: Record<string, string> = {
  ACT: "Active",
  PASS: "Passive",
};

const NUMBER_LABEL: Record<string, string> = {
  S: "Singular",
  D: "Dual",
  P: "Plural",
};

const GENDER_LABEL: Record<string, string> = {
  M: "Masculine",
  F: "Feminine",
};

const PERSON_LABEL: Record<string, string> = {
  "1": "1st person",
  "2": "2nd person",
  "3": "3rd person",
};

// ─── Segment detail row ───────────────────────────────────────────────────────

function SegmentRow({ seg }: { seg: Segment }) {
  const f = seg.features;

  const featureParts: string[] = [];
  if (f.verbAspect)  featureParts.push(ASPECT_LABEL[f.verbAspect]  ?? f.verbAspect);
  if (f.verbMood)    featureParts.push(MOOD_LABEL[f.verbMood]      ?? f.verbMood);
  if (f.verbVoice)   featureParts.push(VOICE_LABEL[f.verbVoice]    ?? f.verbVoice);
  if (f.verbForm)    featureParts.push(`Form ${f.verbForm}`);
  if (f.derivation)  featureParts.push(f.derivation);
  if (f.person)      featureParts.push(PERSON_LABEL[f.person]      ?? f.person);
  if (f.gender)      featureParts.push(GENDER_LABEL[f.gender]      ?? f.gender);
  if (f.number)      featureParts.push(NUMBER_LABEL[f.number]      ?? f.number);
  if (f.gramCase)    featureParts.push(CASE_LABEL[f.gramCase]      ?? f.gramCase);
  if (f.gramState)   featureParts.push(STATE_LABEL[f.gramState]    ?? f.gramState);
  if (f.specialGroup) featureParts.push(`Group: ${f.specialGroup}`);

  const rowClass = `segment-breakdown__row segment-breakdown__row--${seg.type.toLowerCase()}`;

  return (
    <div className={rowClass}>
      {/* Arabic form */}
      <span
        lang="ar"
        dir="rtl"
        className="segment-breakdown__arabic arabic"
      >
        {seg.formArabic || seg.formBuckwalter}
      </span>

      {/* POS + description */}
      <div>
        <div className="segment-breakdown__label">{seg.type}</div>
        <div className="flex items-center gap-1 mt-1">
          <POSBadge tag={seg.posTag} showTooltip={false} />
          <span className="segment-breakdown__pos latin">{seg.posDescription}</span>
        </div>
        {seg.posArabic && (
          <span
            lang="ar"
            dir="rtl"
            className="arabic mt-1 block"
            style={{ fontSize: "var(--token-font-size-arabic-sm)", color: "var(--token-text-secondary)" }}
          >
            {seg.posArabic}
          </span>
        )}
      </div>

      {/* Features */}
      <div>
        {f.root && (
          <div className="segment-breakdown__label" style={{ marginBottom: "2px" }}>Root</div>
        )}
        {f.root && (
          <bdi className="segment-breakdown__pos">
            {f.rootArabic ? `${f.rootArabic} · ` : ""}{f.root}
          </bdi>
        )}
        {featureParts.length > 0 && (
          <div className="segment-breakdown__features latin mt-1">
            {featureParts.join(" · ")}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface WordDetailDrawerProps {
  word: Word;
  open: boolean;
  onClose: () => void;
}

export function WordDetailDrawer({ word, open, onClose }: WordDetailDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Sync open/close with native <dialog>
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Close on backdrop click (click outside panel)
  function handleDialogClick(e: React.MouseEvent<HTMLDialogElement>) {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const rect = dialog.getBoundingClientRect();
    const clickedOutside =
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top  ||
      e.clientY > rect.bottom;
    if (clickedOutside) onClose();
  }

  // Close on native dialog close event (Escape key)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handler = () => onClose();
    dialog.addEventListener("close", handler);
    return () => dialog.removeEventListener("close", handler);
  }, [onClose]);

  const stem = word.segments.find((s) => s.type === "STEM");
  const tierFourUrl = `/surah/${word.surah}/verse/${word.verse}/word/${word.position}`;

  return (
    <dialog
      ref={dialogRef}
      className="word-detail-drawer"
      aria-label={`Word analysis: ${word.textUthmani}`}
      onClick={handleDialogClick}
    >
      <div className="word-detail-drawer__panel" onClick={(e) => e.stopPropagation()}>
        {/* Drag handle (mobile only) */}
        <div className="word-detail-drawer__handle" aria-hidden="true" />

        {/* Header */}
        <div className="word-detail-drawer__header">
          <div className="word-detail-drawer__title">
            <span
              lang="ar"
              dir="rtl"
              className="word-detail-drawer__arabic arabic"
            >
              {word.textUthmani}
            </span>
            {word.transliteration && (
              <span className="word-detail-drawer__transliteration latin">
                {word.transliteration}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="word-detail-drawer__close"
            aria-label="Close word detail"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="word-detail-drawer__body" dir="ltr">

          {/* Translation */}
          {word.translation && (
            <section className="word-detail-drawer__section" aria-label="Translation">
              <h2 className="word-detail-drawer__section-title">Translation</h2>
              <p
                className="latin"
                style={{
                  fontSize: "var(--token-font-size-latin-md)",
                  color: "var(--token-text-primary)",
                  fontStyle: "italic",
                }}
              >
                "{word.translation}"
              </p>
            </section>
          )}

          {/* Root + Lemma */}
          {(word.root || stem?.features.lemma) && (
            <section className="word-detail-drawer__section" aria-label="Root and Lemma">
              <h2 className="word-detail-drawer__section-title">Root &amp; Lemma</h2>
              {word.root && (
                <div className="root-info">
                  <span
                    lang="ar"
                    dir="rtl"
                    className="root-info__arabic arabic"
                  >
                    {word.root.lettersArabic}
                  </span>
                  <div className="root-info__details">
                    <bdi className="root-info__buckwalter">{word.root.lettersBuckwalter}</bdi>
                    <span className="root-info__freq latin">
                      {word.root.frequency.toLocaleString()} occurrences in the Quran
                    </span>
                  </div>
                </div>
              )}
              {stem?.features.lemma && (
                <div
                  className="mt-2"
                  style={{ fontSize: "var(--token-font-size-latin-sm)", color: "var(--token-text-secondary)" }}
                >
                  <span className="latin" style={{ color: "var(--token-text-tertiary)" }}>Lemma: </span>
                  <bdi>
                    {stem.features.lemmaArabic ? `${stem.features.lemmaArabic} · ` : ""}
                    {stem.features.lemma}
                  </bdi>
                </div>
              )}
            </section>
          )}

          {/* Full segment breakdown */}
          {word.segments.length > 0 && (
            <section className="word-detail-drawer__section" aria-label="Morphological segments">
              <h2 className="word-detail-drawer__section-title">
                Segments ({word.segments.length})
              </h2>
              <div className="segment-breakdown">
                {word.segments.map((seg) => (
                  <SegmentRow key={seg.position} seg={seg} />
                ))}
              </div>
            </section>
          )}

        </div>

        {/* Footer — deep link to Tier 4 */}
        <div className="word-detail-drawer__footer" dir="ltr">
          <Link
            href={tierFourUrl}
            className="word-detail-drawer__deep-link latin"
            onClick={onClose}
          >
            Full linguistic analysis →
          </Link>
        </div>
      </div>
    </dialog>
  );
}
