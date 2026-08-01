"use client";

/**
 * Toughness suite segmented control — True 75 · FatTail Hard · Today.
 * Mirrors Practice suite nav pattern (Apps hub → suite → work surface).
 */

import Link from "next/link";

export type ToughnessSuiteId = "hub" | "true-75" | "fattail-hard" | "today";

const ITEMS: { id: ToughnessSuiteId; label: string; href: string }[] = [
  { id: "true-75", label: "True 75", href: "/app/toughness/true-75" },
  {
    id: "fattail-hard",
    label: "FatTail Hard",
    href: "/app/toughness/fattail-hard",
  },
  { id: "today", label: "Today", href: "/app/toughness/today" },
];

export default function ToughnessSuiteNav({
  active,
}: {
  active: ToughnessSuiteId;
}) {
  return (
    <nav
      className="inline-flex max-w-full flex-wrap items-center justify-center gap-0.5 rounded-full bg-[var(--color-fill)] p-1"
      aria-label="Toughness programs"
      data-testid="toughness-suite-nav"
    >
      {ITEMS.map((item) => {
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
