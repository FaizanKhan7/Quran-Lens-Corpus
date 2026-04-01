export default function ConceptLoading() {
  return (
    <div className="flex-1 pb-nav" dir="ltr">
      <div
        className="w-full mx-auto py-6 px-4"
        style={{ maxWidth: "var(--token-layout-max-content)" }}
      >
        {/* Breadcrumb skeleton */}
        <div className="h-4 w-64 bg-surface-raised rounded animate-pulse mb-6" />

        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-4 w-24 bg-surface-raised rounded animate-pulse mb-2" />
          <div className="h-8 w-48 bg-surface-raised rounded animate-pulse" />
        </div>

        {/* Layout skeleton */}
        <div className="flex gap-6">
          <div className="w-64 shrink-0 space-y-4">
            <div className="h-24 bg-surface-raised rounded animate-pulse" />
            <div className="h-32 bg-surface-raised rounded animate-pulse" />
          </div>
          <div className="flex-1 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-surface-raised rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
