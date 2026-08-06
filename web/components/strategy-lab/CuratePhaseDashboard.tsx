"use client";

/**
 * Curate phase primary surface — high visibility grid/table + equity charts.
 * Member language: bots (not "strategies"); strategy = pack attribute; position = bot instance.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import CorrelationCalculator from "@/components/strategy-lab/CorrelationCalculator";
import CurateLiveMarksStrip from "@/components/strategy-lab/CurateLiveMarksStrip";
import CuratePositionsReportPanel from "@/components/strategy-lab/CuratePositionsReport";
import PhaseRunDashboard, {
  type PhaseRunRow,
} from "@/components/strategy-lab/PhaseRunDashboard";
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
};

export default function CuratePhaseDashboard({ pushNotice }: Props) {
  const [report, setReport] = useState<CurateComparisonReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [ticking, setTicking] = useState(false);
  const [showPositions, setShowPositions] = useState(false);
  const [showCorrCalc, setShowCorrCalc] = useState(false);

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
    const t = setInterval(() => void load(), 20000);
    return () => clearInterval(t);
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
        `Tick-all: ${r.ok} ok · ${r.errors} err · ${r.ticked} runs`,
      );
      await load();
    } finally {
      setTicking(false);
    }
  }

  const rows: PhaseRunRow[] = useMemo(() => {
    const list = report?.bots ?? report?.strategies ?? [];
    return list.map((s) => ({
      id: s.instance_id,
      title: s.bot_name || s.strategy_name,
      subtitle: `v${s.bound_version} · ${s.instance_id}`,
      status: s.instance_status,
      symbol: s.scan_symbol || undefined,
      equity: s.equity_approx_usd,
      vsBaseline: s.vs_allocation_usd,
      baseline: s.allocation_usd,
      openPositions: s.open_positions,
      openRisk: s.open_risk_usd,
      openUpnl: s.open_unrealized_pnl_usd,
      closedPositions: s.closed_positions,
      metaRight: s.last_tick_at
        ? s.last_tick_at.slice(0, 19).replace("T", " ")
        : undefined,
      equitySeries: (s.equity_series || []).map((p) => ({
        t: p.t,
        equity: p.equity,
      })),
      corrVsSpy: (s as { corr_vs_spy?: number | null }).corr_vs_spy,
      corrInterpretation: (s as { corr_interpretation?: string | null })
        .corr_interpretation,
    }));
  }, [report]);

  return (
    <div className="space-y-4">
      <PhaseRunDashboard
        phaseLabel="Curate"
        phaseKey="curate"
        accountModeLabel="sim · fake money"
        summary={
          report
            ? {
                runs: report.summary.instances,
                active: report.summary.armed_or_running,
                bots: report.summary.bots ?? report.summary.strategies,
                strategies: report.summary.strategies,
              }
            : undefined
        }
        rows={rows}
        loading={loading}
        emptyHint="Promote bots to Curate, open the work area below, create a runtime, arm, and tick — bots appear here with equity paths and positions."
        onRefresh={() => void load()}
        toolbarExtra={
          <>
            <button
              type="button"
              disabled={ticking}
              onClick={() => void onTickAll()}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {ticking ? "Ticking…" : "Tick all armed bots"}
            </button>
            <Link
              href="/app/strategy-lab/symbols"
              className="rounded-lg border border-[var(--color-separator)] px-2.5 py-1.5 text-xs font-semibold hover:bg-[var(--color-fill)]"
            >
              Symbols
            </Link>
          </>
        }
        headerSlot={<CurateLiveMarksStrip />}
        footerSlot={
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setShowCorrCalc((v) => !v)}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                {showCorrCalc ? "Hide" : "Show"} correlation calculator
              </button>
              <button
                type="button"
                onClick={() => setShowPositions((v) => !v)}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                {showPositions ? "Hide" : "Show"} positions report
              </button>
            </div>
            {showCorrCalc ? <CorrelationCalculator /> : null}
            {showPositions ? <CuratePositionsReportPanel /> : null}
          </div>
        }
      />
    </div>
  );
}
