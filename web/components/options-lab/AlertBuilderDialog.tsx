"use client";

/**
 * Analyzer Alert Builder — MSC feature range, Labs chrome (AZ-ALB v1.0.3).
 * Save goes through the Alerts Manager hook (adapter until Manager GO).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Banner from "@/components/ui/Banner";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import Modal from "@/components/ui/Modal";
import SegmentedControl from "@/components/ui/SegmentedControl";
import { formatAlertTouchedContext } from "@/lib/options-lab/analyzerBook";
import { IconPlus } from "@/components/ui/icons";
import type {
  AlertsManagerBehavior,
  AlertsManagerCondition,
  AlertsManagerDraft,
  AlertsManagerKind,
  AlertsManagerRunState,
} from "@/lib/alerts/analyzerAlertsAdapter";
import {
  ALERTS_DOMAIN,
  ALERTS_SEVERITY_DEFAULT,
  ALERTS_SOURCE_SYSTEM,
  ALERTS_SUITE,
  ALERT_TAG_CHIPS,
} from "@/lib/alerts/analyzerAlertsAdapter";
import {
  ALGO_ENTRY_PCT_DEFAULT,
  ALGO_F0_DEFAULT,
  ALGO_FMIN_DEFAULT,
  algoReasonPrompt,
} from "@/lib/options-lab/algoTrailMath";
import { sessionEodMs } from "@/lib/options-lab/whatIfClocks";

function toDatetimeLocal(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type Category = "price" | "position" | "greeks" | "algo";
type PosTab = "pnl" | "profit" | "greeks" | "breakeven" | "trailing" | "zerodte";

export type AlertBuilderSeed = {
  id?: string;
  kind: AlertsManagerKind;
  category?: Category;
  price?: number;
  condition?: AlertsManagerCondition;
  positionId?: string;
  runState?: AlertsManagerRunState;
  touchedAt?: string;
  touchedSpot?: number;
  /** Default Demo on when creating during Time Machine (ATM-A1). */
  demo?: boolean;
  demoClock?: "timemachine" | "whatif";
  /** Session clock for EoD (playhead `t_ms` on a TM day). */
  clockMs?: number;
  overlay?: boolean;
  entryPct?: number;
  trailStartPct?: number;
  trailFloorPct?: number;
  decayEnd?: "eod" | string;
  trailStopReason?: string;
  trailEndReason?: string;
  highWaterColor?: string;
  trailColor?: string;
  color?: string;
};

function pctField(n: number | undefined, fallback: number): number {
  if (n == null || !Number.isFinite(n)) return fallback;
  return n <= 1 ? Math.round(n * 100) : Math.round(n);
}

function chipIdForPaint(
  paint: string | undefined,
  fallback: (typeof ALERT_TAG_CHIPS)[number]["id"],
): (typeof ALERT_TAG_CHIPS)[number]["id"] {
  const hit = ALERT_TAG_CHIPS.find((c) => c.paint === paint);
  return hit?.id ?? fallback;
}

export type AlertBuilderPosition = {
  id: string;
  strikesLabel: string;
  algoEligible?: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (draft: AlertsManagerDraft) => void;
  symbol: string;
  spot: number;
  positions: AlertBuilderPosition[];
  seed: AlertBuilderSeed | null;
};

const TYPE_OPTIONS = [
  { id: "price" as const, label: "Price" },
  { id: "position" as const, label: "Position" },
  { id: "greeks" as const, label: "Greeks" },
  { id: "algo" as const, label: "Algo" },
];

const LIVE_POS_TABS = [
  { id: "pnl" as const, label: "P&L" },
  { id: "profit" as const, label: "Profit" },
  { id: "greeks" as const, label: "Greeks" },
];

/** Member-settable only. Touched is evaluation — Reset, never pick. */
const RUN_STATE_OPTIONS = [
  { id: "live" as const, label: "Live" },
  { id: "idle" as const, label: "Idle" },
];

export default function AlertBuilderDialog({
  open,
  onClose,
  onSave,
  symbol,
  spot,
  positions,
  seed,
}: Props) {
  const [category, setCategory] = useState<Category>("price");
  const [condition, setCondition] = useState<AlertsManagerCondition>("above");
  const [target, setTarget] = useState("");
  const [behavior, setBehavior] = useState<AlertsManagerBehavior>("once_only");
  const [tagId, setTagId] = useState<(typeof ALERT_TAG_CHIPS)[number]["id"]>(
    "watch",
  );
  const [positionId, setPositionId] = useState("");
  const [posTab, setPosTab] = useState<PosTab>("pnl");
  const [greek, setGreek] = useState<"delta" | "gamma" | "theta">("delta");
  const [noExp, setNoExp] = useState(false);
  const [expiration, setExpiration] = useState("");
  const [runState, setRunState] = useState<AlertsManagerRunState>("live");
  const [entryPct, setEntryPct] = useState(
    Math.round(ALGO_ENTRY_PCT_DEFAULT * 100),
  );
  const [trailStartPct, setTrailStartPct] = useState(
    Math.round(ALGO_F0_DEFAULT * 100),
  );
  const [trailFloorPct, setTrailFloorPct] = useState(
    Math.round(ALGO_FMIN_DEFAULT * 100),
  );
  const [decayEod, setDecayEod] = useState(true);
  const [decayEndAt, setDecayEndAt] = useState("");
  const [stopReasonOn, setStopReasonOn] = useState(false);
  const [stopReason, setStopReason] = useState("");
  const [endReasonOn, setEndReasonOn] = useState(false);
  const [endReason, setEndReason] = useState("");
  const [demoOn, setDemoOn] = useState(false);
  const [overlayOn, setOverlayOn] = useState(false);
  const [hwColorId, setHwColorId] = useState<(typeof ALERT_TAG_CHIPS)[number]["id"]>("target");
  const [trailColorId, setTrailColorId] = useState<(typeof ALERT_TAG_CHIPS)[number]["id"]>("warning");
  const spotRef = useRef(spot);
  const positionsRef = useRef(positions);
  spotRef.current = spot;
  positionsRef.current = positions;
  const seedKey = open
    ? [
        seed?.id ?? "new",
        seed?.category ?? "",
        seed?.kind ?? "",
        seed?.positionId ?? "",
        seed?.condition ?? "",
        seed?.price ?? "",
        seed?.entryPct ?? "",
      ].join("|")
    : "closed";

  useEffect(() => {
    if (!open) return;
    const liveSpot = spotRef.current;
    const livePositions = positionsRef.current;
    const cat =
      seed?.category ?? (seed?.kind === "position" ? "position" : "price");
    setCategory(cat);
    setCondition(seed?.condition ?? "above");
    setTarget(
      seed?.price != null && Number.isFinite(seed.price)
        ? String(Math.round(seed.price))
        : liveSpot > 0
          ? String(Math.round(liveSpot))
          : "",
    );
    setBehavior("once_only");
    setTagId(chipIdForPaint(seed?.color, "watch"));
    const eligible = livePositions.filter((p) => p.algoEligible);
    setPositionId(
      seed?.positionId ||
        (cat === "algo" ? eligible[0]?.id : livePositions[0]?.id) ||
        "",
    );
    setPosTab("pnl");
    setGreek("delta");
    setNoExp(false);
    setRunState(seed?.runState ?? "live");
    const et = new Date().toLocaleDateString("en-CA", {
      timeZone: "America/New_York",
    });
    setExpiration(`${et}T16:00`);
    setEntryPct(pctField(seed?.entryPct, Math.round(ALGO_ENTRY_PCT_DEFAULT * 100)));
    setTrailStartPct(
      pctField(seed?.trailStartPct, Math.round(ALGO_F0_DEFAULT * 100)),
    );
    setTrailFloorPct(
      pctField(seed?.trailFloorPct, Math.round(ALGO_FMIN_DEFAULT * 100)),
    );
    const decay = seed?.decayEnd;
    if (decay && decay !== "eod") {
      const ms = Date.parse(decay);
      setDecayEod(false);
      setDecayEndAt(
        Number.isFinite(ms)
          ? toDatetimeLocal(ms)
          : toDatetimeLocal(sessionEodMs(symbol, seed?.clockMs ?? Date.now())),
      );
    } else {
      setDecayEod(true);
      setDecayEndAt(
        toDatetimeLocal(sessionEodMs(symbol, seed?.clockMs ?? Date.now())),
      );
    }
    const stop = (seed?.trailStopReason || "").trim();
    setStopReasonOn(stop.length > 0);
    setStopReason(stop);
    const end = (seed?.trailEndReason || "").trim();
    setEndReasonOn(end.length > 0);
    setEndReason(end);
    setDemoOn(seed?.demo === true);
    setOverlayOn(seed?.overlay === true);
    setHwColorId(chipIdForPaint(seed?.highWaterColor, "target"));
    setTrailColorId(chipIdForPaint(seed?.trailColor, "warning"));
  }, [open, seedKey, seed, symbol]);

  const bound = positions.find((p) => p.id === positionId) ?? positions[0];
  const title = useMemo(() => {
    if (category === "price") return `${symbol} — Price Alert`;
    if (category === "greeks") return `${symbol} — Greeks Alert (Δ Γ Θ)`;
    if (category === "algo") return `${symbol} — Algo Alert`;
    return bound?.strikesLabel
      ? `${symbol} — ${bound.strikesLabel}`
      : `${symbol} — Position Alert`;
  }, [category, symbol, bound]);

  const placeholder =
    category === "position" &&
    (posTab === "breakeven" || posTab === "trailing" || posTab === "zerodte");
  const algo = category === "algo";
  const algoList = positions.filter((p) => p.algoEligible);
  /** Eligible flies first; if none qualify, still list the book so they can pick. */
  const pickerPositions =
    category === "algo"
      ? algoList.length > 0
        ? algoList
        : positions
      : positions;

  useEffect(() => {
    if (!open) return;
    if (
      category !== "algo" &&
      category !== "position" &&
      category !== "greeks"
    ) {
      return;
    }
    if (!pickerPositions.length) return;
    if (positionId && pickerPositions.some((p) => p.id === positionId)) return;
    setPositionId(pickerPositions[0].id);
  }, [open, category, pickerPositions, positionId]);
  const n = Number(target);
  const algoOk =
    algo &&
    !!positionId &&
    algoList.some((p) => p.id === positionId) &&
    entryPct > 0 &&
    trailStartPct > trailFloorPct &&
    trailFloorPct > 0;
  const canSave = algo
    ? algoOk
    : !placeholder &&
      Number.isFinite(n) &&
      (category !== "position" || !!positionId || positions.length === 0);

  const bump = (delta: number) => {
    const cur = Number(target);
    const base = Number.isFinite(cur) ? cur : 0;
    setTarget(String(base + delta));
  };

  const field =
    "min-h-[var(--hit-min)] w-full rounded-[var(--radius-md)] border border-[var(--color-separator)] " +
    "bg-[var(--color-fill)] px-3 text-[length:var(--text-body)] text-[var(--color-label)] " +
    "outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
    "focus-visible:outline-[var(--color-tint)]";
  const lab =
    "mb-1.5 block text-[length:var(--text-footnote)] font-medium text-[var(--color-label-secondary)]";
  const group = "flex flex-col";

  const tag = ALERT_TAG_CHIPS.find((t) => t.id === tagId) ?? ALERT_TAG_CHIPS[0];

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      workSurface="dark"
      floatable
      testId="analyzer-alert-builder"
      footer={
        <>
          <Button variant="plain" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!canSave}
            onClick={() => {
              if (!canSave) return;
              if (category === "algo") {
                const hw =
                  ALERT_TAG_CHIPS.find((t) => t.id === hwColorId) ??
                  ALERT_TAG_CHIPS[3];
                const tr =
                  ALERT_TAG_CHIPS.find((t) => t.id === trailColorId) ??
                  ALERT_TAG_CHIPS[2];
                onSave({
                  id: seed?.id,
                  source_system: ALERTS_SOURCE_SYSTEM,
                  suite: ALERTS_SUITE,
                  domain: ALERTS_DOMAIN,
                  alert_class: "algo",
                  kind: "position",
                  symbol,
                  title: `${symbol} OTM fly trail`,
                  color: hw.paint,
                  behavior: "once_only",
                  severity: ALERTS_SEVERITY_DEFAULT,
                  run_state: runState,
                  position_id: positionId,
                  position_label: bound?.strikesLabel,
                  expires_at: noExp ? undefined : expiration || undefined,
                  trigger: {
                    family: "algo",
                    condition: "at",
                    target: 0,
                    algo: {
                      variant: "otm_fly_trail",
                      entry_pct: entryPct,
                      trail_start_pct: trailStartPct,
                      trail_floor_pct: trailFloorPct,
                      decay_end:
                        decayEod || !decayEndAt
                          ? "eod"
                          : new Date(decayEndAt).toISOString(),
                      trail_stop_reason: algoReasonPrompt(
                        stopReasonOn,
                        stopReason,
                      ),
                      trail_end_reason: algoReasonPrompt(
                        endReasonOn,
                        endReason,
                      ),
                      demo: demoOn,
                      overlay: overlayOn,
                      high_water_color: hw.paint,
                      trail_color: tr.paint,
                    },
                  },
                });
                onClose();
                return;
              }
              const kind: AlertsManagerKind =
                category === "price" ? "canvas" : "position";
              const family =
                category === "greeks" || posTab === "greeks"
                  ? "greek"
                  : category === "price"
                    ? "price"
                    : "pnl";
              onSave({
                id: seed?.id,
                source_system: ALERTS_SOURCE_SYSTEM,
                suite: ALERTS_SUITE,
                domain: ALERTS_DOMAIN,
                alert_class: "threshold",
                kind,
                symbol,
                title: title.replace(" — ", " "),
                color: tag.paint,
                behavior,
                severity: ALERTS_SEVERITY_DEFAULT,
                run_state: runState,
                position_id: kind === "position" ? positionId : undefined,
                position_label: bound?.strikesLabel,
                expires_at: noExp ? undefined : expiration || undefined,
                trigger: {
                  family,
                  condition,
                  target: n,
                  greek: family === "greek" ? greek : undefined,
                },
              });
              onClose();
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <div className={group}>
          <span className={lab}>State</span>
          {runState === "touched" ? (
            <div className="flex flex-col gap-3">
              <Banner tone="warning">
                <span data-testid="alert-builder-touched-at">
                  Touched{" "}
                  {formatAlertTouchedContext({
                    at: seed?.touchedAt,
                    spot: seed?.touchedSpot,
                  }) || "— reset to Live or Idle"}
                </span>
              </Banner>
              <Button
                variant="bordered"
                onClick={() => setRunState("live")}
                data-testid="alert-builder-reset-touch"
              >
                Reset to Live
              </Button>
            </div>
          ) : (
            <SegmentedControl
              ariaLabel="Alert state"
              value={runState}
              options={RUN_STATE_OPTIONS}
              onChange={(id) => setRunState(id as "live" | "idle")}
            />
          )}
        </div>
        <div className={group}>
          <span className={lab}>Type</span>
          <SegmentedControl
            ariaLabel="Alert type"
            value={category}
            options={TYPE_OPTIONS}
            onChange={setCategory}
          />
        </div>

        {(category === "position" ||
          category === "greeks" ||
          category === "algo") &&
          pickerPositions.length > 0 && (
            <div className={group}>
              <label className={lab} htmlFor="alert-builder-position">
                Position
              </label>
              <select
                id="alert-builder-position"
                className={field}
                value={positionId}
                onChange={(e) => setPositionId(e.target.value)}
                data-testid="alert-builder-position"
              >
                {pickerPositions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {category === "algo" && p.algoEligible === false
                      ? `${p.strikesLabel} — not an OTM debit fly`
                      : p.strikesLabel}
                  </option>
                ))}
              </select>
            </div>
          )}

        {category === "position" && (
          <div className={group}>
            <span className={lab}>Measure</span>
            <SegmentedControl
              ariaLabel="Position alert family"
              value={
                posTab === "breakeven" ||
                posTab === "trailing" ||
                posTab === "zerodte"
                  ? "pnl"
                  : posTab
              }
              options={LIVE_POS_TABS}
              onChange={(id) => setPosTab(id)}
            />
            <p className="mt-2 text-[length:var(--text-caption)] text-[var(--color-label-tertiary)]">
              Break-even, trailing, and 0DTE — coming soon.
            </p>
          </div>
        )}

        {algo ? (
          <div className="flex flex-col gap-4" data-testid="analyzer-alert-algo">
            {algoList.length === 0 ? (
              <p className="text-[length:var(--text-subheadline)] text-[var(--color-label-secondary)]">
                {positions.length === 0
                  ? "Specify an OTM butterfly."
                  : "Choose a long OTM debit butterfly (call body above spot, put body below). Save stays off until that bind is valid."}
              </p>
            ) : null}
            <label className={lab} htmlFor="algo-entry-pct">
              Start profit management (% unrealized gain)
            </label>
            <input
              id="algo-entry-pct"
              className={field}
              type="number"
              min={1}
              max={100}
              value={entryPct}
              onChange={(e) => setEntryPct(Number(e.target.value) || 0)}
              data-testid="algo-entry-pct"
            />
            <p className="text-[length:var(--text-caption)] text-[var(--color-label-tertiary)]">
              Starts when unrealized gain reaches this percent of the debit.
            </p>
            <div
              className={
                "flex flex-col gap-4 rounded-[var(--radius-md)] border " +
                "border-[var(--color-tint)] bg-[var(--color-tint-soft)] p-4"
              }
              data-testid="algo-trail-range"
            >
              <h4 className="text-[length:var(--text-subheadline)] font-semibold text-[var(--color-label)]">
                Trail Settings
              </h4>
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[10rem] flex-1">
                  <label className={lab} htmlFor="algo-trail-start">
                    Start Trail %
                  </label>
                  <input
                    id="algo-trail-start"
                    className={field}
                    type="number"
                    min={1}
                    max={100}
                    value={trailStartPct}
                    onChange={(e) =>
                      setTrailStartPct(Number(e.target.value) || 0)
                    }
                    data-testid="algo-trail-start"
                  />
                </div>
                <label className="flex min-h-[var(--hit-min)] items-center gap-2 pb-1">
                  <input
                    type="checkbox"
                    checked={stopReasonOn}
                    onChange={(e) => setStopReasonOn(e.target.checked)}
                    data-testid="algo-trail-stop-reason-on"
                  />
                  Reason
                </label>
              </div>
              {stopReasonOn ? (
                <textarea
                  className={field + " min-h-[5.5rem] py-2"}
                  value={stopReason}
                  onChange={(e) => setStopReason(e.target.value)}
                  placeholder="Prompt the AI will use to hold or fold at this stop. Off = built-in engine."
                  data-testid="algo-trail-stop-reason"
                />
              ) : null}
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[10rem] flex-1">
                  <label className={lab} htmlFor="algo-trail-floor">
                    End Trail %
                  </label>
                  <input
                    id="algo-trail-floor"
                    className={field}
                    type="number"
                    min={1}
                    max={99}
                    value={trailFloorPct}
                    onChange={(e) =>
                      setTrailFloorPct(Number(e.target.value) || 0)
                    }
                    data-testid="algo-trail-floor"
                  />
                </div>
                <label className="flex min-h-[var(--hit-min)] items-center gap-2 pb-1">
                  <input
                    type="checkbox"
                    checked={endReasonOn}
                    onChange={(e) => setEndReasonOn(e.target.checked)}
                    data-testid="algo-trail-end-reason-on"
                  />
                  Reason
                </label>
              </div>
              {endReasonOn ? (
                <textarea
                  className={field + " min-h-[5.5rem] py-2"}
                  value={endReason}
                  onChange={(e) => setEndReason(e.target.value)}
                  placeholder="Prompt the AI will use to hold or fold at trail end. Off = built-in engine."
                  data-testid="algo-trail-end-reason"
                />
              ) : null}
              <label className="flex min-h-[var(--hit-min)] items-center gap-3">
                <input
                  type="checkbox"
                  checked={decayEod}
                  onChange={(e) => {
                    const on = e.target.checked;
                    setDecayEod(on);
                    if (!on && !decayEndAt) {
                      setDecayEndAt(
                        toDatetimeLocal(
                          sessionEodMs(symbol, seed?.clockMs ?? Date.now()),
                        ),
                      );
                    }
                  }}
                  data-testid="algo-decay-eod"
                />
                Decay ends at end of day
              </label>
              {!decayEod ? (
                <>
                  <label className={lab} htmlFor="algo-decay-end">
                    Decay ends
                  </label>
                  <input
                    id="algo-decay-end"
                    className={field}
                    type="datetime-local"
                    value={decayEndAt}
                    onChange={(e) => setDecayEndAt(e.target.value)}
                    data-testid="algo-decay-end"
                  />
                </>
              ) : null}
            </div>
            <label className="flex min-h-[var(--hit-min)] items-center gap-3">
              <input
                type="checkbox"
                checked={demoOn}
                onChange={(e) => setDemoOn(e.target.checked)}
                data-testid="algo-demo"
              />
              Demo
            </label>
            <label className="flex min-h-[var(--hit-min)] items-center gap-3">
              <input
                type="checkbox"
                checked={overlayOn}
                onChange={(e) => setOverlayOn(e.target.checked)}
                data-testid="algo-overlay"
              />
              Overlay between lines
            </label>
          </div>
        ) : placeholder ? (
          <p
            className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-separator)] px-4 py-8 text-center text-[length:var(--text-subheadline)] text-[var(--color-label-tertiary)]"
            data-testid="analyzer-alert-coming-soon"
          >
            Coming soon — Save is off.
          </p>
        ) : (
          <>
            <div className={group}>
              <label className={lab} htmlFor="alert-builder-condition">
                Condition
              </label>
              <select
                id="alert-builder-condition"
                className={field}
                value={condition}
                onChange={(e) =>
                  setCondition(e.target.value as AlertsManagerCondition)
                }
              >
                {category === "price" ? (
                  <>
                    <option value="above">Cross above</option>
                    <option value="below">Cross below</option>
                    <option value="at">Touches</option>
                  </>
                ) : category === "greeks" || posTab === "greeks" ? (
                  <>
                    <option value="above">Greater than</option>
                    <option value="below">Less than</option>
                  </>
                ) : (
                  <>
                    <option value="above">P&amp;L above</option>
                    <option value="below">P&amp;L below</option>
                  </>
                )}
              </select>
            </div>
            <div className={group}>
              <span className={lab}>Value</span>
              <div className="flex items-center gap-2">
                <IconButton label="Decrease value" onClick={() => bump(-1)}>
                  −
                </IconButton>
                <input
                  className={field + " font-mono text-right"}
                  type="number"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
                <IconButton label="Increase value" onClick={() => bump(1)}>
                  <IconPlus size={18} />
                </IconButton>
              </div>
            </div>
            {(category === "greeks" || posTab === "greeks") && (
              <div className={group}>
                <span className={lab}>Greek</span>
                <SegmentedControl
                  ariaLabel="Greek"
                  value={greek}
                  options={[
                    { id: "delta", label: "Δ" },
                    { id: "gamma", label: "Γ" },
                    { id: "theta", label: "Θ" },
                  ]}
                  onChange={setGreek}
                />
              </div>
            )}
            <div className={group}>
              <label className={lab} htmlFor="alert-builder-trigger">
                Trigger
              </label>
              <select
                id="alert-builder-trigger"
                className={field}
                value={behavior}
                onChange={(e) =>
                  setBehavior(e.target.value as AlertsManagerBehavior)
                }
              >
                <option value="once_only">Once only</option>
                <option value="repeating">Repeating</option>
                <option value="persistent">Persistent</option>
              </select>
            </div>
          </>
        )}

        <div className={group}>
          <label className={lab} htmlFor="alert-builder-expiration">
            Expiration
          </label>
          <input
            id="alert-builder-expiration"
            className={field}
            type="datetime-local"
            disabled={noExp}
            value={noExp ? "" : expiration}
            onChange={(e) => {
              setExpiration(e.target.value);
              setNoExp(false);
            }}
          />
          <label className="mt-3 flex min-h-[var(--hit-min)] items-center gap-3 text-[length:var(--text-subheadline)] text-[var(--color-label)]">
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={noExp}
              onChange={(e) => setNoExp(e.target.checked)}
            />
            No expiration
          </label>
        </div>
        <div className={group}>
          <span className={lab}>Tag</span>
          <div className="flex flex-wrap gap-2">
            {ALERT_TAG_CHIPS.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={tagId === c.id}
                aria-label={c.id}
                className={
                  "min-h-[var(--hit-min)] min-w-[var(--hit-min)] rounded-[var(--radius-full)] " +
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
                  "focus-visible:outline-[var(--color-tint)] " +
                  (tagId === c.id
                    ? "ring-2 ring-[var(--color-label)] ring-offset-2 ring-offset-[var(--color-surface)]"
                    : "")
                }
                style={{ background: c.token }}
                onClick={() => setTagId(c.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
