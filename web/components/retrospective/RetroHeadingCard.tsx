"use client";

/**
 * Heading Card — Reporting Standards Spec v0.1 §7a.
 * Opening reckoning: verdict + Journey score + trajectory chips,
 * then shape vs true north, drawdown ribbon, practice balance.
 */

import { useEffect, useMemo, useState } from "react";
import type { ProcessPayload } from "@/components/ProcessMeter";
import {
  buildRetroHeading,
  formatCapital,
  resolveHeadingCapital,
  type CapitalBase,
  type RadarAxis,
  type RetroDrawdownReading,
  type RetroHeadingModel,
  type RetroShapeReading,
  type RetroTrajectory,
} from "@/lib/retroHeading";
import { reportsBookFromServer, type ReportsBook } from "@/lib/reportsBook";
import { fetchReportsBook } from "@/lib/tradeLogAnalytics";
import { fetchCapitalOverview } from "@/lib/capitalApi";
import { usePracticeContextOptional } from "@/lib/practiceContext";

function toDayYmd(iso: string | null | undefined): string | undefined {
  if (!iso) return undefined;
  const s = String(iso).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  try {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return undefined;
    return d.toISOString().slice(0, 10);
  } catch {
    return undefined;
  }
}

export function useRetroHeading(opts: {
  scopeStart?: string | null;
  scopeEnd?: string | null;
  accountId?: number | null;
  comparison?: Record<string, unknown> | null;
  periodBrief?: Record<string, unknown> | null;
  integrity?: Record<string, unknown> | null;
  isMaiden?: boolean;
  process?: ProcessPayload | null;
  periodProcess?: Record<string, unknown> | null;
  windowHint?: { days?: number | null; trades?: number | null };
}): {
  model: RetroHeadingModel;
  process: ProcessPayload | null;
  loading: boolean;
} {
  const practice = usePracticeContextOptional();
  const fromDay = toDayYmd(opts.scopeStart);
  const toDay = toDayYmd(opts.scopeEnd);
  const prefsReady = practice?.prefsReady ?? true;
  const accountId =
    opts.accountId != null && Number.isFinite(opts.accountId)
      ? opts.accountId
      : (practice?.accountIdParam ?? null);
  const campaign = practice?.campaigns.find((c) => c.id === practice.campaignId);
  const [process, setProcess] = useState<ProcessPayload | null>(
    opts.process ?? null,
  );
  const [book, setBook] = useState<ReportsBook | null>(null);
  const [fullBook, setFullBook] = useState<ReportsBook | null>(null);
  const [capital, setCapital] = useState<CapitalBase>(() =>
    resolveHeadingCapital({ capitalAccounts: [], campaign }),
  );
  const [bookLoading, setBookLoading] = useState(true);
  const [processLoading, setProcessLoading] = useState(!opts.process);

  useEffect(() => {
    if (opts.process) {
      setProcess(opts.process);
      setProcessLoading(false);
      return;
    }
    let cancelled = false;
    setProcessLoading(true);
    fetch("/api/me/journey/scores", { credentials: "same-origin" })
      .then(async (r) => {
        if (!r.ok) return null;
        const d = await r.json();
        return (d.process as ProcessPayload) || null;
      })
      .then((p) => {
        if (!cancelled) setProcess(p);
      })
      .catch(() => {
        if (!cancelled) setProcess(null);
      })
      .finally(() => {
        if (!cancelled) setProcessLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [opts.process]);

  useEffect(() => {
    let cancelled = false;
    async function loadBook() {
      if (!prefsReady) return;
      if (!fromDay || !toDay) {
        setBook(null);
        setFullBook(null);
        setBookLoading(false);
        return;
      }
      setBookLoading(true);
      try {
        const overview = await fetchCapitalOverview().catch(() => null);
        const base = resolveHeadingCapital({
          capitalAccounts: overview?.accounts || [],
          campaign,
        });
        if (cancelled) return;
        setCapital(base);
        const campId =
          base.kind === "allocated" && base.campaignId
            ? base.campaignId
            : null;
        const common = {
          accountId: accountId ?? ("all" as const),
          startingCapital: base.amount ?? 1,
          practiceCampaignId: campId,
        };
        const [periodRes, fullRes] = await Promise.all([
          fetchReportsBook({ ...common, fromDay, toDay }),
          fetchReportsBook(common),
        ]);
        if (cancelled) return;
        setBook(periodRes.ok ? reportsBookFromServer(periodRes.data) : null);
        setFullBook(fullRes.ok ? reportsBookFromServer(fullRes.data) : null);
      } catch {
        if (!cancelled) {
          setBook(null);
          setFullBook(null);
        }
      } finally {
        if (!cancelled) setBookLoading(false);
      }
    }
    void loadBook();
    return () => {
      cancelled = true;
    };
  }, [fromDay, toDay, accountId, campaign?.id, campaign?.starting_capital, prefsReady]);

  const model = useMemo(
    () =>
      buildRetroHeading({
        process,
        book,
        fullBook,
        comparison: opts.comparison,
        periodBrief: opts.periodBrief,
        periodProcess: opts.periodProcess,
        integrity: opts.integrity,
        isMaiden: opts.isMaiden,
        loading: bookLoading || processLoading,
        capital,
        windowHint: opts.windowHint,
      }),
    [
      process,
      book,
      fullBook,
      bookLoading,
      processLoading,
      capital,
      opts.comparison,
      opts.periodBrief,
      opts.periodProcess,
      opts.integrity,
      opts.isMaiden,
      opts.windowHint,
    ],
  );

  return { model, process, loading: bookLoading || processLoading };
}

function ShapePanel({ shape }: { shape: RetroShapeReading }) {
  const w = 320;
  const h = 132;
  const padL = 4;
  const padR = 4;
  const padT = 8;
  const padB = 18;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const bins = shape.curve;
  const n = bins.length;
  const max = Math.max(1, ...bins.map((b) => b.fullCount));
  const barW = n > 0 ? plotW / n : 0;

  return (
    <div data-testid="retro-heading-shape">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
        Shape vs true north
      </p>
      <p
        className="mt-1 font-semibold tabular-nums text-[var(--color-label)]"
        style={{ fontSize: "var(--text-headline)" }}
      >
        {shape.headline}
      </p>
      <p className="mt-0.5 text-xs text-[var(--color-label-secondary)]">
        {shape.fullOutcomes} on the full curve
        {shape.periodOutcomes > 0
          ? ` · ${shape.periodOutcomes} this period`
          : ""}
      </p>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="mt-2 h-auto w-full"
        role="img"
        aria-label="Full outcome distribution with this period in contrast"
      >
        {bins.map((b, i) => {
          const x = padL + i * barW;
          const fullH =
            b.fullCount > 0 ? Math.max(1.5, (b.fullCount / max) * plotH) : 0;
          const periodH =
            b.periodCount > 0
              ? Math.max(1.5, (b.periodCount / max) * plotH)
              : 0;
          return (
            <g key={i}>
              {fullH > 0 && (
                <rect
                  x={x}
                  y={padT + plotH - fullH}
                  width={Math.max(0.6, barW - 0.2)}
                  height={fullH}
                  fill="var(--color-label)"
                  opacity={0.22}
                />
              )}
              {periodH > 0 && (
                <rect
                  x={x}
                  y={padT + plotH - periodH}
                  width={Math.max(0.6, barW - 0.2)}
                  height={periodH}
                  fill="var(--color-tint)"
                  opacity={0.95}
                />
              )}
              {b.label ? (
                <text
                  x={x + barW / 2}
                  y={h - 4}
                  textAnchor="middle"
                  className="fill-[var(--color-label-tertiary)]"
                  style={{ fontSize: 7 }}
                >
                  {b.label}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <p className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-[var(--color-label-tertiary)]">
        <span className="inline-flex items-center gap-1">
          <span
            className="inline-block h-1.5 w-2.5 rounded-sm"
            style={{ background: "var(--color-label)", opacity: 0.35 }}
          />
          Full book
        </span>
        <span className="inline-flex items-center gap-1">
          <span
            className="inline-block h-1.5 w-2.5 rounded-sm"
            style={{ background: "var(--color-tint)" }}
          />
          This period
        </span>
      </p>
      <p className="mt-1 text-[11px] leading-snug text-[var(--color-label-tertiary)]">
        {shape.caption}
      </p>
    </div>
  );
}

function DrawdownPanel({ dd }: { dd: RetroDrawdownReading }) {
  const w = 280;
  const h = 88;
  const padL = 28;
  const padR = 6;
  const padT = 8;
  const padB = 8;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const floor = Math.min(-6, dd.deepestPct != null ? dd.deepestPct * 1.15 : -6);
  const yAt = (v: number) => padT + ((0 - v) / (0 - floor || 1)) * plotH;
  const n = dd.points.length;
  const xAt = (i: number) =>
    padL + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);

  const bands = [
    { y0: 0, y1: -2.5, fill: "var(--color-tint-soft)" },
    { y0: -2.5, y1: -4, fill: "rgba(255, 159, 10, 0.16)" },
    { y0: -4, y1: floor, fill: "var(--color-destructive-soft)" },
  ];

  const line =
    n > 1
      ? dd.points
          .map(
            (v, i) =>
              `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`,
          )
          .join(" ")
      : "";

  return (
    <div data-testid="retro-heading-drawdown">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
        Current drawdown
      </p>
      <p
        className="mt-1 font-semibold tabular-nums text-[var(--color-label)]"
        style={{ fontSize: "var(--text-headline)" }}
        data-testid="retro-heading-drawdown-current"
      >
        {dd.headline}
      </p>
      <p className="mt-0.5 text-xs text-[var(--color-label-secondary)]">
        {dd.bandLabel}
        {dd.capital.amount != null
          ? ` · ${dd.capital.label}${dd.capital.kind === "allocated" ? ` ${formatCapital(dd.capital.amount)}` : ""}`
          : ""}
      </p>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="mt-2 h-auto w-full"
        role="img"
        aria-label="Current period drawdown against trading or allocated capital"
      >
        {bands.map((b) => {
          const top = yAt(b.y0);
          const bot = yAt(Math.max(b.y1, floor));
          return (
            <rect
              key={b.y0}
              x={padL}
              y={top}
              width={plotW}
              height={Math.max(0, bot - top)}
              fill={b.fill}
            />
          );
        })}
        {[0, -2.5, -4, -5].map((t) => (
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
              x={padL - 4}
              y={yAt(t) + 3}
              textAnchor="end"
              className="fill-[var(--color-label-tertiary)]"
              style={{ fontSize: 8 }}
            >
              {t === 0 ? "0" : `${Math.abs(t)}`}
            </text>
          </g>
        ))}
        {line ? (
          <path
            d={line}
            fill="none"
            stroke="var(--color-label)"
            strokeWidth={1.6}
          />
        ) : null}
      </svg>
      <p className="mt-1 text-[11px] leading-snug text-[var(--color-label-tertiary)]">
        {dd.recoveryNote}
        {dd.sideways ? " Sideways is on schedule." : ""} {dd.conductNote}
      </p>
    </div>
  );
}

function polar(cx: number, cy: number, r: number, angleRad: number) {
  return {
    x: cx + r * Math.sin(angleRad),
    y: cy - r * Math.cos(angleRad),
  };
}

function PracticeRadar({
  axes,
  caption,
}: {
  axes: RadarAxis[];
  caption: string;
}) {
  const n = axes.length;
  const size = 220;
  const pad = 28;
  const cx = size / 2;
  const cy = size / 2;
  const rMax = size / 2 - pad;
  const angleAt = (i: number) => (i / Math.max(n, 1)) * Math.PI * 2;
  const ring = (t: number) =>
    axes
      .map((_, i) => {
        const p = polar(cx, cy, rMax * t, angleAt(i));
        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      })
      .join(" ");
  const overallPoly = axes
    .map((a, i) => {
      const p = polar(cx, cy, (a.overall / 100) * rMax, angleAt(i));
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(" ");
  const periodPoly = axes
    .map((a, i) => {
      const v = a.period == null ? 0 : a.period;
      const p = polar(cx, cy, (v / 100) * rMax, angleAt(i));
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(" ");
  const hasPeriod = axes.some((a) => a.period != null);

  return (
    <div data-testid="retro-heading-practice">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
        Practice balance
      </p>
      {n < 3 ? (
        <p className="mt-3 text-xs text-[var(--color-label-tertiary)]">
          Not enough pillars yet for a practice map.
        </p>
      ) : (
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="mx-auto mt-1 h-auto w-full max-w-[240px]"
          role="img"
          aria-label="Practice radar: full compass with this period overlaid"
        >
          {[0.25, 0.5, 0.75, 1].map((lv) => (
            <polygon
              key={lv}
              points={ring(lv)}
              fill="none"
              stroke="var(--color-separator)"
              strokeWidth={1}
              opacity={lv === 1 ? 0.9 : 0.45}
            />
          ))}
          {axes.map((a, i) => {
            const tip = polar(cx, cy, rMax, angleAt(i));
            return (
              <line
                key={a.id}
                x1={cx}
                y1={cy}
                x2={tip.x}
                y2={tip.y}
                stroke="var(--color-separator)"
                strokeWidth={1}
                opacity={0.7}
              />
            );
          })}
          <polygon
            points={overallPoly}
            fill="var(--color-label)"
            fillOpacity={0.1}
            stroke="var(--color-label)"
            strokeWidth={1.5}
            strokeLinejoin="round"
            opacity={0.55}
          />
          {hasPeriod ? (
            <polygon
              points={periodPoly}
              fill="var(--color-tint)"
              fillOpacity={0.22}
              stroke="var(--color-tint)"
              strokeWidth={2}
              strokeLinejoin="round"
            />
          ) : null}
          {axes.map((a, i) => {
            const ov = polar(cx, cy, (a.overall / 100) * rMax, angleAt(i));
            const pv =
              a.period != null
                ? polar(cx, cy, (a.period / 100) * rMax, angleAt(i))
                : null;
            const lab = polar(cx, cy, rMax + 14, angleAt(i));
            return (
              <g key={`pt-${a.id}`}>
                <circle
                  cx={ov.x}
                  cy={ov.y}
                  r={2.4}
                  fill="var(--color-label)"
                  opacity={0.55}
                />
                {pv ? (
                  <circle
                    cx={pv.x}
                    cy={pv.y}
                    r={3.2}
                    fill="var(--color-tint)"
                    stroke="var(--color-surface)"
                    strokeWidth={1}
                  />
                ) : null}
                <text
                  x={lab.x}
                  y={lab.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-[var(--color-label-secondary)]"
                  style={{ fontSize: 9, fontWeight: 600 }}
                >
                  {a.label}
                </text>
              </g>
            );
          })}
        </svg>
      )}
      <p className="mt-1 flex flex-wrap items-center justify-center gap-3 text-[11px] text-[var(--color-label-tertiary)]">
        <span className="inline-flex items-center gap-1">
          <span
            className="inline-block h-1.5 w-2.5 rounded-sm"
            style={{ background: "var(--color-label)", opacity: 0.45 }}
          />
          Full compass
        </span>
        <span className="inline-flex items-center gap-1">
          <span
            className="inline-block h-1.5 w-2.5 rounded-sm"
            style={{ background: "var(--color-tint)" }}
          />
          This period
        </span>
      </p>
      <p className="mt-1 text-center text-[11px] leading-snug text-[var(--color-label-tertiary)]">
        {caption}
      </p>
    </div>
  );
}

function TrajectoryChips({ t }: { t: RetroTrajectory }) {
  if (!t.ready) {
    return (
      <p
        className="text-xs text-[var(--color-label-tertiary)]"
        data-testid="retro-heading-trajectory"
      >
        {t.note}
      </p>
    );
  }
  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-testid="retro-heading-trajectory"
    >
      <span className="inline-flex items-center rounded-full bg-[var(--color-tint-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-tint-emphasis)]">
        {t.resolving} resolving
      </span>
      <span className="inline-flex items-center rounded-full bg-[rgba(255,159,10,0.16)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-warning)]">
        {t.repeating} repeating
      </span>
      <span className="text-[11px] text-[var(--color-label-tertiary)]">
        {t.note}
      </span>
    </div>
  );
}

export default function RetroHeadingCard({
  model,
  loading = false,
  kicker = "Retrospective",
}: {
  model: RetroHeadingModel;
  loading?: boolean;
  kicker?: string;
}) {
  const { verdict } = model;
  return (
    <section
      className="surface-card border border-[var(--color-separator)] px-5 py-6 shadow-[var(--elevation-2)] sm:px-7 sm:py-7"
      data-testid="retro-heading-card"
      aria-label="Retrospective heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-label-tertiary)]">
            {kicker}
          </p>
          <h1
            className="mt-1 font-semibold tracking-tight text-[var(--color-label)]"
            style={{ fontSize: "var(--text-title-1)", lineHeight: 1.15 }}
          >
            {verdict.state}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-[var(--color-label-secondary)]">
            {verdict.blurb}
          </p>
        </div>
        <div className="text-right">
          <p
            className="font-semibold tabular-nums tracking-tight text-[var(--color-label)]"
            style={{ fontSize: "var(--text-large-title)", lineHeight: 1 }}
            data-testid="retro-heading-score"
          >
            {verdict.score == null ? "···" : verdict.score}
          </p>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-[var(--color-label-tertiary)]">
            Journey score
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-label-secondary)]">
        {model.window.days != null ? (
          <span className="tabular-nums">
            {model.window.days} day{model.window.days === 1 ? "" : "s"}
          </span>
        ) : null}
        {model.window.trades != null ? (
          <span className="tabular-nums">
            {model.window.trades} trade{model.window.trades === 1 ? "" : "s"}
          </span>
        ) : null}
        <span>{model.drawdown.capital.label}</span>
      </div>

      <div className="mt-3">
        <TrajectoryChips t={model.trajectory} />
      </div>

      <div className="mt-6 grid gap-6 border-t border-[var(--color-separator)] pt-5 lg:grid-cols-3">
        <ShapePanel shape={model.shape} />
        <DrawdownPanel dd={model.drawdown} />
        <PracticeRadar axes={model.radar} caption={model.pillarCaption} />
      </div>

      <p className="mt-5 text-[11px] leading-relaxed text-[var(--color-label-tertiary)]">
        True north is balanced practice producing a healthy distribution. Win
        rate is not a compass reading. The journal never shows this score.
      </p>
      {loading ? (
        <p className="mt-2 text-[11px] text-[var(--color-label-tertiary)]">
          Compiling the period path…
        </p>
      ) : null}
    </section>
  );
}
