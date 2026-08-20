"use client";

/**
 * Analyzer Alert Builder — MSC feature range, Labs chrome (AZ-ALB v1.0.3).
 * Save goes through the Alerts Manager hook (adapter until Manager GO).
 */

import { useEffect, useMemo, useState } from "react";
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
  kind: AlertsManagerKind;
  category?: Category;
  price?: number;
  condition?: AlertsManagerCondition;
  positionId?: string;
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

  useEffect(() => {
    if (!open) return;
    const cat = seed?.category ?? (seed?.kind === "position" ? "position" : "price");
    setCategory(cat);
    setCondition(seed?.condition ?? "above");
    setTarget(
      seed?.price != null && Number.isFinite(seed.price)
        ? String(Math.round(seed.price))
        : spot > 0
          ? String(Math.round(spot))
          : "",
    );
    setBehavior("once_only");
    setTagId("watch");
    setPositionId(seed?.positionId || positions[0]?.id || "");
    setPosTab("pnl");
    setGreek("delta");
    setNoExp(false);
    const et = new Date().toLocaleDateString("en-CA", {
      timeZone: "America/New_York",
    });
    setExpiration(`${et}T16:00`);
  }, [open, seed, spot, positions]);

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
    "min-h-[var(--hit-min)] flex-1 rounded-[var(--radius-md)] border border-[var(--color-separator)] " +
    "bg-[var(--color-fill)] px-2.5 text-[length:var(--text-subheadline)] text-[var(--color-label)] " +
    "outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
    "focus-visible:outline-[var(--color-tint)]";
  const lab =
    "w-[7rem] shrink-0 text-[length:var(--text-subheadline)] text-[var(--color-label)]";
  const row = "flex min-h-[var(--hit-min)] items-center gap-3";

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
      <div className="flex flex-col gap-3">
        <div className={row}>
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
            <div className={row}>
              <span className={lab}>Position</span>
              <select
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
          <>
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
            <div className="flex gap-1">
              {(
                [
                  ["breakeven", "B/E"],
                  ["trailing", "Trail"],
                  ["zerodte", "0DTE"],
                ] as const
              ).map(([k, l]) => (
                <Button
                  key={k}
                  variant="plain"
                  aria-pressed={posTab === k}
                  onClick={() => setPosTab(k)}
                >
                  {l}
                </Button>
              ))}
            </div>
          </>
        )}

        {placeholder || algo ? (
          <p
            className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-separator)] px-4 py-6 text-center text-[length:var(--text-footnote)] text-[var(--color-label-tertiary)]"
            data-testid="analyzer-alert-coming-soon"
          >
            Coming soon — Save is off. Use Price or Position P&amp;L / Greeks.
          </p>
        ) : (
          <>
            <div className={row}>
              <span className={lab}>Condition</span>
              <select
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
            <div className={row}>
              <span className={lab}>Value</span>
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
            {(category === "greeks" || posTab === "greeks") && (
              <div className={row}>
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
            <div className={row}>
              <span className={lab}>Trigger</span>
              <select
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

        <div className={row}>
          <span className={lab}>Expiration</span>
          <input
            className={field}
            type="datetime-local"
            disabled={noExp}
            value={noExp ? "" : expiration}
            onChange={(e) => {
              setExpiration(e.target.value);
              setNoExp(false);
            }}
          />
        </div>
        <label className="flex min-h-[var(--hit-min)] items-center justify-end gap-2 text-[length:var(--text-footnote)] text-[var(--color-label-secondary)]">
          <input
            type="checkbox"
            className="h-5 w-5"
            checked={noExp}
            onChange={(e) => setNoExp(e.target.checked)}
          />
          No expiration
        </label>
        <div className={row}>
          <span className={lab}>Tags</span>
          <div className="flex min-h-[var(--hit-min)] flex-1 flex-wrap gap-1">
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
