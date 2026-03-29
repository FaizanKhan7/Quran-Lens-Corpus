// Streaming skeleton for /surah — shown while getAllSurahs() resolves.

export default function SurahListLoading() {
  return (
    <main className="flex-1 pb-nav" dir="ltr">
      <div
        className="w-full mx-auto py-6 px-4"
        style={{ maxWidth: "var(--token-layout-max-content)" }}
      >
        {/* Breadcrumb skeleton */}
        <div className="mb-6">
          <div
            className="skeleton-line"
            style={{ width: "10rem" }}
            aria-hidden="true"
          />
        </div>

        {/* Heading skeleton */}
        <div
          className="skeleton-line mb-6"
          style={{ width: "8rem", height: "1.75rem" }}
          aria-hidden="true"
        />

        {/* 114-card grid skeleton — show 20 cards as placeholders */}
        <div className="surah-grid" aria-busy="true" aria-label="Loading surahs…">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="skeleton-word-card"
              style={{ height: "6rem", borderRadius: "var(--primitive-radius-8)" }}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
