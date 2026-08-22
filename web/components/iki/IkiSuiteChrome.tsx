"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import CompileLauncher from "@/components/wiki/CompileLauncher";
import IkiSuiteNav from "./IkiSuiteNav";
import { ikiSuiteItem, type IkiSuiteId } from "@/lib/ikiSuite";

export default function IkiSuiteChrome({
  active,
  children,
  workspace = false,
}: {
  active: IkiSuiteId;
  children: ReactNode;
  /** Compact top bar; child fills remaining viewport (Heatmap workspace). */
  workspace?: boolean;
}) {
  const item = ikiSuiteItem(active);
  const topNav = (
    <div
      className="shrink-0 grid grid-cols-1 items-center gap-2 px-3 py-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-3 sm:px-4"
      data-testid="iki-suite-chrome-top"
    >
      <nav
        className="justify-self-start text-sm text-[var(--color-label-secondary)]"
        aria-label="Breadcrumb"
      >
        <Link
          href="/app"
          className="rounded-sm hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]"
        >
          Apps
        </Link>
        <span className="mx-2 text-[var(--color-label-tertiary)]" aria-hidden>
          ›
        </span>
        <Link
          href="/app/wiki"
          className="rounded-sm hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]"
        >
          IKI Lab
        </Link>
        <span className="mx-2 text-[var(--color-label-tertiary)]" aria-hidden>
          ›
        </span>
        <span className="font-medium text-[var(--color-label)]">
          {item.label}
        </span>
      </nav>
      <div className="justify-self-center">
        <IkiSuiteNav active={active} />
      </div>
      <div className="hidden sm:block" aria-hidden />
    </div>
  );

  if (workspace) {
    return (
      <div
        className="flex h-[calc(100dvh-4.5rem)] min-h-0 w-full flex-col overflow-hidden"
        data-testid="iki-suite-chrome"
      >
        <div className="shrink-0 border-b border-[var(--color-separator)] bg-[var(--color-surface)]">
          {topNav}
        </div>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        <ErrorBoundary>
          <CompileLauncher />
        </ErrorBoundary>
      </div>
    );
  }

  return (
    <div data-testid="iki-suite-chrome">
      <div className="border-b border-[var(--color-separator)] bg-[var(--color-surface)]">
        {topNav}
      </div>
      {children}
      <ErrorBoundary>
        <CompileLauncher />
      </ErrorBoundary>
    </div>
  );
}
