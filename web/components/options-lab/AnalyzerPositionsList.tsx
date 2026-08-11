"use client";

/**
 * Position cards — Spec v0.2 definition SoR, lock, liveState.
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

const LIVE_CHIP: Record<string, string> = {
  live: "text-emerald-400",
  held: "text-amber-400",
  not_live: "text-white/40",
  budget_refused: "text-red-400",
  incomplete: "text-amber-400",
  skewed: "text-orange-400",
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
  sessionHeld?: boolean;
  onFocus: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  onLockNatural: (id: string) => void;
  onLockLimit: (id: string) => void;
  onUnlock: (id: string) => void;
};

export default function AnalyzerPositionsList({
  positions,
  focusedId,
  sessionHeld = false,
  onFocus,
  onToggleVisibility,
  onEdit,
  onDelete,
  onCreate,
  onLockNatural,
  onLockLimit,
  onUnlock,
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
          data-testid="analyzer-create-position"
        >
          +
        </button>
      </div>

      {positions.length === 0 ? (
        <p className="text-[11px] text-[var(--color-label-tertiary)]">
          No positions — open Builder for live OPF package debit.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {positions.map((pos) => {
            const hidden = !pos.visible;
            const focused = pos.id === focusedId;
            const locked = pos.lock.mode === "locked";
            const dte = dteOf(pos);
            const price = pos.livePackagePerShare;
            const side = pos.priceSide;
            const chip =
              !pos.visible
                ? "not_live"
                : sessionHeld && pos.liveState === "live"
                  ? "held"
                  : pos.liveState;
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
                  (side === "credit"
                    ? " border-l-[3px] border-l-emerald-500"
                    : side === "debit"
                      ? " border-l-[3px] border-l-sky-500"
                      : " border-l-[3px] border-l-white/20")
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
                  {locked && (
                    <span className="rounded bg-violet-500/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-violet-300">
                      Locked
                    </span>
                  )}
                  <span
                    className={
                      "text-[9px] font-semibold uppercase " +
                      (LIVE_CHIP[chip] || LIVE_CHIP.not_live)
                    }
                  >
                    {chip === "budget_refused"
                      ? "not live (budget)"
                      : chip === "not_live"
                        ? "not live"
                        : chip}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 font-mono text-[10px] text-[var(--color-label-secondary)]">
                  {pos.position.legs.map((leg, i) => (
                    <span key={i}>{formatLeg(leg)}</span>
                  ))}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-[var(--color-label)]">
                    {price != null && Number.isFinite(price)
                      ? price.toFixed(2)
                      : "—"}
                  </span>
                  <span className="text-[10px] font-semibold uppercase text-[var(--color-label-tertiary)]">
                    {side ?? "—"}
                    {locked ? " basis" : ""}
                  </span>
                  {locked && pos.lastNatSigned != null && (
                    <span className="text-[10px] text-white/40">
                      mkt {Math.abs(pos.lastNatSigned).toFixed(2)}
                      {sessionHeld ? " · held" : ""}
                    </span>
                  )}
                  {pos.displayAsOf && (
                    <span
                      className="text-[9px] text-white/30"
                      title={pos.displayAsOf}
                    >
                      as_of
                    </span>
                  )}
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
                  {locked ? (
                    <button
                      type="button"
                      className="rounded border border-violet-500/40 px-2 py-0.5 text-[10px] font-semibold uppercase text-violet-300 hover:bg-violet-500/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnlock(pos.id);
                      }}
                    >
                      Unlock
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="rounded border border-violet-500/40 px-2 py-0.5 text-[10px] font-semibold uppercase text-violet-300 hover:bg-violet-500/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLockNatural(pos.id);
                        }}
                      >
                        Lock mkt
                      </button>
                      <button
                        type="button"
                        className="rounded border border-violet-500/40 px-2 py-0.5 text-[10px] font-semibold uppercase text-violet-300 hover:bg-violet-500/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLockLimit(pos.id);
                        }}
                      >
                        Lock lim
                      </button>
                    </>
                  )}
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
