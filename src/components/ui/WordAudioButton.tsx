"use client";

/**
 * WordAudioButton — per-word audio playback (spec §11 F09)
 *
 * Audio URL is derived deterministically from word position:
 *   https://audio.qurancdn.com/wbw/{SSS}_{VVV}_{WWW}.mp3
 *
 * Only one word plays at a time — a module-level stop handle ensures
 * tapping a new word silently stops the previous one.
 *
 * States: idle → loading → playing → idle (auto on ended)
 *                ↓ on error: error (2s) → idle
 */

import { useState, useRef } from "react";

// ─── Module-level singleton — one word playing at a time ─────────────────────

let stopCurrentWord: (() => void) | null = null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AUDIO_CDN = "https://audio.qurancdn.com/";

function pad3(n: number): string {
  return String(n).padStart(3, "0");
}

function buildAudioUrl(surah: number, verse: number, position: number): string {
  return `${AUDIO_CDN}wbw/${pad3(surah)}_${pad3(verse)}_${pad3(position)}.mp3`;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function PlayIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-4 h-4"
      aria-hidden="true"
    >
      <path d="M8 5.14v14l11-7-11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-4 h-4"
      aria-hidden="true"
    >
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="w-4 h-4 word-audio-btn__spinner"
      aria-hidden="true"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className="w-4 h-4"
      aria-hidden="true"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

type AudioStatus = "idle" | "loading" | "playing" | "error";

interface WordAudioButtonProps {
  surah:    number;
  verse:    number;
  position: number;
}

export function WordAudioButton({ surah, verse, position }: WordAudioButtonProps) {
  const [status, setStatus] = useState<AudioStatus>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function stop() {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = "";
    }
    audioRef.current = null;
    setStatus("idle");
    if (stopCurrentWord === stop) stopCurrentWord = null;
  }

  function handleClick(e: React.MouseEvent) {
    // Must not bubble — this button is a sibling of the WordCard trigger
    e.stopPropagation();

    if (status === "playing" || status === "loading") {
      stop();
      return;
    }

    // Stop any other word currently playing
    if (stopCurrentWord) stopCurrentWord();

    const url   = buildAudioUrl(surah, verse, position);
    const audio = new Audio(url);
    audioRef.current = audio;
    stopCurrentWord  = stop;

    setStatus("loading");

    audio.addEventListener(
      "canplaythrough",
      () => {
        audio
          .play()
          .then(() => setStatus("playing"))
          .catch(() => {
            setStatus("error");
            setTimeout(() => setStatus("idle"), 2000);
            audioRef.current = null;
            if (stopCurrentWord === stop) stopCurrentWord = null;
          });
      },
      { once: true },
    );

    audio.addEventListener(
      "ended",
      () => {
        audioRef.current = null;
        setStatus("idle");
        if (stopCurrentWord === stop) stopCurrentWord = null;
      },
      { once: true },
    );

    audio.addEventListener(
      "error",
      () => {
        audioRef.current = null;
        setStatus("error");
        setTimeout(() => setStatus("idle"), 2000);
        if (stopCurrentWord === stop) stopCurrentWord = null;
      },
      { once: true },
    );

    audio.load();
  }

  const label =
    status === "playing" ? "Pause word audio" :
    status === "loading" ? "Loading audio…"   :
    status === "error"   ? "Audio unavailable" :
    "Play word audio";

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`word-audio-btn word-audio-btn--${status}`}
      aria-label={label}
      title={label}
    >
      {status === "idle"    && <PlayIcon />}
      {status === "loading" && <SpinnerIcon />}
      {status === "playing" && <PauseIcon />}
      {status === "error"   && <XIcon />}
    </button>
  );
}
