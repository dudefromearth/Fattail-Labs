"use client";

/**
 * Shared chrome for Practice suite apps:
 * breadcrumb · centered suite nav · Practice Context (account + date).
 * Work surfaces render as children.
 * Spec: Practice Context v0.2 — shared contexts in topmost chrome.
 */

import Link from "next/link";
import type { ReactNode } from "react";
import PracticeSuiteNav from "./PracticeSuiteNav";
import PracticeContextBar from "./PracticeContextBar";
import PracticeStoryStrip from "./PracticeStoryStrip";
import { PracticeContextProvider } from "@/lib/practiceContext";
import { suiteItem, type PracticeSuiteId } from "@/lib/practiceSuite";

function PracticeSuiteChromeInner({
  active,
  children,
  hideTitle = false,
  subtitle,
  contextInert = false,
  contextInertMessage,
}: {
  active: PracticeSuiteId;
  children: ReactNode;
  hideTitle?: boolean;
  subtitle?: string;
  contextInert?: boolean;
  contextInertMessage?: string;
}) {
  const item = suiteItem(active);

  return (
    <>
      {/* Top chrome: breadcrumb + suite nav on one row (nav centered).
          Account/date context bar stays below this line. */}
      <div
        className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-3"
        data-testid="practice-chrome-top"
      >
        <nav
          className="justify-self-start text-sm text-[var(--color-label-secondary)]"
          aria-label="Breadcrumb"
        >
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

        <div className="justify-self-center">
          <PracticeSuiteNav active={active} />
        </div>

        {/* Balances the breadcrumb column so the suite nav stays page-centered */}
        <div className="hidden sm:block" aria-hidden />
      </div>

      {/* Account + Date — always below the breadcrumb/nav line */}
      <PracticeContextBar
        inertHint={contextInert}
        inertMessage={contextInertMessage}
      />

      <PracticeStoryStrip className="mt-3" />

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
          <p className="mt-2 text-sm text-[var(--color-label-secondary)]">
            <Link
              href="/app/toughness"
              className="font-medium text-[var(--color-tint)] hover:underline"
            >
              Toughness
            </Link>
            {" — "}
            FatTail Hard / True 75 (capacity training, Mental Toughness meter)
          </p>
        </header>
      )}

      {children}
    </>
  );
}

export default function PracticeSuiteChrome({
  active,
  children,
  hideTitle = false,
  subtitle,
  contextInert = false,
  contextInertMessage,
}: {
  active: PracticeSuiteId;
  children: ReactNode;
  hideTitle?: boolean;
  subtitle?: string;
  /** Completed retrospective: contexts visible but do not change render. */
  contextInert?: boolean;
  contextInertMessage?: string;
}) {
  return (
    <PracticeContextProvider>
      <PracticeSuiteChromeInner
        active={active}
        hideTitle={hideTitle}
        subtitle={subtitle}
        contextInert={contextInert}
        contextInertMessage={contextInertMessage}
      >
        {children}
      </PracticeSuiteChromeInner>
    </PracticeContextProvider>
  );
}
