export default function TreebankLoading() {
  return (
    <main className="flex-1 pb-nav" dir="ltr">
      <div
        className="w-full mx-auto py-6 px-4"
        style={{ maxWidth: "var(--token-layout-max-content)" }}
      >
        {/* Breadcrumb skeleton */}
        <div className="skeleton-line" style={{ width: "55%", height: 14, marginBottom: 24 }} />

        {/* Header skeleton */}
        <div className="skeleton-line" style={{ width: "35%", height: 28, marginBottom: 8 }} />
        <div className="skeleton-line" style={{ width: "25%", height: 14, marginBottom: 16 }} />
        <div className="skeleton-line" style={{ width: "80%", height: 32, marginBottom: 32 }} />

        {/* Tree canvas skeleton */}
        <div
          className="treebank-viewer__canvas"
          style={{ background: "var(--token-surface-raised)", borderRadius: 8 }}
        >
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <span
              className="latin text-sm"
              style={{ color: "var(--token-text-tertiary)" }}
            >
              Loading treebank…
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
