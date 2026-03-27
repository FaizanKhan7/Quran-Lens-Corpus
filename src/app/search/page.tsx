import type { Metadata } from "next";
import { BottomNav } from "@/components/layout/BottomNav";

export const metadata: Metadata = {
  title: "Search",
};

export default function SearchPage() {
  return (
    <>
      <main className="flex-1 px-4 pb-20 md:pb-4" dir="rtl">
        <div className="w-full max-w-[var(--max-content-width)] mx-auto py-8">
          <h1 className="latin text-2xl font-bold text-[var(--color-fg)] mb-8" dir="ltr">
            Search
          </h1>
          <p className="latin text-[var(--color-fg-muted)]" dir="ltr">
            Unified search (Text | Root | Morphological) — built in Phase 1 Step 4.
          </p>
        </div>
      </main>
      <BottomNav />
    </>
  );
}
