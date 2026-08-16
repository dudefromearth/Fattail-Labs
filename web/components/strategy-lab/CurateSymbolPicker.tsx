"use client";

/**
 * Symbol picker for Design (underlying attribute) and Curate (sim scan).
 * Catalog lives under Design → Symbols — not a top-level suite tab.
 * Options are symbol names only — no mids or cadence in the list.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchCurateSymbolCatalog,
  type CurateSymbolCatalog,
  type CurateSymbolGroup,
} from "@/lib/strategyLabCurateApi";

type Props = {
  value: string;
  onChange: (symbol: string) => void;
  /** tradeable only for instance create */
  tradeableOnly?: boolean;
  id?: string;
  /** Select only — no labels or catalog lecture. */
  compact?: boolean;
};

export default function CurateSymbolPicker({
  value,
  onChange,
  tradeableOnly = true,
  id = "curate-symbol",
  compact = false,
}: Props) {
  const [catalog, setCatalog] = useState<CurateSymbolCatalog | null>(null);

  useEffect(() => {
    void fetchCurateSymbolCatalog({ tradeable_only: tradeableOnly }).then(
      (c) => {
        setCatalog(c);
        if (c && c.symbols.length && !c.symbols.some((s) => s.symbol === value)) {
          const first = c.symbols[0]?.symbol;
          if (first) onChange(first);
        }
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once
  }, [tradeableOnly]);

  const groups: CurateSymbolGroup[] = catalog?.groups ?? [];

  const select = (
      <select
        id={id}
        aria-label="Underlying"
        className={
          compact
            ? "min-h-[var(--hit-min)] min-w-[8.5rem] rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 text-[var(--text-headline)] font-semibold text-[var(--color-label)] shadow-[var(--elevation-1)]"
            : "min-h-[var(--hit-min)] w-full min-w-[10rem] rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 text-[var(--text-body)] font-semibold text-[var(--color-label)]"
        }
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {!catalog ? (
          <option value={value || "SPY"}>{value || "Loading…"}</option>
        ) : (
          groups.map((g) => (
            <optgroup key={g.kind} label={g.label}>
              {g.symbols.map((s) => (
                <option key={s.symbol} value={s.symbol}>
                  {s.symbol}
                </option>
              ))}
            </optgroup>
          ))
        )}
      </select>
  );

  if (compact) return select;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={id}
          className="text-[10px] font-semibold text-[var(--color-label-secondary)]"
        >
          Underlying
        </label>
        <Link
          href={
            value
              ? `/app/strategy-lab/symbols/${encodeURIComponent(value)}`
              : "/app/strategy-lab/symbols"
          }
          className="text-[10px] font-semibold text-blue-600 hover:underline"
        >
          Symbol info →
        </Link>
      </div>
      {select}
    </div>
  );
}
