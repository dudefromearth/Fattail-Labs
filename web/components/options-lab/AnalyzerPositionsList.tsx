"use client";

/**
 * Analyzer position book — ToS-style dense table + Trade Log blotter colors.
 * Debit (long/pay) → open green · Credit (short/receive) → close red · Selected blue.
 * Book = definition SoR.
 */

import { useMemo, type CSSProperties } from "react";
import {
  calendarDteOf,
  isOptionPointerExpired,
  type AnalyzerPosition,
} from "@/lib/options-lab/analyzerBook";
import { resolveCardDisplayState } from "@/lib/options-lab/cardDisplayState";
import { legNotTradedLabel } from "@/lib/options-lab/optionBind";
import type { LegInput } from "@/lib/options-lab/positionTypes";
import { detectFamily } from "@/lib/options-lab/positionLabels";
import {
  BLOTTER_CSS_VARS,
  BLOTTER_HEX,
  blotterCardBackground,
  blotterKindFromPackageSide,
  resolvePackageSide,
  type BlotterBlockKind,
} from "@/lib/blotterTheme";

function dteOf(exp: string): number {
  return calendarDteOf(exp);
}

function fmtExp(exp: string): string {
  if (!exp || exp.length < 10) return exp || "—";
  try {
    const d = new Date(exp.slice(0, 10) + "T12:00:00Z");
    return d
      .toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
        timeZone: "UTC",
      })
      .replace(",", "");
  } catch {
    return exp.slice(0, 10);
  }
}

function fmtIv(vol: number | undefined): string {
  if (vol == null || !Number.isFinite(vol)) return "—";
  const pct = vol > 0 && vol <= 2 ? vol * 100 : vol;
  return `${pct.toFixed(2)}%`;
}

function fmtStrike(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}

/**
 * Traditional display order: ascending strike (butterfly → wing / body / wing
 * = +1 / −2 / +1 for a long fly). Never group all longs first (+1/+1/−2).
 */
function legsInDisplayOrder(legs: readonly LegInput[]): LegInput[] {
  return [...legs].sort((a, b) => {
    const ds = a.strike - b.strike;
    if (Math.abs(ds) > 1e-9) return ds;
    // Same strike: put before call (iron fly body)
    if (a.type !== b.type) return a.type === "put" ? -1 : 1;
    // Long before short only as last resort (same strike/type rare)
    if (a.side !== b.side) return a.side === "long" ? -1 : 1;
    return 0;
  });
}

// Body ~15px after two +15% steps from 11px; chrome scaled with it
const th =
  "px-1.5 py-1 text-left text-[12px] font-semibold uppercase tracking-wide text-white/45 whitespace-nowrap";
const td = "px-1.5 py-1 text-[15px] tabular-nums whitespace-nowrap";
const actionBtn =
  "rounded bg-black/25 px-1.5 py-0.5 text-[12px] font-semibold uppercase text-white/90 hover:bg-black/40";

export type AnalyzerPositionsListProps = {
  positions: AnalyzerPosition[];
  focusedId: string | null;
  sessionHeld?: boolean;
  sessionSymbol?: string;
  onFocus: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  onLockNatural: (id: string) => void;
  onLockLimit: (id: string) => void;
  onUnlock: (id: string) => void;
  /** ToS-style structure BUY/SELL flip (debit↔credit). */
  onSetDirection: (id: string, direction: "buy" | "sell") => void;
  /** ToS-style expiration roll from listed chain expirations. */
  onSetExpiration: (id: string, expiration: string) => void;
  /**
   * Nudge all strikes one listed step ↑/↓. Caller must unlock package
   * (shiftCardStrikes always unlocks) so natural mid re-settles.
   */
  onShiftStrikes: (id: string, direction: "up" | "down") => void;
  /** Upcoming listed expirations (YYYY-MM-DD) for the suite / product. */
  expirations?: string[];
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
  onSetDirection,
  onSetExpiration,
  onShiftStrikes,
  expirations = [],
}: AnalyzerPositionsListProps) {
  const list = positions;
  /**
   * Expiration select = OPF/chain listed pointers (from props.expirations).
   * Always includes the card's current pointer even if past (so EXPIRED still
   * shows), plus every valid listed date so the user can re-point to live.
   */
  const expChoices = useMemo(() => {
    const set = new Set<string>();
    for (const e of expirations) {
      const d = e.slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) set.add(d);
    }
    // Keep any book dates so current selection always appears (incl. expired)
    for (const p of positions) {
      const fe = (p.position.expiration || "").slice(0, 10);
      if (fe) set.add(fe);
      for (const l of p.position.legs) {
        const le = (l.expiration || "").slice(0, 10);
        if (le) set.add(le);
      }
    }
    return [...set].sort();
  }, [expirations, positions]);

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      data-testid="analyzer-positions-list"
      style={BLOTTER_CSS_VARS}
    >
      <div className="mb-0.5 flex shrink-0 flex-wrap items-center justify-between gap-2">
        <span className="text-[14px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
          Positions
          {list.length > 0 ? (
            <span className="ml-1 font-normal normal-case">({list.length})</span>
          ) : null}
        </span>
        <div className="flex flex-wrap items-center gap-2 text-[14px] text-[var(--color-label-tertiary)]">
          {/* Trade Log open/close fills · package economics */}
          <span className="inline-flex items-center gap-1">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ background: BLOTTER_HEX.openBg }}
            />
            Debit
          </span>
          <span className="inline-flex items-center gap-1">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ background: BLOTTER_HEX.closeBg }}
            />
            Credit
          </span>
          <span className="inline-flex items-center gap-1">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ background: BLOTTER_HEX.selectBg }}
            />
            Selected
          </span>
          <button
            type="button"
            onClick={onCreate}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--color-separator)] text-sm font-bold text-[var(--color-tint)] hover:bg-[var(--color-fill)]"
            aria-label="Create position"
            data-testid="analyzer-create-position"
          >
            +
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="text-[15px] text-[var(--color-label-tertiary)]">
          No positions — open Builder to add a structure to the book.
        </p>
      ) : (
        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto rounded border border-[var(--color-separator)] bg-[var(--color-surface)]">
          <table
            className="w-full min-w-[960px] border-collapse text-left text-[16px] leading-snug"
            data-testid="analyzer-positions-table"
          >
            <thead className="sticky top-0 z-[1] bg-[var(--color-surface)] shadow-[0_1px_0_var(--color-separator)]">
              <tr className="border-b border-[var(--color-separator)]">
                <th className={th + " w-4"} aria-label="select" />
                <th className={th}>Spread</th>
                <th className={th}>Side</th>
                <th className={th + " text-right"}>Qty</th>
                <th className={th}>Symbol</th>
                <th className={th}>Exp</th>
                <th className={th + " w-8 text-center"} aria-label="nudge strikes" />
                <th className={th + " text-right"}>Strike</th>
                <th className={th}>Type</th>
                <th className={th + " text-right"}>Price</th>
                <th className={th}>Pkg</th>
                <th className={th}>Live</th>
                <th className={th + " text-right"}>Vol</th>
                <th className={th}>DTE</th>
                <th className={th}>Actions</th>
              </tr>
            </thead>
            {/* One tbody per position — Trade Log block: solid fill, no inter-leg borders */}
            {list.map((pos, posIdx) => {
              const hidden = !pos.visible;
              const selected = pos.id === focusedId;
              const locked = pos.lock.mode === "locked";
              const und = (pos.position.underlying || "").toUpperCase();
              const offSymbol =
                !!sessionSymbol &&
                !!und &&
                und !== sessionSymbol.toUpperCase();
              // Debit/credit fill: explicit side → OPF sign → BUY/SELL fallback
              const side = resolvePackageSide(pos);
              const kind = blotterKindFromPackageSide(side);
              const family = detectFamily(pos.position.legs).toUpperCase();
              const pkgDir =
                pos.position.direction === "sell" ? "SELL" : "BUY";
              const mult = Math.max(1, pos.position.contracts || 1);
              const front = pos.position.expiration;
              const dte = dteOf(front);
              // Card = pointer: EXPIRED only when the pointed-to option is past
              const expired = isOptionPointerExpired(front);
              const isGhost = expired && !hidden;
              const chip =
                !pos.visible
                  ? "not_live"
                  : sessionHeld && pos.liveState === "live"
                    ? "held"
                    : pos.liveState;

              // Elegant failure law: every exceptional case → named state
              const display = resolveCardDisplayState(pos, {
                sessionHeld,
                packageSide: side,
              });
              const liveMark =
                display.kind === "price" &&
                pos.livePackagePerShare != null &&
                Number.isFinite(pos.livePackagePerShare);
              const price = pos.livePackagePerShare;
              const priceLabel =
                liveMark && price != null
                  ? (side === "credit" ? "−" : "") + price.toFixed(2)
                  : display.packageLabel ?? "UPDATING";

              // Exact Trade Log blotter fills (hex — always paint)
              // Ghost keeps debit/credit tint; selected → blue
              const bg = blotterCardBackground(
                kind,
                selected && !isGhost,
              );
              const onFill =
                (!isGhost && selected) || kind === "open" || kind === "close";
              const textMain = isGhost
                ? "text-white/90"
                : onFill
                  ? "text-white"
                  : "text-[var(--color-label)]";
              const textMuted = isGhost
                ? "text-white/75"
                : onFill
                  ? "text-white/80"
                  : "text-[var(--color-label-secondary)]";
              const textDim = isGhost
                ? "text-white/60"
                : onFill
                  ? "text-white/55"
                  : "text-[var(--color-label-tertiary)]";

              const hasNext = posIdx < list.length - 1;
              const orderedLegs = legsInDisplayOrder(pos.position.legs);

              return (
                <PosBlock
                  key={pos.id}
                  pos={pos}
                  orderedLegs={orderedLegs}
                  hidden={hidden}
                  selected={selected}
                  locked={locked}
                  und={und}
                  offSymbol={offSymbol}
                  family={family}
                  pkgDir={pkgDir}
                  mult={mult}
                  priceLabel={priceLabel}
                  liveMark={!!liveMark}
                  expired={expired}
                  isGhost={isGhost}
                  side={side}
                  kind={kind}
                  chip={chip}
                  display={display}
                  dte={dte}
                  front={front}
                  bg={bg}
                  textMain={textMain}
                  textMuted={textMuted}
                  textDim={textDim}
                  hasNext={hasNext}
                  onFocus={onFocus}
                  onToggleVisibility={onToggleVisibility}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onLockNatural={onLockNatural}
                  onLockLimit={onLockLimit}
                  onUnlock={onUnlock}
                  onSetDirection={onSetDirection}
                  onSetExpiration={onSetExpiration}
                  onShiftStrikes={onShiftStrikes}
                  expChoices={expChoices}
                />
              );
            })}
          </table>
        </div>
      )}
    </div>
  );
}

function PosBlock({
  pos,
  orderedLegs,
  hidden,
  selected,
  locked,
  und,
  offSymbol,
  family,
  pkgDir,
  mult,
  priceLabel,
  liveMark,
  expired,
  isGhost,
  side,
  kind,
  chip,
  display,
  dte,
  front,
  bg,
  textMain,
  textMuted,
  textDim,
  hasNext,
  onFocus,
  onToggleVisibility,
  onEdit,
  onDelete,
  onLockNatural,
  onLockLimit,
  onUnlock,
  onSetDirection,
  onSetExpiration,
  onShiftStrikes,
  expChoices,
}: {
  pos: AnalyzerPosition;
  orderedLegs: LegInput[];
  hidden: boolean;
  selected: boolean;
  locked: boolean;
  und: string;
  offSymbol: boolean;
  family: string;
  pkgDir: string;
  mult: number;
  priceLabel: string;
  liveMark: boolean;
  expired: boolean;
  isGhost: boolean;
  side: "debit" | "credit" | null;
  kind: BlotterBlockKind;
  chip: string;
  display: ReturnType<typeof resolveCardDisplayState>;
  dte: number;
  front: string;
  bg: string;
  textMain: string;
  textMuted: string;
  textDim: string;
  hasNext: boolean;
  onFocus: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onLockNatural: (id: string) => void;
  onLockLimit: (id: string) => void;
  onUnlock: (id: string) => void;
  onSetDirection: (id: string, direction: "buy" | "sell") => void;
  onSetExpiration: (id: string, expiration: string) => void;
  onShiftStrikes: (id: string, direction: "up" | "down") => void;
  expChoices: string[];
}) {
  const nLegs = orderedLegs.length;
  const pkgSide =
    side === "credit" ? "CREDIT" : side === "debit" ? "DEBIT" : "—";

  /**
   * Trade Log blotter rule:
   * - Solid fill on every cell (hex)
   * - No borders between legs
   * - Position separator only after last leg
   * - Outer ring on tbody only
   */
  const cellBase = (isLast: boolean): CSSProperties => ({
    backgroundColor: bg,
    // Between-position rule: 2px (was 1)
    borderBottomWidth: isLast && hasNext ? 2 : 0,
    borderBottomStyle: isLast && hasNext ? "solid" : "none",
    borderBottomColor:
      isLast && hasNext ? BLOTTER_HEX.positionRule : "transparent",
  });

  // Outer edge only — inset ring +1px thicker than prior (selected 3, ghost 2, default 2)
  const edgeColor =
    kind === "close"
      ? BLOTTER_HEX.borderClose
      : kind === "open"
        ? BLOTTER_HEX.borderOpen
        : "rgba(255,255,255,0.22)";
  const blockShadow = selected
    ? "inset 0 0 0 3px rgba(255,255,255,0.42)"
    : isGhost
      ? "inset 0 0 0 2px rgba(156,163,175,0.75)"
      : `inset 0 0 0 2px ${edgeColor}`;

  return (
    <tbody
      data-testid={`analyzer-pos-card-${pos.id}`}
      data-focused={selected ? "1" : "0"}
      data-blotter-kind={kind}
      data-price-side={side ?? ""}
      data-ghost={isGhost ? "1" : "0"}
      data-expired={expired ? "1" : "0"}
      data-off-symbol={offSymbol ? "1" : "0"}
      className={
        (hidden ? "opacity-40 " : isGhost ? "opacity-90 " : "") +
        "transition-[filter] hover:brightness-110"
      }
      style={{
        backgroundColor: bg,
        boxShadow: blockShadow,
        filter: isGhost
          ? "grayscale(0.15) saturate(0.85) brightness(1.15)"
          : undefined,
      }}
    >
      {orderedLegs.map((leg, i) => {
        const isTop = i === 0;
        const isLast = i === nLegs - 1;
        const exp = (leg.expiration || front).slice(0, 10);
        const legSide = leg.side === "long" ? "BUY" : "SELL";
        const q = Math.abs(leg.quantity) * mult;
        const signedQ = leg.side === "long" ? `+${q}` : `−${q}`;
        const edge = cellBase(isLast);

        return (
          <tr
            key={`${pos.id}-leg-${i}`}
            className="cursor-pointer tabular-nums"
            style={{ backgroundColor: bg }}
            onClick={() => onFocus(pos.id)}
            data-testid={
              isTop
                ? undefined
                : `analyzer-pos-leg-${pos.id}-${i}`
            }
          >
            <td
              className={td + " w-4 text-center"}
              style={edge}
            >
              {isTop ? (
                <span
                  className={
                    "inline-block h-2 w-2 rounded-full " +
                    (selected ? "bg-white" : "bg-white/30")
                  }
                  aria-hidden
                />
              ) : null}
            </td>
            <td
              className={
                td +
                (isTop
                  ? ` font-semibold uppercase tracking-wide ${textMain}`
                  : ` ${textDim}`)
              }
              style={edge}
            >
              {isTop ? family : ""}
            </td>
            <td
              className={td}
              style={edge}
              onClick={(e) => e.stopPropagation()}
            >
              {isTop ? (
                <select
                  className={
                    "cursor-pointer rounded bg-black/20 py-0.5 pl-1 pr-0.5 text-[15px] font-semibold uppercase outline-none " +
                    textMain
                  }
                  value={pkgDir === "SELL" ? "sell" : "buy"}
                  aria-label="Structure side BUY or SELL"
                  data-testid={`analyzer-pos-direction-${pos.id}`}
                  title="Flip structure BUY ↔ SELL (debit ↔ credit)"
                  onChange={(e) => {
                    const v = e.target.value === "sell" ? "sell" : "buy";
                    onSetDirection(pos.id, v);
                  }}
                >
                  <option value="buy">BUY</option>
                  <option value="sell">SELL</option>
                </select>
              ) : (
                <span className={`font-semibold ${textMain}`}>{legSide}</span>
              )}
            </td>
            <td
              className={td + ` text-right font-mono ${textMain}`}
              style={edge}
            >
              {signedQ}
            </td>
            <td
              className={td + ` font-semibold ${textMain}`}
              style={edge}
            >
              {und}
              {isTop && offSymbol ? (
                <span
                  className="ml-1 rounded bg-black/25 px-1 text-[10px] uppercase text-white"
                  data-testid="analyzer-pos-off-symbol"
                >
                  off
                </span>
              ) : null}
            </td>
            <td
              className={td}
              style={edge}
              onClick={(e) => e.stopPropagation()}
            >
              {isTop && expChoices.length > 0 ? (
                <select
                  className={
                    "max-w-[9rem] cursor-pointer rounded bg-black/20 py-0.5 pl-1 pr-0.5 text-[15px] font-semibold outline-none " +
                    textMain
                  }
                  value={
                    expChoices.includes(exp)
                      ? exp
                      : front.slice(0, 10) || exp
                  }
                  aria-label="Structure expiration"
                  data-testid={`analyzer-pos-expiration-${pos.id}`}
                  title="Roll structure to listed expiration"
                  onChange={(e) => onSetExpiration(pos.id, e.target.value)}
                >
                  {expChoices.map((e) => (
                    <option key={e} value={e}>
                      {fmtExp(e)}
                    </option>
                  ))}
                </select>
              ) : (
                <span className={textMuted}>{fmtExp(exp)}</span>
              )}
            </td>
            {/* Strike nudge: one cell spanning all legs, vertically centered */}
            {isTop ? (
              <td
                className={td + " w-8 px-0.5 align-middle"}
                rowSpan={nLegs}
                style={{
                  ...edge,
                  verticalAlign: "middle",
                  // Last-row bottom rule is owned by this spanning cell
                  borderBottomWidth: hasNext ? 2 : 0,
                  borderBottomStyle: hasNext ? "solid" : "none",
                  borderBottomColor: hasNext
                    ? BLOTTER_HEX.positionRule
                    : "transparent",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="flex h-full min-h-full flex-col items-center justify-center gap-0.5 py-0.5"
                  data-testid={`analyzer-pos-strike-nudge-${pos.id}`}
                >
                  <button
                    type="button"
                    className={
                      "inline-flex h-5 w-6 items-center justify-center rounded " +
                      "bg-black/25 text-[11px] font-bold leading-none text-white " +
                      "hover:bg-black/45 disabled:opacity-40"
                    }
                    title="Shift all strikes up one listed step (unlocks package)"
                    aria-label="Shift strikes up"
                    data-testid={`analyzer-pos-strike-up-${pos.id}`}
                    onClick={() => onShiftStrikes(pos.id, "up")}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className={
                      "inline-flex h-5 w-6 items-center justify-center rounded " +
                      "bg-black/25 text-[11px] font-bold leading-none text-white " +
                      "hover:bg-black/45 disabled:opacity-40"
                    }
                    title="Shift all strikes down one listed step (unlocks package)"
                    aria-label="Shift strikes down"
                    data-testid={`analyzer-pos-strike-down-${pos.id}`}
                    onClick={() => onShiftStrikes(pos.id, "down")}
                  >
                    ▼
                  </button>
                </div>
              </td>
            ) : null}
            <td
              className={
                td + ` text-right font-mono font-semibold ${textMain}`
              }
              style={edge}
            >
              {fmtStrike(leg.strike)}
            </td>
            <td className={td + ` uppercase ${textMain}`} style={edge}>
              {leg.type === "call" ? "CALL" : "PUT"}
            </td>
            <td
              className={
                td +
                ` text-right font-mono font-semibold ` +
                (isTop && expired ? "text-amber-200" : textMain)
              }
              style={edge}
              data-testid={isTop ? `analyzer-pos-price-${pos.id}` : undefined}
              data-display-kind={isTop ? display.kind : undefined}
              data-live={isTop && display.kind === "price" ? "1" : undefined}
              data-expired={isTop && display.kind === "expired" ? "1" : undefined}
              data-bindable={
                isTop
                  ? pos.bind == null
                    ? undefined
                    : pos.bind.bindable
                      ? "1"
                      : "0"
                  : undefined
              }
              title={
                isTop
                  ? display.detail
                  : leg.entry_price > 0
                    ? "Leg mid"
                    : undefined
              }
            >
              {isTop ? (
                display.kind === "price" ? (
                  <>
                    {priceLabel}
                    {liveMark ? (
                      <span
                        className={`ml-1 text-[10px] font-semibold uppercase ${textMuted}`}
                      >
                        {display.chipLabel}
                      </span>
                    ) : null}
                  </>
                ) : (
                  <span
                    className={
                      "text-[12px] font-bold uppercase tracking-wide " +
                      (display.kind === "updating"
                        ? textMuted
                        : "text-amber-200")
                    }
                    data-testid={`analyzer-pos-state-${pos.id}`}
                    data-state={display.kind}
                  >
                    {display.packageLabel}
                  </span>
                )
              ) : (() => {
                  // Per-leg: ▲/▼ can land on a strike with no market
                  // Match by strike/type/exp (display order ≠ definition index)
                  const legExp = (leg.expiration || front).slice(0, 10);
                  const br = pos.bind?.legs?.find(
                    (b) =>
                      Math.abs(b.strike - leg.strike) < 1e-9 &&
                      b.type === leg.type &&
                      (b.expiration || "").slice(0, 10) === legExp,
                  );
                  const nt = legNotTradedLabel(br?.reason);
                  if (nt) {
                    return (
                      <span
                        className="text-[11px] font-bold uppercase tracking-wide text-amber-200"
                        data-testid={`analyzer-pos-leg-not-traded-${pos.id}-${i}`}
                        title={`${leg.strike} ${leg.type} — not traded`}
                      >
                        NOT TRADED
                      </span>
                    );
                  }
                  return leg.entry_price > 0
                    ? leg.entry_price.toFixed(2)
                    : "—";
                })()}
            </td>
            <td
              className={td}
              style={edge}
              onClick={(e) => e.stopPropagation()}
            >
              {isTop ? (
                <div className="flex items-center gap-1">
                  <span
                    className={`text-[14px] font-semibold uppercase ${textMain}`}
                    data-testid={`analyzer-pos-pkg-side-${pos.id}`}
                  >
                    {pkgSide}
                  </span>
                  {locked ? (
                    <button
                      type="button"
                      className="inline-flex h-7 w-7 items-center justify-center rounded bg-black/20 text-[15px] text-white hover:bg-black/35"
                      title="Unlock package basis"
                      aria-label="Unlock"
                      data-testid={`analyzer-pos-lock-${pos.id}`}
                      data-locked="1"
                      onClick={() => onUnlock(pos.id)}
                    >
                      🔒
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="inline-flex h-7 w-7 items-center justify-center rounded bg-black/15 text-[15px] text-white/80 hover:bg-black/30"
                      title="Lock at natural mid (Option-click / right-click for limit)"
                      aria-label="Lock natural"
                      data-testid={`analyzer-pos-lock-${pos.id}`}
                      data-locked="0"
                      onClick={(e) => {
                        if (e.altKey || e.metaKey) onLockLimit(pos.id);
                        else onLockNatural(pos.id);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        onLockLimit(pos.id);
                      }}
                    >
                      🔓
                    </button>
                  )}
                </div>
              ) : null}
            </td>
            <td
              className={
                td +
                " text-[12px] font-semibold uppercase " +
                (isTop
                  ? chip === "live"
                    ? selected || kind !== "neutral"
                      ? "text-emerald-200"
                      : "text-emerald-600"
                    : chip === "held"
                      ? "text-amber-200"
                      : chip === "incomplete" || chip === "skewed"
                        ? "text-amber-200"
                        : textDim
                  : textDim)
              }
              style={edge}
            >
              {isTop ? display.chipLabel : ""}
            </td>
            <td
              className={td + ` text-right ${textMuted}`}
              style={edge}
            >
              {fmtIv(leg.volatility)}
            </td>
            <td
              className={
                td +
                (isTop && expired
                  ? " font-bold uppercase tracking-wide text-amber-200"
                  : ` ${textMuted}`)
              }
              style={edge}
              data-testid={isTop ? `analyzer-pos-dte-${pos.id}` : undefined}
            >
              {isTop && expired ? "EXPIRED" : `${dteOf(exp)}d`}
            </td>
            <td
              className={td}
              style={edge}
              onClick={(e) => e.stopPropagation()}
            >
              {isTop ? (
                <div className="flex flex-nowrap items-center gap-0.5">
                  <button
                    type="button"
                    className={actionBtn}
                    onClick={() => onToggleVisibility(pos.id)}
                  >
                    {hidden ? "Show" : "Hide"}
                  </button>
                  <button
                    type="button"
                    className={actionBtn}
                    onClick={() => onEdit(pos.id)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className={actionBtn + " text-red-100"}
                    onClick={() => onDelete(pos.id)}
                  >
                    ×
                  </button>
                </div>
              ) : null}
            </td>
          </tr>
        );
      })}
    </tbody>
  );
}
