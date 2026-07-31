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
      {/* Breadcrumb — left aligned */}
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

      {/* Suite nav — centered on the page axis (Spec §0) */}
      <div className="mt-4 flex justify-center">
        <PracticeSuiteNav active={active} />
      </div>

      {/* Account + Date — Practice-level only, always stated */}
      <PracticeContextBar
        inertHint={contextInert}
        inertMessage={contextInertMessage}
      />

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
