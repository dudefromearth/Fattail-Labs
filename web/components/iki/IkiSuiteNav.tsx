"use client";

/**
 * IKI suite nav — Factory · Runner · About · Catalog
 * Factory/Runner: administrator only. Nav hide is not the URL gate.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchMe } from "@/lib/useIsAdmin";
import { ikiSuiteNavItems, type IkiSuiteId } from "@/lib/ikiSuite";

export default function IkiSuiteNav({ active }: { active: IkiSuiteId }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchMe().then((me) => setIsAdmin(me?.role === "administrator"));
  }, []);

  const items = ikiSuiteNavItems(isAdmin);

  return (
    <nav
      className="inline-flex max-w-full flex-wrap items-center justify-center gap-0.5 rounded-full bg-[var(--color-fill)] p-1"
      aria-label="IKI Lab apps"
      data-testid="iki-suite-nav"
    >
      {items.map((item) => {
        const isActive = item.id === active;
        const className = [
          "inline-flex min-h-9 items-center justify-center rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors sm:px-4",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]",
          isActive
            ? "bg-[var(--color-surface)] text-[var(--color-label)] shadow-[var(--elevation-1)]"
            : "text-[var(--color-label-secondary)] hover:text-[var(--color-label)]",
        ].join(" ");

        if (!item.available) {
          return (
            <span
              key={item.id}
              className={`${className} cursor-not-allowed opacity-50 hover:text-[var(--color-label-secondary)]`}
              aria-disabled="true"
              title="Not on this host"
              data-testid={`iki-suite-nav-${item.id}-unavailable`}
            >
              {item.label}
            </span>
          );
        }

        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={className}
            data-testid={`iki-suite-nav-${item.id}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
