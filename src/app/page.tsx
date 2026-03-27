import Link from "next/link";
import { BottomNav } from "@/components/layout/BottomNav";
import { POSBadge, PhraseBadge, HiddenNodeBadge } from "@/components/ui/POSBadge";

export default function HomePage() {
  return (
    <>
      <main
        className="flex-1 flex flex-col items-center justify-center px-card-padding pb-16 md:pb-0"
        dir="rtl"
      >
        <div className="w-full max-w-content mx-auto">
          {/* Hero */}
          <section className="text-center py-16 md:py-24" aria-labelledby="hero-heading">
            <p className="arabic verse-arabic text-text-secondary mb-4" lang="ar">
              بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
            </p>
            <h1
              id="hero-heading"
              className="latin text-3xl md:text-5xl font-bold text-text-primary mb-4"
              dir="ltr"
            >
              Quran Lens
            </h1>
            <p
              className="latin text-text-secondary text-latin-lg max-w-prose mx-auto mb-10"
              dir="ltr"
            >
              Explore every word of the Quran — morphology, roots, grammar, and
              syntactic structure. Tap any word to understand it.
            </p>

            <div className="flex gap-3 justify-center flex-wrap" dir="ltr">
              <Link
                href="/search"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full
                  bg-pos-verbal text-text-on-accent font-semibold text-latin-md
                  hover:opacity-90 transition-opacity duration-base min-h-touch-min"
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
              <Link
                href="/design-tokens"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full
                  border border-border-base bg-surface-raised text-text-secondary
                  hover:bg-surface-overlay transition-colors duration-base min-h-touch-min
                  latin text-latin-sm"
                aria-label="View design system tokens"
                dir="ltr"
              >
                Design Tokens →
              </Link>
            </div>
          </section>

          {/* POS preview — using POSBadge component */}
          <section
            className="border border-border-base rounded-[var(--primitive-radius-12)] p-6 mb-verse-gap"
            aria-labelledby="pos-heading"
          >
            <h2
              id="pos-heading"
              className="latin text-latin-xs font-semibold text-text-tertiary mb-4 uppercase tracking-widest"
              dir="ltr"
            >
              POS Color System — Triple Encoding (spec §8.3)
            </h2>
            <div className="flex flex-wrap gap-3 items-center justify-center" dir="ltr">
              <POSBadge tag="N" />
              <POSBadge tag="PN" />
              <POSBadge tag="ADJ" />
              <POSBadge tag="V" />
              <POSBadge tag="P" />
              <POSBadge tag="CONJ" />
              <POSBadge tag="NEG" />
              <POSBadge tag="INL" />
              <PhraseBadge tag="NS" />
              <HiddenNodeBadge />
            </div>
          </section>

          {/* Quick-browse Surah grid stub */}
          <section aria-labelledby="browse-heading">
            <h2
              id="browse-heading"
              className="latin text-latin-lg font-semibold text-text-primary mb-4"
              dir="ltr"
            >
              Browse Surahs
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-word-gap">
              {SAMPLE_SURAHS.map((surah) => (
                <Link
                  key={surah.id}
                  href={`/surah/${surah.id}`}
                  className="flex flex-col items-center gap-1 p-4 rounded-[var(--primitive-radius-8)]
                    border border-border-base bg-surface-raised
                    hover:border-pos-verbal hover:bg-surface-overlay
                    transition-colors duration-base min-h-touch-min"
                >
                  <span className="latin text-latin-xs text-text-tertiary" dir="ltr">
                    {surah.id}
                  </span>
                  <span className="arabic text-arabic-md" lang="ar">
                    {surah.nameArabic}
                  </span>
                  <span className="latin text-latin-xs text-text-secondary" dir="ltr">
                    {surah.nameSimple}
                  </span>
                </Link>
              ))}
            </div>
            <div className="mt-4 text-center" dir="ltr">
              <Link
                href="/surah"
                className="inline-link latin text-latin-sm text-pos-verbal hover:underline"
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

const SAMPLE_SURAHS = [
  { id: 1,   nameArabic: "ٱلْفَاتِحَة",  nameSimple: "Al-Fatihah" },
  { id: 2,   nameArabic: "ٱلْبَقَرَة",   nameSimple: "Al-Baqarah" },
  { id: 3,   nameArabic: "آلِ عِمْرَان", nameSimple: "Ali 'Imran" },
  { id: 4,   nameArabic: "ٱلنِّسَاء",   nameSimple: "An-Nisa" },
  { id: 18,  nameArabic: "ٱلْكَهْف",    nameSimple: "Al-Kahf" },
  { id: 36,  nameArabic: "يس",          nameSimple: "Ya-Sin" },
  { id: 55,  nameArabic: "ٱلرَّحْمَـٰن", nameSimple: "Ar-Rahman" },
  { id: 112, nameArabic: "ٱلْإِخْلَاص", nameSimple: "Al-Ikhlas" },
] as const;
