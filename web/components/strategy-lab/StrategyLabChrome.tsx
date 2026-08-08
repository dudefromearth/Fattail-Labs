"use client";

/**
 * Shared chrome for Strategy Lab — matches Practice suite layout:
 * breadcrumb left · centered pill nav · balance column.
 * Design sub-nav (Board | Symbols) when on Design or Design/Symbols.
 */

import Link from "next/link";
import type { ReactNode } from "react";
import StrategyLabNav from "./StrategyLabNav";
import StrategyLabDesignSubNav from "./StrategyLabDesignSubNav";
import {
  suiteItem,
  type DesignSubNavId,
  type StrategyLabSuiteId,
} from "@/lib/strategyLabSuite";

function defaultSubtitle(
  active: StrategyLabSuiteId,
  designSub?: DesignSubNavId,
): string {
  if (active === "archive") {
    return "Retired strategies, reports, and logs — on your account.";
  }
  if (active === "development" && designSub === "symbols") {
    return "Symbol universe for Design (back test / forward walk) and Curate sim runs. Assign a symbol to each bot in the designer.";
  }
  if (active === "curation") {
    return "Curate phase — compare bots on shared live marks with sim capital before Deploy.";
  }
  if (active === "deployment") {
    return "Deploy — put curated strategies into live campaigns (capital, log, prune).";
  }
  return "Design phase — configure pack, assign symbol, back test, forward walk, then Curate.";
}

export default function StrategyLabChrome({
  active,
  children,
  hideTitle = false,
  subtitle,
  designSub,
}: {
  active: StrategyLabSuiteId;
  children: ReactNode;
  hideTitle?: boolean;
  subtitle?: string;
  /** When set (or active is development), show Design Board | Symbols sub-nav */
  designSub?: DesignSubNavId;
}) {
  const item = suiteItem(active);
  const showDesignSub = active === "development" || designSub != null;
  const designSubActive: DesignSubNavId = designSub ?? "board";

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
          {designSub === "symbols" ? (
            <>
              <span className="mx-2">›</span>
              <span className="text-[var(--color-label)]">Symbols</span>
            </>
          ) : null}
        </nav>

        <div className="justify-self-center">
          <StrategyLabNav active={active} />
        </div>

        <div className="hidden sm:block" aria-hidden />
      </div>

      {!hideTitle && (
        <header className="mt-4 max-w-2xl">
          <h1
            className="font-semibold tracking-tight text-[var(--color-label)]"
            style={{ fontSize: "var(--text-title-1)", lineHeight: 1.15 }}
          >
            {item.label}
            {designSub === "symbols" ? (
              <span className="text-[var(--color-label-secondary)]">
                {" "}
                · Symbols
              </span>
            ) : null}
          </h1>
          {(subtitle || defaultSubtitle(active, designSub)) && (
            <p
              className="mt-1 text-[var(--color-label-secondary)]"
              style={{ fontSize: "var(--text-subheadline)", lineHeight: 1.4 }}
            >
              {subtitle || defaultSubtitle(active, designSub)}
            </p>
          )}
          {showDesignSub ? (
            <StrategyLabDesignSubNav active={designSubActive} />
          ) : null}
        </header>
      )}

      {children}
    </>
  );
}
