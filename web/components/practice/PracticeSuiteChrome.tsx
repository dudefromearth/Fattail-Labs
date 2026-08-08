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

function Breadcrumb({ label }: { label: string }) {
  return (
    <nav
      className="text-sm text-[var(--color-label-secondary)]"
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
      <span className="text-[var(--color-label)]">{label}</span>
    </nav>
  );
}

function PracticeSuiteChromeInner({
  active,
  children,
  hideTitle = false,
  subtitle,
  contextInert = false,
  contextInertMessage,
  hideStoryStrip = false,
  hideToughness = false,
  breadcrumbUnderTitle = false,
}: {
  active: PracticeSuiteId;
  children: ReactNode;
  hideTitle?: boolean;
  subtitle?: string;
  contextInert?: boolean;
  contextInertMessage?: string;
  hideStoryStrip?: boolean;
  hideToughness?: boolean;
  /** When true, breadcrumb sits under the page title (quieter header). */
  breadcrumbUnderTitle?: boolean;
}) {
  const item = suiteItem(active);

  return (
    <>
      {/* Top chrome: suite nav centered; breadcrumb optional on this row. */}
      <div
        className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-3"
        data-testid="practice-chrome-top"
      >
        {!breadcrumbUnderTitle ? (
          <div className="justify-self-start">
            <Breadcrumb label={item.label} />
          </div>
        ) : (
          <div className="hidden sm:block" aria-hidden />
        )}

        <div className="justify-self-center">
          <PracticeSuiteNav active={active} />
        </div>

        <div className="hidden sm:block" aria-hidden />
      </div>

      <PracticeContextBar
        inertHint={contextInert}
        inertMessage={contextInertMessage}
      />

      {!hideStoryStrip && <PracticeStoryStrip className="mt-3" />}

      {!hideTitle ? (
        <header className="mt-4 max-w-2xl">
          <h1
            className="font-semibold tracking-tight text-[var(--color-label)]"
            style={{ fontSize: "var(--text-title-1)", lineHeight: 1.15 }}
          >
            {item.label}
          </h1>
          {breadcrumbUnderTitle && (
            <div className="mt-1.5">
              <Breadcrumb label={item.label} />
            </div>
          )}
          {(subtitle || item.blurb) && (
            <p
              className="mt-1 text-[var(--color-label-secondary)]"
              style={{ fontSize: "var(--text-subheadline)", lineHeight: 1.4 }}
            >
              {subtitle || item.blurb}
            </p>
          )}
          {!hideToughness && (
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
          )}
        </header>
      ) : breadcrumbUnderTitle ? (
        <div className="mt-2">
          <Breadcrumb label={item.label} />
        </div>
      ) : null}

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
  hideStoryStrip = false,
  hideToughness = false,
  breadcrumbUnderTitle = false,
}: {
  active: PracticeSuiteId;
  children: ReactNode;
  hideTitle?: boolean;
  subtitle?: string;
  /** Completed retrospective: contexts visible but do not change render. */
  contextInert?: boolean;
  contextInertMessage?: string;
  hideStoryStrip?: boolean;
  hideToughness?: boolean;
  breadcrumbUnderTitle?: boolean;
}) {
  return (
    <PracticeContextProvider>
      <PracticeSuiteChromeInner
        active={active}
        hideTitle={hideTitle}
        subtitle={subtitle}
        contextInert={contextInert}
        contextInertMessage={contextInertMessage}
        hideStoryStrip={hideStoryStrip}
        hideToughness={hideToughness}
        breadcrumbUnderTitle={breadcrumbUnderTitle}
      >
        {children}
      </PracticeSuiteChromeInner>
    </PracticeContextProvider>
  );
}
