"use client";

/**
 * Position cards for Options Lab Analyzer — MSC Risk Graph list layout (Labs styles).
 */

import type { AnalyzerPosition } from "@/lib/options-lab/analyzerBook";

const STATUS_CLASS: Record<string, string> = {
  ANALYSIS: "bg-blue-500/20 text-blue-300",
  PENDING: "bg-amber-500/20 text-amber-300",
  OPEN: "bg-emerald-500/20 text-emerald-300",
  PARTIAL_OPEN: "bg-amber-500/20 text-amber-300",
  CLOSED: "bg-white/10 text-white/50",
  CANCELLED: "bg-white/10 text-white/50",
  REJECTED: "bg-red-500/20 text-red-300",
};

function dteOf(pos: AnalyzerPosition): number {
  const exp =
    pos.position.legs[0]?.expiration || pos.position.expiration || "";
  if (!exp) return 0;
  const e = new Date(exp + "T16:00:00Z");
  return Math.max(
    0,
    Math.ceil((e.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );
}

function formatLeg(leg: AnalyzerPosition["position"]["legs"][0]): string {
  const sign = leg.side === "long" ? "+" : "-";
  const t = leg.type === "call" ? "C" : "P";
  return `${sign}${leg.quantity} ${leg.strike}${t}`;
}

export type AnalyzerPositionsListProps = {
  positions: AnalyzerPosition[];
  focusedId: string | null;
  onFocus: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  onUpdatePrice: (id: string, value: number) => void;
};

export default function AnalyzerPositionsList({
  positions,
  focusedId,
  onFocus,
  onToggleVisibility,
  onEdit,
  onDelete,
  onCreate,
  onUpdatePrice,
}: AnalyzerPositionsListProps) {
  return (
    <div className="space-y-2" data-testid="analyzer-positions-list">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
          Positions
        </span>
        <button
          type="button"
          onClick={onCreate}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-separator)] text-sm font-bold text-[var(--color-tint)] hover:bg-[var(--color-fill)]"
          aria-label="Create position"
          title="Create position"
          data-testid="analyzer-create-position"
        >
          +
        </button>
      </div>

      {positions.length === 0 ? (
        <p className="text-[11px] text-[var(--color-label-tertiary)]">
          No positions — open the builder to add a structure with live mids.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {positions.map((pos) => {
            const hidden = !pos.visible;
            const focused = pos.id === focusedId;
            const dte = dteOf(pos);
            const price = pos.livePackagePerShare;
            return (
              <div
                key={pos.id}
                role="button"
                tabIndex={0}
                onClick={() => onFocus(pos.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onFocus(pos.id);
                }}
                className={
                  "cursor-pointer rounded-xl border p-2.5 text-left transition " +
                  (focused
                    ? "border-[var(--color-tint)] bg-[var(--color-tint)]/10"
                    : "border-[var(--color-separator)] bg-[var(--color-fill)]/40") +
                  (hidden ? " opacity-45" : "") +
                  (pos.priceSide === "credit"
                    ? " border-l-[3px] border-l-emerald-500"
                    : " border-l-[3px] border-l-sky-500")
                }
                data-testid={`analyzer-pos-card-${pos.id}`}
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold text-[var(--color-label)]">
                    {pos.label}
                  </span>
                  <span className="text-[10px] text-[var(--color-label-tertiary)]">
                    {dte}D
                  </span>
                  <span
                    className={
                      "rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase " +
                      (STATUS_CLASS[pos.status] || STATUS_CLASS.ANALYSIS)
                    }
                  >
                    {pos.status}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 font-mono text-[10px] text-[var(--color-label-secondary)]">
                  {pos.position.legs.map((leg, i) => (
                    <span key={i}>{formatLeg(leg)}</span>
                  ))}
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    className="w-20 rounded border border-[var(--color-separator)] bg-[var(--color-surface)] px-1.5 py-0.5 font-mono text-xs text-[var(--color-label)]"
                    value={
                      price != null && Number.isFinite(price)
                        ? price.toFixed(2)
                        : ""
                    }
                    placeholder="—"
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (Number.isFinite(v) && v >= 0) onUpdatePrice(pos.id, v);
                    }}
                  />
                  <span className="text-[10px] font-semibold uppercase text-[var(--color-label-tertiary)]">
                    {pos.priceSide}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    className="rounded border border-[var(--color-separator)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--color-label-secondary)] hover:bg-[var(--color-fill)]"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVisibility(pos.id);
                    }}
                  >
                    {hidden ? "Show" : "Hide"}
                  </button>
                  <button
                    type="button"
                    className="rounded border border-[var(--color-separator)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--color-label-secondary)] hover:bg-[var(--color-fill)]"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(pos.id);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rounded border border-red-500/30 px-2 py-0.5 text-[10px] font-semibold uppercase text-red-400 hover:bg-red-500/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(pos.id);
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
