"use client";

/**
 * Analyzer position book — ToS-style dense table + Trade Log blotter colors.
 * Debit (long/pay) → open green · Credit (short/receive) → close red.
 * No selected/blue state — click does not recolor the card.
 * Book = definition SoR.
 */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import ReplayBadge from "@/components/options-lab/ReplayBadge";
import { formatReplayClock } from "@/lib/options-lab/algoDayReplay";
import {
  calendarDteOf,
  definedDebitSigned,
  isOptionPointerExpired,
  type AnalyzerPosition,
} from "@/lib/options-lab/analyzerBook";
import { boundSelectValue, dteFromClock } from "@/lib/options-lab/chainControls";
import {
  formatEtHm,
  isTmPositionDark,
} from "@/lib/options-lab/positionSession";
import {
  packageLivenessChip,
  resolveCardDisplayState,
} from "@/lib/options-lab/cardDisplayState";
import { legNotTradedLabel } from "@/lib/options-lab/optionBind";
import type { LegInput, OptionRight, TemplateType } from "@/lib/options-lab/positionTypes";
import { detectFamily } from "@/lib/options-lab/positionLabels";
import { posAndRatio } from "@/lib/options-lab/positionQty";
import {
  packageUnitScale,
} from "@/lib/options-lab/packageEconomics";
import {
  BLOTTER_CSS_VARS,
  BLOTTER_HEX,
  blotterCardBackground,
  blotterKindFromPackageSide,
  resolvePackageSide,
  type BlotterBlockKind,
} from "@/lib/blotterTheme";
import {
  CARD_TD,
  CARD_TH,
  CARD_THEAD,
  CardMenuField,
  FIELD_FILL,
  OL_CHROME as CHROME,
  OL_DATA as DATA,
  TosPadlock,
  TosQtyControl,
  TosStepper,
  cardSelect,
} from "@/components/options-lab/TosControls";
import {
  CARD_COLUMNS,
  TEMPLATE_LABELS,
  cardFieldExposure,
  catalogToTemplate,
  fmtPackageDelta,
  groupPositionsBySymbol,
  offeredCardTemplates,
  packageDelta,
  signedActualQty,
  stepCardPrice,
} from "@/lib/options-lab/tosCard";
import type { CatalogName } from "@/lib/options-lab/structureClassifier";

function dteOf(exp: string, clock?: Date): number {
  return clock ? dteFromClock(exp, clock) : calendarDteOf(exp);
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
 * Price cell is the lock control for the canvas basis.
 *
 * Unlocked: shows live mid. Click → lock immediately, stay in edit.
 * Locked: click to edit D*. Tab / Enter / Return (or blur) commits;
 * the card stays locked and the canvas re-renders at the new basis.
 */
function PackagePriceField({
  id,
  locked,
  price,
  priceLabel,
  textMain,
  onCommit,
  onLockForEdit,
}: {
  id: string;
  locked: boolean;
  price: number | null;
  priceLabel: string;
  textMain: string;
  onCommit: (magnitude: number) => void;
  onLockForEdit: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const committedRef = useRef(false);
  const stayEditingRef = useRef(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() =>
    price != null && Number.isFinite(price) ? price.toFixed(2) : "",
  );

  useEffect(() => {
    if (locked) {
      if (stayEditingRef.current) {
        stayEditingRef.current = false;
        setEditing(true);
      }
      return;
    }
    setEditing(false);
  }, [locked]);

  useEffect(() => {
    if (editing) return;
    setDraft(price != null && Number.isFinite(price) ? price.toFixed(2) : "");
  }, [price, editing]);

  useEffect(() => {
    if (!editing) return;
    committedRef.current = false;
    const t = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(t);
  }, [editing]);

  const beginEdit = () => {
    committedRef.current = false;
    setDraft(price != null && Number.isFinite(price) ? price.toFixed(2) : "");
    if (!locked) {
      stayEditingRef.current = true;
      onLockForEdit();
    }
    setEditing(true);
  };

  const commit = () => {
    if (committedRef.current) return;
    const mag = Math.abs(parseFloat(String(draft).replace(/[−–—]/g, "-")));
    if (!Number.isFinite(mag) || mag <= 0) {
      if (price != null && Number.isFinite(price)) setDraft(price.toFixed(2));
      setEditing(false);
      return;
    }
    committedRef.current = true;
    setEditing(false);
    onCommit(mag);
  };

  if (!editing) {
    return (
      <button
        type="button"
        className={
          `font-mono ${DATA} font-normal tabular-nums ` + textMain
        }
        data-testid={`analyzer-pos-price-edit-${id}`}
        title={locked ? "Edit locked basis" : "Lock and edit basis"}
        onClick={(e) => {
          e.stopPropagation();
          beginEdit();
        }}
      >
        {priceLabel}
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      aria-label="Package debit or credit per position"
      data-testid={`analyzer-pos-price-edit-${id}`}
      className={
        "w-[4.5rem] rounded bg-black/25 px-1 py-0 text-right font-mono " +
        `${DATA} font-normal tabular-nums outline-none ring-1 ring-white/40 ` +
        FIELD_FILL +
        " " +
        textMain
      }
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      onBlur={(e) => {
        const next = e.relatedTarget as HTMLElement | null;
        if (next?.closest?.(`[data-testid="analyzer-pos-lock-${id}"]`)) {
          setEditing(false);
          return;
        }
        commit();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === "Tab") {
          if (e.key === "Enter") e.preventDefault();
          commit();
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }
        if (e.key === "Escape") {
          committedRef.current = true;
          if (price != null && Number.isFinite(price)) setDraft(price.toFixed(2));
          setEditing(false);
          (e.target as HTMLInputElement).blur();
        }
      }}
    />
  );
}

/**
 * ToS-style leg order on the position card: **calls above puts**, then
 * ascending strike within each right. Case-insensitive type compare.
 */
function legsInDisplayOrder(
  legs: readonly LegInput[],
): { leg: LegInput; recordIndex: number }[] {
  const rightRank = (t: string) =>
    String(t).toLowerCase() === "call" ? 0 : 1;
  return legs
    .map((leg, recordIndex) => ({ leg, recordIndex }))
    .sort((a, b) => {
      const ra = rightRank(a.leg.type);
      const rb = rightRank(b.leg.type);
      if (ra !== rb) return ra - rb;
      const ds = a.leg.strike - b.leg.strike;
      if (Math.abs(ds) > 1e-9) return ds;
      const sa = String(a.leg.side).toLowerCase() === "short" ? 0 : 1;
      const sb = String(b.leg.side).toLowerCase() === "short" ? 0 : 1;
      return sa - sb;
    });
}

/** Card scale is --ol-card-data / --ol-card-chrome (tokens). Column headers keep ToS uppercase. */
const th = CARD_TH;
const td = CARD_TD;
/** Chrome gutter + ten PC-VOCAB-7 columns + lock chrome + delete at the right edge. */
const COLS = [
  "15%",
  "11%",
  "7%",
  "7%",
  "7%",
  "10%",
  "8%",
  "6%",
  "9%",
  "3%",
  "7%",
  "7%",
  "3%",
] as const;
/** ToS: padlock sits in its own column, separated by a vertical grid rule. */
const LOCK_RULE: CSSProperties = {
  borderLeftWidth: 1,
  borderLeftStyle: "solid",
  borderLeftColor: "rgba(255,255,255,0.22)",
  borderRightWidth: 1,
  borderRightStyle: "solid",
  borderRightColor: "rgba(255,255,255,0.22)",
};
const TD_PAD_Y = 1;
const CARD_EXTRA_Y = 0;
const chromeBtn =
  `rounded px-1 py-0 ${CHROME} font-normal text-white/80 hover:bg-black/40`;
const actionBtn = chromeBtn;

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
  /** Simulated open fill in Trade Log. */
  onSendToTradeLog?: (id: string) => void;
  /** PC-TM-1: Log is disabled on every position while Time Machine is active. */
  tmActive?: boolean;
  onSetEntryAt: (id: string, entryAt: number) => void;
  /** Close transaction — stamps the clock; not a pre-set time. */
  onClosePosition: (id: string) => void;
  onLockNatural: (id: string) => void;
  /** Commit a per-position debit/credit magnitude and lock it. */
  onLockLimit: (id: string, magnitude: number) => void;
  onUnlock: (id: string) => void;
  onKeepCheckPrice?: (id: string) => void;
  /** ToS-style structure BUY/SELL flip (debit↔credit). */
  onSetDirection: (id: string, direction: "buy" | "sell") => void;
  /** ToS-style expiration roll from listed chain expirations. */
  onSetExpiration: (id: string, expiration: string) => void;
  onShiftStrikes: (id: string, direction: "up" | "down") => void;
  onScalePos: (id: string, pos: number) => void;
  onSetSpread: (id: string, template: TemplateType) => void;
  onPatchLeg: (id: string, recordIndex: number, patch: Partial<LegInput>) => void;
  onSetRight: (id: string, right: OptionRight) => void;
  onSelectSymbolGroup: (symbol: string) => void;
  onReorderSymbolGroup: (symbol: string, dir: "up" | "down") => void;
  getListedStrikes: (expiration: string) => readonly number[];
  spotPrice?: number;
  symbolGroupOrder?: string[];
  collapsedGroups?: ReadonlySet<string>;
  onToggleGroupCollapsed?: (symbol: string) => void;
  /** Upcoming listed expirations (YYYY-MM-DD) for the suite / product. */
  expirations?: string[];
  /** TMI-96: dark until playhead reaches entry. Not hidden. */
  playheadMs?: number | null;
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
  onSendToTradeLog,
  tmActive = false,
  onSetEntryAt,
  onClosePosition,
  onLockNatural,
  onLockLimit,
  onUnlock,
  onKeepCheckPrice,
  onSetDirection,
  onSetExpiration,
  onShiftStrikes,
  onScalePos,
  onSetSpread,
  onPatchLeg,
  onSetRight,
  onSelectSymbolGroup,
  onReorderSymbolGroup,
  getListedStrikes,
  spotPrice = 0,
  symbolGroupOrder,
  collapsedGroups,
  onToggleGroupCollapsed,
  expirations = [],
  playheadMs = null,
}: AnalyzerPositionsListProps) {
  const list = positions;
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [localCollapsed, setLocalCollapsed] = useState<Set<string>>(
    () => new Set(),
  );
  const collapsed = collapsedGroups ?? localCollapsed;
  const toggleCollapsed = (symbol: string) => {
    if (onToggleGroupCollapsed) {
      onToggleGroupCollapsed(symbol);
      return;
    }
    setLocalCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      return next;
    });
  };
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
      {list.length === 0 ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-[15px] text-[var(--color-label-tertiary)]">
            No positions — open Builder to add a structure to the book.
          </p>
          <button
            type="button"
            onClick={onCreate}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--color-separator)] text-sm font-bold text-[var(--color-tint)] hover:bg-[var(--color-fill)]"
            aria-label="Create position"
            data-testid="analyzer-create-position"
          >
            +
          </button>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto rounded border border-[var(--color-separator)] bg-[#0a0a0e]">
          <table
            className={`w-full min-w-[720px] table-fixed border-separate border-spacing-0 text-left ${DATA} leading-tight`}
            data-testid="analyzer-positions-table"
          >
            <colgroup>
              {COLS.map((w, i) => (
                <col key={i} style={{ width: w }} />
              ))}
            </colgroup>
            <thead className={"sticky top-0 z-[1] " + CARD_THEAD}>
              <tr>
                <th className={th} aria-label="Show, edit, delete, log">
                  <button
                    type="button"
                    onClick={onCreate}
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-white/20 text-sm font-bold text-[var(--color-tint)] hover:bg-white/10"
                    aria-label="Create position"
                    data-testid="analyzer-create-position"
                  >
                    +
                  </button>
                </th>
                {CARD_COLUMNS.flatMap((col) => {
                  const heading = (
                    <th
                      key={col}
                      className={
                        th +
                        (col === "QTY" ||
                        col === "STRIKE" ||
                        col === "PRICE" ||
                        col === "VOL" ||
                        col === "DELTA"
                          ? " text-right"
                          : "")
                      }
                    >
                      {col}
                    </th>
                  );
                  if (col !== "PRICE") return [heading];
                  return [
                    heading,
                    <th
                      key="padlock"
                      className={th + " text-center"}
                      aria-label="Lock"
                      data-testid="analyzer-col-lock"
                      style={LOCK_RULE}
                    />,
                  ];
                })}
                <th className={th + " text-right"} aria-label="Delete" />
              </tr>
            </thead>
            {groupPositionsBySymbol(
              list,
              symbolGroupOrder && symbolGroupOrder.length
                ? symbolGroupOrder
                : [...new Set(list.map((p) => (p.position.underlying || "").toUpperCase()))],
            ).flatMap((group, gi, groups) => {
            const groupSelected =
              !!sessionSymbol &&
              group.symbol === sessionSymbol.toUpperCase();
            const isCollapsed = collapsed.has(group.symbol);
            const header = (
              <tbody
                key={`group-${group.symbol}`}
                data-testid={`analyzer-symbol-group-${group.symbol}`}
                data-group-selected={groupSelected ? "1" : "0"}
              >
                <tr className={groupSelected ? "bg-white/10" : "bg-white/[0.04]"}>
                  <td colSpan={COLS.length} className="px-2 py-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="px-1 text-white/70 hover:text-white"
                        aria-expanded={!isCollapsed}
                        aria-label={
                          isCollapsed
                            ? `Expand ${group.symbol}`
                            : `Collapse ${group.symbol}`
                        }
                        data-testid={`analyzer-symbol-group-toggle-${group.symbol}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCollapsed(group.symbol);
                        }}
                      >
                        {isCollapsed ? "▸" : "▾"}
                      </button>
                      <button
                        type="button"
                        className={
                          "font-normal tracking-wide text-white " +
                          (groupSelected ? "text-white" : "text-white/85")
                        }
                        data-testid={`analyzer-symbol-group-select-${group.symbol}`}
                        onClick={() => onSelectSymbolGroup(group.symbol)}
                      >
                        {group.symbol}
                      </button>
                      <span className="ml-auto inline-flex gap-0.5">
                        <button
                          type="button"
                          className={`px-1 ${CHROME} text-white/50 hover:text-white`}
                          aria-label={`Move ${group.symbol} up`}
                          data-testid={`analyzer-symbol-group-reorder-up-${group.symbol}`}
                          disabled={gi === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            onReorderSymbolGroup(group.symbol, "up");
                          }}
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          className={`px-1 ${CHROME} text-white/50 hover:text-white`}
                          aria-label={`Move ${group.symbol} down`}
                          data-testid={`analyzer-symbol-group-reorder-down-${group.symbol}`}
                          disabled={gi === groups.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            onReorderSymbolGroup(group.symbol, "down");
                          }}
                        >
                          ▼
                        </button>
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            );
            if (isCollapsed) return [header];
            const cards = group.positions.map((pos, posIdx) => {
              const hidden = !pos.visible;
              const tmDark = isTmPositionDark(pos, playheadMs);
              const locked = pos.lock.mode === "locked";
              const und = (pos.position.underlying || "").toUpperCase();
              const offSymbol =
                !!sessionSymbol &&
                !!und &&
                und !== sessionSymbol.toUpperCase();
              // Debit/credit fill: explicit side → OPF sign → BUY/SELL fallback
              const side = resolvePackageSide(pos);
              const kind = blotterKindFromPackageSide(side);
              const family = detectFamily(pos.position.legs);
              const pkgDir =
                pos.position.direction === "sell" ? "SELL" : "BUY";
              const pkgQty = posAndRatio(pos.position.legs).pos;
              const unitScale = packageUnitScale(pos.position.legs);
              const front = pos.position.expiration;
              const dteClock =
                playheadMs != null ? new Date(playheadMs) : undefined;
              const dte = dteOf(front, dteClock);
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
              const livenessChip = packageLivenessChip(pos, display);
              const definedDebit = definedDebitSigned(pos);
              const liveMark =
                !locked &&
                display.kind === "price" &&
                pos.livePackagePerShare != null &&
                Number.isFinite(pos.livePackagePerShare);
              const price =
                display.kind === "expired"
                  ? definedDebit != null
                    ? Math.abs(definedDebit)
                    : null
                  : pos.livePackagePerShare;
              const priceSideShown =
                display.kind === "expired"
                  ? definedDebit != null && definedDebit < 0
                    ? "credit"
                    : "debit"
                  : side;
              const priceLabel =
                price != null && Number.isFinite(price)
                  ? (priceSideShown === "credit" ? "−" : "") + price.toFixed(2)
                  : display.packageLabel ?? "UPDATING";

              // Exact Trade Log blotter fills (hex — always paint).
              // No selected/blue: click does not change card color.
              const bg = blotterCardBackground(kind, false);
              const onFill = kind === "open" || kind === "close";
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

              const hasNext = posIdx < group.positions.length - 1;
              const orderedLegs = legsInDisplayOrder(pos.position.legs);
              const pkgDelta = packageDelta(
                pos.position.legs,
                spotPrice,
                playheadMs ?? Date.now(),
              );

              return (
                <PosBlock
                  key={pos.id}
                  pos={pos}
                  orderedLegs={orderedLegs}
                  hidden={hidden}
                  focused={focusedId === pos.id}
                  locked={locked}
                  und={und}
                  offSymbol={offSymbol}
                  family={family}
                  pkgDir={pkgDir}
                  pkgQty={pkgQty}
                  unitScale={unitScale}
                  price={price}
                  priceLabel={priceLabel}
                  liveMark={!!liveMark}
                  livenessChip={livenessChip}
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
                  pkgDelta={pkgDelta}
                  expChoices={expChoices}
                  tmDark={tmDark}
                  dteClock={dteClock}
                  getListedStrikes={getListedStrikes}
                  onFocus={onFocus}
                  onToggleVisibility={onToggleVisibility}
                  onEdit={onEdit}
                  onAskDelete={() =>
                    setPendingDelete({ id: pos.id, label: pos.label })
                  }
                  onSendToTradeLog={onSendToTradeLog}
                  tmActive={tmActive}
                  onSetEntryAt={onSetEntryAt}
                  onClosePosition={onClosePosition}
                  onLockNatural={onLockNatural}
                  onLockLimit={onLockLimit}
                  onUnlock={onUnlock}
                  onKeepCheckPrice={onKeepCheckPrice}
                  onSetDirection={onSetDirection}
                  onSetExpiration={onSetExpiration}
                  onShiftStrikes={onShiftStrikes}
                  onScalePos={onScalePos}
                  onSetSpread={onSetSpread}
                  onPatchLeg={onPatchLeg}
                  onSetRight={onSetRight}
                />
              );
            });
            return [header, ...cards];
            })}
          </table>
        </div>
      )}
      {pendingDelete ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55"
          data-testid={`analyzer-pos-delete-confirm-${pendingDelete.id}`}
        >
          <div className="w-[min(24rem,calc(100vw-2rem))] rounded-lg bg-[#1a1a22] p-4 text-white shadow-xl ring-1 ring-white/15">
            <p className="text-[18px] font-semibold">Delete this position?</p>
            <p className="mt-2 text-[16px] text-white/75">
              {pendingDelete.label} will be removed from the book. This cannot
              be undone except with Undo.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className={actionBtn}
                onClick={() => setPendingDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={actionBtn + " text-red-100"}
                data-testid={`analyzer-pos-delete-confirm-go-${pendingDelete.id}`}
                onClick={() => {
                  onDelete(pendingDelete.id);
                  setPendingDelete(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PosBlock({
  pos,
  orderedLegs,
  hidden,
  focused = false,
  tmDark = false,
  locked,
  und,
  offSymbol,
  family,
  pkgDir,
  pkgQty,
  unitScale,
  price,
  priceLabel,
  liveMark,
  livenessChip,
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
  pkgDelta,
  onFocus,
  onToggleVisibility,
  onEdit,
  onAskDelete,
  onSendToTradeLog,
  tmActive = false,
  onSetEntryAt,
  onClosePosition,
  onLockNatural,
  onLockLimit,
  onUnlock,
  onKeepCheckPrice,
  onSetDirection,
  onSetExpiration,
  onShiftStrikes,
  onScalePos,
  onSetSpread,
  onPatchLeg,
  onSetRight,
  getListedStrikes,
  expChoices,
  dteClock,
}: {
  pos: AnalyzerPosition;
  orderedLegs: { leg: LegInput; recordIndex: number }[];
  hidden: boolean;
  focused?: boolean;
  tmDark?: boolean;
  dteClock?: Date;
  locked: boolean;
  und: string;
  offSymbol: boolean;
  family: string;
  pkgDir: string;
  pkgQty: number;
  unitScale: number;
  price: number | null;
  priceLabel: string;
  liveMark: boolean;
  livenessChip: string;
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
  pkgDelta: number | null;
  getListedStrikes: (expiration: string) => readonly number[];
  onFocus: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onEdit: (id: string) => void;
  onAskDelete: () => void;
  onSendToTradeLog?: (id: string) => void;
  tmActive?: boolean;
  onSetEntryAt: (id: string, entryAt: number) => void;
  onClosePosition: (id: string) => void;
  onLockNatural: (id: string) => void;
  onLockLimit: (id: string, magnitude: number) => void;
  onUnlock: (id: string) => void;
  onKeepCheckPrice?: (id: string) => void;
  onSetDirection: (id: string, direction: "buy" | "sell") => void;
  onSetExpiration: (id: string, expiration: string) => void;
  onShiftStrikes: (id: string, direction: "up" | "down") => void;
  onScalePos: (id: string, pos: number) => void;
  onSetSpread: (id: string, template: TemplateType) => void;
  onPatchLeg: (
    id: string,
    recordIndex: number,
    patch: Partial<LegInput>,
  ) => void;
  onSetRight: (id: string, right: OptionRight) => void;
  expChoices: string[];
}) {
  const nLegs = orderedLegs.length;
  const pkgSide =
    side === "credit" ? "CREDIT" : side === "debit" ? "DEBIT" : "—";
  const rowExtra = CARD_EXTRA_Y / Math.max(1, nLegs);
  const padY = TD_PAD_Y + rowExtra / 2;

  /**
   * Trade Log blotter rule:
   * - Solid fill on every cell (hex)
   * - No borders between legs
   * - Position separator only after last leg
   * - Outer ring on tbody only
   */
  const cellBase = (isLast: boolean): CSSProperties => ({
    backgroundColor: bg,
    paddingTop: padY,
    paddingBottom: padY,
    // Between-position rule: 2px (was 1)
    borderBottomWidth: isLast && hasNext ? 2 : 0,
    borderBottomStyle: isLast && hasNext ? "solid" : "none",
    borderBottomColor:
      isLast && hasNext ? BLOTTER_HEX.positionRule : "transparent",
  });

  // Outer edge only — ghost vs debit/credit ring. No selected/blue ring.
  const edgeColor =
    kind === "close"
      ? BLOTTER_HEX.borderClose
      : kind === "open"
        ? BLOTTER_HEX.borderOpen
        : "rgba(255,255,255,0.22)";
  const blockShadow = isGhost
    ? "inset 0 0 0 2px rgba(156,163,175,0.75)"
    : `inset 0 0 0 2px ${edgeColor}`;

  if (tmDark) {
    const pendingEdge = cellBase(true);
    return (
      <tbody
        data-testid={`analyzer-pos-card-${pos.id}`}
        data-focused={focused ? "1" : "0"}
        data-visible={hidden ? "0" : "1"}
        data-tm-dark="1"
        data-blotter-kind={kind}
        data-ghost={isGhost ? "1" : "0"}
        data-rehearsal={pos.rehearsal ? "1" : "0"}
        className={(hidden ? "opacity-40 " : "opacity-50 ") + "transition-[filter]"}
        style={{ backgroundColor: bg, boxShadow: blockShadow }}
      >
        <tr className="tabular-nums" style={{ backgroundColor: bg }}>
          <td
            className={td + " align-middle"}
            style={pendingEdge}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={!hidden}
              onChange={() => onToggleVisibility(pos.id)}
              aria-label={
                hidden
                  ? `Show ${pos.label} on graph`
                  : `Hide ${pos.label} from graph`
              }
              data-testid={`analyzer-pos-show-${pos.id}`}
              className="h-3 w-3 cursor-pointer accent-[var(--color-tint)]"
            />
          </td>
          <td
            colSpan={COLS.length - 2}
            className={td + ` ${textMuted}`}
            style={pendingEdge}
            data-testid={`analyzer-pos-pending-${pos.id}`}
          >
            Not yet taken
          </td>
          <td
            className={td + " text-right align-top"}
            style={pendingEdge}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={`px-0.5 ${CHROME} font-normal leading-none text-white/35 hover:text-white/80`}
              data-testid={`analyzer-pos-delete-${pos.id}`}
              aria-label={`Delete ${pos.label} from the list`}
              onClick={() => onAskDelete()}
            >
              ✕
            </button>
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody
      data-testid={`analyzer-pos-card-${pos.id}`}
      data-focused={focused ? "1" : "0"}
      data-visible={hidden ? "0" : "1"}
      data-tm-dark={tmDark ? "1" : "0"}
      data-blotter-kind={kind}
      data-price-side={side ?? ""}
      data-ghost={isGhost ? "1" : "0"}
      data-rehearsal={pos.rehearsal ? "1" : "0"}
      data-expired={expired ? "1" : "0"}
      data-off-symbol={offSymbol ? "1" : "0"}
      className={
        (hidden ? "opacity-40 " : tmDark ? "opacity-50 " : isGhost ? "opacity-90 " : "") +
        "transition-[filter] hover:brightness-110"
      }
      style={{
        backgroundColor: bg,
        boxShadow: blockShadow,
        filter: isGhost
          ? "grayscale(0.15) saturate(0.85) brightness(1.15)"
          : undefined,
      }}
      onClick={() => onFocus(pos.id)}
    >
      {orderedLegs.map(({ leg, recordIndex }, i) => {
        const isTop = i === 0;
        const isLast = i === nLegs - 1;
        const exp = (leg.expiration || front).slice(0, 10);
        const legSide = leg.side === "long" ? "BUY" : "SELL";
        const signedQ = signedActualQty(leg);
        const edge = cellBase(isLast);
        const exposure = cardFieldExposure(family as CatalogName);
        const listedForLeg = getListedStrikes(exp);
        const currentTemplate = catalogToTemplate(family as CatalogName);

        return (
          <tr
            key={`${pos.id}-leg-${i}`}
            className="tabular-nums"
            style={{ backgroundColor: bg }}
            data-testid={
              isTop
                ? undefined
                : `analyzer-pos-leg-${pos.id}-${i}`
            }
          >
            {isTop ? (
              <td
                rowSpan={nLegs}
                className={td + " align-middle"}
                style={cellBase(true)}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-nowrap items-center gap-0.5 overflow-hidden">
                  <input
                    type="checkbox"
                    checked={!hidden}
                    onChange={() => onToggleVisibility(pos.id)}
                    aria-label={
                      hidden
                        ? `Show ${pos.label} on graph`
                        : `Hide ${pos.label} from graph`
                    }
                    data-testid={`analyzer-pos-show-${pos.id}`}
                    className="h-3 w-3 shrink-0 cursor-pointer accent-[var(--color-tint)]"
                  />
                  <button
                    type="button"
                    className={chromeBtn}
                    data-testid={`analyzer-pos-edit-${pos.id}`}
                    aria-label={`Edit ${pos.label}`}
                    onClick={() => onEdit(pos.id)}
                  >
                    Edit
                  </button>
                  {onSendToTradeLog && !pos.rehearsal ? (
                    <button
                      type="button"
                      className={chromeBtn}
                      data-testid={`analyzer-pos-send-log-${pos.id}`}
                      disabled={tmActive}
                      title={
                        tmActive
                          ? "Log is closed while Time Machine is active"
                          : "Promote to Trade Log"
                      }
                      onClick={() => onSendToTradeLog(pos.id)}
                    >
                      Log
                    </button>
                  ) : null}
                  {pos.closedAt != null ? (
                    <span
                      className={`px-0.5 ${CHROME} font-normal text-white/70`}
                      data-testid={`analyzer-pos-closed-${pos.id}`}
                    >
                      Closed {formatEtHm(pos.closedAt)}
                    </span>
                  ) : (
                    <button
                      type="button"
                      className={chromeBtn}
                      data-testid={`analyzer-pos-close-${pos.id}`}
                      onClick={() => onClosePosition(pos.id)}
                    >
                      Close
                    </button>
                  )}
                  {pos.rehearsal ? (
                    <span
                      className={`px-0.5 ${CHROME} font-normal text-white/55`}
                      data-testid={`analyzer-pos-rehearsal-${pos.id}`}
                    >
                      <ReplayBadge className="!inline-flex !min-h-4 !min-w-4 !h-4 !w-4" />
                      Rehearsal
                      {pos.entryAt != null
                        ? ` · ${formatReplayClock(pos.entryAt)}`
                        : ""}
                    </span>
                  ) : null}
                </div>
              </td>
            ) : null}
            <td
              className={
                td +
                (isTop ? ` ${textMain}` : ` ${textDim}`)
              }
              style={edge}
              onClick={(e) => e.stopPropagation()}
            >
              {isTop ? (
                <CardMenuField surface="card">
                <select
                  className={cardSelect + " " + textMain}
                  value={currentTemplate ?? ""}
                  aria-label="Spread"
                  data-testid={`analyzer-pos-spread-${pos.id}`}
                  onChange={(e) => {
                    const v = e.target.value as TemplateType;
                    if (!v) return;
                    onSetSpread(pos.id, v);
                  }}
                >
                  {currentTemplate ? null : (
                    <option value="">{family}</option>
                  )}
                  {offeredCardTemplates(expChoices.length).map((t) => (
                    <option key={t} value={t}>
                      {TEMPLATE_LABELS[t]}
                    </option>
                  ))}
                </select>
                </CardMenuField>
              ) : (
                ""
              )}
            </td>
            <td
              className={td}
              style={edge}
              onClick={(e) => e.stopPropagation()}
            >
              {isTop ? (
                <CardMenuField surface="card">
                <select
                  className={cardSelect + " " + textMain}
                  value={pkgDir === "SELL" ? "sell" : "buy"}
                  aria-label="Structure side BUY or SELL"
                  data-testid={`analyzer-pos-direction-${pos.id}`}
                  onChange={(e) => {
                    const v = e.target.value === "sell" ? "sell" : "buy";
                    onSetDirection(pos.id, v);
                  }}
                >
                  <option value="buy">BUY</option>
                  <option value="sell">SELL</option>
                </select>
                </CardMenuField>
              ) : (
                <span className={textMain}>{legSide}</span>
              )}
            </td>
            <td
              className={td + ` text-right font-mono ${textMain}`}
              style={edge}
              data-testid={isTop ? `analyzer-pos-qty-${pos.id}` : undefined}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-end gap-0">
                {isTop ? (
                  <input
                    className={
                      `h-[18px] w-5 rounded-sm ${FIELD_FILL} py-0 pr-0.5 text-right font-mono ` +
                      "leading-[18px] outline-none " +
                      textMain
                    }
                    inputMode="numeric"
                    aria-label="POS"
                    data-testid={`analyzer-pos-qty-input-${pos.id}`}
                    value={pkgQty}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (!Number.isFinite(v) || v < 1) return;
                      onScalePos(pos.id, v);
                    }}
                  />
                ) : (
                  <span>{signedQ}</span>
                )}
                {isTop ? (
                  <TosQtyControl surface="card"
                    testId={`analyzer-pos-qty-step-${pos.id}`}
                    onUp={() => onScalePos(pos.id, pkgQty + 1)}
                    onDown={() => onScalePos(pos.id, Math.max(1, pkgQty - 1))}
                    onPick={(n) => onScalePos(pos.id, n)}
                  />
                ) : null}
              </div>
            </td>
            <td
              className={td + ` ${textMain}`}
              style={edge}
            >
              {und}
              {isTop && offSymbol ? (
                <span
                  className={`ml-1 rounded bg-black/25 px-1 ${CHROME} text-white`}
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
              {(isTop && exposure.expiration === "row1") ||
              exposure.expiration === "per-leg" ? (
                <CardMenuField surface="card">
                <select
                  className={cardSelect + " " + textMain}
                  value={boundSelectValue(exp, expChoices).value}
                  data-invalid={
                    boundSelectValue(exp, expChoices).invalid ? "1" : "0"
                  }
                  aria-label={
                    exposure.expiration === "per-leg"
                      ? "Leg expiration"
                      : "Structure expiration"
                  }
                  data-testid={
                    isTop
                      ? `analyzer-pos-expiration-${pos.id}`
                      : `analyzer-pos-leg-exp-${pos.id}-${i}`
                  }
                  onChange={(e) => {
                    if (!e.target.value) return;
                    if (exposure.expiration === "per-leg") {
                      onPatchLeg(pos.id, recordIndex, {
                        expiration: e.target.value,
                      });
                    } else {
                      onSetExpiration(pos.id, e.target.value);
                    }
                  }}
                >
                  {boundSelectValue(exp, expChoices).invalid ? (
                    <option value="">{fmtExp(exp)}</option>
                  ) : null}
                  {expChoices.map((e) => (
                    <option key={e} value={e}>
                      {fmtExp(e)}
                    </option>
                  ))}
                </select>
                </CardMenuField>
              ) : (
                <span className={textMuted}>
                  {fmtExp(exp)}
                  {isTop ? (
                    <span className={`ml-1 ${CHROME} text-white/50`}>
                      {expired ? "EXPIRED" : `${dte}d`}
                    </span>
                  ) : null}
                </span>
              )}
            </td>
            <td
              className={
                td + ` text-right font-mono ${textMain}`
              }
              style={edge}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-end gap-0.5">
                {listedForLeg.length ? (
                  <CardMenuField surface="card" fit="min">
                  <select
                    className={
                      cardSelect +
                      " !w-auto max-w-[6.5rem] text-right font-mono " +
                      textMain
                    }
                    value={
                      listedForLeg.some((s) => s === leg.strike)
                        ? String(leg.strike)
                        : ""
                    }
                    data-testid={`analyzer-pos-strike-${pos.id}-${i}`}
                    aria-label="Strike"
                    onChange={(e) => {
                      const s = parseFloat(e.target.value);
                      if (!Number.isFinite(s)) return;
                      onPatchLeg(pos.id, recordIndex, { strike: s });
                    }}
                  >
                    {listedForLeg.some((s) => s === leg.strike) ? null : (
                      <option value="">{fmtStrike(leg.strike)}</option>
                    )}
                    {listedForLeg.map((s) => (
                      <option key={s} value={s}>
                        {fmtStrike(s)}
                      </option>
                    ))}
                  </select>
                  </CardMenuField>
                ) : (
                  <span>{fmtStrike(leg.strike)}</span>
                )}
                <TosStepper surface="card"
                  testId={`analyzer-pos-strike-step-${pos.id}-${i}`}
                  ariaLabel="Strike"
                  disabled={!listedForLeg.length}
                  onUp={() => {
                    const next = listedForLeg
                      .filter((s) => s > leg.strike)
                      .sort((a, b) => a - b)[0];
                    if (next == null) {
                      onShiftStrikes(pos.id, "up");
                      return;
                    }
                    onPatchLeg(pos.id, recordIndex, { strike: next });
                  }}
                  onDown={() => {
                    const next = listedForLeg
                      .filter((s) => s < leg.strike)
                      .sort((a, b) => b - a)[0];
                    if (next == null) {
                      onShiftStrikes(pos.id, "down");
                      return;
                    }
                    onPatchLeg(pos.id, recordIndex, { strike: next });
                  }}
                />
              </div>
            </td>
            <td
              className={td + ` ${textMain}`}
              style={edge}
              onClick={(e) => e.stopPropagation()}
            >
              {exposure.type === "inert" ? (
                <span className={textDim}>
                  {leg.type === "call" ? "CALL" : "PUT"}
                </span>
              ) : (
                <CardMenuField surface="card" fit="min">
                <button
                  type="button"
                  className={
                    `h-[18px] rounded-sm ${FIELD_FILL} px-1 py-0 ` + textMain
                  }
                  data-testid={
                    isTop
                      ? `analyzer-pos-type-${pos.id}`
                      : `analyzer-pos-leg-type-${pos.id}-${i}`
                  }
                  onClick={() => {
                    const next: OptionRight =
                      leg.type === "call" ? "put" : "call";
                    if (isTop && exposure.type === "row1") {
                      onSetRight(pos.id, next);
                    } else {
                      onPatchLeg(pos.id, recordIndex, { type: next });
                    }
                  }}
                >
                  {leg.type === "call" ? "CALL" : "PUT"}
                </button>
                </CardMenuField>
              )}
            </td>
            <td
              className={
                td +
                ` text-right font-mono ` +
                (isTop && expired ? "text-amber-200" : textMain)
              }
              style={edge}
              onClick={(e) => e.stopPropagation()}
              data-testid={isTop ? `analyzer-pos-price-${pos.id}` : undefined}
              data-display-kind={isTop ? display.kind : undefined}
              data-live={
                isTop && liveMark && livenessChip.toLowerCase() === "live"
                  ? "1"
                  : undefined
              }
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

            >
              {isTop ? (
                display.kind === "price" ? (
                  <div className="flex flex-col items-end gap-0.5">
                    <div className="flex items-center justify-end gap-0.5">
                      <PackagePriceField
                        id={pos.id}
                        locked={locked}
                        price={price}
                        priceLabel={priceLabel}
                        textMain={
                          pos.lock.mode === "locked" && pos.lock.checkPrice
                            ? "text-amber-200 line-through decoration-amber-200/80"
                            : textMain
                        }
                        onCommit={(mag) => onLockLimit(pos.id, mag)}
                        onLockForEdit={() => onLockNatural(pos.id)}
                      />
                      <TosStepper surface="card"
                        testId={`analyzer-pos-price-step-${pos.id}`}
                        ariaLabel="Price"
                        disabled={price == null}
                        onUp={() => {
                          if (price == null) return;
                          try {
                            onLockLimit(
                              pos.id,
                              stepCardPrice(und, price, "up"),
                            );
                          } catch {
                            /* unknown product — no step */
                          }
                        }}
                        onDown={() => {
                          if (price == null) return;
                          try {
                            onLockLimit(
                              pos.id,
                              stepCardPrice(und, price, "down"),
                            );
                          } catch {
                            /* unknown product — no step */
                          }
                        }}
                      />
                    </div>
                    {pos.lock.mode === "locked" && pos.lock.checkPrice ? (
                      <div
                        className="flex items-center gap-1"
                        data-testid={`analyzer-pos-check-price-${pos.id}`}
                      >
                        <span className={`${CHROME} font-normal uppercase text-amber-200`}>
                          CHECK PRICE
                        </span>
                        <button
                          type="button"
                          className={`rounded bg-black/25 px-1 py-0 ${CHROME} font-normal text-white hover:bg-black/40`}
                          data-testid={`analyzer-pos-keep-${pos.id}`}
                          onClick={() => onKeepCheckPrice?.(pos.id)}
                        >
                          Keep
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : display.kind === "expired" &&
                  definedDebitSigned(pos) != null ? (
                  <>
                    {priceLabel}
                    <span
                      className={
                        `ml-1 ${CHROME} font-normal uppercase text-amber-200`
                      }
                    >
                      EXPIRED
                    </span>
                  </>
                ) : (
                  <span
                    className={
                      `${CHROME} font-normal uppercase ` +
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
              ) : i === 1 ? (
                <span
                  className={`${DATA} font-normal uppercase ${textMain}`}
                  data-testid={`analyzer-pos-pkg-side-${pos.id}`}
                >
                  {pkgSide}
                </span>
              ) : (() => {
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
                        className={`${CHROME} font-normal uppercase text-amber-200`}
                        data-testid={`analyzer-pos-leg-not-traded-${pos.id}-${i}`}
                      >
                        NOT TRADED
                      </span>
                    );
                  }
                  return "";
                })()}
            </td>
            <td
              className={td + " text-center align-middle"}
              style={{ ...edge, ...LOCK_RULE }}
              data-testid={isTop ? `analyzer-pos-lock-cell-${pos.id}` : undefined}
              onClick={(e) => e.stopPropagation()}
            >
              {isTop ? (
                <TosPadlock surface="card"
                  locked={locked}
                  testId={`analyzer-pos-lock-${pos.id}`}
                  onToggle={() =>
                    locked ? onUnlock(pos.id) : onLockNatural(pos.id)
                  }
                />
              ) : null}
            </td>
            <td
              className={td + ` text-right ${textMuted}`}
              style={edge}
            >
              {fmtIv(leg.volatility)}
            </td>
            <td
              className={td + ` text-right font-mono ${textMain}`}
              style={edge}
              data-testid={isTop ? `analyzer-pos-delta-${pos.id}` : undefined}
            >
              {isTop ? fmtPackageDelta(pkgDelta) : "—"}
            </td>
            {isTop ? (
              <td
                rowSpan={nLegs}
                className={td + " text-right align-top"}
                style={cellBase(true)}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className={`px-0.5 ${CHROME} font-normal leading-none text-white/35 hover:text-white/80`}
                  data-testid={`analyzer-pos-delete-${pos.id}`}
                  aria-label={`Delete ${pos.label} from the list`}
                  onClick={() => onAskDelete()}
                >
                  ✕
                </button>
              </td>
            ) : null}
          </tr>
        );
      })}
    </tbody>
  );
}
