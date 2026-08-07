"use client";

// Playbook — personal setups/rules (Practice suite).

import PracticeSuiteChrome from "@/components/practice/PracticeSuiteChrome";
import { Button } from "@/components/ui";
import Link from "next/link";

export default function PlaybookPage() {
  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 py-6 pb-24 sm:px-6">
      <PracticeSuiteChrome
        active="playbook"
        subtitle="Your defined-risk setups and rules — the book you actually trade from."
      >
        <div className="surface-card mt-6 border border-[var(--color-separator)] px-5 py-8 text-center sm:px-8">
          <p
            className="font-semibold text-[var(--color-label)]"
            style={{ fontSize: "var(--text-headline)" }}
          >
            Playbook is coming soon
          </p>
          <p
            className="mx-auto mt-2 max-w-md text-[var(--color-label-secondary)]"
            style={{ fontSize: "var(--text-subheadline)", lineHeight: 1.45 }}
          >
            Your playbook is who you are under risk — the rules you will not
            break. Phase 1 of Trader Development lands CRUD here next.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <Link href="/app/journal">
              <Button type="button" variant="secondary">
                Open Journal
              </Button>
            </Link>
            <Link href="/app/trade-log">
              <Button type="button" variant="primary">
                Open Trade Log
              </Button>
            </Link>
          </div>
        </div>
      </PracticeSuiteChrome>
    </main>
  );
}
