"use client";

/**
 * Shared symbol universe catalog — Design sub-nav (Board | Symbols).
 * Assign symbols to bots in the designer; re-select in Curate for sim runs.
 */

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import StrategyLabChrome from "@/components/strategy-lab/StrategyLabChrome";
import CorrelationCalculator from "@/components/strategy-lab/CorrelationCalculator";
import {
  fetchCurateSymbolCatalog,
  type CurateSymbolCatalog,
  type CurateSymbolRow,
} from "@/lib/strategyLabCurateApi";

function moneyPct(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

function SymbolTable({ rows }: { rows: CurateSymbolRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] border-collapse text-left text-[12px]">
        <thead>
          <tr className="border-b border-[var(--color-separator)] text-[10px] uppercase tracking-wide text-[var(--color-label-secondary)]">
            <th className="py-1.5 pr-2 font-semibold">Symbol</th>
            <th className="py-1.5 pr-2 font-semibold">Role</th>
            <th className="py-1.5 pr-2 font-semibold">Mid</th>
            <th className="py-1.5 pr-2 font-semibold">Prev</th>
            <th className="py-1.5 pr-2 font-semibold">Day %</th>
            <th className="py-1.5 pr-2 font-semibold">Options</th>
            <th className="py-1.5 font-semibold">Note</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr
              key={s.symbol}
              className="border-b border-[var(--color-separator)]/70"
            >
              <td className="py-2 pr-2">
                <Link
                  href={`/app/strategy-lab/symbols/${encodeURIComponent(s.symbol)}`}
                  className="font-mono text-sm font-bold text-blue-700 hover:underline"
                >
                  {s.symbol}
                  {s.is_proxy ? (
                    <span className="ml-1 text-[10px] text-sky-700">~</span>
                  ) : null}
                </Link>
              </td>
              <td className="py-2 pr-2 text-[11px] capitalize text-[var(--color-label-secondary)]">
                {s.role}
              </td>
              <td className="py-2 pr-2 font-mono tabular-nums">
                {s.mid != null ? s.mid.toFixed(2) : "—"}
              </td>
              <td className="py-2 pr-2 font-mono tabular-nums text-[var(--color-label-secondary)]">
                {s.prev_close != null ? s.prev_close.toFixed(2) : "—"}
              </td>
              <td
                className={`py-2 pr-2 font-mono tabular-nums ${
                  (s.day_change_pct ?? 0) >= 0
                    ? "text-rose-700"
                    : "text-emerald-700"
                }`}
              >
                {moneyPct(s.day_change_pct)}
              </td>
              <td className="py-2 pr-2 text-[11px] text-[var(--color-label-secondary)]">
                {s.options_cadence || "—"}
              </td>
              <td className="py-2 text-[11px] text-[var(--color-label-secondary)]">
                {s.note || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function StrategyLabSymbolsApp() {
  const [catalog, setCatalog] = useState<CurateSymbolCatalog | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const c = await fetchCurateSymbolCatalog();
    if (!c) setErr("Could not load symbol universe");
    else {
      setErr(null);
      setCatalog(c);
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 15000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <StrategyLabChrome
        active="development"
        designSub="symbols"
        subtitle="Shared universe — assign a symbol to each bot in Design (back test / forward walk); re-select in Curate for sim. Deploy only runs curated bots."
      >
        <div className="mt-4 space-y-6">
          <CorrelationCalculator />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-[var(--color-label-secondary)]">
              One stream feeds every collection. Click a symbol for detail. Use
              the designer to attach a symbol to a bot.
            </p>
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-lg border border-[var(--color-separator)] px-2.5 py-1 text-xs font-semibold hover:bg-[var(--color-fill)]"
            >
              Refresh
            </button>
          </div>

          {err ? <p className="text-sm text-rose-600">{err}</p> : null}

          {!catalog ? (
            <p className="text-sm text-[var(--color-label-secondary)]">
              Loading universe…
            </p>
          ) : (
            catalog.groups.map((g) => (
              <section
                key={g.kind}
                className="rounded-xl border border-[var(--color-separator)] bg-[var(--color-surface)] p-4"
              >
                <h2 className="text-base font-semibold text-[var(--color-label)]">
                  {g.label}
                  <span className="ml-2 text-xs font-normal text-[var(--color-label-secondary)]">
                    {g.symbols.length}
                  </span>
                </h2>
                <div className="mt-3">
                  <SymbolTable rows={g.symbols} />
                </div>
              </section>
            ))
          )}

          <p className="text-[11px] text-[var(--color-label-secondary)]">
            ~ = proxy mark (index feed not entitled).{" "}
            <Link
              href="/app/strategy-lab?phase=development"
              className="text-blue-600 hover:underline"
            >
              ← Back to Design board
            </Link>
            {" · "}
            <Link
              href="/app/strategy-lab?phase=curation"
              className="text-blue-600 hover:underline"
            >
              Curate
            </Link>
          </p>
        </div>
      </StrategyLabChrome>
    </main>
  );
}
