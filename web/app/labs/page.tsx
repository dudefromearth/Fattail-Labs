import type { Metadata } from "next";
import Link from "next/link";
import { siteUrl } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Labs",
  description:
    "Member tools for practice: Trade Log, Journal, Playbook, Statistics, and Vexy.",
  alternates: { canonical: siteUrl("/labs") },
};

/**
 * Labs hub — primary tab between Courses and Resources.
 * Home of member practice tools (Trade Log, Journal, Playbook, Statistics, Vexy).
 * Pathway/assessment stays out of primary chrome; sequencing will be role-driven later.
 */
const TOOLS: {
  id: string;
  name: string;
  blurb: string;
  status: "soon" | "external";
  href?: string;
}[] = [
  {
    id: "tradelog",
    name: "Trade Log",
    blurb:
      "Record fills and structure outcomes — process first, not P&L theater.",
    status: "soon",
  },
  {
    id: "journal",
    name: "Journal",
    blurb:
      "Daily notes tied to the routine: preparation, selection, and review.",
    status: "soon",
  },
  {
    id: "playbook",
    name: "Playbook",
    blurb:
      "Your defined-risk setups and rules — the book you actually trade from.",
    status: "soon",
  },
  {
    id: "statistics",
    name: "Statistics",
    blurb:
      "Adherence and process metrics — streaks and discipline, never profit claims.",
    status: "soon",
  },
  {
    id: "vexy",
    name: "Vexy",
    blurb:
      "Cognitive partner for structure and doctrine — when the practice stack is wired.",
    status: "soon",
  },
];

export default function LabsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-label)]">
        Labs
      </h1>
      <p className="mt-2 max-w-2xl text-[var(--color-label-secondary)]">
        Tools for the practice — trade log, journal, playbook, statistics, and
        Vexy. Built for members who are building capacity, not dependency.
      </p>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {TOOLS.map((t) => (
          <li key={t.id}>
            <div className="surface-card flex h-full flex-col border border-[var(--color-separator)] p-5">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-[var(--color-label)]">
                  {t.name}
                </h2>
                {t.status === "soon" && (
                  <span className="rounded-full bg-[var(--color-fill)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-secondary)]">
                    Coming soon
                  </span>
                )}
              </div>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--color-label-secondary)]">
                {t.blurb}
              </p>
              {t.href ? (
                <Link
                  href={t.href}
                  className="mt-4 text-sm font-medium text-[var(--color-tint)] hover:underline"
                >
                  Open →
                </Link>
              ) : (
                <p className="mt-4 text-xs text-[var(--color-label-tertiary)]">
                  Ships with the practice stack — not a survey-driven pathway.
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-sm text-[var(--color-label-secondary)]">
        Looking for courses?{" "}
        <Link href="/courses" className="text-[var(--color-tint)] hover:underline">
          Course library
        </Link>
        . Live sessions stay on{" "}
        <Link href="/live" className="text-[var(--color-tint)] hover:underline">
          Live
        </Link>
        .
      </p>
    </main>
  );
}
