"use client";

/**
 * Multi-strategy Curate comparison — promote / portfolio inclusion.
 * Member-scoped; multi-member platform isolates by identity.
 */

import { useCallback, useEffect, useState } from "react";
import {
  fetchCurateComparison,
  tickAllCurateInstances,
  type CurateComparisonReport,
} from "@/lib/strategyLabCurateApi";

type Props = {
  pushNotice: (
    level: "info" | "success" | "warning" | "error",
    message: string,
  ) => void;
  onChanged?: () => void;
};

function money(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export default function CurateComparisonPanel({
  pushNotice,
  onChanged,
}: Props) {
  const [report, setReport] = useState<CurateComparisonReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [ticking, setTicking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetchCurateComparison();
      setReport(r);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onTickAll() {
    setTicking(true);
    try {
      const r = await tickAllCurateInstances();
      if (r.error) {
        pushNotice("error", r.error);
        return;
      }
      pushNotice(
        "success",
        `Tick-all: ${r.ok} ok, ${r.errors} error(s) across ${r.ticked} instance(s)`,
      );
      await load();
      onChanged?.();
    } finally {
      setTicking(false);
    }
  }

  const rows = report?.bots ?? report?.strategies ?? [];

  return (
    <div className="rounded-xl border border-[var(--color-separator)] bg-[var(--color-surface)] p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-label)]">
            Bot comparison
          </h3>
          <p className="mt-0.5 max-w-2xl text-[11px] text-[var(--color-label-secondary)]">
            Run many Curate <strong>bots</strong> side-by-side (sim). Strategy is a
            pack attribute of each bot; positions are instances of the bot. Compare
            for <strong>promote</strong> or <strong>portfolio</strong>. Multi-member:
            each person only sees their own bots.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            disabled={ticking || loading}
            onClick={() => void onTickAll()}
            className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {ticking ? "Ticking…" : "Tick all armed/running"}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => void load()}
            className="rounded-lg border border-[var(--color-separator)] px-2.5 py-1.5 text-xs font-semibold hover:bg-[var(--color-fill)] disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {report ? (
        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-[var(--color-label-secondary)]">
          <span>
            Bots{" "}
            <strong className="text-[var(--color-label)]">
              {report.summary.bots ?? report.summary.strategies}
            </strong>
          </span>
          <span>
            Instances{" "}
            <strong className="text-[var(--color-label)]">
              {report.summary.instances}
            </strong>
          </span>
          <span>
            Armed/running{" "}
            <strong className="text-[var(--color-label)]">
              {report.summary.armed_or_running}
            </strong>
          </span>
        </div>
      ) : null}

      {loading && !report ? (
        <p className="mt-2 text-xs text-[var(--color-label-secondary)]">
          Loading…
        </p>
      ) : rows.length === 0 ? (
        <p className="mt-2 text-xs text-[var(--color-label-secondary)]">
          No Curate instances yet. Create instances on multiple strategies, arm
          them, then tick-all to compare.
        </p>
      ) : (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[48rem] border-collapse text-left text-[11px]">
            <thead>
              <tr className="border-b border-[var(--color-separator)] text-[10px] uppercase tracking-wide text-[var(--color-label-secondary)]">
                <th className="py-1 pr-2 font-semibold">Strategy</th>
                <th className="py-1 pr-2 font-semibold">Status</th>
                <th className="py-1 pr-2 font-semibold">Equity≈</th>
                <th className="py-1 pr-2 font-semibold">vs alloc</th>
                <th className="py-1 pr-2 font-semibold">Open</th>
                <th className="py-1 pr-2 font-semibold">Risk open</th>
                <th className="py-1 pr-2 font-semibold">uPnL</th>
                <th className="py-1 pr-2 font-semibold">Closed</th>
                <th className="py-1 pr-2 font-semibold">TP / stop</th>
                <th className="py-1 pr-2 font-semibold">TP share</th>
                <th className="py-1 font-semibold">Last tick</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.instance_id}
                  className="border-b border-[var(--color-separator)]/70"
                >
                  <td className="py-1.5 pr-2">
                    <div className="font-semibold text-[var(--color-label)]">
                      {r.bot_name || r.strategy_name}
                    </div>
                    <div className="font-mono text-[10px] text-[var(--color-label-secondary)]">
                      v{r.bound_version} · {r.instance_id}
                    </div>
                  </td>
                  <td className="py-1.5 pr-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        r.instance_status === "running"
                          ? "bg-emerald-100 text-emerald-800"
                          : r.instance_status === "armed"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {r.instance_status}
                    </span>
                  </td>
                  <td className="py-1.5 pr-2 tabular-nums font-semibold text-[var(--color-label)]">
                    {money(r.equity_approx_usd)}
                  </td>
                  <td
                    className={`py-1.5 pr-2 tabular-nums ${
                      r.vs_allocation_usd >= 0
                        ? "text-emerald-700"
                        : "text-rose-700"
                    }`}
                  >
                    {r.vs_allocation_usd >= 0 ? "+" : ""}
                    {money(r.vs_allocation_usd)}
                  </td>
                  <td className="py-1.5 pr-2 tabular-nums">{r.open_positions}</td>
                  <td className="py-1.5 pr-2 tabular-nums">
                    {money(r.open_risk_usd)}
                  </td>
                  <td className="py-1.5 pr-2 tabular-nums">
                    {money(r.open_unrealized_pnl_usd)}
                  </td>
                  <td className="py-1.5 pr-2 tabular-nums">
                    {r.closed_positions}
                  </td>
                  <td className="py-1.5 pr-2 tabular-nums">
                    {r.take_profit_exits} / {r.stop_or_max_loss_exits}
                  </td>
                  <td className="py-1.5 pr-2 tabular-nums">
                    {r.process_tp_share_of_closes == null
                      ? "—"
                      : `${(r.process_tp_share_of_closes * 100).toFixed(0)}%`}
                  </td>
                  <td className="py-1.5 text-[10px] text-[var(--color-label-secondary)]">
                    {r.last_tick_at
                      ? r.last_tick_at.slice(0, 19).replace("T", " ")
                      : "—"}
                    {r.last_tick_status ? ` · ${r.last_tick_status}` : ""}
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
