"use client";

import { algoNarrativeLines } from "@/lib/options-lab/algoNarrative";

export default function AlgoNarrativePanel({
  phase,
  side,
  symbol,
  fPct,
  xS,
  gexOn,
  vpOn,
  decayFast,
}: {
  phase: "waiting" | "armed" | "recorded";
  side: "near" | "far";
  symbol: string;
  fPct: number | null;
  xS: number | null;
  gexOn: boolean;
  vpOn: boolean;
  decayFast: boolean;
}) {
  const lines = algoNarrativeLines({
    phase,
    side,
    symbol,
    fPct,
    xS,
    gexOn,
    vpOn,
    decayFast,
  });
  return (
    <aside
      className="pointer-events-auto absolute left-3 top-16 z-30 max-h-[min(22rem,50%)] w-[min(22rem,calc(100%-1.5rem))] overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)]/90 p-3 text-[length:var(--text-subheadline)] leading-snug text-[var(--color-label)] shadow-[var(--elevation-3)]"
      data-testid="analyzer-algo-narrative"
      data-algo-phase={phase}
      data-algo-side={side}
    >
      <div className="mb-1 text-[length:var(--text-caption)] font-semibold uppercase tracking-wide text-[var(--color-label-secondary)]">
        Algo · {symbol}
      </div>
      {lines.map((l) => (
        <p key={l} className="mt-1.5">
          {l}
        </p>
      ))}
    </aside>
  );
}
