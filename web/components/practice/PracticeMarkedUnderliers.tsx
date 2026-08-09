"use client";

/**
 * Common read view of shared mark universe — Practice mirror of Lab Design → Symbols.
 * SoR: market_symbol_universe (admin CRUD). Not a suite pill.
 */

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  fetchMarketUniverse,
  type MarketUniverseSymbol,
} from "@/lib/capitalApi";

function moneyPct(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export default function PracticeMarkedUnderliers() {
  const [rows, setRows] = useState<MarketUniverseSymbol[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await fetchMarketUniverse({ enabledOnly: true });
      setRows(d.symbols || []);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 30000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <div className="space-y-4" data-testid="practice-marked-underliers">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-label)]">
          Marked underliers
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-label-secondary)]">
          Shared mark universe for{" "}
          <strong className="font-medium text-[var(--color-label)]">
            Practice Positions
          </strong>{" "}
          and Strategy Lab — one source of truth. Trade Log still accepts any
          ticker; symbols not on this list price{" "}
          <em>at cost</em> until an admin adds them (and the stream marks them).
        </p>
        <p className="mt-1 text-xs text-[var(--color-label-tertiary)]">
          Operators manage the list in{" "}
          <Link
            href="/admin/market-universe"
            className="font-medium text-[var(--color-tint)] hover:underline"
          >
            Admin · Market universe
          </Link>
          . Lab catalog:{" "}
          <Link
            href="/app/strategy-lab/symbols"
            className="font-medium text-[var(--color-tint)] hover:underline"
          >
            Strategy Lab · Symbols
          </Link>
          .
        </p>
      </header>

      {err && (
        <p className="text-sm text-red-600" role="alert">
          {err}
        </p>
      )}

      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-separator)]">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-separator)] text-[10px] uppercase tracking-wide text-[var(--color-label-tertiary)]">
              <th className="px-3 py-2 font-semibold">Symbol</th>
              <th className="px-2 py-2 font-semibold">Kind</th>
              <th className="px-2 py-2 font-semibold">Mid</th>
              <th className="px-2 py-2 font-semibold">Prev</th>
              <th className="px-2 py-2 font-semibold">Day %</th>
              <th className="px-2 py-2 font-semibold">Feed</th>
              <th className="px-3 py-2 font-semibold">Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr
                key={s.symbol}
                className="border-b border-[var(--color-separator)]/60"
                data-testid={`practice-symbol-${s.symbol}`}
              >
                <td className="px-3 py-2 font-mono font-semibold text-[var(--color-label)]">
                  {s.symbol}
                </td>
                <td className="px-2 py-2 text-xs capitalize text-[var(--color-label-secondary)]">
                  {s.kind || "—"}
                </td>
                <td className="px-2 py-2 font-mono tabular-nums">
                  {s.mid != null ? s.mid.toFixed(2) : "—"}
                </td>
                <td className="px-2 py-2 font-mono tabular-nums text-[var(--color-label-secondary)]">
                  {s.prev_close != null ? s.prev_close.toFixed(2) : "—"}
                </td>
                <td className="px-2 py-2 font-mono tabular-nums text-[var(--color-label-secondary)]">
                  {moneyPct(s.day_change_pct)}
                </td>
                <td className="px-2 py-2 text-xs text-[var(--color-label-tertiary)]">
                  {s.feed_symbol || s.proxy_symbol
                    ? [s.feed_symbol, s.proxy_symbol && `proxy ${s.proxy_symbol}`]
                        .filter(Boolean)
                        .join(" · ")
                    : "—"}
                </td>
                <td className="max-w-[14rem] truncate px-3 py-2 text-xs text-[var(--color-label-tertiary)]">
                  {s.note || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && !err && (
          <p className="p-4 text-sm text-[var(--color-label-secondary)]">
            No enabled underliers. An administrator can add symbols under Market
            universe.
          </p>
        )}
      </div>
    </div>
  );
}
