"use client";

/**
 * Shared chrome for Strategy Lab — matches Practice suite layout:
 * breadcrumb left · centered pill nav · balance column.
 */

import Link from "next/link";
import type { ReactNode } from "react";
import StrategyLabNav from "./StrategyLabNav";
import {
  suiteItem,
  type StrategyLabSuiteId,
} from "@/lib/strategyLabSuite";

function defaultSubtitle(active: StrategyLabSuiteId): string {
  if (active === "archive") {
    return "Retired strategies, reports, and logs — on your account.";
  }
  if (active === "curation") {
    return "Book readiness — group, size, and monitor after Design validation.";
  }
  if (active === "deployment") {
    return "Campaigns — capital, schedule, run, prune, and review.";
  }
  return "Design phase — configure, back test, forward walk, then Curate.";
}

export default function StrategyLabChrome({
  active,
  children,
  hideTitle = false,
  subtitle,
}: {
  active: StrategyLabSuiteId;
  children: ReactNode;
  hideTitle?: boolean;
  subtitle?: string;
}) {
  const item = suiteItem(active);

  return (
    <>
      <div
        className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-3"
        data-testid="strategy-lab-chrome-top"
      >
        <nav
          className="justify-self-start text-sm text-[var(--color-label-secondary)]"
          aria-label="Breadcrumb"
        >
          <Link href="/app" className="hover:underline">
            Apps
          </Link>
          <span className="mx-2">›</span>
          <Link href="/app/strategy-lab" className="hover:underline">
            Strategy Lab
          </Link>
          <span className="mx-2">›</span>
          <span className="text-[var(--color-label)]">{item.label}</span>
        </nav>

        <div className="justify-self-center">
          <StrategyLabNav active={active} />
        </div>

        {/* Balances the breadcrumb column so the suite nav stays page-centered */}
        <div className="hidden sm:block" aria-hidden />
      </div>

      {!hideTitle && (
        <header className="mt-4 max-w-2xl">
          <h1
            className="font-semibold tracking-tight text-[var(--color-label)]"
            style={{ fontSize: "var(--text-title-1)", lineHeight: 1.15 }}
          >
            {item.label}
          </h1>
          {(subtitle || defaultSubtitle(active)) && (
            <p
              className="mt-1 text-[var(--color-label-secondary)]"
              style={{ fontSize: "var(--text-subheadline)", lineHeight: 1.4 }}
            >
              {subtitle || defaultSubtitle(active)}
            </p>
          )}
        </header>
      )}

      {children}
    </>
  );
}
