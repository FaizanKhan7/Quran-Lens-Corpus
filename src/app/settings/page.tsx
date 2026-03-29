import type { Metadata } from "next";
import { BottomNav } from "@/components/layout/BottomNav";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <>
      <main className="flex-1 px-4 pb-nav" dir="ltr">
        <div className="w-full max-w-[var(--token-layout-max-content)] mx-auto py-8">
          <h1 className="latin text-2xl font-bold text-[var(--token-text-primary)] mb-8">
            Settings
          </h1>

          {/* ── Appearance ─────────────────────────────────────────── */}
          <section className="settings-section" aria-labelledby="settings-appearance">
            <h2 id="settings-appearance" className="settings-section__title">
              Appearance
            </h2>

            <div className="settings-row">
              <div className="settings-row__label">
                <span className="settings-row__name">Colour scheme</span>
                <span className="settings-row__desc">
                  Choose light, dark, or follow your system setting
                </span>
              </div>
              <ThemeToggle variant="segment" />
            </div>
          </section>

          {/* ── About ──────────────────────────────────────────────── */}
          <section className="settings-section" aria-labelledby="settings-about">
            <h2 id="settings-about" className="settings-section__title">
              About
            </h2>

            <div className="settings-row">
              <div className="settings-row__label">
                <span className="settings-row__name">Quran Lens</span>
                <span className="settings-row__desc">Version 1.0 · Phase 2</span>
              </div>
            </div>

            <div className="settings-row">
              <div className="settings-row__label">
                <span className="settings-row__name">Morphological data</span>
                <span className="settings-row__desc">
                  Quranic Arabic Corpus v0.4 · Dukes &amp; Habash, 2010 · GNU GPL
                </span>
              </div>
            </div>

            <div className="settings-row">
              <div className="settings-row__label">
                <span className="settings-row__name">Quran text</span>
                <span className="settings-row__desc">
                  Tanzil Project · Uthmani text v1.0.2 · CC BY-SA
                </span>
              </div>
            </div>

            <div className="settings-row">
              <div className="settings-row__label">
                <span className="settings-row__name">Translations &amp; audio</span>
                <span className="settings-row__desc">
                  Quran Foundation API · quran.com
                </span>
              </div>
            </div>
          </section>
        </div>
      </main>
      <BottomNav />
    </>
  );
}
