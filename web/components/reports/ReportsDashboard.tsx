"use client";

/**
 * Reports dashboard — chart.png layout:
 * left metric table · right equity (balance) · underlay % drawdown.
 * Account pager; starting capital editable (local).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui";
import type { Account, Trade } from "@/lib/tradeLog";
import {
  accountPages,
  buildReportsBook,
  loadStartingCapital,
  saveStartingCapital,
  type DistBin,
  type SeriesPoint,
  type StatRow,
} from "@/lib/reportsBook";

type LoadState = "loading" | "ok" | "anon" | "forbidden" | "err";

function formatAxisMoney(n: number): string {
  if (Math.abs(n) >= 1000) {
    return `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  }
  return `$${n.toFixed(0)}`;
}

function EquityChart({
  series,
  height = 420,
  highlightTradeId,
}: {
  series: SeriesPoint[];
  /** Plot height — taller to fill the column next to the stats table. */
  height?: number;
  /** Deep-link from Journal: mark this fill on the path. */
  highlightTradeId?: number | null;
}) {
  const w = 720;
  const h = height;
  const padL = 52;
  const padR = 12;
  const padT = 12;
  const padB = 28;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  if (series.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-sm text-[var(--color-label-tertiary)]"
        style={{ minHeight: h }}
      >
        Equity path appears as closed outcomes land in Trade Log.
      </div>
    );
  }

  const vals = series.map((p) => p.equity);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const span = maxV - minV || 1;
  // Pin lowest equity near the bottom of the plot (small pad only).
  // Top gets a little headroom; do not center the series in empty space.
  const padBottomFrac = 0.04;
  const padTopFrac = 0.08;
  const n = series.length;
  const xAt = (i: number) => padL + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const yAt = (v: number) => {
    const t = (v - minV) / span; // 0 at min equity, 1 at max
    const yBottom = padT + plotH * (1 - padBottomFrac);
    const yTop = padT + plotH * padTopFrac;
    return yBottom - t * (yBottom - yTop);
  };

  const line = series
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(p.equity).toFixed(1)}`,
    )
    .join(" ");

  // Horizontal grid from data min → max (not an inflated domain)
  const tickCount = 5;
  const grid: number[] = [];
  for (let i = 0; i <= tickCount; i++) {
    grid.push(minV + (span * i) / tickCount);
  }

  // X labels: trade index or date samples
  const xLabels: { i: number; label: string }[] = [];
  const step = Math.max(1, Math.floor((n - 1) / 8));
  for (let i = 0; i < n; i += step) {
    xLabels.push({
      i,
      label: String(series[i].tradeIndex || i + 1),
    });
  }
  if (xLabels[xLabels.length - 1]?.i !== n - 1) {
    xLabels.push({ i: n - 1, label: String(series[n - 1].tradeIndex || n) });
  }

  const hi =
    highlightTradeId != null
      ? series.findIndex((p) => p.tradeId === highlightTradeId)
      : -1;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-auto w-full"
      role="img"
      aria-label="Equity curve from starting capital"
      id="reports-equity-chart"
    >
      {grid.map((v) => (
        <g key={v}>
          <line
            x1={padL}
            x2={w - padR}
            y1={yAt(v)}
            y2={yAt(v)}
            stroke="var(--color-separator)"
            strokeWidth={1}
          />
          <text
            x={padL - 8}
            y={yAt(v) + 3}
            textAnchor="end"
            className="fill-[var(--color-label-tertiary)]"
            style={{ fontSize: 10 }}
          >
            {formatAxisMoney(v)}
          </text>
        </g>
      ))}
      <path
        d={line}
        fill="none"
        stroke="var(--color-tint)"
        strokeWidth={2.25}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {hi >= 0 && (
        <g>
          <line
            x1={xAt(hi)}
            x2={xAt(hi)}
            y1={padT}
            y2={padT + plotH}
            stroke="var(--color-label)"
            strokeWidth={1}
            strokeDasharray="4 3"
            opacity={0.45}
          />
          <circle
            cx={xAt(hi)}
            cy={yAt(series[hi].equity)}
            r={6}
            fill="var(--color-tint)"
            stroke="var(--color-surface)"
            strokeWidth={2}
          />
          <text
            x={xAt(hi)}
            y={Math.max(padT + 12, yAt(series[hi].equity) - 12)}
            textAnchor="middle"
            className="fill-[var(--color-label)]"
            style={{ fontSize: 11, fontWeight: 600 }}
          >
            {formatAxisMoney(series[hi].equity)}
          </text>
        </g>
      )}
      {xLabels.map(({ i, label }) => (
        <text
          key={i}
          x={xAt(i)}
          y={h - 8}
          textAnchor="middle"
          className="fill-[var(--color-label-tertiary)]"
          style={{ fontSize: 9 }}
        >
          {label}
        </text>
      ))}
    </svg>
  );
}

function DrawdownChart({ series }: { series: SeriesPoint[] }) {
  const w = 720;
  const h = 140;
  const padL = 52;
  const padR = 12;
  const padT = 8;
  const padB = 24;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  if (series.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-sm text-[var(--color-label-tertiary)]"
        style={{ minHeight: h }}
      >
        Drawdown % from peak balance.
      </div>
    );
  }

  const vals = series.map((p) => p.drawdownPct * 100); // percent
  const minV = Math.min(...vals, -1);
  const maxV = 0;
  const y0 = minV * 1.1;
  const y1 = maxV;
  const n = series.length;
  const xAt = (i: number) => padL + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const yAt = (v: number) => padT + plotH - ((v - y0) / (y1 - y0 || 1)) * plotH;

  const line = series
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(p.drawdownPct * 100).toFixed(1)}`,
    )
    .join(" ");
  const area =
    line +
    ` L${xAt(n - 1).toFixed(1)},${yAt(0).toFixed(1)} L${xAt(0).toFixed(1)},${yAt(0).toFixed(1)} Z`;

  const ticks = [0, -2, -4, -6, -8].filter((t) => t >= y0 - 0.5);

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-auto w-full"
      role="img"
      aria-label="Drawdown percent"
    >
      {ticks.map((t) => (
        <g key={t}>
          <line
            x1={padL}
            x2={w - padR}
            y1={yAt(t)}
            y2={yAt(t)}
            stroke="var(--color-separator)"
            strokeWidth={1}
          />
          <text
            x={padL - 8}
            y={yAt(t) + 3}
            textAnchor="end"
            className="fill-[var(--color-label-tertiary)]"
            style={{ fontSize: 10 }}
          >
            {t.toFixed(2)}%
          </text>
        </g>
      ))}
      <path d={area} fill="var(--color-destructive-soft)" />
      <path
        d={line}
        fill="none"
        stroke="var(--color-destructive)"
        strokeWidth={1.75}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * HIG stats: highlight tone spans the full row (label + value),
 * matching the spreadsheet intent (blue band across).
 */
function StatsTable({
  stats,
  startingCapital,
  onCapital,
}: {
  stats: StatRow[];
  startingCapital: number;
  onCapital: (n: number) => void;
}) {
  const rowClass = (tone?: StatRow["tone"]) => {
    switch (tone) {
      case "capital":
        return "bg-[var(--color-warning)]/25 text-[var(--color-label)]";
      case "key":
        return "bg-[var(--color-tint)] text-[var(--color-on-tint)]";
      case "balance":
        return "bg-[var(--color-success)]/15 text-[var(--color-label)]";
      case "loss":
        return "bg-[var(--color-surface)] text-[var(--color-label)]";
      default:
        return "bg-[var(--color-surface)] text-[var(--color-label)]";
    }
  };

  const valueExtra = (tone?: StatRow["tone"]) => {
    if (tone === "loss") return "text-[var(--color-destructive)]";
    if (tone === "balance") return "font-semibold text-[var(--color-success)]";
    if (tone === "key") return "font-semibold";
    if (tone === "capital") return "font-semibold";
    return "font-medium";
  };

  return (
    <div
      className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] shadow-[var(--elevation-1)]"
      data-testid="reports-stats-table"
    >
      <table className="w-full border-collapse text-left text-[13px]">
        <tbody>
          {stats.map((row) => (
            <tr
              key={row.key}
              className={`border-b border-[var(--color-separator)] last:border-b-0 ${rowClass(row.tone)}`}
            >
              <th
                scope="row"
                className={[
                  "whitespace-nowrap px-3 py-2 font-semibold",
                  row.tone === "key"
                    ? "text-[var(--color-on-tint)]"
                    : "text-inherit",
                ].join(" ")}
              >
                {row.label}
              </th>
              <td
                className={`px-3 py-2 text-right tabular-nums ${valueExtra(row.tone)}`}
              >
                {row.key === "capital" ? (
                  <label className="inline-flex min-h-8 items-center justify-end gap-1">
                    <span className="sr-only">Starting capital</span>
                    <span className="opacity-70">$</span>
                    <input
                      type="number"
                      min={1}
                      step={1000}
                      className="w-[6.5rem] rounded-[var(--radius-sm)] border border-[var(--color-separator)] bg-[var(--color-surface)]/80 px-2 py-1 text-right font-semibold text-[var(--color-label)] outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-tint)]"
                      value={startingCapital}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (Number.isFinite(n) && n > 0) onCapital(n);
                      }}
                    />
                  </label>
                ) : (
                  row.value
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function moneyShort(n: number, parensNeg = false): string {
  if (parensNeg && n < 0) {
    return `($${Math.abs(n).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })})`;
  }
  const sign = n < 0 ? "-$" : "$";
  return `${sign}${Math.abs(n).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Featured process card: average winner vs average loser. */
function AvgWinLossCard({
  avgWin,
  avgLoss,
  ratio,
  winners,
  losers,
}: {
  avgWin: number;
  avgLoss: number;
  ratio: number;
  winners: number;
  losers: number;
}) {
  const max = Math.max(avgWin, avgLoss, 1);
  const winH = Math.max(8, (avgWin / max) * 100);
  const lossH = Math.max(8, (avgLoss / max) * 100);
  const has = winners > 0 || losers > 0;

  return (
    <section
      className="surface-card h-full border border-[var(--color-separator)] p-4 shadow-[var(--elevation-1)] sm:p-5"
      data-testid="avg-win-loss"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--color-label)]">
          Avg winner vs loser
        </h3>
        {has && (
          <span className="rounded-full bg-[var(--color-tint)] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[var(--color-on-tint)]">
            Ratio {ratio >= 99 ? "∞" : ratio.toFixed(2)}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-[var(--color-label-tertiary)]">
        Asymmetry of outcomes — keep winners larger than losers on average.
      </p>

      {!has ? (
        <p className="mt-6 text-sm text-[var(--color-label-tertiary)]">
          Needs signed closes to compare.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-6">
          <div className="flex flex-col items-center">
            <div
              className="flex w-full max-w-[7rem] flex-col justify-end"
              style={{ height: 120 }}
            >
              <div
                className="w-full rounded-t-[var(--radius-md)] bg-[var(--color-tint)]"
                style={{ height: winH }}
                title={`Avg win ${moneyShort(avgWin)}`}
              />
            </div>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
              Avg winner
            </p>
            <p className="text-lg font-semibold tabular-nums text-[var(--color-tint)]">
              {winners > 0 ? moneyShort(avgWin) : "—"}
            </p>
            <p className="text-xs text-[var(--color-label-tertiary)]">
              {winners} trade{winners === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div
              className="flex w-full max-w-[7rem] flex-col justify-end"
              style={{ height: 120 }}
            >
              <div
                className="w-full rounded-t-[var(--radius-md)] bg-[var(--color-destructive)]"
                style={{ height: lossH, opacity: 0.9 }}
                title={`Avg loss ${moneyShort(-avgLoss, true)}`}
              />
            </div>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
              Avg loser
            </p>
            <p className="text-lg font-semibold tabular-nums text-[var(--color-destructive)]">
              {losers > 0 ? moneyShort(-avgLoss, true) : "—"}
            </p>
            <p className="text-xs text-[var(--color-label-tertiary)]">
              {losers} trade{losers === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

/** Featured: Sharpe on trade returns (mean/std × √n). */
function SharpeCard({
  sharpe,
  sampleSize,
}: {
  sharpe: number;
  sampleSize: number;
}) {
  const has = sampleSize > 1;
  // Soft gauge 0–4 for display (capped); not a hard grade.
  const gaugeMax = 4;
  const fill = has ? Math.min(1, Math.max(0, sharpe / gaugeMax)) : 0;
  const tone =
    !has
      ? "text-[var(--color-label-tertiary)]"
      : sharpe >= 2
        ? "text-[var(--color-tint)]"
        : sharpe >= 1
          ? "text-[var(--color-label)]"
          : sharpe >= 0
            ? "text-[var(--color-warning)]"
            : "text-[var(--color-destructive)]";

  return (
    <section
      className="surface-card flex h-full flex-col border border-[var(--color-separator)] p-4 shadow-[var(--elevation-1)] sm:p-5"
      data-testid="sharpe-ratio"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--color-label)]">
          Sharpe ratio
        </h3>
        {has && (
          <span className="rounded-full bg-[var(--color-tint)] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[var(--color-on-tint)]">
            n = {sampleSize}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-[var(--color-label-tertiary)]">
        Mean trade outcome ÷ volatility × √n — path quality, not a guarantee.
      </p>

      {!has ? (
        <p className="mt-6 text-sm text-[var(--color-label-tertiary)]">
          Needs at least two signed outcomes.
        </p>
      ) : (
        <div className="mt-6 flex flex-1 flex-col items-center justify-center">
          <p
            className={`text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl ${tone}`}
          >
            {sharpe.toFixed(2)}
          </p>
          <div className="mt-4 h-2 w-full max-w-[12rem] overflow-hidden rounded-full bg-[var(--color-fill)]">
            <div
              className="h-full rounded-full bg-[var(--color-tint)] transition-[width]"
              style={{ width: `${fill * 100}%` }}
            />
          </div>
          <p className="mt-2 text-center text-[11px] text-[var(--color-label-tertiary)]">
            Gauge 0–{gaugeMax} (capped for display)
          </p>
        </div>
      )}
    </section>
  );
}

/** Featured: max drawdown % of peak balance (capital preservation). */
function DrawdownCard({
  maxDrawdownPct,
  hasPnlData,
  series,
}: {
  maxDrawdownPct: number;
  hasPnlData: boolean;
  series: SeriesPoint[];
}) {
  // maxDrawdownPct is ≤ 0 (fraction of peak)
  const absPct = Math.abs(maxDrawdownPct) * 100;
  const has = hasPnlData && series.length > 1;
  // Gauge: 0% good → 20%+ fills bar (capital preservation first)
  const gaugeMax = 20;
  const fill = has ? Math.min(1, absPct / gaugeMax) : 0;
  const tone =
    !has
      ? "text-[var(--color-label-tertiary)]"
      : absPct <= 5
        ? "text-[var(--color-tint)]"
        : absPct <= 10
          ? "text-[var(--color-warning)]"
          : "text-[var(--color-destructive)]";

  // Mini spark from series drawdown
  const w = 200;
  const h = 48;
  let spark: string | null = null;
  if (has && series.length >= 2) {
    const vals = series.map((p) => p.drawdownPct * 100);
    const minV = Math.min(...vals, -0.5);
    const maxV = 0;
    const xAt = (i: number) =>
      series.length === 1 ? w / 2 : (i / (series.length - 1)) * w;
    const yAt = (v: number) =>
      h - ((v - minV) / (maxV - minV || 1)) * (h - 4) - 2;
    spark = series
      .map(
        (p, i) =>
          `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(p.drawdownPct * 100).toFixed(1)}`,
      )
      .join(" ");
  }

  return (
    <section
      className="surface-card flex h-full flex-col border border-[var(--color-separator)] p-4 shadow-[var(--elevation-1)] sm:p-5"
      data-testid="max-drawdown"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--color-label)]">
          Max drawdown
        </h3>
        {has && (
          <span className="rounded-full bg-[var(--color-destructive)] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-white">
            of peak
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-[var(--color-label-tertiary)]">
        Worst peak-to-trough on the balance path — capital preservation first.
      </p>

      {!has ? (
        <p className="mt-6 text-sm text-[var(--color-label-tertiary)]">
          Needs a realized path to measure.
        </p>
      ) : (
        <div className="mt-6 flex flex-1 flex-col items-center justify-center">
          <p
            className={`text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl ${tone}`}
          >
            {absPct.toFixed(2)}%
          </p>
          {spark && (
            <svg
              viewBox={`0 0 ${w} ${h}`}
              className="mt-3 h-12 w-full max-w-[14rem]"
              aria-hidden
            >
              <path
                d={spark}
                fill="none"
                stroke="var(--color-destructive)"
                strokeWidth={1.75}
                strokeLinejoin="round"
              />
            </svg>
          )}
          <div className="mt-3 h-2 w-full max-w-[12rem] overflow-hidden rounded-full bg-[var(--color-fill)]">
            <div
              className="h-full rounded-full bg-[var(--color-destructive)] transition-[width]"
              style={{ width: `${fill * 100}%` }}
            />
          </div>
          <p className="mt-2 text-center text-[11px] text-[var(--color-label-tertiary)]">
            Severity gauge 0–{gaugeMax}% (capped)
          </p>
        </div>
      )}
    </section>
  );
}

function BarDist({
  bins,
  title,
  subtitle,
  dense = false,
}: {
  bins: DistBin[];
  title: string;
  subtitle?: string;
  /** High-resolution histogram (e.g. 100 outcome bins). */
  dense?: boolean;
}) {
  const max = Math.max(...bins.map((b) => b.count), 1);
  const plotH = dense ? 180 : 112;
  const binCount = bins.length;
  // ~4px per bar at 100 bins ≈ 400px min; grow with viewport via flex
  const minTrack = dense ? Math.max(400, binCount * 4) : undefined;

  return (
    <div>
      <h3
        className="font-semibold text-[var(--color-label)]"
        style={{ fontSize: "var(--text-headline)" }}
      >
        {title}
      </h3>
      {subtitle && (
        <p className="mt-0.5 text-xs text-[var(--color-label-tertiary)]">
          {subtitle}
        </p>
      )}
      <div className={["mt-4", dense ? "overflow-x-auto pb-2" : ""].join(" ")}>
        <div
          className={[
            "flex items-end",
            dense ? "gap-px" : "gap-2 sm:gap-3",
          ].join(" ")}
          style={{
            minHeight: plotH + (dense ? 28 : 36),
            minWidth: minTrack,
          }}
        >
          {bins.map((b, i) => {
            const h = b.count > 0 ? Math.max(2, (b.count / max) * plotH) : 1;
            const color =
              b.tone < 0
                ? "var(--color-destructive)"
                : b.tone > 0
                  ? "var(--color-tint)"
                  : "var(--color-label-tertiary)";
            return (
              <div
                key={`${i}-${b.label}`}
                className={[
                  "flex flex-col items-center justify-end",
                  dense ? "min-w-0 flex-1" : "min-w-0 flex-1 gap-1",
                ].join(" ")}
                title={`${b.label || `bin ${i + 1}`}: ${b.count}`}
              >
                {!dense && (
                  <span className="text-[11px] tabular-nums text-[var(--color-label-secondary)]">
                    {b.count > 0 ? b.count : ""}
                  </span>
                )}
                <div
                  className={dense ? "w-full rounded-t-[1px]" : "w-full rounded-t-[3px]"}
                  style={{
                    height: h,
                    background: color,
                    opacity: b.count === 0 ? 0.12 : 0.92,
                    maxWidth: dense ? undefined : 44,
                  }}
                />
                {(!dense || b.label) && (
                  <span
                    className={[
                      "max-w-full text-center text-[var(--color-label-tertiary)]",
                      dense
                        ? "mt-1 text-[8px] leading-none tabular-nums"
                        : "truncate text-[10px]",
                    ].join(" ")}
                  >
                    {b.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {dense && (
        <p className="mt-2 text-[11px] text-[var(--color-label-tertiary)]">
          {binCount} bins · axis labeled every 10th edge · hover a bar for count
        </p>
      )}
    </div>
  );
}

export default function ReportsDashboard() {
  const searchParams = useSearchParams();
  const highlightTradeId = (() => {
    const raw = searchParams.get("trade");
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  })();
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [pageIdx, setPageIdx] = useState(0);
  const [capital, setCapital] = useState(50000);

  useEffect(() => {
    setCapital(loadStartingCapital(50000));
  }, []);

  const load = useCallback(() => {
    setState("loading");
    setError(null);
    fetch("/api/me/trade-log/trades", { credentials: "same-origin" })
      .then(async (r) => {
        if (r.status === 401) {
          setState("anon");
          return;
        }
        if (r.status === 403) {
          setState("forbidden");
          return;
        }
        if (!r.ok) {
          setState("err");
          setError(await r.text());
          return;
        }
        const data = await r.json();
        setTrades(data.trades || []);
        setAccounts(data.accounts || []);
        setState("ok");
      })
      .catch((e) => {
        setState("err");
        setError(e instanceof Error ? e.message : String(e));
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pages = useMemo(() => accountPages(accounts), [accounts]);
  const safeIdx = Math.min(pageIdx, Math.max(0, pages.length - 1));
  const page = pages[safeIdx] || pages[0];
  const filter: number | "all" = page?.kind === "one" ? page.id : "all";

  const book = useMemo(
    () => buildReportsBook(trades, accounts, filter, capital),
    [trades, accounts, filter, capital],
  );

  function onCapital(n: number) {
    setCapital(n);
    saveStartingCapital(n);
  }

  function shiftPage(delta: number) {
    setPageIdx((i) => {
      const next = i + delta;
      if (next < 0) return pages.length - 1;
      if (next >= pages.length) return 0;
      return next;
    });
  }

  if (state === "loading") {
    return (
      <p className="mt-8 text-sm text-[var(--color-label-tertiary)]">
        Loading reports…
      </p>
    );
  }
  if (state === "anon") {
    return (
      <p className="mt-8 text-sm">
        <Link href="/login" className="font-medium text-[var(--color-tint)]">
          Sign in
        </Link>{" "}
        to view Practice reports.
      </p>
    );
  }
  if (state === "forbidden") {
    return (
      <div className="surface-card mt-8 border border-[var(--color-separator)] p-5 text-sm">
        <p className="font-medium text-[var(--color-label)]">
          Membership required
        </p>
        <p className="mt-2 text-[var(--color-label-secondary)]">
          Practice tools are available to Activator and above.
        </p>
      </div>
    );
  }
  if (state === "err") {
    return (
      <div className="mt-8 text-sm">
        Could not load.{" "}
        <button type="button" className="text-[var(--color-tint)] underline" onClick={load}>
          Retry
        </button>
        {error && <p className="mt-1 font-mono text-xs opacity-70">{error}</p>}
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6" data-testid="reports-dashboard">
      {/* Account pager — HIG secondary controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p
            className="font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]"
            style={{ fontSize: "var(--text-caption)" }}
          >
            Account
          </p>
          <p
            className="font-semibold text-[var(--color-label)]"
            style={{ fontSize: "var(--text-headline)" }}
          >
            {book.accountLabel}
          </p>
        </div>
        {pages.length > 1 && (
          <div
            className="inline-flex items-center gap-1 rounded-full bg-[var(--color-fill)] p-1"
            role="group"
            aria-label="Account page"
          >
            <Button
              type="button"
              variant="plain"
              className="!min-h-9 !rounded-full !px-3"
              onClick={() => shiftPage(-1)}
              aria-label="Previous account"
            >
              ‹
            </Button>
            <span className="min-w-[4.5rem] text-center text-sm tabular-nums text-[var(--color-label-secondary)]">
              {safeIdx + 1} / {pages.length}
            </span>
            <Button
              type="button"
              variant="plain"
              className="!min-h-9 !rounded-full !px-3"
              onClick={() => shiftPage(1)}
              aria-label="Next account"
            >
              ›
            </Button>
          </div>
        )}
      </div>

      {/* Main: stats | charts — equity fills remaining height; no dead gap */}
      <div className="grid gap-5 lg:grid-cols-[minmax(17rem,22rem)_1fr] lg:items-stretch">
        <StatsTable
          stats={book.stats}
          startingCapital={capital}
          onCapital={onCapital}
        />

        <div className="flex min-h-0 min-w-0 flex-col gap-4">
          <section className="surface-card flex min-h-0 flex-1 flex-col border border-[var(--color-separator)] p-4 sm:p-5">
            <div className="mb-3 flex shrink-0 flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2
                  className="font-semibold text-[var(--color-label)]"
                  style={{ fontSize: "var(--text-headline)" }}
                >
                  Equity curve
                </h2>
                <p className="mt-0.5 text-xs text-[var(--color-label-tertiary)]">
                  Balance from starting capital
                </p>
              </div>
              <span className="rounded-full bg-[var(--color-fill)] px-3 py-1 text-xs font-semibold tabular-nums text-[var(--color-label)]">
                {book.stats.find((s) => s.key === "balance")?.value}
              </span>
            </div>
            <div className="min-h-[280px] flex-1">
              <EquityChart
                series={book.series}
                height={480}
                highlightTradeId={highlightTradeId}
              />
            </div>
            {highlightTradeId != null && (
              <p className="mt-2 text-xs text-[var(--color-label-secondary)]">
                Highlighted trade #{highlightTradeId}
                {book.series.some((p) => p.tradeId === highlightTradeId)
                  ? " on the equity path."
                  : " — not on this account’s realized path (open-only or filtered out)."}{" "}
                <Link
                  href={`/app/trade-log?id=${highlightTradeId}`}
                  className="font-medium text-[var(--color-tint)]"
                >
                  Open in Trade Log
                </Link>
              </p>
            )}
          </section>

          <section className="surface-card shrink-0 border border-[var(--color-separator)] p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2
                  className="font-semibold text-[var(--color-label)]"
                  style={{ fontSize: "var(--text-headline)" }}
                >
                  Drawdown
                </h2>
                <p className="mt-0.5 text-xs text-[var(--color-label-tertiary)]">
                  Peak-to-trough on the path
                </p>
              </div>
              <span className="rounded-full bg-[var(--color-destructive-soft)] px-3 py-1 text-xs font-semibold tabular-nums text-[var(--color-destructive)]">
                Max{" "}
                {book.hasPnlData
                  ? `${(Math.abs(book.maxDrawdownPct) * 100).toFixed(3)}%`
                  : "—"}
              </span>
            </div>
            <DrawdownChart series={book.series} />
          </section>
        </div>
      </div>

      {/* Featured: win/loss asymmetry · Sharpe · max drawdown */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AvgWinLossCard
          avgWin={book.avgWin}
          avgLoss={book.avgLoss}
          ratio={book.winLossRatio}
          winners={book.winners}
          losers={book.losers}
        />
        <SharpeCard
          sharpe={book.sharpe}
          sampleSize={book.sharpeSampleSize}
        />
        <DrawdownCard
          maxDrawdownPct={book.maxDrawdownPct}
          hasPnlData={book.hasPnlData}
          series={book.series}
        />
      </div>

      {/* Outcome histogram — full width, granular bins for skew */}
      <section className="surface-card border border-[var(--color-separator)] p-4 sm:p-5">
        <BarDist
          bins={book.distribution}
          title="Outcome distribution"
          subtitle="Realized $ per closed trade · 125 equal-width bins (1st–99th pct range) — same density as the spreadsheet."
          dense
        />
      </section>

      <section className="surface-card border border-[var(--color-separator)] p-4 sm:p-5">
        <BarDist bins={book.strategyDist} title="Trades by strategy" />
      </section>

      <p
        className="text-[var(--color-label-tertiary)]"
        style={{ fontSize: "var(--text-footnote)" }}
      >
        Path from starting capital + realized outcomes in{" "}
        <Link
          href="/app/trade-log"
          className="font-medium text-[var(--color-tint)]"
        >
          Trade Log
        </Link>
        . Starting capital is stored in this browser.
      </p>
    </div>
  );
}
