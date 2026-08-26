"use client";

import { filterOnLabel } from "@/lib/autofilter/apply";

/** A9 — shown/total + Filter on. Strategy Lab dashboard treatment. */
export default function FilterOnMark({
  shown,
  total,
  active,
}: {
  shown: number;
  total: number;
  active: boolean;
}) {
  if (!active) return null;
  const ratio =
    total > 0 ? filterOnLabel(shown, total).replace(/^Filter on — /, "") : null;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border-2 border-amber-500 bg-amber-100 px-2.5 py-0.5 text-xs font-bold tabular-nums text-amber-950"
      data-testid="autofilter-filter-on"
      data-filtered="true"
    >
      <span className="text-[10px] font-extrabold uppercase tracking-wide text-amber-800">
        Filter on
      </span>
      {ratio ? <span className="font-mono">{ratio}</span> : null}
    </span>
  );
}
