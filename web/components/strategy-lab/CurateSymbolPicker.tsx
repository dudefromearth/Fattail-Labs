"use client";

/**
 * Symbol picker for Design (underlying attribute) and Curate (sim scan).
 * Catalog lives under Design → Symbols — not a top-level suite tab.
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
};

export default function CurateSymbolPicker({
  value,
  onChange,
  tradeableOnly = true,
  id = "curate-symbol",
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

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={id}
          className="text-[10px] font-semibold text-[var(--color-label-secondary)]"
        >
          Symbol
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
      <select
        id={id}
        className="w-full min-w-[10rem] rounded border border-[var(--color-separator)] bg-[var(--color-surface)] px-2 py-1.5 text-xs font-semibold"
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
                  {s.mid != null ? ` · ${s.mid.toFixed(2)}` : ""}
                  {s.is_proxy ? " ~" : ""}
                  {s.options_cadence ? ` · ${s.options_cadence}` : ""}
                </option>
              ))}
            </optgroup>
          ))
        )}
      </select>
      <p className="text-[10px] text-[var(--color-label-secondary)]">
        Organized by type. Full catalog under{" "}
        <Link
          href="/app/strategy-lab/symbols"
          className="text-blue-600 hover:underline"
        >
          Design → Symbols
        </Link>
        . Reference-only (VIX / VIX1D) are not scan opens.
      </p>
    </div>
  );
}
