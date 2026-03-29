// Skeleton loading page for /dictionary/root/[bw]

export default function RootConcordanceLoading() {
  return (
    <main dir="ltr" className="flex-1 px-4 pb-nav">
      <div
        className="w-full mx-auto py-6 px-4"
        style={{ maxWidth: "var(--token-layout-max-content)" }}
      >
        {/* Breadcrumb skeleton */}
        <div className="skeleton-line mb-6" style={{ width: "240px", height: "1rem" }} />

        {/* Root hero skeleton */}
        <div
          className="root-hero mb-6"
          style={{ gap: "var(--primitive-space-16)" }}
        >
          <div className="skeleton-word-card" style={{ width: "80px", height: "64px", borderRadius: "var(--primitive-radius-4)" }} />
          <div className="flex flex-col gap-2">
            <div className="skeleton-line" style={{ width: "120px", height: "1.25rem" }} />
            <div className="skeleton-line" style={{ width: "200px", height: "1rem" }} />
          </div>
        </div>

        {/* Lemma chips skeleton */}
        <div className="mb-6">
          <div className="skeleton-line mb-3" style={{ width: "120px", height: "0.875rem" }} />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="skeleton-word-card"
                style={{ width: `${60 + i * 12}px`, height: "2rem", borderRadius: "var(--primitive-radius-full)" }}
              />
            ))}
          </div>
        </div>

        {/* Concordance header skeleton */}
        <div className="skeleton-line mb-4" style={{ width: "180px", height: "1.25rem" }} />

        {/* Concordance rows skeleton */}
        <div className="flex flex-col gap-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="skeleton-word-card"
              style={{ height: "3.5rem", borderRadius: "var(--primitive-radius-4)" }}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
