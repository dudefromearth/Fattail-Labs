"use client";

/**
 * One Autofilter control on the Trade Log title bar (TLAF2).
 * Shared dropdowns from `@/components/autofilter`. Column defs from the host.
 */

import { useEffect, useMemo, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import DateWhenFilter from "@/components/autofilter/DateWhenFilter";
import FilterOnMark from "@/components/autofilter/FilterOnMark";
import ValueFilter from "@/components/autofilter/ValueFilter";
import {
  cellValues,
  dateVsWindowsConflict,
  emptyValidCopy,
  filtersActive,
  selectionGate,
  type DateWindow,
  type FilterMap,
} from "@/lib/autofilter";
import { tradeLogColumns } from "@/lib/tradeLogAutofilter";
import type { Trade } from "@/lib/tradeLog";

export default function TradeLogAutofilterBar({
  trades,
  allTrades,
  filters,
  onFilters,
  campaignLabels,
  campaignWindows,
  panelHostRef,
}: {
  trades: Trade[];
  allTrades: Trade[];
  filters: FilterMap;
  onFilters: (next: FilterMap) => void;
  campaignLabels: Map<string, string>;
  campaignWindows: DateWindow[];
  /** Title-row controls stay inline; panel renders under the whole bar. */
  panelHostRef?: RefObject<HTMLDivElement | null>;
}) {
  const [open, setOpen] = useState(false);
  const [openCol, setOpenCol] = useState<string | null>(null);
  const [, setHostReady] = useState(0);
  const cols = useMemo(() => tradeLogColumns(allTrades), [allTrades]);
  const universe = allTrades.length ? allTrades : trades;
  const distinct = useMemo(() => {
    const m: Record<string, string[]> = {};
    for (const col of cols) {
      const set = new Set<string>();
      for (const t of universe) {
        for (const v of cellValues(t, col)) set.add(v);
      }
      m[col.key] = [...set].sort((a, b) => a.localeCompare(b));
    }
    return m;
  }, [cols, universe]);

  const incompat = useMemo(
    () => dateVsWindowsConflict("when", "campaign", campaignWindows),
    [campaignWindows],
  );
  const campaignDisabled = useMemo(() => {
    const m = new Map<string, string>();
    for (const v of distinct.campaign || []) {
      const g = selectionGate(filters, "campaign", v, incompat);
      if (g.disabled && g.reason) m.set(v, g.reason);
    }
    return m;
  }, [distinct.campaign, filters, incompat]);

  const days = distinct.when || [];
  const active = filtersActive(filters);
  const emptyCopy = emptyValidCopy(trades.length, active);

  useEffect(() => {
    setHostReady(1);
  }, []);

  function setCol(key: string, picked: string[] | null) {
    const next = { ...filters };
    if (!picked || picked.length === 0) delete next[key];
    else next[key] = picked;
    onFilters(next);
  }

  const labelsFor = (key: string) => {
    if (key === "campaign") return campaignLabels;
    return undefined;
  };

  const surface = (
    <>
      {open ? (
        <div
          className="flex w-full flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-fill)]/40 px-3 py-2"
          data-testid="trade-log-autofilter-panel"
          role="dialog"
          aria-label="Autofilter"
        >
          {cols.map((c) => (
            <span key={c.key} className="inline-flex items-center gap-1 text-xs">
              <span className="font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                {c.label}
              </span>
              {c.type === "date" ? (
                <DateWhenFilter
                  days={days}
                  applied={filters.when}
                  open={openCol === "when"}
                  onOpen={(k) => setOpenCol(k)}
                  onApply={(picked) => setCol("when", picked)}
                  onClear={() => setCol("when", null)}
                />
              ) : (
                <ValueFilter
                  col={c.key}
                  label={c.label}
                  values={distinct[c.key] || []}
                  labels={labelsFor(c.key)}
                  applied={filters[c.key]}
                  open={openCol === c.key}
                  onOpen={setOpenCol}
                  onApply={setCol}
                  onClear={(k) => setCol(k, null)}
                  disabledValues={
                    c.key === "campaign" ? campaignDisabled : undefined
                  }
                />
              )}
            </span>
          ))}
        </div>
      ) : null}
      {emptyCopy ? (
        <p
          className="w-full text-xs text-[var(--color-label-secondary)]"
          data-testid="autofilter-nothing-matched"
          role="status"
        >
          {emptyCopy}
        </p>
      ) : null}
    </>
  );
  const host = panelHostRef?.current;

  return (
    <div className="contents" data-testid="trade-log-autofilter-host">
      <button
        type="button"
        className={[
          "inline-flex min-h-[var(--hit-min)] min-w-[44px] items-center rounded-full px-4 text-sm font-medium",
          open || active
            ? "bg-[var(--color-label)] text-[var(--color-surface)]"
            : "border border-[var(--color-separator)] text-[var(--color-label)] hover:bg-[var(--color-fill)]",
        ].join(" ")}
        data-testid="trade-log-autofilter"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          setOpen((v) => !v);
          setOpenCol(null);
        }}
      >
        Autofilter
      </button>
      <FilterOnMark
        shown={trades.length}
        total={universe.length}
        active={active}
      />
      {active ? (
        <button
          type="button"
          className="min-h-[var(--hit-min)] text-xs font-medium text-[var(--color-tint)] hover:underline"
          data-testid="trade-log-autofilter-clear"
          onClick={() => onFilters({})}
        >
          Clear filters
        </button>
      ) : null}
      {host ? createPortal(surface, host) : surface}
    </div>
  );
}
