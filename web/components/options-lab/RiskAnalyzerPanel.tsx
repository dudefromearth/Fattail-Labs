"use client";

/**
 * Options Lab Analyzer v1 — expiration risk graph from ToS trade selection.
 * Input: heatmap Option-click (session) or paste ToS line.
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
  buildPayoffCurve,
  tradeLabel,
} from "@/lib/options-lab/riskPayoff";
import { parseTosScript, type ParsedTosTrade } from "@/lib/options-lab/tosParser";

const fieldLabel =
  "mb-1 block text-xs font-medium text-[var(--color-label-secondary)]";

const selectControl =
  "block min-h-11 w-full rounded-[var(--radius-md,0.5rem)] border border-[var(--color-separator)] " +
  "bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-label)] " +
  "shadow-[var(--elevation-1)] " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]";

const secondaryBtn =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--color-separator)] " +
  "bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-label)] " +
  "shadow-[var(--elevation-1)] hover:bg-[var(--color-fill)] " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)] " +
  "disabled:opacity-45";

function fmtMoney(n: number, digits = 0): string {
  return n.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
}

function PayoffChart({
  trade,
  spot,
}: {
  trade: ParsedTosTrade;
  spot: number | null;
}) {
  const curve = useMemo(
    () => buildPayoffCurve(trade, { spot, padPts: Math.max(40, (trade.width ?? 25) * 3) }),
    [trade, spot],
  );

  const W = 720;
  const H = 360;
  const padL = 56;
  const padR = 16;
  const padT = 16;
  const padB = 36;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const xScale = (x: number) =>
    padL + ((x - curve.xMin) / (curve.xMax - curve.xMin || 1)) * plotW;
  const yScale = (y: number) =>
    padT + ((curve.yMax - y) / (curve.yMax - curve.yMin || 1)) * plotH;

  const pathD = curve.points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(p.x).toFixed(1)} ${yScale(p.y).toFixed(1)}`)
    .join(" ");

  const zeroY = yScale(0);
  const spotX = spot != null ? xScale(spot) : null;

  // Area under curve split profit / loss
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full max-h-[28rem]"
      role="img"
      aria-label="Expiration payoff chart"
    >
      <rect x={0} y={0} width={W} height={H} fill="#0a0a0e" rx={8} />
      {/* grid */}
      {[0.25, 0.5, 0.75].map((t) => {
        const y = padT + plotH * t;
        return (
          <line
            key={`h${t}`}
            x1={padL}
            x2={W - padR}
            y1={y}
            y2={y}
            stroke="rgba(255,255,255,0.06)"
          />
        );
      })}
      {/* zero line */}
      <line
        x1={padL}
        x2={W - padR}
        y1={zeroY}
        y2={zeroY}
        stroke="rgba(255,255,255,0.28)"
        strokeDasharray="4 3"
      />
      {/* spot */}
      {spotX != null && spotX >= padL && spotX <= W - padR ? (
        <line
          x1={spotX}
          x2={spotX}
          y1={padT}
          y2={H - padB}
          stroke="rgb(251,191,36)"
          strokeWidth={1.5}
          strokeOpacity={0.85}
        />
      ) : null}
      {/* payoff */}
      <path
        d={pathD}
        fill="none"
        stroke="rgb(52,211,153)"
        strokeWidth={2.25}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* axes labels */}
      <text
        x={padL}
        y={H - 10}
        fill="rgba(255,255,255,0.45)"
        fontSize={11}
        fontFamily="ui-monospace, monospace"
      >
        {fmtMoney(curve.xMin, 0)}
      </text>
      <text
        x={W - padR}
        y={H - 10}
        fill="rgba(255,255,255,0.45)"
        fontSize={11}
        fontFamily="ui-monospace, monospace"
        textAnchor="end"
      >
        {fmtMoney(curve.xMax, 0)}
      </text>
      <text
        x={8}
        y={padT + 10}
        fill="rgba(255,255,255,0.45)"
        fontSize={11}
        fontFamily="ui-monospace, monospace"
      >
        ${fmtMoney(curve.yMax, 0)}
      </text>
      <text
        x={8}
        y={H - padB}
        fill="rgba(255,255,255,0.45)"
        fontSize={11}
        fontFamily="ui-monospace, monospace"
      >
        ${fmtMoney(curve.yMin, 0)}
      </text>
      {spot != null ? (
        <text
          x={spotX ?? padL}
          y={padT + 12}
          fill="rgb(251,191,36)"
          fontSize={11}
          fontFamily="ui-monospace, monospace"
          textAnchor="middle"
        >
          Spot {fmtMoney(spot, 1)}
        </text>
      ) : null}
    </svg>
  );
}

export default function RiskAnalyzerPanel() {
  const { symbol, setSymbol, universe, loading: universeLoading } =
    useOptionsLab();
  const [raw, setRaw] = useState("");
  const [stored, setStored] = useState<StoredAnalyzerTrade | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [spotOverride, setSpotOverride] = useState<string>("");

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
    window.addEventListener("storage", onEvt);
    return () => {
      window.removeEventListener("ft-analyzer-trade", onEvt);
      window.removeEventListener("storage", onEvt);
    };
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
    if (trade?.symbol && trade.symbol !== symbol) {
      // Align suite symbol when trade carries one
      const known = universe.some((u) => u.symbol === trade.symbol);
      if (known) setSymbol(trade.symbol);
    }
  }, [trade?.symbol, symbol, universe, setSymbol]);

  const spotNum = useMemo(() => {
    if (spotOverride.trim()) {
      const n = Number(spotOverride);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }, [spotOverride]);

  const summary = useMemo(() => {
    if (!trade) return null;
    return buildPayoffCurve(trade, { spot: spotNum });
  }, [trade, spotNum]);

  const applyPaste = () => {
    if (!raw.trim()) return;
    const p = parseTosScript(raw);
    if (!p) {
      setParseError("Could not parse ToS line");
      return;
    }
    saveAnalyzerTrade(raw.trim(), "paste");
    setStored(loadAnalyzerTrade());
    setParseError(null);
  };

  return (
    <div
      className="flex min-h-0 flex-1 flex-col md:flex-row"
      data-testid="options-lab-analyzer-panel"
    >
      {/* Controls */}
      <aside
        className="flex w-full shrink-0 flex-col gap-4 overflow-y-auto border-b border-[var(--color-separator)] bg-[var(--color-surface)] p-3 sm:p-4 md:w-[22%] md:min-w-[14rem] md:max-w-[22rem] md:border-b-0 md:border-r"
        aria-label="Analyzer controls"
      >
        <div>
          <h2
            className="font-semibold tracking-tight text-[var(--color-label)]"
            style={{ fontSize: "var(--text-headline, 1.0625rem)" }}
          >
            Analyzer
          </h2>
          <p className="mt-0.5 text-xs leading-snug text-[var(--color-label-tertiary)]">
            Expiration risk graph from a ToS order line
          </p>
        </div>

        <label className="block">
          <span className={fieldLabel}>Symbol</span>
          <select
            className={selectControl}
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
          <span className={fieldLabel}>ToS trade</span>
          <textarea
            className={
              selectControl +
              " min-h-[6.5rem] resize-y font-mono text-[11px] leading-snug"
            }
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="BUY +1 BUTTERFLY SPX 100 (Weeklys) 11 AUG 26 7720/7750/7780 CALL @1.25 LMT"
            spellCheck={false}
            data-testid="analyzer-tos-input"
          />
          <p className="mt-1 text-[11px] text-[var(--color-label-tertiary)]">
            From Heatmap: ⌥-click a fly tile, then open Analyzer — or paste here.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            className={secondaryBtn + " w-full"}
            onClick={applyPaste}
            disabled={!raw.trim()}
          >
            Load trade
          </button>
          <button
            type="button"
            className={secondaryBtn + " w-full"}
            onClick={() => {
              clearAnalyzerTrade();
              setRaw("");
              setStored(null);
              setParseError(null);
            }}
          >
            Clear
          </button>
          <Link
            href="/app/options-lab/heatmap"
            className={
              secondaryBtn +
              " w-full no-underline " +
              "inline-flex"
            }
          >
            Open Heatmap
          </Link>
        </div>

        {stored?.source === "heatmap" ? (
          <p className="text-[11px] text-emerald-500/90">
            Loaded from Heatmap Option-click
            {stored.savedAt
              ? ` · ${new Date(stored.savedAt).toLocaleTimeString()}`
              : ""}
          </p>
        ) : null}

        {parseError ? (
          <div
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-300"
            role="alert"
          >
            {parseError}
          </div>
        ) : null}

        <label className="block">
          <span className={fieldLabel}>Spot marker (optional)</span>
          <input
            className={selectControl}
            type="text"
            inputMode="decimal"
            placeholder="e.g. 5750"
            value={spotOverride}
            onChange={(e) => setSpotOverride(e.target.value)}
          />
        </label>

        {trade ? (
          <div className="mt-auto space-y-1 border-t border-[var(--color-separator)] pt-3 text-xs text-[var(--color-label-secondary)]">
            <div className="font-semibold text-[var(--color-label)]">
              {tradeLabel(trade)}
            </div>
            <div>
              {trade.expiration} · {trade.action} · {trade.structure}
            </div>
            <div className="font-mono text-[11px] text-emerald-500/90">
              {trade.isCredit ? "Credit" : "Debit"}{" "}
              {trade.limit != null ? trade.limit.toFixed(2) : "—"}
            </div>
            <ul className="mt-1 space-y-0.5 font-mono text-[11px]">
              {trade.legs.map((l) => (
                <li key={`${l.strike}-${l.quantity}`}>
                  {l.quantity > 0 ? "+" : ""}
                  {l.quantity} {l.right[0].toUpperCase()} {l.strike}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </aside>

      {/* Chart panel */}
      <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--color-canvas)] p-2 sm:p-3">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--color-separator)] bg-[var(--color-surface)] shadow-[var(--elevation-2,0_4px_16px_rgba(0,0,0,0.18))]">
          <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-[var(--color-separator)] bg-[var(--color-surface-secondary,var(--color-fill))] px-3 py-2 sm:px-4">
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-[var(--color-label)]">
                {trade ? tradeLabel(trade) : "No trade selected"}
              </h3>
              <p className="text-[11px] text-[var(--color-label-tertiary)]">
                Expiration P&amp;L · 1 package × $100 multiplier · v1 (no T+0 theo yet)
              </p>
            </div>
            {summary ? (
              <div className="flex flex-wrap gap-4 text-xs tabular-nums">
                <span>
                  Max{" "}
                  <span className="font-semibold text-emerald-500">
                    ${fmtMoney(summary.maxProfit, 0)}
                  </span>
                </span>
                <span>
                  Min{" "}
                  <span className="font-semibold text-red-400">
                    ${fmtMoney(summary.maxLoss, 0)}
                  </span>
                </span>
                {summary.breakevens.length ? (
                  <span className="text-[var(--color-label-secondary)]">
                    BE{" "}
                    {summary.breakevens
                      .map((b) => fmtMoney(b, 1))
                      .join(" · ")}
                  </span>
                ) : null}
              </div>
            ) : null}
          </header>
          <div className="min-h-0 flex-1 overflow-auto bg-[#0a0a0e] p-3">
            {trade ? (
              <PayoffChart trade={trade} spot={spotNum} />
            ) : (
              <div className="flex h-full min-h-[16rem] flex-col items-center justify-center gap-2 px-6 text-center text-sm text-white/45">
                <p>Select a trade to graph expiration risk.</p>
                <p className="text-xs text-white/30">
                  On Heatmap, Option-click a Symmetric flies tile (copies ToS), then
                  return here — or paste a ToS line in the left rail.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
