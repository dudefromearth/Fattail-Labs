"use client";

/**
 * Design-phase secondary nav: Board | Symbols.
 * Symbols is an attribute/catalog for Design (and selection in Curate) — not a suite tab.
 */

import Link from "next/link";
import {
  DESIGN_SUB_NAV,
  type DesignSubNavId,
} from "@/lib/strategyLabSuite";

export default function StrategyLabDesignSubNav({
  active,
}: {
  active: DesignSubNavId;
}) {
  return (
    <nav
      className="mt-3 inline-flex flex-wrap items-center gap-0.5 rounded-lg border border-[var(--color-separator)] bg-[var(--color-fill)]/50 p-0.5"
      aria-label="Design sub-navigation"
      data-testid="strategy-lab-design-subnav"
    >
      {DESIGN_SUB_NAV.map((item) => {
        const isActive = item.id === active;
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={[
              "inline-flex min-h-8 items-center justify-center rounded-md px-3 py-1 text-xs font-semibold transition-colors",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]",
              isActive
                ? "bg-[var(--color-surface)] text-[var(--color-label)] shadow-sm"
                : "text-[var(--color-label-secondary)] hover:text-[var(--color-label)]",
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
