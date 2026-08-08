"use client";

/**
 * Charter bounds editor — Two Roles (boundary / goal).
 * Ledger must not mount this.
 */

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui";
import {
  createCampaignBound,
  deleteCampaignBound,
  fetchCampaignBounds,
  type CampaignBound,
} from "@/lib/practiceSpineApi";

const ATTRIBUTES = [
  "win_rate",
  "risk_to_reward",
  "profit_factor",
  "drawdown",
  "avg_win_loss",
  "position_size",
  "risk_per_trade",
  "trading_window",
  "asset_scope",
  "strategy_scope",
] as const;

export default function CampaignBoundsPanel({
  campaignId,
  isLedger,
  readOnly,
}: {
  campaignId: number;
  isLedger?: boolean;
  readOnly?: boolean;
}) {
  const [bounds, setBounds] = useState<CampaignBound[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [role, setRole] = useState<"boundary" | "goal">("boundary");
  const [attribute, setAttribute] = useState<string>("win_rate");
  const [low, setLow] = useState("40");
  const [high, setHigh] = useState("60");
  const [critical, setCritical] = useState(false);

  const load = useCallback(async () => {
    if (isLedger) return;
    try {
      setBounds(await fetchCampaignBounds(campaignId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load bounds");
    }
  }, [campaignId, isLedger]);

  useEffect(() => {
    void load();
  }, [load]);

  if (isLedger) return null;

  async function addBound() {
    if (busy || readOnly) return;
    setBusy(true);
    setError(null);
    try {
      const lo = low.trim() === "" ? null : Number(low);
      const hi = high.trim() === "" ? null : Number(high);
      if (lo != null && !Number.isFinite(lo)) throw new Error("range_low invalid");
      if (hi != null && !Number.isFinite(hi)) throw new Error("range_high invalid");
      await createCampaignBound(campaignId, {
        role,
        attribute,
        range_low: lo,
        range_high: hi,
        is_critical: critical && role === "boundary",
      });
      setCritical(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add bound");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    if (busy || readOnly) return;
    setBusy(true);
    setError(null);
    try {
      await deleteCampaignBound(campaignId, id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="surface-card border border-[var(--color-separator)] p-4 sm:p-5"
      data-testid="campaign-bounds-panel"
    >
      <h2
        className="mb-1 font-semibold text-[var(--color-label)]"
        style={{ fontSize: "var(--text-headline)" }}
      >
        Charter bounds
      </h2>
      <p className="mb-3 text-xs text-[var(--color-label-secondary)]">
        <strong>Boundary</strong> = corridor (outside is variance).{" "}
        <strong>Goal</strong> = mark (progress only — never variance, never
        critical).
      </p>
      {error && (
        <p className="mb-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <ul className="mb-4 space-y-2 text-sm">
        {bounds.length === 0 && (
          <li className="text-[var(--color-label-tertiary)]">
            No bounds yet — add a corridor or goal.
          </li>
        )}
        {bounds.map((b) => (
          <li
            key={b.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[var(--color-fill)]/50 px-3 py-2"
            data-testid="campaign-bound-row"
          >
            <span>
              <span className="font-medium text-[var(--color-label)]">
                {b.attribute.replace(/_/g, " ")}
              </span>
              <span className="ml-2 text-xs uppercase text-[var(--color-label-tertiary)]">
                {b.role}
                {b.is_critical ? " · critical" : ""}
              </span>
              <span className="ml-2 tabular-nums text-[var(--color-label-secondary)]">
                [{b.range_low ?? "—"}, {b.range_high ?? "—"}]
              </span>
            </span>
            {!readOnly && (
              <button
                type="button"
                className="text-xs text-red-600 hover:underline"
                onClick={() => void remove(b.id)}
                disabled={busy}
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>
      {!readOnly && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-xs text-[var(--color-label-secondary)]">
            Role
            <select
              className="mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] px-2 py-1.5 text-sm"
              value={role}
              onChange={(e) => {
                setRole(e.target.value as "boundary" | "goal");
                if (e.target.value === "goal") setCritical(false);
              }}
              data-testid="bound-role"
            >
              <option value="boundary">Boundary (corridor)</option>
              <option value="goal">Goal (mark)</option>
            </select>
          </label>
          <label className="text-xs text-[var(--color-label-secondary)]">
            Attribute
            <select
              className="mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] px-2 py-1.5 text-sm"
              value={attribute}
              onChange={(e) => setAttribute(e.target.value)}
              data-testid="bound-attribute"
            >
              {ATTRIBUTES.map((a) => (
                <option key={a} value={a}>
                  {a.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-[var(--color-label-secondary)]">
            Low
            <input
              className="mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] px-2 py-1.5 text-sm tabular-nums"
              value={low}
              onChange={(e) => setLow(e.target.value)}
              data-testid="bound-low"
            />
          </label>
          <label className="text-xs text-[var(--color-label-secondary)]">
            High
            <input
              className="mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] px-2 py-1.5 text-sm tabular-nums"
              value={high}
              onChange={(e) => setHigh(e.target.value)}
              data-testid="bound-high"
            />
          </label>
          <label className="flex items-center gap-2 self-end text-xs text-[var(--color-label-secondary)]">
            <input
              type="checkbox"
              checked={critical}
              disabled={role === "goal"}
              onChange={(e) => setCritical(e.target.checked)}
              data-testid="bound-critical"
            />
            Critical (boundary only)
          </label>
          <div className="self-end">
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => void addBound()}
              data-testid="bound-add"
            >
              {busy ? "Adding…" : "Add bound"}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
