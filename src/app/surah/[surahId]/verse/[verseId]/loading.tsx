// Streaming skeleton shown while the verse server component loads.
// Spec §13.2: skeleton loaders show verse structure as grey blocks while data loads.

export default function VerseLoading() {
  return (
    <main className="flex-1 pb-nav" dir="ltr">
      <div
        className="w-full mx-auto py-6 px-4"
        style={{ maxWidth: "var(--token-layout-max-content)" }}
      >
        {/* Breadcrumb skeleton */}
        <div className="mb-6 flex gap-2 items-center">
          <div className="skeleton-line" style={{ width: "3rem" }} />
          <div className="skeleton-line" style={{ width: "0.5rem" }} />
          <div className="skeleton-line" style={{ width: "4rem" }} />
          <div className="skeleton-line" style={{ width: "0.5rem" }} />
          <div className="skeleton-line" style={{ width: "3.5rem" }} />
        </div>

        {/* Verse text skeleton */}
        <div className="mb-8">
          <div
            className="skeleton-line mb-3"
            style={{ width: "100%", height: "2rem" }}
          />
          <div
            className="skeleton-line"
            style={{ width: "40%", height: "2rem" }}
          />
          <div
            className="skeleton-line mt-3"
            style={{ width: "5rem", height: "1rem" }}
          />
        </div>

        {/* Word grid skeleton */}
        <div className="verse-word-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="skeleton-word-card" />
          ))}
        </div>
      </div>
    </main>
  );
}
