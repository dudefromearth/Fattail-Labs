import type { Metadata } from "next";
import Link from "next/link";
import { siteUrl } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Practice Log",
  description:
    "Trade Log and Journal — fills, adherence, prep, and review. Process first, not P&L theater.",
  alternates: { canonical: siteUrl("/app/practice") },
};

type ChildApp = {
  slug: string;
  title: string;
  blurb: string;
  status: "live" | "soon";
  href: string;
};

const CHILDREN: ChildApp[] = [
  {
    slug: "trade-log",
    title: "Trade Log",
    blurb:
      "Record fills and structure outcomes — process first, not P&L theater.",
    status: "live",
    href: "/app/trade-log",
  },
  {
    slug: "journal",
    title: "Journal",
    blurb:
      "Daily notes tied to the routine: preparation, selection, and review.",
    status: "soon",
    href: "/app/journal",
  },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "soon") {
    return (
      <span className="rounded-full bg-[var(--color-fill)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-secondary)]">
        Coming soon
      </span>
    );
  }
  return (
    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
      Live
    </span>
  );
}

export default function PracticeLogHubPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <nav className="text-sm text-[var(--color-label-secondary)]">
        <Link href="/app" className="hover:underline">
          Apps
        </Link>
        <span className="mx-2">›</span>
        <span className="text-[var(--color-label)]">Practice Log</span>
      </nav>

      <header className="mt-4 max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-label)]">
          Practice Log
        </h1>
        <p className="mt-2 text-[var(--color-label-secondary)] leading-relaxed">
          What you did in the practice — trades and the daily routine. Process
          first, not P&L theater.
        </p>
      </header>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {CHILDREN.map((t) => (
          <li key={t.slug}>
            <div className="surface-card flex h-full flex-col border border-[var(--color-separator)] p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-[var(--color-label)]">
                  {t.title}
                </h2>
                <StatusBadge status={t.status} />
              </div>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--color-label-secondary)]">
                {t.blurb}
              </p>
              {t.status === "live" ? (
                <Link
                  href={t.href}
                  className="mt-4 text-sm font-medium text-[var(--color-tint)] hover:underline"
                >
                  Open →
                </Link>
              ) : (
                <p className="mt-4 text-xs text-[var(--color-label-tertiary)]">
                  Coming soon — daily prep, selection, and review notes.
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
