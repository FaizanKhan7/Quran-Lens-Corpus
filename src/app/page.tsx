import Link from "next/link";
import { BottomNav } from "@/components/layout/BottomNav";

export default function HomePage() {
  return (
    <>
      <main
        className="flex-1 flex flex-col items-center justify-center px-4 pb-16 md:pb-0"
        dir="rtl"
      >
        <div className="w-full max-w-[var(--max-content-width)] mx-auto">
          {/* Hero */}
          <section className="text-center py-16 md:py-24" aria-labelledby="hero-heading">
            <p
              className="arabic verse-arabic text-[var(--color-fg-muted)] mb-4"
              lang="ar"
            >
              بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
            </p>
            <h1
              id="hero-heading"
              className="latin text-3xl md:text-5xl font-bold text-[var(--color-fg)] mb-4"
              dir="ltr"
            >
              Quran Lens
            </h1>
            <p
              className="latin text-[var(--color-fg-muted)] text-lg max-w-xl mx-auto mb-10"
              dir="ltr"
            >
              Explore every word of the Quran — morphology, roots, grammar, and
              syntactic structure. Tap any word to understand it.
            </p>

            <div className="flex justify-center" dir="ltr">
              <Link
                href="/search"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full
                  bg-[var(--color-pos-verbal)] text-white font-semibold text-base
                  hover:opacity-90 transition-opacity min-h-[3rem]"
                aria-label="Go to search"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                Search a word or root
              </Link>
            </div>
          </section>

          {/* Design Token Preview — Phase 1 visual verification */}
          <section
            className="border border-[var(--color-border-base)] rounded-xl p-6 mb-8"
            aria-labelledby="design-tokens-heading"
          >
            <h2
              id="design-tokens-heading"
              className="latin text-sm font-semibold text-[var(--color-fg-subtle)] mb-4 uppercase tracking-widest"
              dir="ltr"
            >
              POS Color System (Triple Encoding — spec §8.3)
            </h2>
            <div className="flex flex-wrap gap-3 justify-center" dir="ltr">
              <span className="pos-badge pos-badge--nominal">N</span>
              <span className="pos-badge pos-badge--nominal">PN</span>
              <span className="pos-badge pos-badge--nominal">ADJ</span>
              <span className="pos-badge pos-badge--verbal">V</span>
              <span className="pos-badge pos-badge--particle">P</span>
              <span className="pos-badge pos-badge--particle">CONJ</span>
              <span className="pos-badge pos-badge--particle">NEG</span>
              <span className="pos-badge pos-badge--special">INL</span>
              <span className="pos-badge pos-badge--phrase">NS</span>
              <span className="pos-badge pos-badge--hidden">(*)</span>
            </div>
          </section>

          {/* Quick-browse Surah grid stub */}
          <section aria-labelledby="browse-heading">
            <h2
              id="browse-heading"
              className="latin text-lg font-semibold text-[var(--color-fg)] mb-4"
              dir="ltr"
            >
              Browse Surahs
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {SAMPLE_SURAHS.map((surah) => (
                <Link
                  key={surah.id}
                  href={`/surah/${surah.id}`}
                  className="flex flex-col items-center gap-1 p-4 rounded-lg
                    border border-[var(--color-border-base)]
                    bg-[var(--color-bg-raised)]
                    hover:border-[var(--color-pos-verbal-display)]
                    transition-colors min-h-[3rem]"
                >
                  <span
                    className="latin text-xs text-[var(--color-fg-muted)]"
                    dir="ltr"
                  >
                    {surah.id}
                  </span>
                  <span className="arabic text-base" lang="ar">
                    {surah.nameArabic}
                  </span>
                  <span
                    className="latin text-xs text-[var(--color-fg-subtle)]"
                    dir="ltr"
                  >
                    {surah.nameSimple}
                  </span>
                </Link>
              ))}
            </div>
            <div className="mt-4 text-center" dir="ltr">
              <Link
                href="/surah"
                className="inline-link latin text-sm text-[var(--color-pos-verbal-display)] hover:underline"
              >
                View all 114 surahs →
              </Link>
            </div>
          </section>
        </div>
      </main>

      <BottomNav />
    </>
  );
}

// Stub data — replaced by API in Phase 1 Step 4
const SAMPLE_SURAHS = [
  { id: 1, nameArabic: "ٱلْفَاتِحَة", nameSimple: "Al-Fatihah" },
  { id: 2, nameArabic: "ٱلْبَقَرَة", nameSimple: "Al-Baqarah" },
  { id: 3, nameArabic: "آلِ عِمْرَان", nameSimple: "Ali 'Imran" },
  { id: 4, nameArabic: "ٱلنِّسَاء", nameSimple: "An-Nisa" },
  { id: 18, nameArabic: "ٱلْكَهْف", nameSimple: "Al-Kahf" },
  { id: 36, nameArabic: "يس", nameSimple: "Ya-Sin" },
  { id: 55, nameArabic: "ٱلرَّحْمَـٰن", nameSimple: "Ar-Rahman" },
  { id: 112, nameArabic: "ٱلْإِخْلَاص", nameSimple: "Al-Ikhlas" },
] as const;
