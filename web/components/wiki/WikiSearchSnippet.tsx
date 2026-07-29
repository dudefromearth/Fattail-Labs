"use client";

// Search snippet: plain text with query-term highlights (Wiki Interface Spec §4).
// Server strips markdown to plain text; this layer only highlights hits.

import { useMemo, type ReactNode } from "react";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Split plain text and wrap whole-term hits in <mark>. */
export function highlightPlainText(text: string, query: string): ReactNode[] {
  const terms = query
    .trim()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  if (!text || terms.length === 0) {
    return [text];
  }
  const pattern = terms.map(escapeRegExp).join("|");
  const re = new RegExp(`(${pattern})`, "gi");
  const parts = text.split(re);
  return parts.map((part, i) => {
    if (!part) return null;
    const hit = terms.some((t) => part.toLowerCase() === t.toLowerCase());
    if (hit) {
      return (
        <mark
          key={i}
          className="rounded-sm bg-[var(--color-tint-soft,rgba(16,185,129,0.2))] px-0.5 font-medium text-[var(--color-label)]"
        >
          {part}
        </mark>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function WikiSearchSnippet({
  text,
  query,
  className = "",
}: {
  text: string;
  query: string;
  className?: string;
}) {
  const nodes = useMemo(() => highlightPlainText(text, query), [text, query]);
  if (!text) return null;
  return (
    <p
      className={
        className ||
        "mt-2 text-sm leading-relaxed text-[var(--color-label-secondary)]"
      }
    >
      {nodes}
    </p>
  );
}
