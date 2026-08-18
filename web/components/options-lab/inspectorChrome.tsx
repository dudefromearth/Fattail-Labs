"use client";

/**
 * Shared Options Lab inspector chrome (Analyzer + Heatmap).
 * Human Interface Spec v1.0 — grouped insets, 44pt rows, tokens only.
 */

import type { ReactNode } from "react";

export const INSPECTOR_W = "22.5rem";

export const inspectorGroup =
  "overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-separator)] " +
  "bg-[var(--color-surface)] shadow-[var(--elevation-1)]";

export const inspectorRow =
  "flex min-h-[var(--hit-min)] items-center gap-3 border-b border-[var(--color-separator)] " +
  "px-3 last:border-b-0";

export const inspectorRowLabel =
  "w-[7rem] shrink-0 text-[length:var(--text-subheadline)] text-[var(--color-label)]";

export const inspectorField =
  "min-h-[var(--hit-min)] w-full min-w-0 bg-transparent px-0 text-right " +
  "text-[length:var(--text-subheadline)] text-[var(--color-label)] outline-none " +
  "focus-visible:bg-[var(--color-fill)]/60";

export const inspectorSectionHeader =
  "px-1 pb-1.5 text-[length:var(--text-footnote)] font-semibold text-[var(--color-label-secondary)]";

export const inspectorListRow =
  "flex min-h-[var(--hit-min)] w-full items-center justify-between px-3 text-left " +
  "text-[length:var(--text-subheadline)] text-[var(--color-label)] " +
  "hover:bg-[var(--color-fill)] disabled:pointer-events-none disabled:opacity-45 " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] " +
  "focus-visible:outline-[var(--color-tint)]";

export const inspectorAside =
  "flex max-h-[42dvh] w-full shrink-0 flex-col overflow-y-auto " +
  "border-b border-[var(--color-separator)] " +
  "bg-[var(--color-surface-secondary)] " +
  "md:max-h-none md:w-[22.5rem] md:border-b-0 md:border-r";

export const inspectorStickyNav =
  "sticky top-0 z-10 border-b border-[var(--color-separator)] " +
  "bg-[var(--color-surface)]/90 px-4 pb-3 pt-2 backdrop-blur-md";

export const inspectorBody = "flex flex-col gap-5 px-4 py-4";

export const inspectorFooter =
  "bg-[var(--color-surface-secondary)]/80 px-3 py-3 text-[length:var(--text-caption)] " +
  "leading-snug text-[var(--color-label-tertiary)]";

export function InspectorSection({
  title,
  children,
  testId,
}: {
  title: string;
  children: ReactNode;
  testId?: string;
}) {
  return (
    <section data-testid={testId}>
      <h3 className={inspectorSectionHeader}>{title}</h3>
      <div className={inspectorGroup}>{children}</div>
    </section>
  );
}
