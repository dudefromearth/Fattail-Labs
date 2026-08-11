"use client";

/**
 * Labs Risk Analyzer — MSC Risk Graph engine + PnLChart (ported).
 * Trade selection: Heatmap ToS Option-click (session) or paste.
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
import { parseTosScript, type ParsedTosTrade } from "@/lib/options-lab/tosParser";
import {
  useRiskGraphCalculations,
  type Strategy,
  type MarketRegime,
  type PricingModel,
  MARKET_REGIMES,
  PRICING_MODELS,
} from "@/lib/msc-risk/useRiskGraphCalculations";
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

function tradeToStrategy(trade: ParsedTosTrade): Strategy {
  const debitAbs =
    trade.limit != null
      ? Math.abs(trade.limit)
      : trade.debit != null
        ? Math.abs(trade.debit)
        : 0;
  return {
    id: "tos-selected",
    strike: trade.body ?? trade.strikes[Math.floor(trade.strikes.length / 2)] ?? 0,
    width: trade.width ?? 0,
    side: trade.right,
    strategy:
      trade.structure === "butterfly"
        ? "butterfly"
        : trade.structure === "vertical"
          ? "vertical"
          : "single",
    debit: debitAbs,
    costBasisType: trade.isCredit ? "credit" : "debit",
    visible: true,
    expiration: trade.expiration,
    symbol: trade.symbol,
    legs: trade.legs.map((l) => ({
      strike: l.strike,
      expiration: l.expiration,
      right: l.right,
      quantity: l.quantity,
    })),
  };
}

export default function MscRiskAnalyzer() {
  const { symbol, setSymbol, universe, loading: universeLoading } =
    useOptionsLab();
  const [raw, setRaw] = useState("");
  const [stored, setStored] = useState<StoredAnalyzerTrade | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [spotStr, setSpotStr] = useState("");
  const [vixStr, setVixStr] = useState("16");

  // MSC simulation / model controls
  const [timeMachineEnabled, setTimeMachineEnabled] = useState(false);
  const [simTimeOffsetHours, setSimTimeOffsetHours] = useState(0);
  const [simVolatilityOffset, setSimVolatilityOffset] = useState(0);
  const [simSpotPct, setSimSpotPct] = useState(0);
  const [marketRegime, setMarketRegime] = useState<MarketRegime>("normal");
  const [pricingModel, setPricingModel] = useState<PricingModel>("black-scholes");

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

  useEffect(() => {
    if (trade?.body != null && !spotStr.trim()) {
      setSpotStr(String(trade.body));
    }
  }, [trade?.body, trade?.raw, spotStr]);

  const spotPrice = useMemo(() => {
    const n = Number(spotStr);
    if (Number.isFinite(n) && n > 0) return n;
    return trade?.body ?? 5000;
  }, [spotStr, trade]);

  const vix = useMemo(() => {
    const n = Number(vixStr);
    return Number.isFinite(n) && n > 0 ? n : 16;
  }, [vixStr]);

  const strategies = useMemo<Strategy[]>(() => {
    if (!trade) return [];
    return [tradeToStrategy(trade)];
  }, [trade]);

  const risk = useRiskGraphCalculations({
    strategies,
    spotPrice,
    vix,
    timeMachineEnabled,
    simTimeOffsetHours,
    simVolatilityOffset,
    simSpotPct,
    marketRegime,
    pricingModel,
  });

  const resetSim = () => {
    setTimeMachineEnabled(false);
    setSimTimeOffsetHours(0);
    setSimVolatilityOffset(0);
    setSimSpotPct(0);
  };

  const simSpot = spotPrice * (1 + simSpotPct / 100);

  return (
    <div
      className="flex min-h-0 flex-1 flex-col lg:flex-row"
      data-testid="options-lab-msc-risk-analyzer"
    >
      {/* Left rail — MSC-like controls */}
      <aside className="flex w-full shrink-0 flex-col gap-3 overflow-y-auto border-b border-[var(--color-separator)] bg-[var(--color-surface)] p-3 lg:w-[19rem] lg:border-b-0 lg:border-r">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-label)]">
            Risk Graph
          </h2>
          <p className="text-[11px] text-[var(--color-label-tertiary)]">
            MSC engine · dual-curve PnLChart · ToS trade select
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
            disabled={!trade}
          >
            Auto-fit
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

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className={fieldLabel}>Spot</span>
            <input
              className={control}
              value={spotStr}
              onChange={(e) => setSpotStr(e.target.value)}
            />
          </label>
          <label className="block">
            <span className={fieldLabel}>VIX</span>
            <input
              className={control}
              value={vixStr}
              onChange={(e) => setVixStr(e.target.value)}
            />
          </label>
        </div>

        <label className="block">
          <span className={fieldLabel}>Regime</span>
          <select
            className={control}
            value={marketRegime}
            onChange={(e) => setMarketRegime(e.target.value as MarketRegime)}
          >
            {Object.entries(MARKET_REGIMES).map(([id, r]) => (
              <option key={id} value={id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={fieldLabel}>Pricing model</span>
          <select
            className={control}
            value={pricingModel}
            onChange={(e) => setPricingModel(e.target.value as PricingModel)}
          >
            {Object.entries(PRICING_MODELS).map(([id, m]) => (
              <option key={id} value={id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>

        {/* What-if / Time machine — MSC */}
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
            <button type="button" className="text-[11px] text-[var(--color-tint)]" onClick={resetSim}>
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
            {simVolatilityOffset.toFixed(0)}
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
            <div className="font-semibold">{trade.symbol} {trade.structure}</div>
            <div className="text-[var(--color-label-secondary)]">
              {trade.expiration} · {trade.action} ·{" "}
              {trade.isCredit ? "credit" : "debit"}{" "}
              {trade.limit?.toFixed(2) ?? "—"}
            </div>
            <ul className="font-mono text-[11px] text-[var(--color-label-secondary)]">
              {trade.legs.map((l) => (
                <li key={`${l.strike}-${l.quantity}`}>
                  {l.quantity > 0 ? "+" : ""}
                  {l.quantity} {l.right} {l.strike}
                </li>
              ))}
            </ul>
            <div className="grid grid-cols-3 gap-1 pt-2 text-center">
              <div className="rounded bg-black/20 p-1">
                <div className="text-[9px] text-white/40">Δ</div>
                <div className="font-mono text-[11px]">{risk.delta.toFixed(1)}</div>
              </div>
              <div className="rounded bg-black/20 p-1">
                <div className="text-[9px] text-white/40">Γ</div>
                <div className="font-mono text-[11px]">{risk.gamma.toFixed(2)}</div>
              </div>
              <div className="rounded bg-black/20 p-1">
                <div className="text-[9px] text-white/40">Θ</div>
                <div className="font-mono text-[11px]">{risk.theta.toFixed(1)}</div>
              </div>
            </div>
            <div className="pt-1 text-[11px] text-[var(--color-label-secondary)]">
              Theo @ spot{" "}
              <span className="font-semibold text-fuchsia-400">
                ${risk.theoreticalPnLAtSpot.toFixed(0)}
              </span>
            </div>
          </div>
        )}
      </aside>

      {/* MSC PnLChart */}
      <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#0a0a0e] p-2">
        <div className="mb-2 flex flex-wrap items-center gap-3 px-1 text-xs text-white/50">
          <span className="font-semibold text-white/80">
            {trade ? `${trade.symbol} risk graph` : "No trade"}
          </span>
          <span>Max P/L ${risk.maxPnL.toFixed(0)} / ${risk.minPnL.toFixed(0)}</span>
          <span className="text-emerald-400/80">Expiration</span>
          <span className="text-fuchsia-400/80">Real-time theo</span>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-white/10">
          {trade && risk.expirationPoints.length > 0 ? (
            <div className="h-full min-h-[420px] w-full">
              <PnLChart
                ref={chartRef}
                expirationData={risk.expirationPoints}
                theoreticalData={risk.theoreticalPoints}
                theoreticalStroke="#e879f9"
                theoreticalLegendLabel="Real-Time (Theo)"
                spotPrice={spotPrice}
                spotIndicatorPrice={simSpot}
                expirationBreakevens={risk.expirationBreakevens}
                theoreticalBreakevens={risk.theoreticalBreakevens}
                strikes={risk.allStrikes}
                expiredExpirationData={risk.expiredExpirationPoints}
                expiredTheoreticalData={risk.expiredTheoreticalPoints}
              />
            </div>
          ) : (
            <div className="flex h-full min-h-[420px] items-center justify-center px-6 text-center text-sm text-white/40">
              Option-click a Symmetric flies tile on Heatmap (ToS), then open
              Analyzer — or paste a ToS order line and Load.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
