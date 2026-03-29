// Skeleton loading page for /dictionary

export default function DictionaryLoading() {
  return (
    <main dir="ltr" className="flex-1 px-4 pb-nav">
      <div
        className="w-full mx-auto py-6 px-4"
        style={{ maxWidth: "var(--token-layout-max-content)" }}
      >
        <div className="skeleton-line mb-6" style={{ width: "200px" }} />
        <div className="skeleton-line mb-4" style={{ width: "60%" }} />
        <div className="dict-root-grid mt-6">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="skeleton-word-card" style={{ height: "6rem" }} />
          ))}
        </div>
      </div>
    </main>
  );
}
