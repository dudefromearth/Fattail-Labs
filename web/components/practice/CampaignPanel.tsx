"use client";

/**
 * Campaign Panel v1 — Six Controls (left) + radar/time scrub (right).
 *
 * Visual grammar from Coach CMP blood-work reference (bw.png):
 *   ATTRIBUTE NAME
 *   Normal range: X – Y
 *   [yellow flank | green acceptable | yellow flank]
 *   green pill value + triangle pointer on the bar
 *
 * Docs: docs/Campaign-Panel-v1-The-Six-Controls.md
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  derivePanelAt,
  deriveShapeAt,
  type JourneySeries,
} from "@/lib/campaignJourneySeries";
import {
  fetchCampaignJourneySeries,
  fetchCampaignPanel,
  patchCampaignPanelControl,
  type JourneyShape,
  type JourneyShapeAxis,
  type PanelControl,
  type PanelResponse,
} from "@/lib/practiceSpineApi";

/* ── helpers ─────────────────────────────────────────────────────────── */

function formatReading(attr: string, v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "—";
  if (attr === "win_rate" || attr === "drawdown") {
    return (Math.round(v * 10) / 10).toString();
  }
  return (Math.round(v * 100) / 100).toString();
}

function formatRangeNum(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "—";
  if (Math.abs(v) >= 10 || Number.isInteger(v)) {
    return Number.isInteger(v) ? String(v) : v.toFixed(1).replace(/\.0$/, "");
  }
  return v.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function normalRangeLabel(c: PanelControl): string {
  const lo = formatRangeNum(c.range_low);
  const hi = formatRangeNum(c.range_high);
  const unit =
    c.unit === "percent" ? "%" : c.unit === "ratio" ? "" : c.unit ? ` ${c.unit}` : "";
  // CMP style: "Normal range: 60 - 99 mg/dL" — we use Reference per product doc
  return `Reference range: ${lo} – ${hi}${unit}`;
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

/** Map a value into [0,1] across total display domain. */
function posOnTotal(
  value: number,
  displayLow: number,
  displayHigh: number,
): number {
  const span = displayHigh - displayLow;
  if (!(span > 0)) return 0.5;
  return clamp01((value - displayLow) / span);
}

/* ── CMP blood-work strip (one control) ──────────────────────────────── */

function CmpControlStrip({
  control,
  canEdit,
  onSave,
  busy,
}: {
  control: PanelControl;
  /** Administrator only — members never see dials. */
  canEdit: boolean;
  onSave: (patch: {
    range_low?: number | null;
    range_high?: number | null;
    display_low?: number | null;
    display_high?: number | null;
  }) => Promise<void> | void;
  busy: boolean;
}) {
  const dlo = Number(control.display_low ?? 0);
  const dhi = Number(control.display_high ?? 100);
  const alo = Number(control.range_low ?? dlo);
  const ahi = Number(control.range_high ?? dhi);
  const gathering = control.state === "gathering" || control.reading == null;

  const greenLeft = posOnTotal(alo, dlo, dhi) * 100;
  const greenRight = posOnTotal(ahi, dlo, dhi) * 100;
  const greenWidth = Math.max(0, greenRight - greenLeft);

  const reading = control.reading;
  const pointerPct =
    !gathering && reading != null
      ? posOnTotal(Number(reading), dlo, dhi) * 100
      : null;

  // Bubble shifts inboard near ends so it never clips
  let bubbleTransform = "translateX(-50%)";
  if (pointerPct != null) {
    if (pointerPct < 8) bubbleTransform = "translateX(0%)";
    else if (pointerPct > 92) bubbleTransform = "translateX(-100%)";
  }

  /** Admin: click strip → dials; X → strip again. Members never open. */
  const [dialOpen, setDialOpen] = useState(false);
  const [loIn, setLoIn] = useState(String(alo));
  const [hiIn, setHiIn] = useState(String(ahi));
  const [dloIn, setDloIn] = useState(String(dlo));
  const [dhiIn, setDhiIn] = useState(String(dhi));

  useEffect(() => {
    setLoIn(String(alo));
    setHiIn(String(ahi));
    setDloIn(String(dlo));
    setDhiIn(String(dhi));
  }, [alo, ahi, dlo, dhi, control.bound_id]);

  // Members never keep dial open if role changes
  useEffect(() => {
    if (!canEdit) setDialOpen(false);
  }, [canEdit]);

  function closeDial() {
    setDialOpen(false);
    // Reset inputs to last saved values
    setLoIn(String(alo));
    setHiIn(String(ahi));
    setDloIn(String(dlo));
    setDhiIn(String(dhi));
  }

  async function commitSave() {
    const n = (s: string) => {
      const x = Number(s);
      return Number.isFinite(x) ? x : null;
    };
    await onSave({
      range_low: n(loIn),
      range_high: n(hiIn),
      display_low: n(dloIn),
      display_high: n(dhiIn),
    });
    setDialOpen(false);
  }

  return (
    <div
      className="rounded-lg border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-3 sm:px-4"
      data-testid={`panel-control-${control.attribute}`}
      data-state={control.state}
      data-dial={dialOpen ? "open" : "closed"}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-label)]">
            {control.label}
          </p>
          <p className="mt-0.5 text-[11px] text-[var(--color-label-secondary)]">
            {normalRangeLabel(control)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {gathering && !dialOpen && (
            <span className="text-[10px] italic text-[var(--color-label-tertiary)]">
              gathering — n below reference validity
            </span>
          )}
          {dialOpen && (
            <button
              type="button"
              data-testid={`panel-dial-close-${control.attribute}`}
              aria-label={`Close range editor for ${control.label}`}
              onClick={closeDial}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-separator)] text-[var(--color-label-secondary)] hover:bg-[var(--color-fill)] hover:text-[var(--color-label)]"
            >
              <span className="text-base leading-none" aria-hidden>
                ×
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Default: attribute slider. Admin click reveals dials underneath (replaces strip). */}
      {!dialOpen ? (
        <button
          type="button"
          disabled={!canEdit}
          onClick={() => {
            if (canEdit) setDialOpen(true);
          }}
          className={[
            "relative mt-5 mb-1 block w-full border-0 bg-transparent p-0 pt-7 text-left",
            canEdit
              ? "cursor-pointer rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]"
              : "cursor-default",
          ].join(" ")}
          data-testid={`panel-strip-${control.attribute}`}
          aria-label={
            canEdit
              ? `${control.label}: click to adjust reference ranges`
              : `${control.label} reading`
          }
        >
          {pointerPct != null && (
            <div
              className="pointer-events-none absolute top-0 z-10 flex flex-col items-center"
              style={{
                left: `${pointerPct}%`,
                transform: bubbleTransform,
              }}
            >
              <span
                className="inline-flex min-w-[2rem] items-center justify-center rounded-full bg-[#1a7f37] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-white shadow-sm"
                data-testid={`panel-value-${control.attribute}`}
              >
                {formatReading(control.attribute, reading)}
              </span>
              <span
                className="mt-0.5 block h-0 w-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-[#1a7f37]"
                aria-hidden
              />
            </div>
          )}

          <div className="relative h-[10px] w-full overflow-hidden rounded-sm">
            <div className="absolute inset-0 bg-[#e8b84a]" />
            <div
              className="absolute inset-y-0 bg-[#2d9d46]"
              style={{ left: `${greenLeft}%`, width: `${greenWidth}%` }}
            />
          </div>

          <div className="relative mt-1 h-4 w-full text-[10px] tabular-nums text-[var(--color-label-tertiary)]">
            <span
              className="absolute -translate-x-1/2"
              style={{ left: `${greenLeft}%` }}
            >
              {formatRangeNum(alo)}
            </span>
            <span
              className="absolute -translate-x-1/2"
              style={{ left: `${greenRight}%` }}
            >
              {formatRangeNum(ahi)}
            </span>
          </div>
        </button>
      ) : (
        <div
          className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"
          data-testid={`panel-dial-${control.attribute}`}
        >
          {(
            [
              ["Accept low", loIn, setLoIn],
              ["Accept high", hiIn, setHiIn],
              ["Total low", dloIn, setDloIn],
              ["Total high", dhiIn, setDhiIn],
            ] as const
          ).map(([lab, val, set]) => (
            <label
              key={lab}
              className="text-[10px] text-[var(--color-label-secondary)]"
            >
              {lab}
              <input
                className="mt-0.5 w-full rounded border border-[var(--color-separator)] bg-[var(--color-canvas)] px-1.5 py-1 text-xs tabular-nums"
                value={val}
                onChange={(e) => set(e.target.value)}
                disabled={busy}
              />
            </label>
          ))}
          <div className="col-span-2 flex flex-wrap gap-2 sm:col-span-4">
            <button
              type="button"
              disabled={busy}
              className="rounded-full bg-[var(--color-tint)] px-3 py-1 text-xs font-medium text-[var(--color-on-tint)] disabled:opacity-50"
              onClick={() => void commitSave()}
            >
              {busy ? "Saving…" : "Save ranges"}
            </button>
            <button
              type="button"
              disabled={busy}
              className="rounded-full border border-[var(--color-separator)] px-3 py-1 text-xs font-medium text-[var(--color-label-secondary)] hover:bg-[var(--color-fill)]"
              onClick={closeDial}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Radar (six axes) — fills container, minimal inset for labels ───── */

function RadarChart({ axes }: { axes: JourneyShapeAxis[] }) {
  // Unit square viewBox; plot uses almost all of it (labels sit in a thin ring).
  const size = 100;
  const cx = 50;
  const cy = 50;
  const rMax = 38; // data radius — large so the chart fills the box
  const rLabel = 46; // axis labels just outside the outer ring

  const pts = axes.map((ax, i) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / axes.length;
    const gathering = ax.state === "gathering" || ax.extension == null;
    const ext = gathering
      ? 0.06
      : Math.max(0.04, Math.min(1, Number(ax.extension) || 0));
    return {
      ax,
      x: cx + rMax * ext * Math.cos(ang),
      y: cy + rMax * ext * Math.sin(ang),
      lx: cx + rLabel * Math.cos(ang),
      ly: cy + rLabel * Math.sin(ang),
      gathering,
      ang,
    };
  });

  if (axes.length < 3) {
    return (
      <p className="py-4 text-center text-xs text-[var(--color-label-tertiary)]">
        Loading axes…
      </p>
    );
  }

  const poly = pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="block h-auto w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Campaign Journey radar — six controls alignment"
      data-testid="campaign-journey-radar"
    >
      {[0.33, 0.66, 1].map((t) => (
        <circle
          key={t}
          cx={cx}
          cy={cy}
          r={rMax * t}
          fill="none"
          stroke="var(--color-separator)"
          strokeWidth={0.35}
        />
      ))}
      {pts.map((p, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={cx + rMax * Math.cos(p.ang)}
          y2={cy + rMax * Math.sin(p.ang)}
          stroke="var(--color-separator)"
          strokeWidth={0.35}
        />
      ))}
      <polygon
        points={poly}
        fill="var(--color-tint)"
        fillOpacity={0.2}
        stroke="var(--color-tint)"
        strokeWidth={0.7}
        strokeLinejoin="round"
      />
      {pts.map((p) => (
        <g key={p.ax.bound_id}>
          <circle
            cx={p.x}
            cy={p.y}
            r={p.gathering ? 0.9 : 1.35}
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
            style={{ fontSize: 3.2 }}
          >
            {(p.ax.label || p.ax.attribute).replace(/_/g, " ")}
          </text>
        </g>
      ))}
    </svg>
  );
}

/* ── Main panel: left controls · right radar ─────────────────────────── */

export default function CampaignPanel({
  campaignId,
  isLedger,
}: {
  campaignId: number;
  isLedger?: boolean;
}) {
  /** One-shot series in memory — readings at present only (no time scrub). */
  const [series, setSeries] = useState<JourneySeries | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadSeries = useCallback(async () => {
    if (isLedger) return;
    setLoading(true);
    setError(null);
    try {
      const [s, p] = await Promise.all([
        fetchCampaignJourneySeries(campaignId),
        fetchCampaignPanel(campaignId).catch(() => null),
      ]);
      setSeries(s);
      setCanEdit(!!p?.can_edit);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load panel");
      setSeries(null);
    } finally {
      setLoading(false);
    }
  }, [campaignId, isLedger]);

  useEffect(() => {
    void loadSeries();
  }, [loadSeries]);

  const asOf = useMemo(
    () => (series?.present || series?.window_to || "").slice(0, 10) || null,
    [series],
  );

  const panel: PanelResponse | null = useMemo(() => {
    if (!series || !asOf) return null;
    return derivePanelAt(series, asOf, { can_edit: canEdit });
  }, [series, asOf, canEdit]);

  const shape: JourneyShape | null = useMemo(() => {
    if (!series || !asOf) return null;
    return deriveShapeAt(series, asOf);
  }, [series, asOf]);

  async function saveControl(
    attribute: string,
    patch: {
      range_low?: number | null;
      range_high?: number | null;
      display_low?: number | null;
      display_high?: number | null;
    },
  ) {
    setBusy(true);
    setError(null);
    try {
      await patchCampaignPanelControl(campaignId, attribute, patch);
      await loadSeries();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  if (isLedger) return null;

  return (
    <section
      className="space-y-3"
      data-testid="campaign-panel"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2
            className="font-semibold text-[var(--color-label)]"
            style={{ fontSize: "var(--text-headline)" }}
          >
            Campaign Panel
          </h2>
          <p className="text-xs text-[var(--color-label-secondary)]">
            Six controls · reference ranges · shape means faithful, not big
            numbers
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {panel && (
            <span className="text-xs tabular-nums text-[var(--color-label-tertiary)]">
              window{" "}
              {panel.window_from || "…"} → {panel.window_to || panel.as_of}
              {panel.sample_n != null ? ` · n=${panel.sample_n} closed` : ""}
            </span>
          )}
          {panel?.can_edit && (
            <span className="text-[10px] text-[var(--color-label-tertiary)]">
              Admin: click a strip to adjust ranges
            </span>
          )}
        </div>
      </div>

      {loading && !panel && (
        <p className="text-sm text-[var(--color-label-tertiary)]">Loading panel…</p>
      )}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {/* Left: six control strips (40%) · Right: radar (60%) — no time scrub */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
        <div
          className="flex flex-col gap-2"
          data-testid="campaign-panel-controls"
        >
          {(panel?.controls || []).map((c) => (
            <CmpControlStrip
              key={c.attribute}
              control={c}
              canEdit={!!panel?.can_edit}
              busy={busy}
              onSave={(patch) => saveControl(c.attribute, patch)}
            />
          ))}
        </div>

        <div
          className="surface-card sticky top-4 flex min-h-0 flex-col border border-[var(--color-separator)] p-2 sm:p-2.5"
          data-testid="campaign-panel-radar"
        >
          <h3 className="mb-0.5 shrink-0 text-center text-xs font-semibold text-[var(--color-label)]">
            Campaign Journey
          </h3>

          <div className="min-h-0 w-full flex-1">
            {shape?.axes && shape.axes.length > 0 ? (
              <RadarChart axes={shape.axes} />
            ) : (
              <p className="py-8 text-center text-xs text-[var(--color-label-tertiary)]">
                {loading ? "Loading shape…" : "Shape unavailable"}
              </p>
            )}
          </div>

          {shape?.amendment_markers && shape.amendment_markers.length > 0 && (
            <p className="mt-1 shrink-0 text-center text-[9px] text-[var(--color-label-tertiary)]">
              Amendments:{" "}
              {shape.amendment_markers
                .filter((m) => m.at)
                .map((m) => m.at)
                .join(" · ")}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
