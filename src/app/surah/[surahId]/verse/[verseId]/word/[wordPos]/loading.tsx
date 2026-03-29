/**
 * Tier 4 word detail page — loading skeleton
 */
export default function WordDetailLoading() {
  return (
    <main className="word-detail-page" dir="ltr">
      {/* Breadcrumb skeleton */}
      <nav aria-label="Loading…">
        <div className="flex items-center gap-2 flex-wrap">
          {[120, 80, 100, 80, 60].map((w, i) => (
            <div
              key={i}
              className="skeleton-line"
              style={{ width: `${w}px` }}
            />
          ))}
        </div>
      </nav>

      <div className="word-detail-skeleton">
        <div className="skeleton-word-card word-detail-skeleton__hero" />
        <div className="skeleton-word-card word-detail-skeleton__card" />
        <div className="skeleton-word-card word-detail-skeleton__card" />
        <div className="skeleton-word-card word-detail-skeleton__card" style={{ height: "14rem" }} />
      </div>
    </main>
  );
}
