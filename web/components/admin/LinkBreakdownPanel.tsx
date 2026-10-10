"use client";

// Links / QR — full ranked breakdown for one dimension (the "View all"
// drill-down behind a detail-page top-10 panel).

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Item = { key: string; count: number; pct: number };

type BreakdownResponse = {
  link: { label: string; slug: string };
  dimension: string;
  days: number;
  total_count: number;
  items: Item[];
};

const TITLES: Record<string, string> = {
  os_family: "Operating system",
  device_class: "Device",
  country: "Countries",
  region: "Regions",
  source: "Traffic sources",
  kind: "Scan vs. click",
};

const COLUMN_LABELS: Record<string, string> = {
  os_family: "OS",
  device_class: "Device",
  country: "Country",
  region: "Region",
  source: "Source",
  kind: "Kind",
};

export default function LinkBreakdownPanel({ slug, dimension, days }: { slug: string; dimension: string; days: number }) {
  const [state, setState] = useState<"loading" | "denied" | "error" | "ready">("loading");
  const [data, setData] = useState<BreakdownResponse | null>(null);

  const load = useCallback(() => {
    fetch(`/api/admin/links/${slug}/breakdown/${dimension}?days=${days}`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) {
          setState("denied");
          return;
        }
        setData(d);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, [slug, dimension, days]);

  useEffect(() => {
    load();
  }, [load]);

  if (state === "loading")
    return <main className="p-8 text-[var(--color-label-secondary)]">Loading…</main>;
  if (state === "denied" || state === "error" || !data) {
    return (
      <main className="p-8">
        <p className="text-[var(--color-destructive)]">Could not load this breakdown.</p>
      </main>
    );
  }

  const title = TITLES[dimension] ?? dimension;

  return (
    <main className="mx-auto max-w-2xl p-6" data-testid="link-breakdown-panel">
      <nav className="mb-4 flex gap-2 text-[length:var(--text-footnote)] text-[var(--color-label-secondary)]">
        <Link href="/admin" className="hover:underline">
          Admin
        </Link>
        <span>/</span>
        <Link href="/admin/links" className="hover:underline">
          Links / QR
        </Link>
        <span>/</span>
        <Link href={`/admin/links/${slug}`} className="hover:underline">
          {data.link.label}
        </Link>
        <span>/</span>
        <span className="text-[var(--color-label)]">{title}</span>
      </nav>

      <div className="rounded-[var(--radius-xl)] bg-[var(--color-surface)] p-5 shadow-[var(--elevation-1)]">
        <div className="mb-1 flex items-baseline justify-between">
          <h1 className="text-[length:var(--text-title-2)] font-semibold text-[var(--color-label)]">{title}</h1>
          <span className="text-[length:var(--text-footnote)] text-[var(--color-label-tertiary)]">
            {data.total_count} scans · last {days === 0 ? "all time" : `${days} days`}
          </span>
        </div>
        <table className="mt-4 w-full text-[length:var(--text-subheadline)]">
          <thead>
            <tr className="text-left text-[length:var(--text-caption)] uppercase tracking-wide text-[var(--color-label-tertiary)]">
              <th className="py-1 pr-3 font-semibold">#</th>
              <th className="py-1 pr-3 font-semibold">{COLUMN_LABELS[dimension] ?? dimension}</th>
              <th className="py-1 pr-3 text-right font-semibold">Scans</th>
              <th className="py-1 text-right font-semibold">%</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => (
              <tr key={item.key} className="border-t border-[var(--color-separator)]">
                <td className="py-2 pr-3 text-[var(--color-label-tertiary)]">{i + 1}</td>
                <td className="py-2 pr-3 font-medium text-[var(--color-label)]">{item.key}</td>
                <td className="py-2 pr-3 text-right font-[var(--font-mono)] text-[var(--color-label)]">{item.count}</td>
                <td className="py-2 text-right text-[var(--color-label-secondary)]">{item.pct}%</td>
              </tr>
            ))}
            {!data.items.length && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-[var(--color-label-tertiary)]">
                  No scans yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
