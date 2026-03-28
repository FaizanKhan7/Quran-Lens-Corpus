// /surah — All 114 surahs listing
// Server component — spec §9.1 Level 1 starting point

// DB is required at runtime — skip static prerender
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { BottomNav } from "@/components/layout/BottomNav";
import { getAllSurahs } from "@/lib/surah-data";

export const metadata: Metadata = {
  title: "Browse Surahs — Quran Lens",
  description: "Browse all 114 surahs of the Quran with morphological analysis.",
};

export default async function SurahListPage() {
  const surahs = await getAllSurahs();

  return (
    <>
      <main className="flex-1 pb-20 md:pb-4" dir="ltr">
        <div
          className="w-full mx-auto py-6 px-4"
          style={{ maxWidth: "var(--token-layout-max-content)" }}
        >
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol
              className="flex items-center gap-x-2 latin text-sm"
              style={{ color: "var(--token-text-tertiary)" }}
            >
              <li>
                <Link
                  href="/"
                  className="inline-link hover:underline"
                  style={{ color: "inherit" }}
                >
                  Home
                </Link>
              </li>
              <li aria-hidden="true">›</li>
              <li style={{ color: "var(--token-text-primary)" }} aria-current="page">
                All Surahs
              </li>
            </ol>
          </nav>

          <h1
            className="latin text-2xl font-bold mb-6"
            style={{ color: "var(--token-text-primary)" }}
          >
            All Surahs
          </h1>

          {surahs.length === 0 ? (
            <p
              className="latin text-sm"
              style={{ color: "var(--token-text-tertiary)" }}
              dir="ltr"
            >
              No surahs found. Run{" "}
              <code
                className="font-mono px-1 rounded"
                style={{ background: "var(--token-surface-overlay)" }}
              >
                npm run db:seed
              </code>{" "}
              to populate the database.
            </p>
          ) : (
            <div className="surah-grid" role="list" aria-label="All 114 surahs">
              {surahs.map((surah) => (
                <Link
                  key={surah.id}
                  href={`/surah/${surah.id}`}
                  role="listitem"
                  aria-label={`Surah ${surah.id}: ${surah.nameSimple}, ${surah.versesCount} verses`}
                  className="surah-card"
                >
                  {/* Number */}
                  <span className="surah-card__number latin">
                    {surah.id}
                  </span>

                  {/* Arabic name */}
                  <span
                    lang="ar"
                    dir="rtl"
                    className="surah-card__arabic arabic"
                  >
                    {surah.nameArabic}
                  </span>

                  {/* Latin name */}
                  <span className="surah-card__latin latin">
                    {surah.nameSimple}
                  </span>

                  {/* Meta row */}
                  <span className="surah-card__meta latin">
                    <span>{surah.versesCount}v</span>
                    <span
                      className="surah-card__badge"
                      data-place={surah.revelationPlace}
                    >
                      {surah.revelationPlace === "makkah" ? "Mak." : "Mad."}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </>
  );
}
