import type { Metadata } from "next";
import { BookmarksView } from "@/components/ui/BookmarksView";
import { BottomNav } from "@/components/layout/BottomNav";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

export const metadata: Metadata = {
  title: "Bookmarks — Quran Lens",
  description: "Your saved words and verses.",
};

export default function BookmarksPage() {
  return (
    <>
      <main className="flex-1 pb-nav" dir="ltr">
        <div
          className="w-full mx-auto py-6 px-4"
          style={{ maxWidth: "var(--token-layout-max-content)" }}
        >
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Bookmarks" },
            ]}
          />

          <h1
            className="latin text-2xl font-bold mb-6"
            style={{ color: "var(--token-text-primary)" }}
          >
            Bookmarks
          </h1>

          {/* Client component reads localStorage */}
          <BookmarksView />
        </div>
      </main>
      <BottomNav />
    </>
  );
}
