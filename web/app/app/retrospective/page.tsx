"use client";

/**
 * Retrospective — first-class Practice player (between Journal and Playbook).
 * Spec: FatTail-Labs-Journal-Retrospective-Spec-v0.1 (§3.1, slice P0 shell).
 * Full week roll-up + agent assist land in later slices — shell only for now.
 */

import Link from "next/link";
import PracticeSuiteChrome from "@/components/practice/PracticeSuiteChrome";
import { Button } from "@/components/ui";

export default function RetrospectivePage() {
  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 py-6 pb-24 sm:px-6">
      <PracticeSuiteChrome
        active="retrospective"
        subtitle="End-of-week process review — a first-class stop on your trading journey."
      >
        <div className="mt-6 space-y-6" data-testid="retrospective-shell">
          <section className="surface-card border border-[var(--color-separator)] px-5 py-8 text-center sm:px-8">
            <p
              className="font-semibold text-[var(--color-label)]"
              style={{ fontSize: "var(--text-headline)" }}
            >
              Retrospectives
            </p>
            <p
              className="mx-auto mt-2 max-w-lg text-[var(--color-label-secondary)]"
              style={{ fontSize: "var(--text-subheadline)", lineHeight: 1.45 }}
            >
              A retrospective is a periodic look back at your trading week — not
              a daily note. Tag or create one at the end of the week (Fri–Sun),
              optionally roll up that week’s journal entries for analysis, and
              let the milestone surface on{" "}
              <Link
                href="/app/journey"
                className="font-medium text-[var(--color-tint)]"
              >
                Journey
              </Link>
              .
            </p>
            <p className="mx-auto mt-3 max-w-md text-xs text-[var(--color-label-tertiary)]">
              Shell ship (Spec v0.1 slice P0). Week confirmation, corpus roll-up,
              templates, and agent assist follow in later slices — process first,
              never profit theater.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <Link href="/app/journal">
                <Button type="button" variant="primary">
                  Open Journal
                </Button>
              </Link>
              <Link href="/app/reports">
                <Button type="button" variant="secondary">
                  Open Reports
                </Button>
              </Link>
              <Link href="/app/journey">
                <Button type="button" variant="plain">
                  Open Journey
                </Button>
              </Link>
            </div>
          </section>

          <section className="surface-card border border-[var(--color-separator)] p-5">
            <h2
              className="font-semibold text-[var(--color-label)]"
              style={{ fontSize: "var(--text-headline)" }}
            >
              Your retrospectives
            </h2>
            <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
              Timeline of completed week reviews will live here.
            </p>
            <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-surface-secondary)] px-4 py-6 text-center text-sm text-[var(--color-label-tertiary)]">
              No retrospectives yet. When journal entries ship, you can create
              one from a week-end day and it will appear in this list — and as a
              milestone on Journey.
            </div>
          </section>
        </div>
      </PracticeSuiteChrome>
    </main>
  );
}
