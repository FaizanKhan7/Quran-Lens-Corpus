import type { Metadata } from "next";
import Link from "next/link";
import { BottomNav } from "@/components/layout/BottomNav";

interface Props {
  params: Promise<{ surahId: string; verseId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { surahId, verseId } = await params;
  return {
    title: `Surah ${surahId}:${verseId}`,
  };
}

export default async function VersePage({ params }: Props) {
  const { surahId, verseId } = await params;

  return (
    <>
      <main className="flex-1 px-4 pb-20 md:pb-4" dir="rtl">
        <div className="w-full max-w-[var(--max-content-width)] mx-auto py-8">
          {/* Breadcrumb — spec §9.2 */}
          <nav aria-label="Breadcrumb" className="mb-6" dir="ltr">
            <ol className="flex items-center gap-2 latin text-sm text-[var(--color-fg-muted)]">
              <li>
                <Link href="/" className="inline-link hover:text-[var(--color-fg)] hover:underline">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">›</li>
              <li>
                <Link
                  href={`/surah/${surahId}`}
                  className="inline-link hover:text-[var(--color-fg)] hover:underline"
                >
                  Surah {surahId}
                </Link>
              </li>
              <li aria-hidden="true">›</li>
              <li className="text-[var(--color-fg)]" aria-current="page">
                Verse {verseId}
              </li>
            </ol>
          </nav>

          <h1 className="latin text-2xl font-bold text-[var(--color-fg)] mb-8" dir="ltr">
            Surah {surahId}, Verse {verseId}
          </h1>

          <p className="latin text-[var(--color-fg-muted)]" dir="ltr">
            Word-by-word view with WordCard component — built in Phase 1 Step 5.
          </p>
        </div>
      </main>
      <BottomNav />
    </>
  );
}
