"use client";

/**
 * Campaign Journey — charter radar at present (Spec §6a).
 * Time scrub removed — shape is always as-of now.
 * Big shape = faithful (alignment/progress), never raw magnitude.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  deriveShapeAt,
  type JourneySeries,
} from "@/lib/campaignJourneySeries";
import {
  fetchCampaignJourneySeries,
  type JourneyShape,
  type JourneyShapeAxis,
} from "@/lib/practiceSpineApi";

function attrLabel(a: string): string {
  return a.replace(/_/g, " ");
}

function stateLabel(state: string, role: string): string {
  switch (state) {
    case "gathering":
      return "gathering";
    case "in_range":
      return "in range";
    case "out_of_range":
      return "out of range";
    case "reached":
      return "reached";
    case "tracking_toward":
      return "tracking toward";
    case "tracking_away":
      return "tracking away";
    default:
      return role === "goal" ? "progress" : state;
  }
}

function Spider({
  axes,
  size = 280,
}: {
  axes: JourneyShapeAxis[];
  size?: number;
}) {
  const n = axes.length;
  const cx = size / 2;
  const cy = size / 2;
  const rMax = size * 0.38;
  if (n < 3) {
    // Degenerate — show spokes as bars
    return (
      <div className="space-y-2 px-2 py-4" data-testid="campaign-journey-bars">
        {axes.map((ax) => {
          const ext =
            ax.extension == null ? 0 : Math.max(0, Math.min(1, ax.extension));
          const gathering = ax.state === "gathering" || ax.extension == null;
          return (
            <div key={ax.bound_id} className="text-xs">
              <div className="mb-0.5 flex justify-between text-[var(--color-label-secondary)]">
                <span>
                  {attrLabel(ax.attribute)}{" "}
                  <span className="opacity-60">({ax.role})</span>
                </span>
                <span>{stateLabel(ax.state, ax.role)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--color-fill)]">
                <div
                  className={`h-full rounded-full ${
                    gathering
                      ? "bg-[var(--color-label-tertiary)]/40"
                      : "bg-[var(--color-tint)]"
                  }`}
                  style={{ width: gathering ? "12%" : `${ext * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const pts = axes.map((ax, i) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const gathering = ax.state === "gathering" || ax.extension == null;
    const ext = gathering
      ? 0.08
      : Math.max(0.05, Math.min(1, Number(ax.extension) || 0));
    return {
      ax,
      x: cx + rMax * ext * Math.cos(ang),
      y: cy + rMax * ext * Math.sin(ang),
      lx: cx + (rMax + 18) * Math.cos(ang),
      ly: cy + (rMax + 18) * Math.sin(ang),
      gathering,
    };
  });
  const poly = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const rings = [0.33, 0.66, 1];

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto h-auto w-full max-w-[320px]"
      role="img"
      aria-label="Campaign Journey radar — band alignment and goal progress"
      data-testid="campaign-journey-radar"
    >
      {rings.map((t) => (
        <circle
          key={t}
          cx={cx}
          cy={cy}
          r={rMax * t}
          fill="none"
          stroke="var(--color-separator)"
          strokeWidth={1}
        />
      ))}
      {pts.map((p, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={cx + rMax * Math.cos(-Math.PI / 2 + (i * 2 * Math.PI) / n)}
          y2={cy + rMax * Math.sin(-Math.PI / 2 + (i * 2 * Math.PI) / n)}
          stroke="var(--color-separator)"
          strokeWidth={1}
        />
      ))}
      <polygon
        points={poly}
        fill="var(--color-tint)"
        fillOpacity={0.18}
        stroke="var(--color-tint)"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {pts.map((p) => (
        <g key={p.ax.bound_id}>
          <circle
            cx={p.x}
            cy={p.y}
            r={p.gathering ? 3 : 4}
            fill={
              p.gathering
                ? "var(--color-label-tertiary)"
                : "var(--color-tint)"
            }
          />
          <text
            x={p.lx}
            y={p.ly}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-[var(--color-label-secondary)]"
            style={{ fontSize: 9 }}
          >
            {attrLabel(p.ax.attribute)}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function CampaignJourneyRadar({
  campaignId,
  isLedger,
}: {
  campaignId: number;
  isLedger?: boolean;
}) {
  const [series, setSeries] = useState<JourneySeries | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (isLedger) return;
    setLoading(true);
    setError(null);
    try {
      const s = await fetchCampaignJourneySeries(campaignId);
      setSeries(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load journey shape");
      setSeries(null);
    } finally {
      setLoading(false);
    }
  }, [campaignId, isLedger]);

  useEffect(() => {
    void load();
  }, [load]);

  const shape: JourneyShape | null = useMemo(() => {
    if (!series) return null;
    const asOf = (series.present || series.window_to || "").slice(0, 10);
    if (!asOf) return null;
    return deriveShapeAt(series, asOf);
  }, [series]);

  if (isLedger) return null;

  return (
    <section
      className="surface-card border border-[var(--color-separator)] p-4 sm:p-5"
      data-testid="campaign-journey"
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2
          className="font-semibold text-[var(--color-label)]"
          style={{ fontSize: "var(--text-headline)" }}
        >
          Campaign Journey
        </h2>
        {shape?.as_of && (
          <span className="text-xs tabular-nums text-[var(--color-label-secondary)]">
            as of {shape.as_of}
            {shape.sample_n != null ? ` · n=${shape.sample_n}` : ""}
          </span>
        )}
      </div>
      <p className="mb-3 text-xs text-[var(--color-label-secondary)]">
        Shape is band alignment and goal progress — faithful execution, not big
        numbers. Ledger books have no radar.
      </p>

      {loading && !shape && (
        <p className="text-sm text-[var(--color-label-tertiary)]">Loading…</p>
      )}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {shape?.kind === "invitation" && (
        <div
          className="rounded-[var(--radius-lg)] bg-[var(--color-fill)]/60 px-4 py-6 text-center text-sm text-[var(--color-label-secondary)]"
          data-testid="campaign-journey-invitation"
        >
          <p className="font-medium text-[var(--color-label)]">
            No fingerprint yet
          </p>
          <p className="mt-1 text-xs">
            {shape.message ||
              "Declare charter bounds to reveal this season’s shape."}
          </p>
          <p className="mt-3 text-xs">
            Add bounds below (corridors and goals), then return here.
          </p>
        </div>
      )}

      {shape?.kind === "shape" && shape.axes.length > 0 && (
        <>
          <Spider axes={shape.axes} />
          <ul className="mt-3 grid gap-1 text-[11px] text-[var(--color-label-secondary)] sm:grid-cols-2">
            {shape.axes.map((ax) => (
              <li key={ax.bound_id}>
                <span className="font-medium text-[var(--color-label)]">
                  {attrLabel(ax.attribute)}
                </span>
                {" · "}
                {stateLabel(ax.state, ax.role)}
                {ax.extension != null && (
                  <span className="tabular-nums">
                    {" "}
                    ({(ax.extension * 100).toFixed(0)}%)
                  </span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {shape?.amendment_markers && shape.amendment_markers.length > 0 && (
        <p className="mt-3 text-[10px] text-[var(--color-label-tertiary)]">
          Amendments:{" "}
          {shape.amendment_markers
            .filter((m) => m.at)
            .map((m) => m.at)
            .join(" · ")}
        </p>
      )}

      <p className="mt-3 text-[10px] text-[var(--color-label-tertiary)]">
        Not Reports. Not the lifelong Journey compass.{" "}
        <Link href="/app/practice/campaign" className="underline">
          Library
        </Link>
      </p>
    </section>
  );
}
