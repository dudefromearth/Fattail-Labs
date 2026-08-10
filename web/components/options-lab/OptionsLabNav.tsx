"use client";

/**
 * Options Lab suite nav — HIG segmented control (Practice / Strategy Lab pattern).
 * Volume Profile · Heatmap · Analyzer
 */

import Link from "next/link";
import {
  OPTIONS_LAB_SUITE,
  type OptionsLabAppId,
} from "@/lib/optionsLabSuite";

export default function OptionsLabNav({ active }: { active: OptionsLabAppId }) {
  return (
    <nav
      className="inline-flex max-w-full flex-wrap items-center justify-center gap-0.5 rounded-full bg-[var(--color-fill)] p-1"
      aria-label="Options Lab apps"
      data-testid="options-lab-suite-nav"
    >
      {OPTIONS_LAB_SUITE.map((item) => {
        const isActive = item.id === active;
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={[
              "inline-flex min-h-9 items-center justify-center rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors sm:px-4",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]",
              isActive
                ? "bg-[var(--color-surface)] text-[var(--color-label)] shadow-[var(--elevation-1)]"
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
