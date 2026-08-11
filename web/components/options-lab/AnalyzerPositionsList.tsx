"use client";

/**
 * Analyzer position cards — Trade Log blotter color scheme
 * (open green / close red / select blue) via shared blotterTheme.
 */

import type { AnalyzerPosition } from "@/lib/options-lab/analyzerBook";
import {
  BLOTTER_CSS_VARS,
  blotterCardBackground,
  blotterCardBorder,
  blotterKindFromPackageSide,
  blotterOnFillText,
} from "@/lib/blotterTheme";

const STATUS_CLASS: Record<string, string> = {
  ANALYSIS: "bg-white/20 text-white",
  PENDING: "bg-amber-400 text-black",
  OPEN: "bg-emerald-500/90 text-white",
  PARTIAL_OPEN: "bg-amber-400 text-black",
  CLOSED: "bg-white/20 text-white",
  CANCELLED: "bg-white/15 text-white/80",
  REJECTED: "bg-amber-400 text-black",
};

const LIVE_CHIP: Record<string, string> = {
  live: "text-emerald-200",
  held: "text-amber-200",
  not_live: "text-white/45",
  budget_refused: "text-red-200",
  incomplete: "text-amber-200",
  skewed: "text-orange-200",
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

const actionBtn =
  "rounded border border-white/25 bg-black/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-white/90 hover:bg-black/30";

export type AnalyzerPositionsListProps = {
  positions: AnalyzerPosition[];
  focusedId: string | null;
  sessionHeld?: boolean;
  /** Suite symbol — off-symbol cards get a badge (A5) */
  sessionSymbol?: string;
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
  sessionSymbol,
  onFocus,
  onToggleVisibility,
  onEdit,
  onDelete,
  onCreate,
  onLockNatural,
  onLockLimit,
  onUnlock,
}: AnalyzerPositionsListProps) {
  // A5: show all cards (do not filter by session symbol)
  const list = positions;
  return (
    <div
      className="space-y-2"
      data-testid="analyzer-positions-list"
      style={BLOTTER_CSS_VARS}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
          Positions
          {list.length > 0 ? (
            <span className="ml-1 font-normal normal-case text-[var(--color-label-tertiary)]">
              ({list.length})
            </span>
          ) : null}
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

      {/* Blotter legend — same chips as Trade Log */}
      <div className="flex flex-wrap items-center gap-2 text-[10px] text-[var(--color-label-tertiary)]">
        <span className="inline-flex items-center gap-1">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ background: "var(--blotter-open-bg)" }}
          />
          Credit
        </span>
        <span className="inline-flex items-center gap-1">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ background: "var(--blotter-close-bg)" }}
          />
          Debit
        </span>
        <span className="inline-flex items-center gap-1">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ background: "var(--blotter-select-bg)" }}
          />
          Focused
        </span>
      </div>

      {list.length === 0 ? (
        <p className="text-[11px] text-[var(--color-label-tertiary)]">
          No positions — open Builder for live OPF package debit.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((pos) => {
            const hidden = !pos.visible;
            const focused = pos.id === focusedId;
            const locked = pos.lock.mode === "locked";
            const dte = dteOf(pos);
            const price = pos.livePackagePerShare;
            const side = pos.priceSide;
            const kind = blotterKindFromPackageSide(side);
            const tone = blotterOnFillText(focused, kind);
            const und = (pos.position.underlying || "").toUpperCase();
            const offSymbol =
              !!sessionSymbol &&
              !!und &&
              und !== sessionSymbol.toUpperCase();
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
                  "cursor-pointer rounded-xl border p-2.5 text-left shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition " +
                  (hidden ? " opacity-45" : "")
                }
                style={{
                  background: blotterCardBackground(kind, focused),
                  borderColor: blotterCardBorder(kind, focused),
                }}
                data-testid={`analyzer-pos-card-${pos.id}`}
                data-blotter-kind={kind}
                data-focused={focused ? "1" : "0"}
                data-off-symbol={offSymbol ? "1" : "0"}
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`text-xs font-semibold ${tone.primary}`}
                  >
                    {pos.label}
                  </span>
                  <span className={`text-[10px] ${tone.tertiary}`}>
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
                  {offSymbol && (
                    <span
                      className="rounded bg-sky-600/90 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-white"
                      data-testid="analyzer-pos-off-symbol"
                      title="Different symbol than suite session — focus syncs suite symbol"
                    >
                      {und}
                    </span>
                  )}
                  {locked && (
                    <span className="rounded bg-violet-500/90 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-white">
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
                <div
                  className={`mt-1 flex flex-wrap gap-x-2 gap-y-0.5 font-mono text-[10px] ${tone.secondary}`}
                >
                  {pos.position.legs.map((leg, i) => (
                    <span key={i}>{formatLeg(leg)}</span>
                  ))}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span
                    className={`font-mono text-xs font-semibold tabular-nums ${tone.primary}`}
                  >
                    {price != null && Number.isFinite(price)
                      ? price.toFixed(2)
                      : "—"}
                  </span>
                  <span
                    className={`text-[10px] font-semibold uppercase ${tone.secondary}`}
                  >
                    {side ?? "—"}
                    {locked ? " basis" : ""}
                  </span>
                  {locked && pos.lastNatSigned != null && (
                    <span className={`text-[10px] ${tone.tertiary}`}>
                      mkt {Math.abs(pos.lastNatSigned).toFixed(2)}
                      {sessionHeld ? " · held" : ""}
                    </span>
                  )}
                  {pos.displayAsOf && (
                    <span
                      className={`text-[9px] ${tone.tertiary}`}
                      title={pos.displayAsOf}
                    >
                      as_of
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    className={actionBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleVisibility(pos.id);
                    }}
                  >
                    {hidden ? "Show" : "Hide"}
                  </button>
                  <button
                    type="button"
                    className={actionBtn}
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
                      className={actionBtn}
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
                        className={actionBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          onLockNatural(pos.id);
                        }}
                      >
                        Lock mkt
                      </button>
                      <button
                        type="button"
                        className={actionBtn}
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
                    className={
                      actionBtn + " border-red-300/40 text-red-100 hover:bg-red-950/40"
                    }
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
