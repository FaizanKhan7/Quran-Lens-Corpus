import Link from "next/link";

export default function NotFound() {
  return (
    <main
      className="flex-1 flex flex-col items-center justify-center px-4 text-center"
      dir="ltr"
    >
      <p className="arabic text-5xl mb-4" lang="ar">٤٠٤</p>
      <h1 className="latin text-2xl font-bold text-[var(--color-fg)] mb-2">
        Page not found
      </h1>
      <p className="latin text-[var(--color-fg-muted)] mb-8">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full
          border border-[var(--color-border-base)]
          text-[var(--color-fg)] hover:bg-[var(--color-bg-raised)]
          transition-colors latin text-sm font-medium min-h-[3rem]"
      >
        ← Back to home
      </Link>
    </main>
  );
}
