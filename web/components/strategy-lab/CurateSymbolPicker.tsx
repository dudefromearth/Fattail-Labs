"use client";

/**
 * Symbol picker for Design (underlying attribute) and Curate (sim scan).
 * Catalog lives under Design → Symbols — not a top-level suite tab.
 * Live mids use the site-wide underlier pattern (not a one-shot catalog mid).
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatUnderlierMid } from "@/lib/market/liveUnderlierPattern";
import { useLiveUnderlierMarks } from "@/lib/market/useLiveUnderlierMarks";
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

  const { bySymbol } = useLiveUnderlierMarks({
    enabledOnly: true,
    pollMs: 5000,
  });

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
              {g.symbols.map((s) => {
                const mark = bySymbol.get(s.symbol.toUpperCase());
                const mid =
                  mark?.mid ??
                  (mark?.viaProxy ? mark.proxyMid : null) ??
                  s.mid ??
                  null;
                const proxy = mark?.viaProxy ?? Boolean(s.is_proxy);
                return (
                  <option key={s.symbol} value={s.symbol}>
                    {s.symbol}
                    {mid != null ? ` · ${formatUnderlierMid(mid)}` : ""}
                    {proxy ? " ~" : ""}
                    {s.options_cadence ? ` · ${s.options_cadence}` : ""}
                  </option>
                );
              })}
            </optgroup>
          ))
        )}
      </select>
      <p className="text-[10px] text-[var(--color-label-secondary)]">
        Organized by type. Live mids via site-wide underlier pattern. Full
        catalog under{" "}
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
