"use client";

/**
 * Options Lab Risk Analyzer — MSC-inspired dual-curve risk graph.
 *
 * v2: expiration + T+0 theoretical (BS flat IV), what-if (time/vol/spot),
 * package greeks, ToS trade input from Heatmap Option-click.
 *
 * Not a line-for-line MSC port (no 3D, multi-book registry, GEX backdrop,
 * order flow). Pricing formulas match MSC blackScholes / risk graph shape.
 */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useOptionsLab } from "@/lib/optionsLabContext";
import {
  clearAnalyzerTrade,
  loadAnalyzerTrade,
  saveAnalyzerTrade,
  type StoredAnalyzerTrade,
} from "@/lib/options-lab/analyzerTrade";
import {
  DEFAULT_WHAT_IF,
  buildRiskGraph,
  type WhatIf,
} from "@/lib/options-lab/riskGraphEngine";
import { tradeLabel } from "@/lib/options-lab/riskPayoff";
import { parseTosScript, type ParsedTosTrade } from "@/lib/options-lab/tosParser";

const fieldLabel =
  "mb-1 block text-xs font-medium text-[var(--color-label-secondary)]";

const control =
  "block w-full rounded-[var(--radius-md,0.5rem)] border border-[var(--color-separator)] " +
  "bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-label)] " +
  "shadow-[var(--elevation-1)] " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]";

const btn =
  "inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--color-separator)] " +
  "bg-[var(--color-surface)] px-3 py-1.5 text-sm font-medium text-[var(--color-label)] " +
  "shadow-[var(--elevation-1)] hover:bg-[var(--color-fill)] " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)] " +
  "disabled:opacity-45";

function fmt$(n: number, d = 0): string {
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toLocaleString(undefined, {
    maximumFractionDigits: d,
    minimumFractionDigits: 0,
  })}`;
}

function DualCurveChart({
  trade,
  baseSpot,
  baseIv,
  whatIf,
}: {
  trade: ParsedTosTrade;
  baseSpot: number;
  baseIv: number;
  whatIf: WhatIf;
}) {
  const rg = useMemo(
    () =>
      buildRiskGraph(trade, {
        baseSpot,
        baseIv,
        whatIf,
        steps: 280,
      }),
    [trade, baseSpot, baseIv, whatIf],
  );

  const W = 900;
  const H = 420;
  const padL = 58;
  const padR = 18;
  const padT = 28;
  const padB = 40;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const xS = (x: number) =>
    padL + ((x - rg.xMin) / (rg.xMax - rg.xMin || 1)) * plotW;
  const yS = (y: number) =>
    padT + ((rg.yMax - y) / (rg.yMax - rg.yMin || 1)) * plotH;

  const expPath = rg.points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${xS(p.x).toFixed(2)} ${yS(p.exp).toFixed(2)}`,
    )
    .join(" ");
  const theoPath = rg.points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${xS(p.x).toFixed(2)} ${yS(p.theo).toFixed(2)}`,
    )
    .join(" ");

  const zeroY = yS(0);
  const spotX = xS(rg.spot);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full max-h-[min(32rem,55vh)]"
        role="img"
        aria-label="Risk graph dual curve"
      >
        <rect width={W} height={H} fill="#0b0b10" rx={10} />

        {/* horizontal grid */}
        {[0.2, 0.4, 0.6, 0.8].map((t) => {
          const y = padT + plotH * t;
          return (
            <line
              key={t}
              x1={padL}
              x2={W - padR}
              y1={y}
              y2={y}
              stroke="rgba(255,255,255,0.05)"
            />
          );
        })}

        {/* zero */}
        <line
          x1={padL}
          x2={W - padR}
          y1={zeroY}
          y2={zeroY}
          stroke="rgba(255,255,255,0.3)"
          strokeDasharray="5 4"
        />

        {/* spot */}
        <line
          x1={spotX}
          x2={spotX}
          y1={padT}
          y2={H - padB}
          stroke="rgb(251,191,36)"
          strokeWidth={1.5}
          opacity={0.9}
        />

        {/* theoretical T+0 — magenta (MSC mkt/theo convention simplified) */}
        <path
          d={theoPath}
          fill="none"
          stroke="rgb(232,121,249)"
          strokeWidth={2.25}
          strokeLinejoin="round"
        />
        {/* expiration — green */}
        <path
          d={expPath}
          fill="none"
          stroke="rgb(52,211,153)"
          strokeWidth={2.5}
          strokeLinejoin="round"
        />

        {/* legend */}
        <g fontFamily="ui-sans-serif, system-ui" fontSize={12}>
          <rect x={padL + 8} y={8} width={10} height={3} fill="rgb(52,211,153)" />
          <text x={padL + 22} y={12} fill="rgba(255,255,255,0.7)">
            Expiration
          </text>
          <rect
            x={padL + 110}
            y={8}
            width={10}
            height={3}
            fill="rgb(232,121,249)"
          />
          <text x={padL + 124} y={12} fill="rgba(255,255,255,0.7)">
            T+0 theo (BS)
          </text>
          <text
            x={spotX}
            y={padT + 14}
            fill="rgb(251,191,36)"
            textAnchor="middle"
            fontSize={11}
            fontFamily="ui-monospace, monospace"
          >
            Spot {rg.spot.toFixed(1)}
          </text>
        </g>

        <text
          x={padL}
          y={H - 12}
          fill="rgba(255,255,255,0.4)"
          fontSize={11}
          fontFamily="ui-monospace, monospace"
        >
          {rg.xMin.toFixed(0)}
        </text>
        <text
          x={W - padR}
          y={H - 12}
          fill="rgba(255,255,255,0.4)"
          fontSize={11}
          fontFamily="ui-monospace, monospace"
          textAnchor="end"
        >
          {rg.xMax.toFixed(0)}
        </text>
        <text
          x={10}
          y={padT + 8}
          fill="rgba(255,255,255,0.4)"
          fontSize={11}
          fontFamily="ui-monospace, monospace"
        >
          {fmt$(rg.yMax)}
        </text>
        <text
          x={10}
          y={H - padB}
          fill="rgba(255,255,255,0.4)"
          fontSize={11}
          fontFamily="ui-monospace, monospace"
        >
          {fmt$(rg.yMin)}
        </text>
      </svg>

      {/* stats strip — MSC-ish */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        <Stat
          label="Max profit"
          value={fmt$(rg.maxProfit)}
          tone="good"
        />
        <Stat label="Max loss" value={fmt$(rg.maxLoss)} tone="bad" />
        <Stat
          label="Theo @ spot"
          value={fmt$(rg.theoAtSpot, 0)}
          tone="magenta"
        />
        <Stat label="Exp @ spot" value={fmt$(rg.expAtSpot, 0)} tone="good" />
        <Stat
          label="Δ / Γ"
          value={`${rg.greeks.delta.toFixed(1)} / ${rg.greeks.gamma.toFixed(2)}`}
        />
        <Stat
          label="Θ / ν"
          value={`${rg.greeks.theta.toFixed(1)} / ${rg.greeks.vega.toFixed(1)}`}
        />
      </div>
      {rg.breakevensExp.length > 0 ? (
        <p className="mt-2 text-xs text-white/45">
          Exp breakevens:{" "}
          {rg.breakevensExp.map((b) => b.toFixed(1)).join(" · ")}
          {" · "}
          IV {(rg.iv * 100).toFixed(1)}% · T {(rg.T * 365).toFixed(2)}d
        </p>
      ) : (
        <p className="mt-2 text-xs text-white/45">
          IV {(rg.iv * 100).toFixed(1)}% · T {(rg.T * 365).toFixed(2)}d to exp
        </p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad" | "magenta";
}) {
  const color =
    tone === "good"
      ? "text-emerald-400"
      : tone === "bad"
        ? "text-red-400"
        : tone === "magenta"
          ? "text-fuchsia-400"
          : "text-[var(--color-label)]";
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2">
      <div className="text-[10px] uppercase tracking-wide text-white/40">
        {label}
      </div>
      <div className={`mt-0.5 font-semibold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

export default function RiskAnalyzerPanel() {
  const { symbol, setSymbol, universe, loading: universeLoading } =
    useOptionsLab();
  const [raw, setRaw] = useState("");
  const [stored, setStored] = useState<StoredAnalyzerTrade | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [spotStr, setSpotStr] = useState("");
  const [ivStr, setIvStr] = useState("18");
  const [whatIf, setWhatIf] = useState<WhatIf>({ ...DEFAULT_WHAT_IF });

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

  // Seed spot from body when trade loads and spot empty
  useEffect(() => {
    if (trade?.body != null && !spotStr.trim()) {
      setSpotStr(String(trade.body));
    }
  }, [trade?.body, trade?.raw, spotStr]);

  const baseSpot = useMemo(() => {
    const n = Number(spotStr);
    if (Number.isFinite(n) && n > 0) return n;
    return trade?.body ?? trade?.strikes[1] ?? trade?.strikes[0] ?? 5000;
  }, [spotStr, trade]);

  const baseIv = useMemo(() => {
    const n = Number(ivStr);
    if (Number.isFinite(n) && n > 0) return n / 100;
    return 0.18;
  }, [ivStr]);

  const resetWhatIf = () => setWhatIf({ ...DEFAULT_WHAT_IF });

  return (
    <div
      className="flex min-h-0 flex-1 flex-col lg:flex-row"
      data-testid="options-lab-analyzer-panel"
    >
      {/* Left rail — MSC risk graph style controls */}
      <aside
        className="flex w-full shrink-0 flex-col gap-3 overflow-y-auto border-b border-[var(--color-separator)] bg-[var(--color-surface)] p-3 sm:p-4 lg:w-[20rem] lg:border-b-0 lg:border-r"
        aria-label="Risk analyzer controls"
      >
        <div>
          <h2 className="text-base font-semibold text-[var(--color-label)]">
            Risk Analyzer
          </h2>
          <p className="mt-0.5 text-[11px] leading-snug text-[var(--color-label-tertiary)]">
            Dual-curve risk graph · ToS trade from Heatmap
          </p>
        </div>

        <label className="block">
          <span className={fieldLabel}>Symbol</span>
          <select
            className={control + " min-h-11"}
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            disabled={universeLoading || !universe.length}
          >
            {universe.map((u) => (
              <option key={u.symbol} value={u.symbol}>
                {u.symbol}
              </option>
            ))}
          </select>
        </label>

        <div>
          <span className={fieldLabel}>ToS order (trade selection)</span>
          <textarea
            className={
              control +
              " min-h-[5.5rem] resize-y font-mono text-[11px] leading-snug"
            }
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="BUY +1 BUTTERFLY SPX 100 (Weeklys) … @1.25 LMT"
            spellCheck={false}
            data-testid="analyzer-tos-input"
          />
          <p className="mt-1 text-[10px] text-[var(--color-label-tertiary)]">
            Heatmap ⌥-click fly tile → Open in Analyzer, or paste ToS here.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={btn}
            disabled={!raw.trim()}
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
            Load trade
          </button>
          <button
            type="button"
            className={btn}
            onClick={() => {
              clearAnalyzerTrade();
              setRaw("");
              setStored(null);
              setParseError(null);
              resetWhatIf();
            }}
          >
            Clear
          </button>
          <Link href="/app/options-lab/heatmap" className={btn + " no-underline"}>
            Heatmap
          </Link>
        </div>

        {stored?.source === "heatmap" ? (
          <p className="text-[11px] text-emerald-500">
            Source: Heatmap Option-click
          </p>
        ) : null}
        {parseError ? (
          <p className="text-xs text-red-400" role="alert">
            {parseError}
          </p>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className={fieldLabel}>Spot</span>
            <input
              className={control}
              value={spotStr}
              onChange={(e) => setSpotStr(e.target.value)}
              inputMode="decimal"
            />
          </label>
          <label className="block">
            <span className={fieldLabel}>Base IV %</span>
            <input
              className={control}
              value={ivStr}
              onChange={(e) => setIvStr(e.target.value)}
              inputMode="decimal"
            />
          </label>
        </div>

        {/* What-if — MSC 3D-of-options simplified to 2D offsets */}
        <div className="rounded-xl border border-[var(--color-separator)] bg-[var(--color-fill)]/40 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-label)]">
              What-if
            </span>
            <button type="button" className="text-[11px] text-[var(--color-tint)]" onClick={resetWhatIf}>
              Reset
            </button>
          </div>
          <label className="mb-2 block">
            <span className={fieldLabel}>
              Time {whatIf.timeOffsetHours >= 0 ? "+" : ""}
              {whatIf.timeOffsetHours.toFixed(0)}h
            </span>
            <input
              type="range"
              min={-72}
              max={72}
              step={1}
              value={whatIf.timeOffsetHours}
              onChange={(e) =>
                setWhatIf((w) => ({
                  ...w,
                  timeOffsetHours: Number(e.target.value),
                }))
              }
              className="w-full accent-[var(--color-tint)]"
            />
          </label>
          <label className="mb-2 block">
            <span className={fieldLabel}>
              Vol {whatIf.volOffsetPts >= 0 ? "+" : ""}
              {whatIf.volOffsetPts.toFixed(0)} pts
            </span>
            <input
              type="range"
              min={-20}
              max={20}
              step={0.5}
              value={whatIf.volOffsetPts}
              onChange={(e) =>
                setWhatIf((w) => ({
                  ...w,
                  volOffsetPts: Number(e.target.value),
                }))
              }
              className="w-full accent-[var(--color-tint)]"
            />
          </label>
          <label className="block">
            <span className={fieldLabel}>
              Spot {whatIf.spotPct >= 0 ? "+" : ""}
              {whatIf.spotPct.toFixed(1)}%
            </span>
            <input
              type="range"
              min={-5}
              max={5}
              step={0.1}
              value={whatIf.spotPct}
              onChange={(e) =>
                setWhatIf((w) => ({
                  ...w,
                  spotPct: Number(e.target.value),
                }))
              }
              className="w-full accent-[var(--color-tint)]"
            />
          </label>
        </div>

        {trade ? (
          <div className="mt-auto space-y-1 border-t border-[var(--color-separator)] pt-3 text-xs">
            <div className="font-semibold text-[var(--color-label)]">
              {tradeLabel(trade)}
            </div>
            <div className="text-[var(--color-label-secondary)]">
              {trade.expiration} · {trade.structure} · {trade.action}
            </div>
            <div className="font-mono text-emerald-400">
              {trade.isCredit ? "Credit" : "Debit"}{" "}
              {trade.limit != null ? trade.limit.toFixed(2) : "—"}
            </div>
            <ul className="font-mono text-[11px] text-[var(--color-label-secondary)]">
              {trade.legs.map((l) => (
                <li key={`${l.strike}-${l.quantity}-${l.right}`}>
                  {l.quantity > 0 ? "+" : ""}
                  {l.quantity}× {l.right} {l.strike}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </aside>

      {/* Chart */}
      <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--color-canvas)] p-2 sm:p-3">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--color-separator)] bg-[#0b0b10] shadow-[var(--elevation-2)]">
          <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-white/10 px-3 py-2.5 sm:px-4">
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-white">
                {trade ? tradeLabel(trade) : "No trade selected"}
              </h3>
              <p className="text-[11px] text-white/40">
                MSC-style dual curve · green = expiration · magenta = T+0 theo ·
                what-if offsets · not full MSC (no 3D / multi-book / GEX backdrop)
              </p>
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-4">
            {trade ? (
              <DualCurveChart
                trade={trade}
                baseSpot={baseSpot}
                baseIv={baseIv}
                whatIf={whatIf}
              />
            ) : (
              <div className="flex min-h-[18rem] flex-col items-center justify-center gap-2 text-center text-sm text-white/40">
                <p className="max-w-md">
                  Select a trade the way MSC does from structure surfaces: on{" "}
                  <strong className="text-white/60">Heatmap</strong>, Option-click a
                  Symmetric flies tile, then open Analyzer — or paste a ToS line.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
