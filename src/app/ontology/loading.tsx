export default function OntologyLoading() {
  return (
    <div className="flex-1 pb-nav" dir="ltr">
      <div
        className="w-full mx-auto py-6 px-4"
        style={{ maxWidth: "var(--token-layout-max-content)" }}
      >
        {/* Breadcrumb skeleton */}
        <div className="h-4 w-48 bg-surface-raised rounded animate-pulse mb-6" />

        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-7 w-64 bg-surface-raised rounded animate-pulse mb-2" />
          <div className="h-4 w-40 bg-surface-raised rounded animate-pulse" />
        </div>

        {/* Category skeletons */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="mb-8">
            <div className="h-5 w-40 bg-surface-raised rounded animate-pulse mb-3" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-16 bg-surface-raised rounded animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
