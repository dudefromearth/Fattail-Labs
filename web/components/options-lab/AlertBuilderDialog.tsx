"use client";

/**
 * Analyzer Alert Builder — MSC feature range, Labs chrome (AZ-ALB v1.0.3).
 * Save goes through the Alerts Manager hook (adapter until Manager GO).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import Modal from "@/components/ui/Modal";
import SegmentedControl from "@/components/ui/SegmentedControl";
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
};

export type AlertBuilderPosition = {
  id: string;
  strikesLabel: string;
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

const RUN_STATE_OPTIONS = [
  { id: "live" as const, label: "Live" },
  { id: "idle" as const, label: "Idle" },
  { id: "touched" as const, label: "Touched" },
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
  const seededRef = useRef(false);
  const spotRef = useRef(spot);
  const positionsRef = useRef(positions);
  spotRef.current = spot;
  positionsRef.current = positions;

  useEffect(() => {
    if (!open) {
      seededRef.current = false;
      return;
    }
    if (seededRef.current) return;
    seededRef.current = true;
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
    setTagId("watch");
    setPositionId(seed?.positionId || livePositions[0]?.id || "");
    setPosTab("pnl");
    setGreek("delta");
    setNoExp(false);
    setRunState(seed?.runState ?? "live");
    const et = new Date().toLocaleDateString("en-CA", {
      timeZone: "America/New_York",
    });
    setExpiration(`${et}T16:00`);
  }, [open, seed]);

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
  const n = Number(target);
  const canSave =
    !placeholder &&
    !algo &&
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
          <SegmentedControl
            ariaLabel="Alert state"
            value={runState}
            options={RUN_STATE_OPTIONS}
            onChange={setRunState}
          />
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
          positions.length > 0 && (
            <div className={group}>
              <label className={lab} htmlFor="alert-builder-position">
                Position
              </label>
              <select
                id="alert-builder-position"
                className={field}
                value={positionId}
                onChange={(e) => setPositionId(e.target.value)}
              >
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.strikesLabel}
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

        {placeholder || algo ? (
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
