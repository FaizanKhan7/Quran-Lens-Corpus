import type { Metadata } from "next";
import Link from "next/link";
import { BottomNav } from "@/components/layout/BottomNav";

interface Props {
  params: Promise<{ surahId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { surahId } = await params;
  return {
    title: `Surah ${surahId}`,
  };
}

export default async function SurahPage({ params }: Props) {
  const { surahId } = await params;
  const id = Number(surahId);

  return (
    <>
      <main className="flex-1 px-4 pb-20 md:pb-4" dir="rtl">
        <div className="w-full max-w-[var(--max-content-width)] mx-auto py-8">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6" dir="ltr">
            <ol className="flex items-center gap-2 latin text-sm text-[var(--color-fg-muted)]">
              <li>
                <Link href="/" className="inline-link hover:text-[var(--color-fg)] hover:underline">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">›</li>
              <li className="text-[var(--color-fg)]" aria-current="page">
                Surah {id}
              </li>
            </ol>
          </nav>

          <h1 className="latin text-2xl font-bold text-[var(--color-fg)] mb-8" dir="ltr">
            Surah {id}
          </h1>

          <p className="latin text-[var(--color-fg-muted)]" dir="ltr">
            Verse-by-verse view — built in Phase 1 Step 2.{" "}
            <Link
              href={`/surah/${id}/verse/1`}
              className="inline-link text-[var(--color-pos-verbal-display)] hover:underline"
            >
              Go to verse 1 →
            </Link>
          </p>
        </div>
      </main>
      <BottomNav />
    </>
  );
}
