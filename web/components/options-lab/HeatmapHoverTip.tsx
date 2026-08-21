"use client";

/**
 * Instant heatmap hover card. Native `title` is too small and too slow.
 * After a tile click the card pins as a position inspector: greeks, tent,
 * copied ToS, Analyze. Escape or the X dismisses.
 */

import Link from "next/link";
import { IconXMark } from "@/components/ui/icons";
import type {
  HeatmapPayoffPoint,
  HeatmapPositionInspect,
  HeatmapTipModel,
  TipTone,
} from "@/lib/options-lab/heatmapTip";
import { fmtGreek, fmtIvPct, toneForSigned } from "@/lib/options-lab/heatmapTip";

const TONE: Record<TipTone, string> = {
  debit: "text-amber-300",
  credit: "text-emerald-300",
  pos: "text-emerald-300",
  neg: "text-rose-400",
  call: "text-sky-300",
  put: "text-red-400",
  neutral: "text-white",
  muted: "text-white/45",
};

function MiniTent({
  points,
  spot,
}: {
  points: HeatmapPayoffPoint[];
  spot: number | null;
}) {
  if (points.length < 2) return null;
  const W = 360;
  const H = 96;
  const pad = 6;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys, 0);
  const yMax = Math.max(...ys, 0);
  const dx = xMax - xMin || 1;
  const dy = yMax - yMin || 1;
  const sx = (x: number) => pad + ((x - xMin) / dx) * (W - 2 * pad);
  const sy = (y: number) => H - pad - ((y - yMin) / dy) * (H - 2 * pad);
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`)
    .join(" ");
  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      className="mt-2 block"
      data-testid="heatmap-tile-tip-tent"
      aria-hidden
    >
      <line
        x1={pad}
        y1={sy(0)}
        x2={W - pad}
        y2={sy(0)}
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="1"
      />
      <path d={d} fill="none" stroke="#22d3ee" strokeWidth="1.8" />
      {spot != null && Number.isFinite(spot) ? (
        <line
          x1={sx(spot)}
          y1={pad}
          x2={sx(spot)}
          y2={H - pad}
          stroke="#fbbf24"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
      ) : null}
    </svg>
  );
}

function GreekCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: TipTone;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[12px] font-medium uppercase tracking-wide text-white/40">
        {label}
      </div>
      <div
        className={"font-mono text-[17px] font-semibold tabular-nums " + TONE[tone]}
      >
        {value}
      </div>
    </div>
  );
}

export function HeatmapHoverTip({
  model,
  x,
  y,
  pinned = false,
  tosScript = null,
  copied = false,
  inspect = null,
  onAnalyze,
  onClose,
}: {
  model: HeatmapTipModel | null;
  x: number;
  y: number;
  pinned?: boolean;
  tosScript?: string | null;
  copied?: boolean;
  inspect?: HeatmapPositionInspect | null;
  onAnalyze?: () => void;
  onClose?: () => void;
}) {
  if (!model) return null;
  const inspector = pinned;
  const w = inspector ? 400 : 280;
  const left = Math.max(8, Math.min(x + 16, window.innerWidth - w - 8));
  const top = Math.max(8, Math.min(y + 12, window.innerHeight - (inspector ? 520 : 220)));
  const g = inspect?.greeks;
  return (
    <div
      role={pinned ? "dialog" : "tooltip"}
      data-testid="heatmap-tile-tip"
      data-pinned={pinned ? "1" : "0"}
      className={
        "fixed z-[80] overflow-y-auto rounded-lg border border-white/15 bg-[#14141a]/95 px-3.5 py-3 shadow-2xl backdrop-blur-sm " +
        (pinned ? "pointer-events-auto" : "pointer-events-none")
      }
      style={{ left, top, width: w, maxHeight: "min(92dvh, 36rem)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[18px] font-semibold leading-tight text-white">
            {model.title}
          </div>
          <div className="mt-0.5 text-[15px] leading-snug text-white/55">
            {model.kicker}
          </div>
        </div>
        <div className="flex shrink-0 items-start gap-1">
          {model.convexityScore != null ? (
            <div
              className={
                "text-right tabular-nums " +
                (model.convexityScore >= 8
                  ? "text-emerald-300"
                  : model.convexityScore >= 5
                    ? "text-amber-300"
                    : "text-white/55")
              }
              data-testid="heatmap-tip-score"
              title="Convexity vs same-width peers on this chain"
            >
              <div className="text-[11px] font-medium uppercase tracking-wide text-white/40">
                Score
              </div>
              <div className="text-[18px] font-semibold leading-none">
                {model.convexityScore}/10
              </div>
            </div>
          ) : null}
          {pinned ? (
            <button
              type="button"
              aria-label="Close"
              data-testid="heatmap-tile-tip-close"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
              onClick={onClose}
            >
              <IconXMark size={18} />
            </button>
          ) : null}
        </div>
      </div>
      {model.structure ? (
        <div className="mt-1 font-mono text-[17px] tabular-nums text-white">
          {model.structure}
        </div>
      ) : null}
      {inspector && inspect?.payoff.length ? (
        <MiniTent points={inspect.payoff} spot={inspect.spot} />
      ) : null}
      {inspector && g ? (
        <div className="mt-2 grid grid-cols-5 gap-2 border-t border-white/10 pt-2">
          <GreekCell
            label="Δ"
            value={fmtGreek(g.delta, 3)}
            tone={toneForSigned(g.delta)}
          />
          <GreekCell
            label="Γ"
            value={fmtGreek(g.gamma, 4)}
            tone={toneForSigned(g.gamma)}
          />
          <GreekCell
            label="Θ"
            value={fmtGreek(g.theta, 3)}
            tone={toneForSigned(g.theta)}
          />
          <GreekCell
            label="ν"
            value={fmtGreek(g.vega, 3)}
            tone={toneForSigned(g.vega)}
          />
          <GreekCell label="IV" value={fmtIvPct(g.iv)} tone="neutral" />
        </div>
      ) : null}
      {inspector && inspect ? (
        <div className="mt-1 flex justify-between gap-3 text-[13px] text-white/45">
          <span>
            Max{" "}
            <span className="font-mono text-emerald-300">
              {inspect.maxProfit >= 0 ? "+" : ""}
              {Math.round(inspect.maxProfit)}
            </span>
          </span>
          <span>
            Risk{" "}
            <span className="font-mono text-rose-400">
              {Math.round(inspect.maxLoss)}
            </span>
          </span>
        </div>
      ) : null}
      {model.rows.length ? (
        <div className="mt-2.5 space-y-1 border-t border-white/10 pt-2">
          {model.rows.map((row) => (
            <div
              key={row.label}
              className="flex items-baseline justify-between gap-4"
            >
              <span className="shrink-0 text-[15px] text-white/50">
                {row.label}
              </span>
              <span
                className={
                  "max-w-[70%] text-right text-[16px] font-semibold leading-snug " +
                  (row.label === "Meaning" ? "" : "font-mono tabular-nums text-[18px] ") +
                  TONE[row.tone]
                }
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      ) : null}
      {model.note ? (
        <div className="mt-2 text-[15px] leading-snug text-amber-200">
          {model.note}
        </div>
      ) : null}
      {inspector && tosScript ? (
        <div className="mt-2.5 overflow-y-auto border-t border-white/10 pt-2">
          <div className="text-[13px] font-medium uppercase tracking-wide text-emerald-300/90">
            {copied ? "Copied to clipboard" : "ToS script"}
          </div>
          <pre
            className="mt-1 max-h-20 overflow-auto whitespace-pre-wrap break-all font-mono text-[13px] leading-snug text-white/85"
            data-testid="heatmap-tile-tip-tos"
          >
            {tosScript}
          </pre>
          <Link
            href="/app/options-lab/analyzer"
            data-testid="heatmap-tip-analyze"
            onClick={onAnalyze}
            className={
              "mt-2.5 flex min-h-[44px] items-center justify-center rounded-full " +
              "bg-[var(--color-tint)] px-4 text-[16px] font-semibold text-white " +
              "no-underline hover:bg-[var(--color-tint-emphasis)]"
            }
          >
            Analyze this Position
          </Link>
        </div>
      ) : model.hint ? (
        <div className="mt-2 text-[14px] text-white/40">{model.hint}</div>
      ) : null}
    </div>
  );
}
