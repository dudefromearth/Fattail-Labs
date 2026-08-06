"use client";

/**
 * Curate phase primary surface (sim capital / multi-bot compare).
 * Stable poll: silent, visibility-aware, aborts in-flight, no loading flash.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  type CurateComparisonRow,
} from "@/lib/strategyLabCurateApi";

type Props = {
  pushNotice: (
    level: "info" | "success" | "warning" | "error",
    message: string,
  ) => void;
};

/** Poll while tab visible only — never stack requests. */
const POLL_MS = 30_000;

function mapRow(s: CurateComparisonRow): PhaseRunRow {
  const series = (s.equity_series || []).map((p) => ({
    equity: p.equity,
  }));
  return {
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
    runStartedAt: s.run_started_at ?? null,
    runtimeLabel: s.runtime_label ?? null,
    equitySeries: series,
    corrVsSpy: s.corr_vs_spy ?? null,
    corrInterpretation: s.corr_interpretation ?? null,
  };
}

export default function CuratePhaseDashboard({ pushNotice }: Props) {
  const [report, setReport] = useState<CurateComparisonReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [ticking, setTicking] = useState(false);
  const [showPositions, setShowPositions] = useState(false);
  const [showCorrCalc, setShowCorrCalc] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (inFlightRef.current) return;
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      return;
    }
    inFlightRef.current = true;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    if (!opts?.silent) setLoading(true);
    try {
      const r = await fetchCurateComparison();
      if (ac.signal.aborted) return;
      setReport(r);
    } finally {
      inFlightRef.current = false;
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load({ silent: false });

    const onVis = () => {
      if (document.visibilityState === "visible") {
        void load({ silent: true });
      }
    };
    document.addEventListener("visibilitychange", onVis);

    const t = window.setInterval(() => {
      void load({ silent: true });
    }, POLL_MS);

    return () => {
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
      abortRef.current?.abort();
    };
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
      await load({ silent: true });
    } finally {
      setTicking(false);
    }
  }

  const rows: PhaseRunRow[] = useMemo(() => {
    const list = report?.bots?.length
      ? report.bots
      : report?.strategies?.length
        ? report.strategies
        : [];
    return list.map(mapRow);
  }, [report]);

  return (
    <div className="space-y-4">
      <PhaseRunDashboard
        phaseLabel="Curate"
        phaseKey="curate"
        accountModeLabel="sim capital · multi-bot"
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
        emptyHint="Select a bot below, pick a symbol, then run in Curate — armed bots appear here with equity paths and positions."
        onRefresh={() => void load({ silent: false })}
        toolbarExtra={
          <>
            <button
              type="button"
              disabled={ticking}
              onClick={() => void onTickAll()}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {ticking ? "Ticking…" : "Advance all Curate bots"}
            </button>
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
