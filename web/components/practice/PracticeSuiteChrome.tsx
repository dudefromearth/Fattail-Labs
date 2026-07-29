"use client";

/**
 * Shared chrome for Practice suite apps: breadcrumb + centered suite nav.
 * Work surfaces (blotter, calendar, etc.) render as children.
 */

import Link from "next/link";
import PracticeSuiteNav from "./PracticeSuiteNav";
import { suiteItem, type PracticeSuiteId } from "@/lib/practiceSuite";

export default function PracticeSuiteChrome({
  active,
  children,
  /** When true, omit the large page title (Journal calendar is the hero). */
  hideTitle = false,
  subtitle,
}: {
  active: PracticeSuiteId;
  children: React.ReactNode;
  hideTitle?: boolean;
  subtitle?: string;
}) {
  const item = suiteItem(active);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <nav className="text-sm text-[var(--color-label-secondary)]">
          <Link href="/app" className="hover:underline">
            Apps
          </Link>
          <span className="mx-2">›</span>
          <Link href="/app/practice" className="hover:underline">
            Practice
          </Link>
          <span className="mx-2">›</span>
          <span className="text-[var(--color-label)]">{item.label}</span>
        </nav>
        <div className="flex justify-center sm:justify-end">
          <PracticeSuiteNav active={active} />
        </div>
      </div>

      {!hideTitle && (
        <header className="mt-4 max-w-2xl">
          <h1
            className="font-semibold tracking-tight text-[var(--color-label)]"
            style={{ fontSize: "var(--text-title-1)", lineHeight: 1.15 }}
          >
            {item.label}
          </h1>
          {(subtitle || item.blurb) && (
            <p
              className="mt-1 text-[var(--color-label-secondary)]"
              style={{ fontSize: "var(--text-subheadline)", lineHeight: 1.4 }}
            >
              {subtitle || item.blurb}
            </p>
          )}
        </header>
      )}

      {children}
    </>
  );
}
