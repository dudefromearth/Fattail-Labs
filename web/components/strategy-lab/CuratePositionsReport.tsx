"use client";

/**
 * Member report: all Curate sim positions + progress across instances.
 * Not Tradier Deploy.
 */

import { useCallback, useEffect, useState } from "react";
import {
  fetchCuratePositionsReport,
  type CuratePositionReportRow,
  type CuratePositionsReport,
} from "@/lib/strategyLabCurateApi";

type Props = {
  strategyId?: string;
  /** When set, default filter to this strategy only */
  compact?: boolean;
};

function money(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function ProgressBar({ frac }: { frac: number }) {
  // frac -1..1 → bar centered at 50%
  const pct = ((frac + 1) / 2) * 100;
  const tone =
    frac > 0.05 ? "bg-emerald-500" : frac < -0.05 ? "bg-rose-500" : "bg-slate-400";
  return (
    <div
      className="relative h-2 w-full max-w-[8rem] overflow-hidden rounded-full bg-[var(--color-fill)]"
      title={`progress_frac ${frac.toFixed(2)} (−1 loss … +1 max profit)`}
    >
      <div
        className={`absolute top-0 h-full w-1 ${tone}`}
        style={{ left: `calc(${pct}% - 2px)` }}
      />
      <div className="absolute left-1/2 top-0 h-full w-px bg-[var(--color-separator)]" />
    </div>
  );
}

export default function CuratePositionsReportPanel({
  strategyId,
  compact,
}: Props) {
  const [status, setStatus] = useState<"all" | "open" | "closed">("all");
  const [report, setReport] = useState<CuratePositionsReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetchCuratePositionsReport({
        status,
        strategy_id: strategyId,
        limit: 200,
      });
      if (!r) {
        setError("Could not load positions report");
        setReport(null);
        return;
      }
      setReport(r);
    } finally {
      setLoading(false);
    }
  }, [status, strategyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const rows: CuratePositionReportRow[] = report?.positions ?? [];

  return (
    <div
      className={`rounded-xl border border-[var(--color-separator)] bg-[var(--color-surface)] ${
        compact ? "p-2.5" : "p-3"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-label)]">
            Positions report
          </h3>
          <p className="mt-0.5 text-[11px] text-[var(--color-label-secondary)]">
            Curate sim packages (fake money) — not Tradier Deploy. Progress:
            −1 max loss · 0 flat · +1 max profit.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(["all", "open", "closed"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`rounded-md px-2 py-1 text-[11px] font-semibold capitalize ${
                status === s
                  ? "bg-blue-600 text-white"
                  : "border border-[var(--color-separator)] text-[var(--color-label-secondary)] hover:bg-[var(--color-fill)]"
              }`}
            >
              {s}
            </button>
          ))}
          <button
            type="button"
            disabled={loading}
            onClick={() => void load()}
            className="rounded-md border border-[var(--color-separator)] px-2 py-1 text-[11px] font-semibold hover:bg-[var(--color-fill)] disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-2 text-xs text-rose-600">{error}</p>
      ) : null}

      {report ? (
        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-[var(--color-label-secondary)]">
          <span>
            Open{" "}
            <strong className="text-[var(--color-label)]">
              {report.summary.open_count}
            </strong>
          </span>
          <span>
            Closed{" "}
            <strong className="text-[var(--color-label)]">
              {report.summary.closed_count}
            </strong>
          </span>
          <span>
            Open risk{" "}
            <strong className="text-[var(--color-label)]">
              {money(report.summary.open_risk_usd)}
            </strong>
          </span>
          <span>
            Open uPnL{" "}
            <strong className="text-[var(--color-label)]">
              {money(report.summary.open_unrealized_pnl_usd)}
            </strong>
          </span>
          <span>
            Closed realized{" "}
            <strong className="text-[var(--color-label)]">
              {money(report.summary.closed_realized_pnl_usd)}
            </strong>
          </span>
          <span className="opacity-70">as of {report.asof.slice(0, 19)}Z</span>
        </div>
      ) : null}

      {loading && !report ? (
        <p className="mt-2 text-xs text-[var(--color-label-secondary)]">
          Loading…
        </p>
      ) : rows.length === 0 ? (
        <p className="mt-2 text-xs text-[var(--color-label-secondary)]">
          No Curate positions yet. Arm an instance and run ticks to open sim
          packages.
        </p>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-left text-[11px]">
            <thead>
              <tr className="border-b border-[var(--color-separator)] text-[10px] uppercase tracking-wide text-[var(--color-label-secondary)]">
                <th className="py-1 pr-2 font-semibold">Status</th>
                <th className="py-1 pr-2 font-semibold">Bot</th>
                <th className="py-1 pr-2 font-semibold">Symbol</th>
                <th className="py-1 pr-2 font-semibold">Risk</th>
                <th className="py-1 pr-2 font-semibold">uPnL / Realized</th>
                <th className="py-1 pr-2 font-semibold">Progress</th>
                <th className="py-1 pr-2 font-semibold">Instance</th>
                <th className="py-1 font-semibold">Opened</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-[var(--color-separator)]/70 text-[var(--color-label)]"
                >
                  <td className="py-1.5 pr-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        p.status === "open"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {p.status}
                    </span>
                    {p.close_reason ? (
                      <span className="ml-1 text-[10px] text-amber-700">
                        {p.close_reason}
                      </span>
                    ) : null}
                  </td>
                  <td className="py-1.5 pr-2">
                    <div className="font-semibold">
                      {p.bot_name || p.strategy_name}
                    </div>
                    <div className="text-[10px] text-[var(--color-label-secondary)]">
                      v{p.bound_version} · {p.strategy_id}
                    </div>
                  </td>
                  <td className="py-1.5 pr-2 font-semibold">{p.symbol}</td>
                  <td className="py-1.5 pr-2 tabular-nums">
                    {money(p.max_loss_usd)}
                  </td>
                  <td className="py-1.5 pr-2 tabular-nums">
                    {p.status === "open"
                      ? money(p.unrealized_pnl_usd)
                      : money(p.realized_pnl_usd)}
                  </td>
                  <td className="py-1.5 pr-2">
                    {p.status === "open" ? (
                      <div className="space-y-0.5">
                        <ProgressBar frac={p.progress_frac} />
                        <div className="text-[10px] text-[var(--color-label-secondary)]">
                          {p.progress_frac >= 0 ? "+" : ""}
                          {(p.progress_frac * 100).toFixed(0)}% of{" "}
                          {p.progress_frac >= 0 ? "max profit" : "max loss"}
                          {p.progress_to_tp_pct > 0
                            ? ` · ~${p.progress_to_tp_pct.toFixed(0)}% to TP`
                            : null}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[var(--color-label-secondary)]">
                        closed
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 pr-2">
                    <div className="font-mono text-[10px]">{p.instance_id}</div>
                    <div className="text-[10px] text-[var(--color-label-secondary)]">
                      {p.instance_status}
                    </div>
                  </td>
                  <td className="py-1.5 text-[10px] text-[var(--color-label-secondary)]">
                    {p.opened_at?.slice(0, 19)?.replace("T", " ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
