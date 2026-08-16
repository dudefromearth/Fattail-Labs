"use client";

/**
 * Design tab — Expiration Schedule.
 * Target DTE + weekday scheduler, limited to what the symbol lists.
 * Daily book = Mon–Fri. Three-day book = Mon, Wed, Fri.
 */

import { useEffect, useMemo, useState } from "react";
import type { StrategyConfig } from "@/lib/strategyPacks";
import { fetchCurateSymbolCatalog } from "@/lib/strategyLabCurateApi";

type Props = {
  config: StrategyConfig;
  setField: (name: string, value: unknown) => void;
};

const DAYS = [
  { id: "mon", label: "Mon" },
  { id: "tue", label: "Tue" },
  { id: "wed", label: "Wed" },
  { id: "thu", label: "Thu" },
  { id: "fri", label: "Fri" },
] as const;

type DayId = (typeof DAYS)[number]["id"];

const group =
  "overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface-secondary)]";
const row =
  "flex items-center gap-3 border-b border-[var(--color-separator)] px-3 py-2 last:border-b-0";
const labelCls =
  "w-[5.75rem] shrink-0 text-[13px] text-[var(--color-label-secondary)]";

function parseDays(raw: unknown): DayId[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  const ok = new Set(DAYS.map((d) => d.id));
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is DayId => ok.has(s as DayId));
}

/** Daily book vs three-day (Mon/Wed/Fri). Unknown/loading shows daily. */
export function allowedWeekdays(cadence: string | null | undefined): DayId[] {
  const c = (cadence || "").toLowerCase();
  if (!c) return DAYS.map((d) => d.id);
  const daily =
    c.includes("daily") ||
    c.includes("5x") ||
    (c.includes("3-5") && c.includes("0dte"));
  if (daily) return DAYS.map((d) => d.id);
  return ["mon", "wed", "fri"];
}

export function allowsZeroDte(cadence: string | null | undefined): boolean {
  const c = (cadence || "").toLowerCase();
  if (!c) return true;
  return c.includes("0dte") || c.includes("daily");
}

export function formatExpDays(raw: unknown): string {
  const ids = parseDays(raw);
  if (!ids.length) return "—";
  return ids
    .map((id) => DAYS.find((d) => d.id === id)?.label)
    .filter(Boolean)
    .join(" ");
}

function cadenceLabel(days: DayId[]): string {
  if (days.length >= 5) return "Daily";
  if (
    days.length === 3 &&
    days.includes("mon") &&
    days.includes("wed") &&
    days.includes("fri")
  ) {
    return "Mon · Wed · Fri";
  }
  return "Listed weekdays";
}

function serializeDays(ids: DayId[]): string {
  return DAYS.map((d) => d.id)
    .filter((id) => ids.includes(id))
    .join(",");
}

export default function ExpirationSchedulePanel({ config, setField }: Props) {
  const symbol = String(config.underlying || config.symbol || "").toUpperCase();
  const [cadence, setCadence] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) {
      setCadence(null);
      return;
    }
    void fetchCurateSymbolCatalog({ tradeable_only: false })
      .then((cat) => {
        const row = cat?.symbols.find((s) => s.symbol.toUpperCase() === symbol);
        setCadence(row?.options_cadence ?? null);
      })
      .catch(() => setCadence(null));
  }, [symbol]);

  const allowed = useMemo(() => allowedWeekdays(cadence), [cadence]);
  const zeroOk = allowsZeroDte(cadence);
  const mode = String(config.dte_type || "next");
  const selected = parseDays(config.exp_days).filter((d) => allowed.includes(d));
  const days = selected.length ? selected : allowed;
  const serialized = serializeDays(days);

  useEffect(() => {
    if (!zeroOk && mode === "0dte") {
      setField("dte_type", "next");
    }
  }, [zeroOk, mode, setField]);

  useEffect(() => {
    if (serialized && serialized !== String(config.exp_days || "")) {
      setField("exp_days", serialized);
    }
  }, [serialized, config.exp_days, setField]);

  function setMode(next: string) {
    if (next === "0dte" && !zeroOk) return;
    setField("dte_type", next);
  }

  function toggleDay(id: DayId) {
    if (!allowed.includes(id)) return;
    const cur = new Set(days);
    if (cur.has(id)) {
      if (cur.size === 1) return;
      cur.delete(id);
    } else {
      cur.add(id);
    }
    setField("exp_days", serializeDays(Array.from(cur)));
  }

  const dteLabel =
    mode === "0dte"
      ? "0DTE"
      : mode === "1dte"
        ? "1DTE"
        : "Next expiration";
  const every =
    days.length >= 5
      ? "every weekday"
      : days.length
        ? formatExpDays(serialized)
        : "";

  return (
    <div className="space-y-3" data-testid="expiration-schedule-panel">
      <div className={group}>
        <div className={row + " justify-between"}>
          <span className={labelCls}>DTE</span>
          <div className="inline-flex flex-wrap justify-end rounded-full bg-[var(--color-fill)] p-0.5">
            <button
              type="button"
              disabled={!zeroOk}
              title={!zeroOk ? "This symbol does not list 0DTE" : undefined}
              className={
                "min-h-9 rounded-full px-3 text-[13px] font-semibold disabled:opacity-35 " +
                (mode === "0dte"
                  ? "bg-[var(--color-surface)] text-[var(--color-label)] shadow-[var(--elevation-1)]"
                  : "text-[var(--color-label-secondary)]")
              }
              onClick={() => setMode("0dte")}
            >
              0DTE
            </button>
            <button
              type="button"
              className={
                "min-h-9 rounded-full px-3 text-[13px] font-semibold " +
                (mode === "1dte"
                  ? "bg-[var(--color-surface)] text-[var(--color-label)] shadow-[var(--elevation-1)]"
                  : "text-[var(--color-label-secondary)]")
              }
              onClick={() => setMode("1dte")}
            >
              1DTE
            </button>
            <button
              type="button"
              className={
                "min-h-9 rounded-full px-3 text-[13px] font-semibold " +
                (mode === "next"
                  ? "bg-[var(--color-surface)] text-[var(--color-label)] shadow-[var(--elevation-1)]"
                  : "text-[var(--color-label-secondary)]")
              }
              onClick={() => setMode("next")}
            >
              Next Exp
            </button>
          </div>
        </div>

        <div className={row + " justify-between"}>
          <span className={labelCls}>Days</span>
          <div className="inline-flex flex-wrap justify-end rounded-full bg-[var(--color-fill)] p-0.5">
            {DAYS.map((d) => {
              const ok = allowed.includes(d.id);
              const on = ok && days.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  disabled={!ok}
                  title={!ok ? "Not listed for this symbol" : undefined}
                  className={
                    "min-h-9 min-w-10 rounded-full px-2.5 text-[13px] font-semibold disabled:opacity-30 " +
                    (on
                      ? "bg-[var(--color-surface)] text-[var(--color-label)] shadow-[var(--elevation-1)]"
                      : "text-[var(--color-label-secondary)]")
                  }
                  onClick={() => toggleDay(d.id)}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className={group}>
        <div className="px-3 py-3">
          <div className="text-[15px] font-medium text-[var(--color-label)]">
            {dteLabel}
            {every ? ` · ${every}` : ""}
          </div>
          <div className="mt-0.5 text-[12px] text-[var(--color-label-tertiary)]">
            {symbol || "—"} · {cadenceLabel(allowed)}
          </div>
        </div>
      </div>
    </div>
  );
}
