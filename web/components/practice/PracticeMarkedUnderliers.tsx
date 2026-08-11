"use client";

/**
 * Shared mark universe — each row mid is bound only to that product's mark.
 * Proxy ETF prices never display as native index mids.
 */

import Link from "next/link";
import { useLiveUniverseMarks } from "@/lib/market/useLiveUniverseMarks";

function moneyPct(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export default function PracticeMarkedUnderliers() {
  const { rows, transport, error, lastHttpAt } = useLiveUniverseMarks({
    enabledOnly: true,
    pollMs: 8000,
  });

  return (
    <div className="space-y-4" data-testid="practice-marked-underliers">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-label)]">
          Marked underliers
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-label-secondary)]">
          One row ↔ one product key on the Market Bus (
          <code className="text-[11px]">mb:sym:{"{SYMBOL}"}</code>
          ). Index prints come from the native feed or options underlying —
          never a silent SPY mid labeled SPX.
        </p>
        <p className="mt-1 text-xs text-[var(--color-label-tertiary)]">
          Stream:{" "}
          <span
            className={
              transport === "stream"
                ? "font-medium text-emerald-600"
                : "text-[var(--color-label-secondary)]"
            }
            data-testid="practice-marks-transport"
          >
            {transport}
          </span>
          {lastHttpAt
            ? ` · HTTP ${Math.round((Date.now() - lastHttpAt) / 1000)}s ago`
            : ""}
          {" · "}
          <Link
            href="/admin/market-universe"
            className="font-medium text-[var(--color-tint)] hover:underline"
          >
            Admin · Market universe
          </Link>
        </p>
      </header>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-separator)]">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-separator)] text-[10px] uppercase tracking-wide text-[var(--color-label-tertiary)]">
              <th className="px-3 py-2 font-semibold">Symbol</th>
              <th className="px-2 py-2 font-semibold">Kind</th>
              <th className="px-2 py-2 font-semibold">Mid</th>
              <th className="px-2 py-2 font-semibold">Proxy</th>
              <th className="px-2 py-2 font-semibold">Prev</th>
              <th className="px-2 py-2 font-semibold">Day %</th>
              <th className="px-2 py-2 font-semibold">Source</th>
              <th className="px-3 py-2 font-semibold">Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr
                key={s.symbol}
                className="border-b border-[var(--color-separator)]/60"
                data-testid={`practice-symbol-${s.symbol}`}
                data-symbol={s.symbol}
              >
                <td className="px-3 py-2 font-mono font-semibold text-[var(--color-label)]">
                  {s.symbol}
                </td>
                <td className="px-2 py-2 text-xs capitalize text-[var(--color-label-secondary)]">
                  {s.kind || "—"}
                </td>
                <td
                  className={[
                    "px-2 py-2 font-mono tabular-nums font-medium",
                    s.displayMid != null
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-[var(--color-label-tertiary)]",
                  ].join(" ")}
                  data-testid={`practice-mid-${s.symbol}`}
                >
                  {s.displayMid != null
                    ? Number(s.displayMid).toFixed(2)
                    : "—"}
                </td>
                <td className="px-2 py-2 font-mono text-xs tabular-nums text-sky-700">
                  {s.viaProxy && s.proxyMid != null
                    ? `${Number(s.proxyMid).toFixed(2)}${
                        s.feedUsed || s.proxy_symbol
                          ? ` · ${s.feedUsed || s.proxy_symbol}`
                          : ""
                      }`
                    : "—"}
                </td>
                <td className="px-2 py-2 font-mono tabular-nums text-[var(--color-label-secondary)]">
                  {s.prev_close != null ? Number(s.prev_close).toFixed(2) : "—"}
                </td>
                <td className="px-2 py-2 font-mono tabular-nums text-[var(--color-label-secondary)]">
                  {moneyPct(s.day_change_pct)}
                </td>
                <td className="px-2 py-2 text-[10px] text-[var(--color-label-tertiary)]">
                  {[s.mark_plane, s.mark_source].filter(Boolean).join(" · ") ||
                    "—"}
                </td>
                <td className="px-3 py-2 text-xs text-[var(--color-label-secondary)]">
                  {s.note || "—"}
                </td>
              </tr>
            ))}
            {!rows.length && !error && (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-8 text-center text-[var(--color-label-tertiary)]"
                >
                  Loading universe…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
