import type { Metadata } from "next";
import { BottomNav } from "@/components/layout/BottomNav";

export const metadata: Metadata = {
  title: "Dictionary",
};

export default function DictionaryPage() {
  return (
    <>
      <main className="flex-1 px-4 pb-20 md:pb-4" dir="rtl">
        <div className="w-full max-w-[var(--max-content-width)] mx-auto py-8">
          <h1 className="latin text-2xl font-bold text-[var(--color-fg)] mb-8" dir="ltr">
            Root Dictionary
          </h1>
          <p className="latin text-[var(--color-fg-muted)]" dir="ltr">
            Root-organised lexicon with concordance — built in Phase 2.
          </p>
        </div>
      </main>
      <BottomNav />
    </>
  );
}
