// /surah/[surahId]
// Server component — fetches surah + verse list from Prisma, renders VerseAccordion list.
// Spec §9.1 Level 1: Surah page with scrollable verse list.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";
import { VerseAccordion } from "@/components/ui/VerseAccordion";
import { JumpToVerse } from "@/components/ui/JumpToVerse";
import { getSurahData } from "@/lib/surah-data";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

interface Props {
  params: Promise<{ surahId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { surahId } = await params;
  const data = await getSurahData(Number(surahId));
  if (!data) return { title: "Surah not found" };
  const { surah } = data;
  return {
    title: `${surah.nameSimple} (${surahId}) — Quran Lens`,
    description: `${surah.translatedName} · ${surah.versesCount} verses · ${surah.revelationPlace === "makkah" ? "Meccan" : "Medinan"}`,
  };
}

export default async function SurahPage({ params }: Props) {
  const { surahId } = await params;
  const id = Number(surahId);

  if (!Number.isInteger(id) || id < 1 || id > 114) notFound();

  const data = await getSurahData(id);
  if (!data) notFound();

  const { surah, verses } = data;
  const revelationLabel = surah.revelationPlace === "makkah" ? "Meccan" : "Medinan";

  return (
    <>
      <main className="flex-1 pb-nav" dir="ltr">
        <div
          className="w-full mx-auto py-6 px-4"
          style={{ maxWidth: "var(--token-layout-max-content)" }}
        >

          {/* ── Breadcrumb — spec §9.2 ───────────────────────────────────── */}
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "All Surahs", href: "/surah" },
              { label: surah.nameSimple, labelArabic: surah.nameArabic },
            ]}
          />

          {/* ── Surah header ─────────────────────────────────────────────── */}
          <header className="mb-8">
            <div
              className="flex items-start justify-between gap-4 pb-4 mb-4"
              style={{ borderBottom: "1px solid var(--token-border-subtle)" }}
            >
              {/* Latin name + metadata */}
              <div>
                <h1
                  className="latin text-2xl font-bold mb-1"
                  style={{ color: "var(--token-text-primary)" }}
                >
                  {surah.nameSimple}
                </h1>
                <p
                  className="latin text-sm"
                  style={{ color: "var(--token-text-tertiary)" }}
                >
                  {surah.translatedName}
                  &ensp;·&ensp;
                  {revelationLabel}
                  &ensp;·&ensp;
                  {surah.versesCount} verses
                  &ensp;·&ensp;
                  Revelation order {surah.revelationOrder}
                </p>
              </div>

              {/* Arabic name */}
              <p
                lang="ar"
                dir="rtl"
                className="arabic shrink-0"
                style={{
                  fontSize: "var(--token-font-size-arabic-xl)",
                  lineHeight: 1.4,
                  color: "var(--token-text-primary)",
                }}
              >
                {surah.nameArabic}
              </p>
            </div>

            {/* Bismillah — shown before every surah except Al-Fatihah (1) and At-Tawbah (9) */}
            {surah.bismillahPre && surah.id !== 1 && surah.id !== 9 && (
              <p
                lang="ar"
                dir="rtl"
                className="verse-arabic text-center my-2"
                style={{ color: "var(--token-text-secondary)" }}
              >
                بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
              </p>
            )}
          </header>

          {/* ── JumpToVerse + verse count — spec §11 F10 ─────────────────── */}
          <div
            className="flex flex-wrap items-end justify-between gap-4 mb-6 pb-4"
            style={{ borderBottom: "1px solid var(--token-border-subtle)" }}
          >
            <p
              className="latin text-sm"
              style={{ color: "var(--token-text-tertiary)" }}
            >
              {surah.versesCount} verse{surah.versesCount !== 1 ? "s" : ""}
            </p>
            <JumpToVerse surahId={id} versesCount={surah.versesCount} />
          </div>

          {/* ── Verse list — each row is a VerseAccordion ────────────────── */}
          <section
            aria-label={`Verses of ${surah.nameSimple}`}
            className="flex flex-col"
            style={{ gap: "var(--comp-verse-gap)" }}
          >
            {verses.map((verse) => (
              <VerseAccordion
                key={verse.id}
                verse={verse}
                surahId={id}
              />
            ))}
          </section>

          {/* ── Prev / Next surah navigation — spec §9.1 ─────────────────── */}
          <nav aria-label="Surah navigation" className="surah-nav-bar latin">
            {id > 1 ? (
              <Link
                href={`/surah/${id - 1}`}
                className="surah-nav-btn"
                aria-label={`Previous surah: ${id - 1}`}
              >
                ← Surah {id - 1}
              </Link>
            ) : (
              <span />
            )}

            <Link
              href="/surah"
              className="inline-link text-sm hover:underline"
              style={{ color: "var(--token-text-tertiary)" }}
            >
              All Surahs
            </Link>

            {id < 114 ? (
              <Link
                href={`/surah/${id + 1}`}
                className="surah-nav-btn"
                aria-label={`Next surah: ${id + 1}`}
              >
                Surah {id + 1} →
              </Link>
            ) : (
              <span />
            )}
          </nav>

        </div>
      </main>
      <BottomNav />
    </>
  );
}
