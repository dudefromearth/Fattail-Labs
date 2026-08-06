"use client";

/**
 * Shared high-visibility layout for Curate and Deploy run phases.
 * Grid or table of bot runs + mini equity charts.
 * Terminology: Bot = unit; Strategy = attribute of bot; Position = instance of bot.
 */

import { useMemo, useState } from "react";
import MiniEquityChart, {
  type EquityPoint,
} from "@/components/strategy-lab/MiniEquityChart";

export type PhaseRunRow = {
  id: string;
  title: string;
  subtitle?: string;
  status: string;
  symbol?: string;
  equity: number;
  vsBaseline: number;
  baseline: number;
  openPositions: number;
  openRisk: number;
  openUpnl: number;
  closedPositions: number;
  metaRight?: string;
  equitySeries: EquityPoint[];
  /** Pearson r of daily returns vs SPY (relative correlation) */
  corrVsSpy?: number | null;
  corrInterpretation?: string | null;
  href?: string;
};

export type PhaseRunDashboardProps = {
  phaseLabel: string;
  phaseKey: "curate" | "deploy";
  accountModeLabel: string;
  summary?: {
    runs: number;
    active: number;
    /** Number of distinct bots (preferred); strategies is legacy alias */
    bots?: number;
    strategies?: number;
  };
  rows: PhaseRunRow[];
  loading?: boolean;
  emptyHint?: string;
  toolbarExtra?: React.ReactNode;
  onRefresh?: () => void;
  headerSlot?: React.ReactNode;
  footerSlot?: React.ReactNode;
};

function money(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function statusTone(status: string) {
  if (status === "running") return "bg-emerald-100 text-emerald-800";
  if (status === "armed") return "bg-blue-100 text-blue-800";
  if (status === "paused" || status === "halted")
    return "bg-amber-100 text-amber-900";
  return "bg-slate-100 text-slate-600";
}

function corrLabel(r: number | null | undefined): string {
  if (r == null || Number.isNaN(r)) return "ρ —";
  const sign = r >= 0 ? "+" : "";
  return `ρ ${sign}${r.toFixed(2)}`;
}

function corrTone(r: number | null | undefined): string {
  if (r == null || Number.isNaN(r)) return "text-[var(--color-label-secondary)]";
  const a = Math.abs(r);
  if (a >= 0.7) return r >= 0 ? "text-violet-800" : "text-orange-800";
  if (a >= 0.4) return "text-sky-800";
  return "text-[var(--color-label-secondary)]";
}

export default function PhaseRunDashboard({
  phaseLabel,
  phaseKey,
  accountModeLabel,
  summary,
  rows,
  loading,
  emptyHint,
  toolbarExtra,
  onRefresh,
  headerSlot,
  footerSlot,
}: PhaseRunDashboardProps) {
  const [view, setView] = useState<"grid" | "table">("grid");

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const sa =
        a.status === "running" ? 0 : a.status === "armed" ? 1 : 2;
      const sb =
        b.status === "running" ? 0 : b.status === "armed" ? 1 : 2;
      if (sa !== sb) return sa - sb;
      return b.equity - a.equity;
    });
  }, [rows]);

  return (
    <section
      className="rounded-2xl border-2 border-blue-600/40 bg-[var(--color-surface)] shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
      data-phase-run={phaseKey}
      data-testid={`phase-run-dashboard-${phaseKey}`}
    >
      {/* Hero header */}
      <div className="border-b border-[var(--color-separator)] bg-gradient-to-r from-blue-600/[0.08] to-transparent px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-[var(--color-label)]">
                {phaseLabel}
              </h2>
              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                {accountModeLabel}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-[var(--color-label-secondary)]">
              {phaseKey === "curate"
                ? "Multi-bot sim book — compare bots, promote, portfolio. Same layout as Deploy."
                : "Live/paper bot runs — compare and manage. Same layout as Curate."}
            </p>
            {summary ? (
              <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-[var(--color-label-secondary)]">
                <span>
                  Runs{" "}
                  <strong className="text-[var(--color-label)]">
                    {summary.runs}
                  </strong>
                </span>
                <span>
                  Active{" "}
                  <strong className="text-[var(--color-label)]">
                    {summary.active}
                  </strong>
                </span>
                {(summary.bots ?? summary.strategies) != null ? (
                  <span>
                    Bots{" "}
                    <strong className="text-[var(--color-label)]">
                      {summary.bots ?? summary.strategies}
                    </strong>
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-[var(--color-separator)] p-0.5">
              <button
                type="button"
                onClick={() => setView("grid")}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                  view === "grid"
                    ? "bg-blue-600 text-white"
                    : "text-[var(--color-label-secondary)] hover:bg-[var(--color-fill)]"
                }`}
              >
                Grid
              </button>
              <button
                type="button"
                onClick={() => setView("table")}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                  view === "table"
                    ? "bg-blue-600 text-white"
                    : "text-[var(--color-label-secondary)] hover:bg-[var(--color-fill)]"
                }`}
              >
                Table
              </button>
            </div>
            {onRefresh ? (
              <button
                type="button"
                onClick={onRefresh}
                className="rounded-lg border border-[var(--color-separator)] px-2.5 py-1 text-xs font-semibold hover:bg-[var(--color-fill)]"
              >
                Refresh
              </button>
            ) : null}
            {toolbarExtra}
          </div>
        </div>
        {headerSlot ? <div className="mt-3">{headerSlot}</div> : null}
      </div>

      <div className="p-4 sm:p-5">
        {loading && !rows.length ? (
          <p className="text-sm text-[var(--color-label-secondary)]">
            Loading runs…
          </p>
        ) : !sorted.length ? (
          <div className="rounded-xl border border-dashed border-[var(--color-separator)] bg-[var(--color-fill)]/40 px-4 py-10 text-center">
            <p className="text-sm font-medium text-[var(--color-label)]">
              No {phaseLabel.toLowerCase()} runs yet
            </p>
            <p className="mt-1 text-xs text-[var(--color-label-secondary)]">
              {emptyHint ||
                "Create and arm instances to populate this dashboard."}
            </p>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {sorted.map((r) => (
              <article
                key={r.id}
                className="flex flex-col rounded-xl border border-[var(--color-separator)] bg-[var(--color-fill)]/30 p-3 shadow-sm transition hover:border-blue-400/60"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-[var(--color-label)]">
                      {r.title}
                    </h3>
                    <p className="truncate text-[10px] text-[var(--color-label-secondary)]">
                      {r.symbol ? `${r.symbol} · ` : ""}
                      {r.subtitle}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${statusTone(r.status)}`}
                  >
                    {r.status}
                  </span>
                </div>

                <div className="mt-2 flex items-end justify-between gap-2">
                  <div>
                    <div className="text-[10px] uppercase text-[var(--color-label-secondary)]">
                      Equity≈
                    </div>
                    <div className="font-mono text-lg font-bold tabular-nums text-[var(--color-label)]">
                      {money(r.equity)}
                    </div>
                    <div
                      className={`text-[11px] font-semibold tabular-nums ${
                        r.vsBaseline >= 0
                          ? "text-emerald-700"
                          : "text-rose-700"
                      }`}
                    >
                      {r.vsBaseline >= 0 ? "+" : ""}
                      {money(r.vsBaseline)}
                    </div>
                  </div>
                  <MiniEquityChart
                    series={r.equitySeries}
                    baseline={r.baseline}
                    width={140}
                    height={52}
                  />
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-[var(--color-label-secondary)]">
                  <span
                    className={`font-bold tabular-nums ${corrTone(r.corrVsSpy)}`}
                    title={
                      r.corrInterpretation ||
                      "Relative correlation vs SPY (Pearson daily returns)"
                    }
                  >
                    {corrLabel(r.corrVsSpy)}
                    <span className="ml-0.5 font-normal opacity-70">vs SPY</span>
                  </span>
                  <span>
                    Open{" "}
                    <strong className="text-[var(--color-label)]">
                      {r.openPositions}
                    </strong>
                  </span>
                  <span>
                    Risk{" "}
                    <strong className="text-[var(--color-label)]">
                      {money(r.openRisk)}
                    </strong>
                  </span>
                  <span>
                    uPnL{" "}
                    <strong className="text-[var(--color-label)]">
                      {money(r.openUpnl)}
                    </strong>
                  </span>
                  <span>
                    Closed{" "}
                    <strong className="text-[var(--color-label)]">
                      {r.closedPositions}
                    </strong>
                  </span>
                </div>
                {r.metaRight ? (
                  <div className="mt-1 text-[10px] text-[var(--color-label-secondary)]">
                    {r.metaRight}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] border-collapse text-left text-[12px]">
              <thead>
                <tr className="border-b border-[var(--color-separator)] text-[10px] uppercase tracking-wide text-[var(--color-label-secondary)]">
                  <th className="py-2 pr-2 font-semibold">Bot</th>
                  <th className="py-2 pr-2 font-semibold">Status</th>
                  <th className="py-2 pr-2 font-semibold">Symbol</th>
                  <th className="py-2 pr-2 font-semibold">ρ vs SPY</th>
                  <th className="py-2 pr-2 font-semibold">Equity path</th>
                  <th className="py-2 pr-2 font-semibold">Equity≈</th>
                  <th className="py-2 pr-2 font-semibold">vs alloc</th>
                  <th className="py-2 pr-2 font-semibold">Open</th>
                  <th className="py-2 pr-2 font-semibold">Risk</th>
                  <th className="py-2 font-semibold">Last tick</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-[var(--color-separator)]/70"
                  >
                    <td className="py-2 pr-2">
                      <div className="font-semibold text-[var(--color-label)]">
                        {r.title}
                      </div>
                      <div className="font-mono text-[10px] text-[var(--color-label-secondary)]">
                        {r.subtitle}
                      </div>
                    </td>
                    <td className="py-2 pr-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${statusTone(r.status)}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2 pr-2 font-mono font-semibold">
                      {r.symbol || "—"}
                    </td>
                    <td
                      className={`py-2 pr-2 font-mono font-bold tabular-nums ${corrTone(r.corrVsSpy)}`}
                      title={r.corrInterpretation || undefined}
                    >
                      {corrLabel(r.corrVsSpy)}
                    </td>
                    <td className="py-2 pr-2">
                      <MiniEquityChart
                        series={r.equitySeries}
                        baseline={r.baseline}
                        width={120}
                        height={40}
                      />
                    </td>
                    <td className="py-2 pr-2 font-mono font-semibold tabular-nums">
                      {money(r.equity)}
                    </td>
                    <td
                      className={`py-2 pr-2 font-mono tabular-nums ${
                        r.vsBaseline >= 0
                          ? "text-emerald-700"
                          : "text-rose-700"
                      }`}
                    >
                      {r.vsBaseline >= 0 ? "+" : ""}
                      {money(r.vsBaseline)}
                    </td>
                    <td className="py-2 pr-2 tabular-nums">
                      {r.openPositions}
                    </td>
                    <td className="py-2 pr-2 tabular-nums">
                      {money(r.openRisk)}
                    </td>
                    <td className="py-2 text-[10px] text-[var(--color-label-secondary)]">
                      {r.metaRight || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {footerSlot ? <div className="mt-4">{footerSlot}</div> : null}
      </div>
    </section>
  );
}
