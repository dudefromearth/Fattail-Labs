"use client";

/**
 * Labs Risk Analyzer — OPF day_trade dual-curve risk graph (ToS-comparable).
 * Trade selection: Heatmap ToS Option-click (session) or paste.
 * Engine: Options Pricing Foundation L4 resolve (not MSC as authority).
 */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOptionsLab } from "@/lib/optionsLabContext";
import {
  clearAnalyzerTrade,
  loadAnalyzerTrade,
  saveAnalyzerTrade,
  type StoredAnalyzerTrade,
} from "@/lib/options-lab/analyzerTrade";
import { parseTosScript } from "@/lib/options-lab/tosParser";
import { useOpfRiskGraph } from "@/lib/options-lab/useOpfRiskGraph";
import PnLChart, {
  type PnLChartHandle,
} from "@/components/options-lab/msc-risk/PnLChart";

const fieldLabel =
  "mb-1 block text-xs font-medium text-[var(--color-label-secondary)]";
const control =
  "block w-full rounded-md border border-[var(--color-separator)] bg-[var(--color-surface)] " +
  "px-3 py-2 text-sm text-[var(--color-label)] shadow-sm " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]";
const btn =
  "inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--color-separator)] " +
  "bg-[var(--color-surface)] px-3 py-1.5 text-sm font-medium text-[var(--color-label)] " +
  "shadow-sm hover:bg-[var(--color-fill)] disabled:opacity-45";

export default function MscRiskAnalyzer() {
  const { symbol, setSymbol, universe, loading: universeLoading } =
    useOptionsLab();
  const [raw, setRaw] = useState("");
  const [stored, setStored] = useState<StoredAnalyzerTrade | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [spotStr, setSpotStr] = useState("");
  const [vixStr, setVixStr] = useState("");

  const [timeMachineEnabled, setTimeMachineEnabled] = useState(false);
  const [simTimeOffsetHours, setSimTimeOffsetHours] = useState(0);
  const [simVolatilityOffset, setSimVolatilityOffset] = useState(0);
  const [simSpotPct, setSimSpotPct] = useState(0);

  const chartRef = useRef<PnLChartHandle>(null);

  const hydrate = useCallback(() => {
    const s = loadAnalyzerTrade();
    setStored(s);
    if (s?.raw) {
      setRaw(s.raw);
      setParseError(null);
    }
  }, []);

  useEffect(() => {
    hydrate();
    const onEvt = () => hydrate();
    window.addEventListener("ft-analyzer-trade", onEvt);
    return () => window.removeEventListener("ft-analyzer-trade", onEvt);
  }, [hydrate]);

  const trade = useMemo(() => {
    if (!raw.trim()) return null;
    return parseTosScript(raw);
  }, [raw]);

  useEffect(() => {
    if (!raw.trim()) {
      setParseError(null);
      return;
    }
    setParseError(trade ? null : "Could not parse ToS line");
  }, [raw, trade]);

  useEffect(() => {
    if (trade?.symbol) {
      const known = universe.some((u) => u.symbol === trade.symbol);
      if (known && trade.symbol !== symbol) setSymbol(trade.symbol);
    }
  }, [trade?.symbol, symbol, universe, setSymbol]);

  const spotOverride = useMemo(() => {
    const n = Number(spotStr);
    if (Number.isFinite(n) && n > 0) return n;
    return null;
  }, [spotStr]);

  const vix = useMemo(() => {
    const n = Number(vixStr);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [vixStr]);

  const risk = useOpfRiskGraph({
    trade,
    spotOverride,
    vix,
    timeOffsetHours: timeMachineEnabled ? simTimeOffsetHours : 0,
    volOffsetPts: simVolatilityOffset,
    spotPct: simSpotPct,
    enabled: !!trade,
  });

  // Prefer live chain spot into the field when empty
  useEffect(() => {
    if (risk.spot != null && !spotStr.trim()) {
      setSpotStr(String(Math.round(risk.spot * 100) / 100));
    }
  }, [risk.spot, spotStr]);

  const resetSim = () => {
    setTimeMachineEnabled(false);
    setSimTimeOffsetHours(0);
    setSimVolatilityOffset(0);
    setSimSpotPct(0);
  };

  const displaySpot = spotOverride ?? risk.spot ?? trade?.body ?? 0;
  const simSpot = displaySpot * (1 + simSpotPct / 100);

  const hasCurves =
    trade &&
    risk.expirationPoints.length > 0 &&
    risk.theoreticalPoints.length > 0;

  return (
    <div
      className="flex min-h-0 flex-1 flex-col lg:flex-row"
      data-testid="options-lab-opf-risk-analyzer"
    >
      <aside className="flex w-full shrink-0 flex-col gap-3 overflow-y-auto border-b border-[var(--color-separator)] bg-[var(--color-surface)] p-3 lg:w-[19rem] lg:border-b-0 lg:border-r">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-label)]">
            Risk Graph
          </h2>
          <p className="text-[11px] text-[var(--color-label-tertiary)]">
            OPF day_trade · dual-curve (expiration + T+0) · ToS-comparable
          </p>
        </div>

        <label className="block">
          <span className={fieldLabel}>Symbol</span>
          <select
            className={control}
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            disabled={universeLoading}
          >
            {universe.map((u) => (
              <option key={u.symbol} value={u.symbol}>
                {u.symbol}
              </option>
            ))}
          </select>
        </label>

        <div>
          <span className={fieldLabel}>ToS trade</span>
          <textarea
            className={control + " min-h-[5rem] font-mono text-[11px]"}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            spellCheck={false}
            placeholder="BUY +1 BUTTERFLY SPX … @1.25 LMT"
            data-testid="analyzer-tos-input"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={btn}
            onClick={() => {
              if (!parseTosScript(raw)) {
                setParseError("Could not parse ToS line");
                return;
              }
              saveAnalyzerTrade(raw.trim(), "paste");
              setStored(loadAnalyzerTrade());
              setParseError(null);
              risk.refresh();
            }}
          >
            Load
          </button>
          <button
            type="button"
            className={btn}
            onClick={() => {
              clearAnalyzerTrade();
              setRaw("");
              setStored(null);
              resetSim();
            }}
          >
            Clear
          </button>
          <Link href="/app/options-lab/heatmap" className={btn + " no-underline"}>
            Heatmap
          </Link>
          <button
            type="button"
            className={btn}
            onClick={() => chartRef.current?.autoFit()}
            disabled={!hasCurves}
          >
            Auto-fit
          </button>
          <button
            type="button"
            className={btn}
            onClick={() => risk.refresh()}
            disabled={!trade || risk.loading}
          >
            {risk.loading ? "…" : "Refresh"}
          </button>
        </div>

        {stored?.source === "heatmap" && (
          <p className="text-[11px] text-emerald-500">From Heatmap Option-click</p>
        )}
        {parseError && (
          <p className="text-xs text-red-400" role="alert">
            {parseError}
          </p>
        )}
        {risk.error && (
          <p className="text-xs text-amber-400" role="status">
            {risk.error}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className={fieldLabel}>Spot</span>
            <input
              className={control}
              value={spotStr}
              onChange={(e) => setSpotStr(e.target.value)}
              placeholder={risk.spot != null ? String(risk.spot) : "chain"}
            />
          </label>
          <label className="block">
            <span className={fieldLabel}>VIX (opt)</span>
            <input
              className={control}
              value={vixStr}
              onChange={(e) => setVixStr(e.target.value)}
              placeholder="chain/native"
            />
          </label>
        </div>

        <div className="rounded-xl border border-[var(--color-separator)] bg-[var(--color-fill)]/50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-semibold">
              <input
                type="checkbox"
                checked={timeMachineEnabled}
                onChange={(e) => setTimeMachineEnabled(e.target.checked)}
              />
              Time machine
            </label>
            <button
              type="button"
              className="text-[11px] text-[var(--color-tint)]"
              onClick={resetSim}
            >
              Reset
            </button>
          </div>
          <label className="mb-2 block text-xs">
            Time {simTimeOffsetHours >= 0 ? "+" : ""}
            {simTimeOffsetHours.toFixed(0)}h
            <input
              type="range"
              className="mt-1 w-full"
              min={0}
              max={72}
              step={1}
              value={simTimeOffsetHours}
              disabled={!timeMachineEnabled}
              onChange={(e) => setSimTimeOffsetHours(Number(e.target.value))}
            />
          </label>
          <label className="mb-2 block text-xs">
            Vol offset {simVolatilityOffset >= 0 ? "+" : ""}
            {simVolatilityOffset.toFixed(0)} pts
            <input
              type="range"
              className="mt-1 w-full"
              min={-30}
              max={30}
              step={1}
              value={simVolatilityOffset}
              onChange={(e) => setSimVolatilityOffset(Number(e.target.value))}
            />
          </label>
          <label className="block text-xs">
            Spot {simSpotPct >= 0 ? "+" : ""}
            {simSpotPct.toFixed(1)}%
            <input
              type="range"
              className="mt-1 w-full"
              min={-5}
              max={5}
              step={0.1}
              value={simSpotPct}
              onChange={(e) => setSimSpotPct(Number(e.target.value))}
            />
          </label>
        </div>

        {trade && (
          <div className="mt-auto space-y-1 border-t border-[var(--color-separator)] pt-3 text-xs">
            <div className="font-semibold">
              {trade.symbol} {trade.structure}
            </div>
            <div className="text-[var(--color-label-secondary)]">
              {trade.expiration} · {trade.action} ·{" "}
              {trade.isCredit ? "credit" : "debit"}{" "}
              {trade.limit?.toFixed(2) ?? "—"}
            </div>
            <ul className="font-mono text-[11px] text-[var(--color-label-secondary)]">
              {trade.legs.map((l) => (
                <li key={`${l.expiration}-${l.strike}-${l.quantity}-${l.right}`}>
                  {l.quantity > 0 ? "+" : ""}
                  {l.quantity} {l.right} {l.strike}
                  {l.expiration !== trade.expiration ? ` ${l.expiration}` : ""}
                </li>
              ))}
            </ul>
            <div className="grid grid-cols-2 gap-1 pt-2 text-center">
              <div className="rounded bg-black/20 p-1">
                <div className="text-[9px] text-white/40">Mark pkg</div>
                <div className="font-mono text-[11px]">
                  {risk.packageDebit != null
                    ? risk.packageDebit.toFixed(2)
                    : "—"}
                </div>
              </div>
              <div className="rounded bg-black/20 p-1">
                <div className="text-[9px] text-white/40">RECON</div>
                <div
                  className={
                    "font-mono text-[11px] " +
                    (risk.reconPass === true
                      ? "text-emerald-400"
                      : risk.reconPass === false
                        ? "text-red-400"
                        : "text-white/50")
                  }
                >
                  {risk.reconPass === true
                    ? "pass"
                    : risk.reconPass === false
                      ? "fail"
                      : "—"}
                </div>
              </div>
            </div>
            <div className="pt-1 text-[11px] text-[var(--color-label-secondary)]">
              T+0 @ spot{" "}
              <span className="font-semibold text-fuchsia-400">
                ${risk.theoreticalPnLAtSpot.toFixed(0)}
              </span>
            </div>
            <div className="text-[10px] text-[var(--color-label-tertiary)]">
              {risk.packId ?? "…"} · {risk.engineId ?? "…"}
              {risk.loading ? " · live…" : ""}
            </div>
          </div>
        )}
      </aside>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#0a0a0e] p-2">
        <div className="mb-2 flex flex-wrap items-center gap-3 px-1 text-xs text-white/50">
          <span className="font-semibold text-white/80">
            {trade ? `${trade.symbol} risk graph` : "No trade"}
          </span>
          <span>
            Max P/L ${risk.maxPnL.toFixed(0)} / ${risk.minPnL.toFixed(0)}
          </span>
          <span className="text-emerald-400/80">Expiration</span>
          <span className="text-fuchsia-400/80">Real-time (OPF T+0)</span>
          {trade?.limit != null && (
            <span className="text-amber-400/70">basis = limit</span>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-white/10">
          {hasCurves ? (
            <div className="h-full min-h-[420px] w-full">
              <PnLChart
                ref={chartRef}
                expirationData={risk.expirationPoints}
                theoreticalData={risk.theoreticalPoints}
                theoreticalStroke="#e879f9"
                theoreticalLegendLabel="Real-Time (OPF)"
                spotPrice={displaySpot > 0 ? displaySpot : 1}
                spotIndicatorPrice={simSpot > 0 ? simSpot : undefined}
                expirationBreakevens={risk.expirationBreakevens}
                theoreticalBreakevens={risk.theoreticalBreakevens}
                strikes={risk.allStrikes}
              />
            </div>
          ) : (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-2 px-6 text-center text-sm text-white/40">
              {trade && risk.loading ? (
                <span>Loading OPF resolve + chain…</span>
              ) : trade && risk.error ? (
                <>
                  <span className="text-amber-400/90">{risk.error}</span>
                  <span className="text-xs">
                    Need dual-side chain for each leg expiration (Market Bus /
                    ladder). Then OPF builds expiration + T+0 curves.
                  </span>
                </>
              ) : (
                <span>
                  Option-click a Symmetric flies tile on Heatmap (ToS), then open
                  Analyzer — or paste a ToS order line and Load.
                </span>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
