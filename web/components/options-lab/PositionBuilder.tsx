"use client";

/**
 * Live Position Builder for Options Lab Analyzer.
 *
 * **Law:** Every prefilled / regenerated strike must exist on the OPF-held
 * dual-side chain for that expiration. There is no alternate strike book —
 * RTH or closed, the chain OPF holds is the only universe. If the ladder is
 * not loaded yet, wait and hydrate; never emit arithmetic “fake” strikes.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import {
  CardMenuField,
  TosPadlock,
  TosQtyControl,
  TosStepper,
} from "@/components/options-lab/TosControls";
import SegmentedControl from "@/components/ui/SegmentedControl";
import {
  calendarDteOf,
  type CardLockState,
} from "@/lib/options-lab/analyzerBook";
import {
  applyEtHm,
  resolveEntryAt,
} from "@/lib/options-lab/positionSession";
import {
  listedStepNear,
  listedWingChoices,
  nearestListedToSpot,
  normalizeStrike,
  snapToListed,
  snapWidthToListed,
} from "@/lib/options-lab/listedStrikes";
import {
  buildListedStructure,
  inferStructureCenter,
} from "@/lib/options-lab/listedStructure";
import {
  boundSelectValue,
  offeredTemplates,
} from "@/lib/options-lab/chainControls";
import {
  packageEconomics,
} from "@/lib/options-lab/packageEconomics";
import { posAndRatio, scaleLegPos, signedActualQty } from "@/lib/options-lab/positionQty";
import { stepCardPrice } from "@/lib/options-lab/tosCard";
import { nyWall } from "@/lib/options-lab/timeOrthoSession";
import { useOptionsLab } from "@/lib/optionsLabContext";
import { rememberTosScript } from "@/lib/tradeLogTos";
import type {
  ChainAccessors,
  LegInput,
  OptionRight,
  PositionInput,
  TemplateType,
  TradeDirection,
} from "@/lib/options-lab/positionTypes";
import {
  diagonalWidthFromLadder,
  flipLegs,
} from "@/lib/options-lab/positionTemplates";
import {
  buildLabel,
  buildNotation,
  detectFamily,
} from "@/lib/options-lab/positionLabels";
import { generateTosScript } from "@/lib/options-lab/tosGenerator";
import {
  DEFAULT_CREATE_WING_WIDTH,
  formatShapeSummary,
  isLabDefaultsActive,
  labDefaultForStrategy,
  loadCreateDefaultsStore,
  MAX_USER_PRESETS,
  resetToLabDefaults,
  resolveCreateSeed,
  saveShapeAsUserPreset,
  setActiveCreateDefault,
  shapeFromBuilderState,
  type CreateDefaultsStore,
} from "@/lib/options-lab/builderCreateDefault";
import {
  builderDefinitionKey,
  resolveBuilderPlaneState,
  type BuilderPlaneState,
} from "@/lib/options-lab/builderAtomicState";

export { DEFAULT_CREATE_WING_WIDTH };

const TEMPLATE_LABELS: Record<TemplateType, string> = {
  single: "Single",
  vertical: "Vertical",
  butterfly: "Butterfly",
  bwb: "BWB",
  condor: "Condor",
  straddle: "Straddle",
  strangle: "Strangle",
  iron_fly: "Iron Fly",
  iron_condor: "Iron Condor",
  calendar: "Calendar",
  diagonal: "Diagonal",
};

const STRATEGY_GROUPS: { label: string; items: TemplateType[] }[] = [
  { label: "Basic", items: ["single", "vertical"] },
  { label: "Spreads", items: ["butterfly", "bwb", "condor"] },
  {
    label: "Volatility",
    items: ["straddle", "strangle", "iron_fly", "iron_condor"],
  },
  { label: "Time", items: ["calendar", "diagonal"] },
];

const TEMPLATE_HAS_SIDE: Record<TemplateType, boolean> = {
  single: true,
  vertical: true,
  butterfly: true,
  bwb: true,
  condor: true,
  straddle: false,
  strangle: false,
  iron_fly: false,
  iron_condor: false,
  calendar: true,
  diagonal: true,
};

/**
 * Payoff silhouettes (viewBox 0 0 60 24, y-down).
 * All templates are **debit-native / long** shapes (Buy = green, no flip).
 * Sell applies scaleY(-1) → short/credit tent for fly · condor · iron.
 * Iron long = valley (same family as long strangle); Sell flips to tent.
 */
const STRATEGY_DIAGRAMS: Record<TemplateType, string> = {
  single: "M2,22 L58,6",
  vertical: "M2,22 L20,22 L40,6 L58,6",
  butterfly: "M2,18 L12,18 L30,4 L48,18 L58,18",
  bwb: "M2,18 L12,18 L28,4 L52,18 L58,18",
  condor: "M2,18 L10,18 L20,6 L40,6 L50,18 L58,18",
  straddle: "M2,6 L30,22 L58,6",
  strangle: "M2,6 L18,18 L42,18 L58,6",
  // Long iron fly = valley at body (debit); Sell flips → short tent
  iron_fly: "M2,6 L12,6 L30,20 L48,6 L58,6",
  // Long iron condor = valley plateau (debit); Sell flips → short tent
  iron_condor: "M2,6 L10,6 L20,18 L40,18 L50,6 L58,6",
  calendar: "M2,16 L20,10 L30,6 L40,10 L58,16",
  diagonal: "M2,18 L20,12 L32,6 L44,10 L58,16",
};

/** Fallback when profile fly_widths missing (A2/A3 prefer profile.fly_widths[0]). */
function defaultWidth(symbol: string, profileMin?: number | null): number {
  if (profileMin != null && profileMin > 0) return profileMin;
  const s = symbol.toUpperCase();
  if (s === "NDX" || s.startsWith("NQ")) return 50;
  if (s === "SPX" || s === "XSP" || s === "RUT") return 20;
  return 5;
}

/** America/New_York calendar date as YYYY-MM-DD (index options). */
function etYmd(now: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);
    const y = parts.find((p) => p.type === "year")?.value;
    const m = parts.find((p) => p.type === "month")?.value;
    const d = parts.find((p) => p.type === "day")?.value;
    if (y && m && d) return `${y}-${m}-${d}`;
  } catch {
    /* fall through */
  }
  return now.toISOString().slice(0, 10);
}

/**
 * Same-day (0DTE) expiration is valid for Builder default only while the
 * cash session is still in play for that day: weekdays **before 16:00 ET**.
 *
 * After 4:00 PM Eastern the current calendar date is no longer a valid default
 * — even if the index residual plane still reports Live until ~16:15.
 */
export function isSameDayExpirationValid(now: Date = new Date()): boolean {
  try {
    const et = new Date(
      now.toLocaleString("en-US", { timeZone: "America/New_York" }),
    );
    const day = et.getDay();
    if (day === 0 || day === 6) return false;
    const mins = et.getHours() * 60 + et.getMinutes();
    // Strict: 16:00 ET and later → today is invalid
    return mins < 16 * 60;
  } catch {
    return false;
  }
}

/**
 * Default front expiration for Create:
 *  - Today listed + before 4:00 PM ET + market Live → today
 *  - After 4:00 PM ET / market not Live / today not listed → **next** listed
 *    expiration after today (never re-select expired same-day)
 *  - Fallback: first future listed, else last listed
 */
export function pickDefaultFrontExpiration(
  listed: readonly string[],
  marketLive: boolean,
  now: Date = new Date(),
): string {
  if (!listed.length) return etYmd(now);
  const sorted = [...listed].filter(Boolean).sort();
  if (!sorted.length) return etYmd(now);
  const today = etYmd(now);

  const todayStillValid =
    marketLive &&
    isSameDayExpirationValid(now) &&
    sorted.includes(today);

  if (todayStillValid) return today;

  // After 4 PM ET (or closed/held): roll to next listed after today
  const next = sorted.find((e) => e > today);
  if (next) return next;

  // No future listed — prefer first on-or-after today that is still valid,
  // never force post-4pm "today" as default when a later date exists (handled above).
  const onOrAfter = sorted.find((e) => e >= today);
  if (onOrAfter && onOrAfter !== today) return onOrAfter;
  if (onOrAfter === today && isSameDayExpirationValid(now) && marketLive) {
    return today;
  }
  // Only past dates left in the ladder
  return sorted[sorted.length - 1] ?? sorted[0];
}

/** Caption for Width row — show inferred OPF step near center. */
function listedStepNearLabel(
  listed: readonly number[],
  center: number,
): string {
  const step = listedStepNear(listed, center);
  if (step == null || !(step > 0)) return "";
  return ` · step ${step}`;
}

/** Snap preferred wing onto OPF-listed choices only (symbol/grid aware). */
function resolveCreateWingWidth(
  center: number,
  listed: number[],
  prefer: number = DEFAULT_CREATE_WING_WIDTH,
): number {
  if (!listed.length) return prefer;
  return (
    snapWidthToListed(prefer, center, listed) ??
    listedWingChoices(center, listed, 40)[0] ??
    prefer
  );
}

/** PB22: next listed only — never synthesize unlisted calendar day. */
function nextListedBack(front: string, listed: string[]): string | null {
  const after = listed.filter((e) => e > front).sort();
  return after[0] ?? null;
}

function defaultDiagonalWidth(symbol: string): number {
  const s = symbol.toUpperCase();
  if (s === "NDX" || s.startsWith("NQ")) return 75;
  if (s === "SPX" || s === "XSP") return 15;
  return 5;
}

/** Dialog field appearance — application tokens, not card tokens (DLG-THEME-4). */
const sectionLabel =
  "pb-2 font-medium uppercase tracking-wide text-[length:var(--text-caption)] text-[var(--color-label-secondary)]";
const dlgField =
  "min-h-[var(--hit-min)] w-full appearance-none cursor-pointer rounded-[var(--radius-sm)] " +
  "border-0 bg-[var(--color-fill)] px-2 text-[length:var(--text-body)] tabular-nums text-[var(--color-label)] " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]";
const formRow =
  "grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-x-3";
const formLabel =
  "text-[length:var(--text-subheadline)] text-[var(--color-label-secondary)]";

function FormRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className={formRow}>
      <div className={formLabel}>{label}</div>
      <div>{children}</div>
    </div>
  );
}

export type PositionBuilderProps = {
  open: boolean;
  mode: "create" | "edit";
  symbol: string;
  spotPrice: number;
  chain: ChainAccessors;
  initial?: PositionInput | null;
  /**
   * True when market session is Live (still in play). Used for create-default
   * front expiration: today if listed + live, else next listed after today.
   */
  marketLive?: boolean;
  /** Massive still printing (RTH or pre/post). False = dark plane, last print only. */
  planePrinting?: boolean;
  onSave: (position: PositionInput, label: string, notation: string) => void;
  onCancel: () => void;
  /** Edit live bind — every patch writes the book. Create must not call this. */
  onLivePatch?: (
    position: PositionInput,
    label: string,
    notation: string,
  ) => void;
  /** Edit-mode lock. Displayed price reads this, not net_debit_override (D-PC-7). */
  cardLock?: CardLockState;
  definedDebit?: number | null;
  onLockLimit?: (magnitude: number) => void;
  onLockNatural?: () => void;
  onUnlock?: () => void;
  /** Edit-only. Card no longer hosts the time widget (PC8-D). */
  entryAt?: number | null;
  onSetEntryAt?: (entryAt: number) => void;
};

/** Wide enough for full Legs table (Qty · Strike · Type · Exp · Mid · ± · IV). */
const PANEL_W = 820;
const PANEL_DEFAULT_OFFSET = { x: 48, y: 72 };

export default function PositionBuilder({
  open,
  mode,
  symbol,
  spotPrice,
  chain,
  initial,
  marketLive = true,
  planePrinting = marketLive,
  onSave,
  onCancel,
  onLivePatch,
  cardLock,
  definedDebit = null,
  onLockLimit,
  onLockNatural,
  onUnlock,
  entryAt = null,
  onSetEntryAt,
}: PositionBuilderProps) {
  const { profile } = useOptionsLab();
  const profileMinWing =
    profile?.fly_widths?.[0] ??
    (profile?.strike_step != null && profile.strike_step > 0
      ? profile.strike_step
      : null);
  const hasExps = chain.expirations.length > 0;
  const frontDefault =
    initial?.expiration ||
    pickDefaultFrontExpiration(chain.expirations, marketLive) ||
    etYmd();

  const [draft, setDraft] = useState<PositionInput>(() => ({
    underlying: symbol,
    expiration: frontDefault,
    contracts: 1,
    legs: [],
    direction: "buy",
    net_debit_override: null,
  }));
  const position: PositionInput =
    mode === "edit" && initial
      ? initial
      : draft;
  const setPosition = (
    update: PositionInput | ((prev: PositionInput) => PositionInput),
  ) => {
    if (mode === "edit" && initial) {
      const next =
        typeof update === "function" ? update(initial) : update;
      onLivePatch?.(
        next,
        buildLabel(next.underlying, next.legs, next.expiration),
        buildNotation(next.legs),
      );
      return;
    }
    setDraft(update);
  };

  const [template, setTemplate] = useState<TemplateType>("butterfly");
  const [direction, setDirection] = useState<TradeDirection>("buy");
  const [optionSide, setOptionSide] = useState<OptionRight>("call");
  const [centerStrike, setCenterStrike] = useState(0);
  /** Editable spot for nearest-listed center (defaults to OPF/underlier mark). */
  const [userSpot, setUserSpot] = useState(0);
  const [userSpotDirty, setUserSpotDirty] = useState(false);
  /** True when user picked Center from dropdown (don't auto-snap until spot edits). */
  const centerPinnedRef = useRef(false);
  const [wingWidth, setWingWidth] = useState(DEFAULT_CREATE_WING_WIDTH);
  const [backExpiration, setBackExpiration] = useState("");
  const [copied, setCopied] = useState(false);
  const [createEntryAt, setCreateEntryAt] = useState<number | null>(null);
  /** Defaults menu (lower-left footer) — Lab + up to 3 user presets */
  const [defaultsMenuOpen, setDefaultsMenuOpen] = useState(false);
  const [defaultsFlash, setDefaultsFlash] = useState<string | null>(null);
  const [defaultsStore, setDefaultsStore] = useState<CreateDefaultsStore>(() =>
    loadCreateDefaultsStore(),
  );
  /** Status when chain not ready / structure cannot sit on OPF grid */
  const [structureNotice, setStructureNotice] = useState<string | null>(null);
  /** Atomic resolve — one settle unit per definition (card-parity). */
  const [atomicResolving, setAtomicResolving] = useState(false);
  const [unplaceableDetail, setUnplaceableDetail] = useState<string | null>(
    null,
  );
  const settledDefRef = useRef<string | null>(null);
  const resolveGenRef = useRef(0);
  /** One seed per open — never re-seed over the user's structure. */
  const didSeed = useRef(false);
  /** Last chain rev we applied prices for (reprice only, no structure rewrite). */
  const lastPriceRev = useRef(-1);
  /** User explicitly changed front exp — do not auto-roll it. */
  const userPickedExp = useRef(false);
  /**
   * Pending quick-build when OPF ladder not yet loaded for front exp.
   * Applied once strikes arrive — never invent strikes while waiting.
   */
  const pendingBuild = useRef<{
    tmpl: TemplateType;
    center: number;
    width: number;
    side: OptionRight;
    dir: TradeDirection;
    front: string;
    back?: string;
  } | null>(null);

  // Free-floating panel position (viewport coords)
  const [panelPos, setPanelPos] = useState(PANEL_DEFAULT_OFFSET);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const frontStrikes = useMemo(
    () => chain.getStrikes(position.expiration),
    // rev forces refresh when ladder hydrates
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chain, position.expiration, chain.rev],
  );

  /** Effective spot mark for nearest-listed center (user edit wins). */
  const effectiveSpot = useMemo(() => {
    if (userSpot > 0) return userSpot;
    if (chain.spot != null && chain.spot > 0) return chain.spot;
    if (spotPrice > 0) return spotPrice;
    return 0;
  }, [userSpot, chain.spot, spotPrice]);

  /**
   * Center MUST be the OPF-listed strike nearest to spot.
   * Never invent arithmetic strikes; null only while ladder empty.
   */
  const nearestCenter = useMemo(() => {
    if (!frontStrikes.length) return 0;
    return (
      nearestListedToSpot(effectiveSpot, frontStrikes) ??
      frontStrikes[Math.floor(frontStrikes.length / 2)]
    );
  }, [frontStrikes, effectiveSpot]);

  const atmCenter = nearestCenter;

  /**
   * OPF + symbol-aware wing widths only (SPX → 5/10/15/20…, never 21/22).
   * Built from listed strike distances around Center — not free integers.
   */
  const wingChoices = useMemo(
    () =>
      listedWingChoices(
        centerStrike || atmCenter || nearestCenter,
        frontStrikes,
        60,
      ),
    [centerStrike, atmCenter, nearestCenter, frontStrikes],
  );

  // Keep wingWidth on the listed set whenever the OPF grid or center moves
  useEffect(() => {
    if (!open || !wingChoices.length) return;
    if (wingChoices.includes(wingWidth)) return;
    const center = centerStrike || atmCenter || nearestCenter;
    const snapped =
      snapWidthToListed(wingWidth || DEFAULT_CREATE_WING_WIDTH, center, frontStrikes) ??
      wingChoices[0];
    if (snapped > 0 && snapped !== wingWidth) setWingWidth(snapped);
  }, [
    open,
    wingChoices,
    wingWidth,
    centerStrike,
    atmCenter,
    nearestCenter,
    frontStrikes,
  ]);

  // Track OPF/underlier spot into editable field until the user edits
  useEffect(() => {
    if (!open) {
      setUserSpotDirty(false);
      centerPinnedRef.current = false;
      return;
    }
    if (userSpotDirty) return;
    const s =
      (chain.spot != null && chain.spot > 0 ? chain.spot : null) ??
      (spotPrice > 0 ? spotPrice : null);
    if (s != null && s > 0) setUserSpot(s);
  }, [open, chain.spot, spotPrice, userSpotDirty, chain.rev]);

  // Center follows the structure (card body). Spot only seeds Center
  // when there are no legs yet. Do not snap a live structure back to ATM.
  useEffect(() => {
    if (!open) return;
    if (position.legs.length > 0) {
      const inferred = inferStructureCenter(position.legs);
      if (!(inferred > 0)) return;
      setCenterStrike((prev) =>
        normalizeStrike(prev) === inferred ? prev : inferred,
      );
      return;
    }
    if (!frontStrikes.length || !(nearestCenter > 0)) return;
    if (centerPinnedRef.current) {
      setCenterStrike((prev) => {
        const onGrid = frontStrikes.some(
          (s) => normalizeStrike(s) === normalizeStrike(prev),
        );
        if (prev > 0 && onGrid) return prev;
        centerPinnedRef.current = false;
        return nearestCenter;
      });
      return;
    }
    setCenterStrike(nearestCenter);
  }, [open, frontStrikes, nearestCenter, position.legs]);

  // Hydrate every expiration the structure needs so any OPF-listed trade is choosable
  useEffect(() => {
    if (!open) return;
    const need = new Set<string>();
    if (position.expiration) need.add(position.expiration.slice(0, 10));
    if (backExpiration) need.add(backExpiration.slice(0, 10));
    for (const leg of position.legs) {
      if (leg.expiration) need.add(leg.expiration.slice(0, 10));
    }
    // Also warm default front + full OPF exp list so Center never stalls
    for (const e of chain.expirations) need.add(e.slice(0, 10));
    for (const e of need) {
      if (e) chain.ensureExpiration(e);
    }
  }, [
    open,
    position.expiration,
    position.legs,
    backExpiration,
    chain,
    chain.expirations,
    chain.rev,
  ]);

  /** Force OPF reload — calm re-resolve, not an error path. */
  const retryOpfChain = useCallback(() => {
    settledDefRef.current = null;
    setAtomicResolving(true);
    setUnplaceableDetail(null);
    setStructureNotice(null);
    chain.refresh();
    const front =
      (position.expiration || "").slice(0, 10) ||
      pickDefaultFrontExpiration(chain.expirations, marketLive) ||
      (chain.expirations[0] || "").slice(0, 10);
    if (front) chain.ensureExpiration(front);
    for (const e of chain.expirations) chain.ensureExpiration(e);
  }, [chain, position.expiration, marketLive]);

  // Open Create/Edit → start one atomic plane resolve
  useEffect(() => {
    if (!open) {
      settledDefRef.current = null;
      setAtomicResolving(false);
      setUnplaceableDetail(null);
      return;
    }
    setAtomicResolving(true);
    retryOpfChain();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps -- once per open

  // Live session only: quiet hydrate while UPDATING.
  // Off market: one last-print fetch on open — do not poll OPF.
  useEffect(() => {
    if (!open) return;
    if (frontStrikes.length > 0 && position.legs.length > 0) {
      setAtomicResolving(false);
      return;
    }
    if (!planePrinting) {
      setAtomicResolving(false);
      return;
    }
    setAtomicResolving(true);
    const id = window.setInterval(() => {
      const front = (position.expiration || "").slice(0, 10);
      if (front) chain.ensureExpiration(front);
      if (!chain.expirations.length) chain.refresh();
    }, 2500);
    return () => window.clearInterval(id);
  }, [
    open,
    frontStrikes.length,
    position.legs.length,
    chain,
    position.expiration,
    marketLive,
    planePrinting,
  ]);

  useEffect(() => {
    setPosition((p) =>
      p.underlying === symbol ? p : { ...p, underlying: symbol },
    );
  }, [symbol]);

  const isTimeSpread = template === "calendar" || template === "diagonal";

  const priceLegs = useCallback(
    (legs: LegInput[], frontExp: string): LegInput[] => {
      // Only price legs that land on the OPF-held listed grid for each exp.
      // Never invent a strike when the ladder is empty — leave as-is and
      // let the caller wait for hydrate.
      return legs.map((leg) => {
        const exp = (leg.expiration || frontExp).slice(0, 10);
        const listed = chain.getStrikes(exp);
        if (!listed.length) {
          return { ...leg, entry_price: leg.entry_price ?? 0 };
        }
        const strike = snapToListed(leg.strike, listed);
        if (strike == null) {
          return { ...leg, entry_price: 0 };
        }
        const c = chain.getContract(exp, strike, leg.type);
        return {
          ...leg,
          strike,
          entry_price: c?.mid ?? leg.entry_price ?? 0,
          volatility: c?.iv ?? leg.volatility,
        };
      });
    },
    [chain],
  );

  /**
   * Materialize legs **only** from the OPF-held listed chain for front exp.
   * If the ladder is not loaded yet: hydrate + queue (pendingBuild) — do not
   * invent center/width arithmetic strikes.
   */
  const regenerate = useCallback(
    (
      tmpl: TemplateType,
      center: number,
      width: number,
      side: OptionRight,
      dir: TradeDirection,
      frontExp: string,
      backExp?: string,
    ): boolean => {
      const front = (frontExp || "").slice(0, 10) || etYmd();
      chain.ensureExpiration(front);
      if (backExp) chain.ensureExpiration(backExp.slice(0, 10));

      const listed = chain.getStrikes(front);
      if (!listed.length) {
        pendingBuild.current = {
          tmpl,
          center,
          width,
          side,
          dir,
          front,
          back: backExp,
        };
        setStructureNotice(
          "Loading OPF chain for this expiration… structure will fill when strikes arrive.",
        );
        return false;
      }

      const prefer =
        (Number.isFinite(center) && center > 0 ? center : null) ??
        (chain.spotStrike != null && chain.spotStrike > 0
          ? chain.spotStrike
          : null) ??
        (chain.spot != null && chain.spot > 0 ? chain.spot : null) ??
        (spotPrice > 0 ? spotPrice : null) ??
        listed[Math.floor(listed.length / 2)];

      const built = buildListedStructure({
        template: tmpl,
        listed,
        preferCenter: prefer,
        preferWidth: width > 0 ? width : DEFAULT_CREATE_WING_WIDTH,
        optionSide: side,
      });

      if (!built) {
        pendingBuild.current = null;
        setUnplaceableDetail(
          "That structure cannot sit on the listed OPF strikes for this expiration. Adjust width, center, or strategy.",
        );
        setAtomicResolving(false);
        return false;
      }
      setUnplaceableDetail(null);

      let legs = built.legs;
      if (tmpl === "calendar" || tmpl === "diagonal") {
        const back =
          (backExp || nextListedBack(front, chain.expirations) || front).slice(
            0,
            10,
          );
        chain.ensureExpiration(back);
        legs = legs.map((leg) => ({
          ...leg,
          expiration: leg.side === "short" ? front : back,
        }));
      }

      legs = priceLegs(legs, front);
      // All templates including iron fly/condor are **debit-native**.
      // Sell flips every leg → short iron (credit), tent-up R/R.
      if (dir === "sell") {
        legs = flipLegs(legs);
      }

      pendingBuild.current = null;
      setStructureNotice(null);
      setUnplaceableDetail(null);
      setCenterStrike(built.body);
      if (built.width > 0) setWingWidth(built.width);
      setPosition((prev) => ({
        ...prev,
        underlying: symbol,
        expiration: front || prev.expiration,
        legs,
        direction: dir,
        net_debit_override: null,
      }));
      setAtomicResolving(false);
      return true;
    },
    [chain, priceLegs, symbol, spotPrice],
  );

  // Reset seed flags when dialog closes; place panel when it opens
  useEffect(() => {
    if (!open) {
      didSeed.current = false;
      pendingBuild.current = null;
      lastPriceRev.current = -1;
      return;
    }
    setDefaultsStore(loadCreateDefaultsStore());
    userPickedExp.current = mode === "edit";
    const w =
      typeof window !== "undefined" ? window.innerWidth : PANEL_W + 96;
    const x = Math.max(
      16,
      Math.min(w - Math.min(PANEL_W, w - 32) - 16, w - PANEL_W - 40),
    );
    setPanelPos({
      x: Number.isFinite(x) ? x : PANEL_DEFAULT_OFFSET.x,
      y: PANEL_DEFAULT_OFFSET.y,
    });
  }, [open, mode]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  /**
   * Seed once per open — **only after OPF can support a real structure**.
   * Create must not mark seeded until legs land on the OPF grid (ATM center
   * listed, priced). Retries on chain.rev / expirations until ready.
   */
  useEffect(() => {
    if (!open || didSeed.current) return;

    if (mode === "edit" && initial?.legs.length) {
      // Live bind: chrome only. Do not snap, reprice, or write the record.
      setDirection(initial.direction || "buy");
      const family = detectFamily(initial.legs);
      const tmpl = (
        Object.entries(TEMPLATE_LABELS) as [TemplateType, string][]
      ).find(([, label]) => label === family)?.[0];
      if (tmpl) setTemplate(tmpl);
      const body = inferStructureCenter(initial.legs);
      if (body > 0) {
        setCenterStrike(body);
        centerPinnedRef.current = true;
      }
      setStructureNotice(null);
      didSeed.current = true;
      return;
    }

    if (mode === "create" && initial?.legs.length) {
      setDraft({
        ...initial,
        legs: initial.legs.map((l) => ({ ...l })),
        net_debit_override: null,
      });
      setDirection(initial.direction || "buy");
      const family = detectFamily(initial.legs);
      const tmpl = (
        Object.entries(TEMPLATE_LABELS) as [TemplateType, string][]
      ).find(([, label]) => label === family)?.[0];
      if (tmpl) setTemplate(tmpl);
      didSeed.current = true;
      setStructureNotice(null);
      return;
    }

    // —— Create: wait for OPF, then user default (or factory butterfly) ——
    if (!chain.expirations.length) {
      setStructureNotice("Loading OPF expirations…");
      return;
    }
    const front =
      pickDefaultFrontExpiration(chain.expirations, marketLive) ||
      chain.expirations[0] ||
      frontDefault;
    chain.ensureExpiration(front);
    const listed = chain.getStrikes(front);
    if (!listed.length) {
      setStructureNotice(
        "Loading OPF strikes for " + front + "… center fills at ATM when ready.",
      );
      return;
    }

    const seed = {
      template: "butterfly" as TemplateType,
      direction: "buy" as TradeDirection,
      optionSide: "call" as OptionRight,
      wingWidth: DEFAULT_CREATE_WING_WIDTH,
      centerOffsetPts: 0,
      contracts: 1,
    };
    const preferSpot =
      (chain.spotStrike != null && chain.spotStrike > 0
        ? chain.spotStrike
        : null) ??
      (chain.spot != null && chain.spot > 0 ? chain.spot : null) ??
      (spotPrice > 0 ? spotPrice : null) ??
      (atmCenter > 0 ? atmCenter : null) ??
      listed[Math.floor(listed.length / 2)];

    const atm =
      snapToListed(preferSpot, listed) ??
      listed[Math.floor(listed.length / 2)];
    // Saved default stores center as offset from ATM so it tracks spot
    const centerIntent = atm + (seed.centerOffsetPts || 0);
    const center =
      snapToListed(centerIntent, listed) ?? atm;
    const width = resolveCreateWingWidth(
      center,
      listed,
      seed.wingWidth > 0 ? seed.wingWidth : DEFAULT_CREATE_WING_WIDTH,
    );
    const side: OptionRight = TEMPLATE_HAS_SIDE[seed.template]
      ? seed.optionSide
      : "call";

    // Multi-exp (calendar / diagonal): front + next listed back
    let back: string | undefined;
    if (seed.template === "calendar" || seed.template === "diagonal") {
      const exps = chain.expirations;
      const idx = exps.indexOf(front);
      back =
        idx >= 0 && idx + 1 < exps.length
          ? exps[idx + 1]
          : nextListedBack(front, exps) || undefined;
      if (back) {
        setBackExpiration(back);
        chain.ensureExpiration(back);
      }
    } else {
      setBackExpiration("");
    }

    setTemplate(seed.template);
    setDirection(seed.direction);
    setOptionSide(side);
    setCenterStrike(center);
    setWingWidth(width > 0 ? width : DEFAULT_CREATE_WING_WIDTH);
    setPosition((prev) => ({
      ...prev,
      underlying: symbol,
      expiration: front,
      direction: seed.direction,
      contracts: Math.max(1, seed.contracts || 1),
      net_debit_override: null,
    }));

    const ok = regenerate(
      seed.template,
      center,
      width,
      side,
      seed.direction,
      front,
      back,
    );
    if (ok) {
      didSeed.current = true;
      setStructureNotice(null);
    } else {
      // pendingBuild queued — leave didSeed false until legs exist
      setStructureNotice(
        "Building structure on OPF chain… position marks follow.",
      );
    }
  }, [
    open,
    mode,
    initial,
    chain,
    chain.rev,
    chain.expirations,
    frontDefault,
    spotPrice,
    regenerate,
    priceLegs,
    atmCenter,
    marketLive,
    symbol,
  ]);

  // Once create seed succeeds (legs on grid), freeze seed even if deps churn
  useEffect(() => {
    if (!open || mode !== "create") return;
    if (didSeed.current) return;
    if (position.legs.length > 0 && frontStrikes.length > 0) {
      didSeed.current = true;
      setStructureNotice(null);
    }
  }, [open, mode, position.legs.length, frontStrikes.length]);

  /**
   * When OPF ladder arrives: apply pending structure build, or reprice mids.
   * Never invent strikes — only listed grid from the dual-side chain.
   */
  useEffect(() => {
    if (!open) return;
    const rev = chain.rev ?? 0;
    if (rev === lastPriceRev.current && !pendingBuild.current) {
      // Still allow mid refresh when legs exist
      if (position.legs.length === 0) return;
    }
    lastPriceRev.current = rev;

    // Pending strategy/create build waiting for OPF strikes
    if (pendingBuild.current) {
      const p = pendingBuild.current;
      let front = p.front;
      let listed = chain.getStrikes(front);
      // Front may have been a calendar guess before OPF exp list arrived
      if (!listed.length && chain.expirations.length) {
        front =
          pickDefaultFrontExpiration(chain.expirations, marketLive) ||
          chain.expirations[0];
        listed = chain.getStrikes(front);
        if (listed.length) {
          pendingBuild.current = { ...p, front };
        } else {
          chain.ensureExpiration(front);
        }
      }
      if (listed.length) {
        regenerate(
          p.tmpl,
          p.center > 0 ? p.center : atmCenter || spotPrice,
          p.width,
          p.side,
          p.dir,
          front,
          p.back,
        );
      }
      return;
    }

    // Empty legs: rebuild on real chain only.
    // Create seed owns first materialization (correct Lab direction e.g. sell
    // iron). Do not race with state direction still stuck on default "buy".
    if (position.legs.length === 0) {
      if (mode === "create" && !didSeed.current) {
        return;
      }
      const front =
        pickDefaultFrontExpiration(chain.expirations, marketLive) ||
        position.expiration ||
        frontDefault ||
        etYmd();
      if (chain.getStrikes(front).length) {
        regenerate(
          template,
          centerStrike || atmCenter || spotPrice,
          wingWidth || DEFAULT_CREATE_WING_WIDTH,
          optionSide,
          direction,
          front,
          backExpiration,
        );
      } else {
        chain.ensureExpiration(front);
        setStructureNotice(
          "Loading OPF chain for this expiration…",
        );
      }
      return;
    }

    // Edit is live-bound: never snap or reprice on chain arrival (AT-PC-04).
    if (mode === "edit") return;

    // Soft reprice + snap any drift onto listed (create seed race)
    setPosition((prev) => {
      if (!prev.legs.length) return prev;
      const listed = chain.getStrikes(prev.expiration);
      let legs = prev.legs;
      if (listed.length) {
        legs = legs.map((l) => {
          const s = snapToListed(l.strike, listed);
          return s != null && s !== l.strike ? { ...l, strike: s } : l;
        });
      }
      const next = priceLegs(legs, prev.expiration);
      const same = next.every(
        (l, i) =>
          l.strike === prev.legs[i]?.strike &&
          l.entry_price === prev.legs[i]?.entry_price &&
          l.volatility === prev.legs[i]?.volatility,
      );
      return same ? prev : { ...prev, legs: next };
    });
  }, [
    open,
    chain.rev,
    chain,
    position.legs.length,
    position.expiration,
    mode,
    template,
    centerStrike,
    wingWidth,
    optionSide,
    direction,
    backExpiration,
    atmCenter,
    spotPrice,
    marketLive,
    frontDefault,
    priceLegs,
    regenerate,
  ]);

  const eco = useMemo(
    () =>
      packageEconomics(position, (exp, strike, type) => {
        const c = chain.getContract(exp, strike, type);
        if (!c) return undefined;
        return { mid: c.mid, bid: c.bid, ask: c.ask };
      }),
    [position, chain, chain.rev],
  );

  /** Pre-open held/theo marks on any leg → OPF-style disclaimer (not live NBBO). */
  const preOpenPackage = useMemo(() => {
    if (!position.legs.length) return false;
    let anyHeld = false;
    let anyLive = false;
    for (const leg of position.legs) {
      const exp = (leg.expiration || position.expiration).slice(0, 10);
      const c = chain.getContract(exp, leg.strike, leg.type);
      if (!c?.mid) continue;
      const src = c.mid_source;
      if (src === "nbbo") anyLive = true;
      else if (src === "last_trade" || src === "day_close") anyHeld = true;
      else if (!marketLive) anyHeld = true; // untagged mid outside RTH
    }
    return anyHeld && !anyLive;
  }, [position, chain, chain.rev, marketLive]);

  const packageDisclaimer = preOpenPackage
    ? "Theoretical position until the market opens — last-session held marks (last trade / prior close), not live NBBO."
    : null;

  /**
   * Atomic plane state (card-parity): ready | UPDATING | OPF UNAVAILABLE | CHECK STRUCTURE.
   * Never a blank unusable dialog.
   */
  const planeState: BuilderPlaneState = useMemo(
    () =>
      resolveBuilderPlaneState({
        open,
        hasListedStrikes: frontStrikes.length > 0,
        hasLegs: position.legs.length > 0,
        packageComplete: eco.complete,
        chainError: chain.error,
        chainLoading: !!chain.loading || atomicResolving,
        resolving: atomicResolving || !!pendingBuild.current,
        unplaceable: unplaceableDetail != null,
        unplaceableDetail,
        offMarket: !planePrinting,
      }),
    [
      open,
      frontStrikes.length,
      position.legs.length,
      eco.complete,
      chain.error,
      chain.loading,
      atomicResolving,
      unplaceableDetail,
      chain.rev,
      marketLive,
      planePrinting,
    ],
  );

  // Definition key — any shape change starts a new atomic unit
  const defKey = useMemo(
    () =>
      builderDefinitionKey({
        mode,
        symbol,
        template,
        direction,
        optionSide,
        center: centerStrike || nearestCenter || 0,
        width: wingWidth || 0,
        expiration: position.expiration || "",
        backExpiration,
        spot: effectiveSpot,
        contracts: position.contracts,
      }),
    [
      mode,
      symbol,
      template,
      direction,
      optionSide,
      centerStrike,
      nearestCenter,
      wingWidth,
      position.expiration,
      position.contracts,
      backExpiration,
      effectiveSpot,
    ],
  );

  useEffect(() => {
    if (!open) return;
    if (settledDefRef.current === defKey && planeState.kind === "ready") return;
    if (planeState.kind === "ready") {
      settledDefRef.current = defKey;
      setAtomicResolving(false);
      setStructureNotice(null);
    } else if (planeState.kind === "updating") {
      setAtomicResolving(true);
    }
  }, [open, defKey, planeState.kind]);

  /** Package bid/ask width for **one** position (unit ratios). */
  const packageSpread = useMemo(() => {
    if (!eco.legs.length) return null;
    const scale = Math.max(1, eco.packages / Math.max(1, position.contracts || 1));
    let width = 0;
    let ok = 0;
    for (const leg of eco.legs) {
      if (
        leg.bid != null &&
        leg.ask != null &&
        Number.isFinite(leg.bid) &&
        Number.isFinite(leg.ask) &&
        leg.ask >= leg.bid
      ) {
        width += (Math.abs(leg.quantity) / scale) * (leg.ask - leg.bid);
        ok += 1;
      }
    }
    if (ok === 0) return null;
    return width;
  }, [eco.legs, eco.packages, position.contracts]);

  const costLabel = eco.side ?? "—";
  const displayCost = eco.absMid ?? 0;
  const lockActive = mode === "edit" && cardLock?.mode === "locked";
  const lockedMagnitude =
    lockActive && cardLock && cardLock.mode === "locked"
      ? Math.abs(cardLock.packageDebitPerShare)
      : definedDebit != null && Number.isFinite(definedDebit)
        ? Math.abs(definedDebit)
        : null;
  const overrideActive =
    mode === "edit" ? lockActive : position.net_debit_override != null;
  const packageSessionLabel = marketLive
    ? overrideActive
      ? "Limit"
      : "Live · unlocked"
    : overrideActive
      ? "Limit"
      : "Close · held";

  const tosScript = useMemo(() => {
    if (!position.legs.length) return "";
    const pkgs = Math.max(1, position.contracts || 1);
    return generateTosScript({
      symbol: position.underlying,
      legs: position.legs.map((leg) => ({
        strike: leg.strike,
        expiration: leg.expiration || position.expiration,
        right: leg.type,
        quantity:
          (leg.side === "long" ? 1 : -1) * Math.abs(leg.quantity) * pkgs,
      })),
      costBasis:
        overrideActive && position.net_debit_override != null
          ? Math.abs(position.net_debit_override)
          : displayCost > 0
            ? displayCost
            : null,
    });
  }, [position, overrideActive, displayCost]);

  const handleTemplate = (tmpl: TemplateType) => {
    setTemplate(tmpl);
    const front =
      position.expiration ||
      pickDefaultFrontExpiration(chain.expirations, marketLive) ||
      frontDefault ||
      etYmd();
    const listed = chain.getStrikes(front);

    // When Lab defaults are active, strategy change applies that strategy’s
    // Options Lab recipe (Wave 1: butterfly · vertical · condor · calendar).
    const useLab = isLabDefaultsActive();
    const lab = useLab ? labDefaultForStrategy(tmpl, symbol) : null;

    let dir: TradeDirection = direction;
    let side: OptionRight = TEMPLATE_HAS_SIDE[tmpl] ? optionSide : "call";
    let width = wingWidth > 0 ? wingWidth : DEFAULT_CREATE_WING_WIDTH;
    let center = centerStrike || atmCenter || spotPrice;

    if (lab) {
      dir = lab.direction;
      side = TEMPLATE_HAS_SIDE[tmpl] ? lab.optionSide : "call";
      setDirection(dir);
      setOptionSide(side);
      const atm =
        atmCenter > 0
          ? atmCenter
          : snapToListed(
              chain.spotStrike ?? chain.spot ?? spotPrice,
              listed,
            ) ?? center;
      center =
        snapToListed(atm + (lab.centerOffsetPts || 0), listed) ?? atm;
      setCenterStrike(center);
      if (tmpl === "diagonal") {
        width =
          diagonalWidthFromLadder(center, listed, 2) ??
          defaultDiagonalWidth(symbol);
      } else {
        width = resolveCreateWingWidth(
          center,
          listed,
          lab.wingWidth > 0 ? lab.wingWidth : DEFAULT_CREATE_WING_WIDTH,
        );
      }
      setWingWidth(width);
    } else if (tmpl === "diagonal") {
      width =
        diagonalWidthFromLadder(
          centerStrike || atmCenter,
          listed.length ? listed : frontStrikes,
          2,
        ) ?? defaultDiagonalWidth(symbol);
      setWingWidth(width);
    }

    let back = backExpiration;
    if (tmpl === "calendar" || tmpl === "diagonal") {
      const exps = chain.expirations;
      const idx = exps.indexOf(front);
      back =
        idx >= 0 && idx + 1 < exps.length
          ? exps[idx + 1]
          : nextListedBack(front, exps) || "";
      setBackExpiration(back);
      if (back) chain.ensureExpiration(back);
    } else {
      setBackExpiration("");
      back = "";
    }

    regenerate(tmpl, center, width, side, dir, front, back || undefined);
  };

  const handleDirection = (dir: TradeDirection) => {
    if (dir === direction) return;
    setDirection(dir);
    // Always rebuild from debit-native template + direction.
    // Do not flipLegs in place — that drifts if legs were already short/long
    // from a prior seed, race, or edit (Buy/Sell ends up inverted).
    regenerate(
      template,
      centerStrike || atmCenter || spotPrice,
      wingWidth || DEFAULT_CREATE_WING_WIDTH,
      optionSide,
      dir,
      position.expiration || frontDefault,
      backExpiration,
    );
  };

  const rebuildShape = (
    center: number,
    width: number,
    side: OptionRight,
    front: string,
    back?: string,
  ) => {
    regenerate(
      template,
      center,
      width,
      side,
      direction,
      front,
      back,
    );
  };

  const handleRight = (side: OptionRight) => {
    if (side === optionSide) return;
    setOptionSide(side);
    rebuildShape(
      centerStrike || atmCenter || spotPrice,
      wingWidth || DEFAULT_CREATE_WING_WIDTH,
      side,
      position.expiration || frontDefault,
      backExpiration,
    );
  };

  const updateLeg = (index: number, patch: Partial<LegInput>) => {
    setPosition((prev) => {
      const legs = prev.legs.map((l, i) => {
        if (i !== index) return l;
        const next = { ...l, ...patch };
        if (patch.strike != null) {
          const exp = (next.expiration || prev.expiration).slice(0, 10);
          const listed = chain.getStrikes(exp);
          // OPF truth: only accept listed strikes; refuse free invent
          if (!listed.length) {
            setStructureNotice(
              "OPF chain not loaded for this expiration — cannot change strike yet.",
            );
            return l;
          }
          if (!listed.some((s) => s === next.strike)) return l;
        }
        if (patch.strike != null || patch.type != null) {
          const exp = (next.expiration || prev.expiration).slice(0, 10);
          const c = chain.getContract(exp, next.strike, next.type);
          if (c) {
            next.entry_price = c.mid ?? next.entry_price;
            next.volatility = c.iv ?? next.volatility;
          } else {
            next.entry_price = 0;
          }
        }
        return next;
      });
      return { ...prev, legs, net_debit_override: null };
    });
  };

  const addLeg = () => {
    const exp = (position.expiration || "").slice(0, 10);
    const listed = chain.getStrikes(exp);
    if (!listed.length) {
      setStructureNotice(
        "OPF chain not loaded — cannot add a leg until listed strikes arrive.",
      );
      chain.ensureExpiration(exp);
      return;
    }
    const prefer = centerStrike || atmCenter || spotPrice;
    const strike =
      snapToListed(prefer, listed) ?? listed[Math.floor(listed.length / 2)];
    setPosition((prev) => ({
      ...prev,
      legs: [
        ...prev.legs,
        {
          strike,
          type: "call",
          quantity: 1,
          side: "long",
          entry_price: 0,
        },
      ],
      net_debit_override: null,
    }));
  };

  const removeLeg = (i: number) => {
    setPosition((prev) => ({
      ...prev,
      legs: prev.legs.filter((_, j) => j !== i),
      net_debit_override: null,
    }));
  };

  const onPanelPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // Drag from title bar only — ignore interactive controls
    const t = e.target as HTMLElement;
    if (t.closest("button, input, select, textarea, a, label")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: panelPos.x,
      origY: panelPos.y,
    };
  };

  const onPanelPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    const maxX =
      typeof window !== "undefined"
        ? Math.max(8, window.innerWidth - 120)
        : 2000;
    const maxY =
      typeof window !== "undefined"
        ? Math.max(8, window.innerHeight - 48)
        : 1200;
    setPanelPos({
      x: Math.min(maxX, Math.max(8, d.origX + dx)),
      y: Math.min(maxY, Math.max(8, d.origY + dy)),
    });
  };

  const onPanelPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const handleSave = useCallback(() => {
    // Save only OPF-held chain structure — never invent strikes
    let legs = position.legs;
    let exp = position.expiration;
    if (!legs.length) {
      const front =
        pickDefaultFrontExpiration(chain.expirations, marketLive) ||
        exp ||
        frontDefault ||
        etYmd();
      const listed = chain.getStrikes(front);
      if (!listed.length) {
        setStructureNotice(
          "OPF chain not loaded for this expiration yet — wait a moment, then Analyze.",
        );
        chain.ensureExpiration(front);
        regenerate(
          template,
          centerStrike || atmCenter || spotPrice,
          wingWidth || DEFAULT_CREATE_WING_WIDTH,
          optionSide,
          direction,
          front,
          backExpiration,
        );
        return;
      }
      const built = buildListedStructure({
        template,
        listed,
        preferCenter: centerStrike || atmCenter || spotPrice || listed[0],
        preferWidth: wingWidth || DEFAULT_CREATE_WING_WIDTH,
        optionSide,
      });
      if (!built) {
        setStructureNotice(
          "Cannot place that strategy on the OPF chain. Choose another strategy or expiration.",
        );
        return;
      }
      exp = front;
      legs = priceLegs(built.legs, front);
      // Debit-native templates: sell flips to short iron / short fly / etc.
      if (direction === "sell") {
        legs = flipLegs(legs);
      }
    } else {
      const listed = chain.getStrikes(exp);
      if (listed.length) {
        legs = legs.map((l) => {
          const s = snapToListed(l.strike, listed);
          return s != null ? { ...l, strike: s } : l;
        });
      }
    }
    const payload = {
      ...position,
      expiration: exp,
      legs,
      direction,
      net_debit_override:
        position.net_debit_override != null &&
        Number.isFinite(position.net_debit_override)
          ? position.net_debit_override
          : null,
    };
    onSave(
      payload,
      buildLabel(payload.underlying, payload.legs, payload.expiration),
      buildNotation(payload.legs),
    );
  }, [
    position,
    chain,
    marketLive,
    frontDefault,
    template,
    centerStrike,
    atmCenter,
    spotPrice,
    wingWidth,
    optionSide,
    direction,
    backExpiration,
    priceLegs,
    regenerate,
    onSave,
  ]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;
      if (t.closest("[data-value-field]")) return;
      e.preventDefault();
      handleSave();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, handleSave]);

  const timeSpreadBackChoices = useMemo(() => {
    const after = chain.expirations.filter((e) => e > position.expiration);
    if (after.length > 0) return after;
    if (chain.expirations.length) return chain.expirations;
    return [position.expiration || frontDefault || etYmd()];
  }, [chain.expirations, position.expiration, frontDefault]);

  const pkgPos = Math.max(1, posAndRatio(position.legs).pos);
  const debitShown =
    mode === "edit" && lockActive && lockedMagnitude != null
      ? lockedMagnitude
      : overrideActive && position.net_debit_override != null
        ? Math.abs(position.net_debit_override)
        : eco.absMid;
  const dte = calendarDteOf(position.expiration);
  const entryMs = resolveEntryAt({
    entryAt: entryAt ?? createEntryAt,
    createdAt: Date.now(),
  });
  const entryWall = nyWall(entryMs);
  const entryHour12 = entryWall.hour % 12 || 12;
  const entryAmpm = entryWall.hour >= 12 ? "PM" : "AM";
  const commitEntry = (hour24: number, minute: number) => {
    const next = applyEtHm(
      entryMs,
      `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    );
    if (onSetEntryAt) onSetEntryAt(next);
    else setCreateEntryAt(next);
  };
  const derivedName = `${direction === "buy" ? "Buy" : "Sell"} ${TEMPLATE_LABELS[template]}`;
  const stepDebit = (dir: "up" | "down") => {
    const mag = debitShown != null && debitShown > 0 ? debitShown : 0.05;
    let next: number;
    try {
      next = stepCardPrice(position.underlying || symbol, mag, dir);
    } catch {
      return;
    }
    if (mode === "edit") onLockLimit?.(next);
    else {
      setPosition((p) => ({ ...p, net_debit_override: next }));
    }
  };
  const scalePos = (n: number) => {
    const next = Math.max(1, Math.round(n));
    setPosition((p) => ({
      ...p,
      contracts: 1,
      legs: scaleLegPos(p.legs, next),
    }));
  };

  if (!open) return null;

  const orderedLegs = [...position.legs]
    .map((leg, origIdx) => ({ leg, origIdx }))
    .sort((a, b) => {
      if (a.leg.type !== b.leg.type) return a.leg.type === "call" ? -1 : 1;
      return a.leg.strike - b.leg.strike;
    });

  const frontExp = (position.expiration || frontDefault || "").slice(0, 10);

  return (
    <div
      className={
        "builder-steppers fixed z-50 flex max-h-[min(92vh,860px)] w-[min(820px,calc(100vw-1.5rem))] " +
        "flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-separator)] " +
        "bg-[var(--color-surface)] text-[var(--color-label)] shadow-[var(--elevation-3)]"
      }
      style={{ left: panelPos.x, top: panelPos.y, width: PANEL_W }}
      role="dialog"
      aria-modal="false"
      aria-label={mode === "edit" ? "Edit Position" : "Create Position"}
      data-testid="position-builder"
      data-panel-width="820"
      data-content-inset="20"
    >
      <div
        className="relative cursor-grab border-b border-[var(--color-separator)] px-5 pt-5 pb-3 text-center active:cursor-grabbing"
        onPointerDown={onPanelPointerDown}
        onPointerMove={onPanelPointerMove}
        onPointerUp={onPanelPointerUp}
        onPointerCancel={onPanelPointerUp}
        data-testid="position-builder-drag-handle"
        title="Drag to move"
      >
        <h3 className="text-[length:var(--text-title-3)] font-semibold text-[var(--color-label)]">
          {mode === "edit" ? "Edit Position" : "Create Position"}
        </h3>
      </div>

      {planeState.kind !== "ready" ? (
        <div
          className="border-b border-[var(--color-separator)] px-5 py-2 text-[var(--color-label-secondary)]"
          role="status"
          data-testid="builder-structure-notice"
          data-plane-kind={planeState.kind}
        >
          <div className="text-[length:var(--text-body)] text-[var(--color-label)]">
            {planeState.title}
          </div>
          <p className="text-[length:var(--text-caption)] text-[var(--color-label-secondary)]">
            {structureNotice || planeState.detail}
          </p>
        </div>
      ) : null}

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        <section className="grid grid-cols-2 gap-5" aria-label="Symbol and Strategy">
          <div>
            <h4 className={sectionLabel}>Symbol</h4>
            <CardMenuField surface="dialog">
              <select
                className={dlgField}
                value={position.underlying || symbol}
                aria-label="Symbol"
                data-testid="builder-symbol"
                onChange={() => {
                  /* session symbol is host-owned — DLG3 */
                }}
              >
                <option value={position.underlying || symbol}>
                  {position.underlying || symbol}
                </option>
              </select>
            </CardMenuField>
          </div>
          <div>
            <h4 className={sectionLabel}>Strategy</h4>
            <CardMenuField surface="dialog">
              <select
                className={dlgField}
                value={template}
                data-testid="builder-template"
                aria-label="Strategy"
                onChange={(e) => handleTemplate(e.target.value as TemplateType)}
              >
                {STRATEGY_GROUPS.map((g) => {
                  const items = offeredTemplates(
                    chain.expirations.length,
                    g.items,
                  );
                  if (!items.length) return null;
                  return (
                    <optgroup key={g.label} label={g.label}>
                      {items.map((t) => (
                        <option key={t} value={t}>
                          {TEMPLATE_LABELS[t]}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </CardMenuField>
          </div>
        </section>

        <div className="flex items-center gap-3" data-testid="builder-direction-row">
          <svg
            viewBox="0 0 60 24"
            width={72}
            height={28}
            className="shrink-0"
            style={
              direction === "sell" ? { transform: "scaleY(-1)" } : undefined
            }
            aria-hidden
            data-testid="builder-payoff"
          >
            <path
              d={STRATEGY_DIAGRAMS[template]}
              fill="none"
              stroke="var(--color-success)"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div
            role="radiogroup"
            aria-label="Buy or Sell"
            data-testid="builder-side"
            className="inline-flex min-h-[var(--hit-min)] rounded-[var(--radius-md)] bg-[var(--color-fill)] p-1"
          >
            <button
              type="button"
              role="radio"
              aria-checked={direction === "buy"}
              aria-label="Buy"
              className={
                "min-h-[var(--hit-min)] rounded-[var(--radius-sm)] px-4 text-[length:var(--text-subheadline)] font-medium " +
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)] " +
                (direction === "buy"
                  ? "bg-[var(--color-success)] text-[var(--color-surface)]"
                  : "text-[var(--color-label-secondary)]")
              }
              onClick={() => handleDirection("buy")}
            >
              Buy
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={direction === "sell"}
              aria-label="Sell"
              className={
                "min-h-[var(--hit-min)] rounded-[var(--radius-sm)] px-4 text-[length:var(--text-subheadline)] font-medium " +
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)] " +
                (direction === "sell"
                  ? "bg-[var(--color-surface)] text-[var(--color-label)] shadow-[var(--elevation-1)]"
                  : "text-[var(--color-label-secondary)]")
              }
              onClick={() => handleDirection("sell")}
            >
              Sell
            </button>
          </div>
          {TEMPLATE_HAS_SIDE[template] ? (
            <div className="inline-flex min-w-[10rem]">
              <SegmentedControl
                ariaLabel="Call or Put"
                value={optionSide}
                onChange={handleRight}
                options={[
                  { id: "call", label: "Call" },
                  { id: "put", label: "Put" },
                ]}
              />
            </div>
          ) : null}
          <span className="text-[length:var(--text-body)] text-[var(--color-label)]">
            {derivedName}
          </span>
        </div>

        {/* §5.3.1 — in the code, not in the prototype. Held; no section heading. */}
        <div className="space-y-3" data-testid="builder-held-shape">
          <FormRow label="Centre">
            <CardMenuField surface="dialog">
              <select
                className={dlgField}
                aria-label="Centre"
                data-testid="builder-center"
                data-value-field="1"
                value={
                  frontStrikes.some((s) => s === (centerStrike || atmCenter))
                    ? String(centerStrike || atmCenter)
                    : ""
                }
                onChange={(e) => {
                  const s = parseFloat(e.target.value);
                  if (!Number.isFinite(s)) return;
                  centerPinnedRef.current = true;
                  setCenterStrike(s);
                  rebuildShape(
                    s,
                    wingWidth || DEFAULT_CREATE_WING_WIDTH,
                    optionSide,
                    frontExp || frontDefault,
                    backExpiration,
                  );
                }}
              >
                {frontStrikes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </CardMenuField>
          </FormRow>
          <FormRow label="Width">
            <CardMenuField surface="dialog">
              <select
                className={dlgField}
                aria-label="Width"
                data-testid="builder-width"
                data-value-field="1"
                value={wingChoices.includes(wingWidth) ? String(wingWidth) : ""}
                onChange={(e) => {
                  const w = parseFloat(e.target.value);
                  if (!Number.isFinite(w)) return;
                  setWingWidth(w);
                  rebuildShape(
                    centerStrike || atmCenter || spotPrice,
                    w,
                    optionSide,
                    frontExp || frontDefault,
                    backExpiration,
                  );
                }}
              >
                {wingChoices.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </CardMenuField>
          </FormRow>
          <FormRow label="Expiration">
            <CardMenuField surface="dialog">
              <select
                className={dlgField}
                aria-label="Expiration"
                data-testid="builder-expiration"
                value={boundSelectValue(frontExp, chain.expirations).value}
                data-invalid={
                  boundSelectValue(frontExp, chain.expirations).invalid
                    ? "1"
                    : "0"
                }
                onChange={(e) => {
                  const nextExp = e.target.value;
                  if (!nextExp) return;
                  chain.ensureExpiration(nextExp);
                  userPickedExp.current = true;
                  setPosition((p) => ({ ...p, expiration: nextExp }));
                  rebuildShape(
                    centerStrike || atmCenter || spotPrice,
                    wingWidth || DEFAULT_CREATE_WING_WIDTH,
                    optionSide,
                    nextExp,
                    backExpiration,
                  );
                }}
              >
                {boundSelectValue(frontExp, chain.expirations).invalid ? (
                  <option value="">{frontExp || "—"}</option>
                ) : null}
                {chain.expirations.map((e) => (
                  <option key={e} value={e}>
                    {e.slice(5)}
                  </option>
                ))}
              </select>
            </CardMenuField>
          </FormRow>
        </div>

        <section aria-label="Legs">
          <h4 className={sectionLabel}>Legs</h4>
          <div
            data-testid="builder-legs-surface"
            className="rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface-secondary)] p-4"
          >
          <table className="w-full table-fixed text-left text-[length:var(--text-body)] tabular-nums">
            <thead>
              <tr className="uppercase tracking-wide text-[length:var(--text-caption)] text-[var(--color-label-tertiary)]">
                <th className="w-12 py-1 font-normal" />
                <th className="py-1 font-normal">Qty</th>
                <th className="py-1 font-normal">Strike</th>
                <th className="py-1 font-normal">Type</th>
                <th className="py-1 font-normal">Expiration</th>
                <th className="py-1 text-right font-normal">Debit</th>
                <th className="py-1 text-right font-normal">Pos</th>
                <th className="w-6 py-1 font-normal" />
              </tr>
            </thead>
            <tbody>
              {orderedLegs.map(({ leg, origIdx: i }, row) => {
                const exp = (leg.expiration || position.expiration).slice(0, 10);
                const legStrikes = chain.getStrikes(exp);
                const signed = signedActualQty(leg);
                const isTop = row === 0;
                return (
                  <tr key={`${i}-${leg.strike}-${leg.type}`}>
                    <td className="py-1 pr-1 text-[var(--color-label-tertiary)]">
                      Leg {row + 1}:
                    </td>
                    <td className="py-1">
                      <div className="flex items-center justify-end gap-1">
                        <span
                          className="w-6 text-right font-mono tabular-nums"
                          data-testid={`builder-leg-qty-${i}`}
                          data-value-field="1"
                        >
                          {signed}
                        </span>
                        <TosStepper surface="dialog"
                          testId={`builder-leg-qty-step-${i}`}
                          ariaLabel="Leg quantity"
                          onUp={() =>
                            updateLeg(i, {
                              quantity: Math.abs(leg.quantity) + 1,
                            })
                          }
                          onDown={() =>
                            updateLeg(i, {
                              quantity: Math.max(1, Math.abs(leg.quantity) - 1),
                            })
                          }
                        />
                      </div>
                    </td>
                    <td className="py-1">
                      <div className="flex items-center justify-end gap-1">
                        {legStrikes.length ? (
                          <CardMenuField surface="dialog" fit="min">
                            <select
                              className={
                                dlgField +
                                " !w-auto max-w-[6.5rem] text-right font-mono"
                              }
                              value={String(leg.strike)}
                              data-testid={`builder-leg-strike-${i}`}
                              data-value-field="1"
                              aria-label="Strike"
                              onChange={(e) => {
                                const s = parseFloat(e.target.value);
                                if (!Number.isFinite(s)) return;
                                updateLeg(i, { strike: s });
                              }}
                            >
                              {legStrikes.some((s) => s === leg.strike) ? null : (
                                <option value={leg.strike}>{leg.strike}</option>
                              )}
                              {legStrikes.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </CardMenuField>
                        ) : (
                          <span className="font-mono">{leg.strike}</span>
                        )}
                        <TosStepper surface="dialog"
                          testId={`builder-leg-strike-step-${i}`}
                          ariaLabel="Strike"
                          disabled={!legStrikes.length}
                          onUp={() => {
                            const next = legStrikes
                              .filter((s) => s > leg.strike)
                              .sort((a, b) => a - b)[0];
                            if (next != null) updateLeg(i, { strike: next });
                          }}
                          onDown={() => {
                            const next = legStrikes
                              .filter((s) => s < leg.strike)
                              .sort((a, b) => b - a)[0];
                            if (next != null) updateLeg(i, { strike: next });
                          }}
                        />
                      </div>
                    </td>
                    <td className="py-1">
                      <CardMenuField surface="dialog" fit="min">
                        <button
                          type="button"
                          className={dlgField + " !w-auto px-2"}
                          data-testid={`builder-leg-type-${i}`}
                          aria-label="Leg type"
                          onClick={() =>
                            updateLeg(i, {
                              type: leg.type === "call" ? "put" : "call",
                            })
                          }
                        >
                          {leg.type === "call" ? "Call" : "Put"}
                        </button>
                      </CardMenuField>
                    </td>
                    <td className="py-1" onClick={(e) => e.stopPropagation()}>
                      {hasExps ? (
                        <CardMenuField surface="dialog">
                          <select
                            className={dlgField}
                            value={boundSelectValue(exp, chain.expirations).value}
                            data-invalid={
                              boundSelectValue(exp, chain.expirations).invalid
                                ? "1"
                                : "0"
                            }
                            data-testid={`builder-leg-exp-${i}`}
                            onChange={(e) => {
                              const nextExp = e.target.value;
                              if (!nextExp) return;
                              chain.ensureExpiration(nextExp);
                              updateLeg(i, { expiration: nextExp });
                            }}
                          >
                            {boundSelectValue(exp, chain.expirations).invalid ? (
                              <option value="">{exp || "—"}</option>
                            ) : null}
                            {chain.expirations.map((e) => (
                              <option key={e} value={e}>
                                {e.slice(5)}
                              </option>
                            ))}
                          </select>
                        </CardMenuField>
                      ) : (
                        <span className="font-mono text-[var(--color-label-secondary)]">
                          {exp.slice(5)}
                        </span>
                      )}
                    </td>
                    <td className="py-1 text-right font-mono">
                      {isTop ? (
                        <div className="flex items-center justify-end gap-1">
                          <span
                            className="tabular-nums"
                            data-testid="builder-live-package-price"
                            data-value-field="1"
                          >
                            {debitShown != null && Number.isFinite(debitShown)
                              ? debitShown.toFixed(2)
                              : "—"}
                          </span>
                          <TosStepper surface="dialog"
                            testId="builder-debit-step"
                            ariaLabel="Package debit"
                            disabled={debitShown == null}
                            onUp={() => stepDebit("up")}
                            onDown={() => stepDebit("down")}
                          />
                          <TosPadlock surface="dialog"
                            locked={!!overrideActive}
                            testId="builder-padlock"
                            onToggle={() => {
                              if (mode === "edit") {
                                if (overrideActive) onUnlock?.();
                                else onLockNatural?.();
                                return;
                              }
                              if (overrideActive) {
                                setPosition((p) => ({
                                  ...p,
                                  net_debit_override: null,
                                }));
                              }
                            }}
                          />
                        </div>
                      ) : null}
                    </td>
                    <td className="py-1 text-right font-mono">
                      {isTop ? (
                        <div className="flex items-center justify-end gap-1">
                          <span
                            className="tabular-nums"
                            data-testid="builder-pos"
                            data-value-field="1"
                          >
                            {pkgPos}
                          </span>
                          <TosQtyControl surface="dialog"
                            testId="builder-pos-step"
                            onUp={() => scalePos(pkgPos + 1)}
                            onDown={() => scalePos(Math.max(1, pkgPos - 1))}
                            onPick={(n) => scalePos(n)}
                          />
                        </div>
                      ) : null}
                    </td>
                    <td className="py-1">
                      <button
                        type="button"
                        className="px-1 text-[var(--color-label-tertiary)] hover:text-[var(--color-label)]"
                        disabled={position.legs.length <= 1}
                        onClick={() => removeLeg(i)}
                        aria-label="Remove leg"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
          <button
            type="button"
            className="mt-2 min-h-[var(--hit-min)] text-[length:var(--text-body)] text-[var(--color-tint)] hover:text-[var(--color-tint-emphasis)]"
            onClick={addLeg}
            aria-label="Add leg"
          >
            + Add Leg
          </button>
        </section>

        <section
          className="grid grid-cols-[1fr_auto] items-start gap-5"
          aria-label="ToS script"
        >
          <div>
            <h4 className={sectionLabel}>Tos Script</h4>
            <button
              type="button"
              className={
                "block w-full rounded-[var(--radius-sm)] px-2 py-2 text-left font-mono " +
                "text-[length:var(--text-footnote)] leading-relaxed " +
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]"
              }
              style={{
                background: "var(--color-code-surface)",
                color: "var(--color-success)",
              }}
              data-code-surface="1"
              data-testid="builder-tos-script"
              aria-label="ToS script"
              onClick={() => {
                if (!tosScript) return;
                rememberTosScript(tosScript);
                void navigator.clipboard.writeText(tosScript).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1200);
                });
              }}
            >
              {tosScript || "—"}
              <span className="mt-2 block text-[length:var(--text-caption)] text-[var(--color-label-secondary)]">
                {copied ? "copied" : "click to copy"}
              </span>
            </button>
          </div>
          <div className="flex flex-col items-stretch gap-2">
            {mode === "create" ? (
              <button
                type="button"
                className="min-h-[var(--hit-min)] rounded-[var(--radius-sm)] bg-[var(--color-tint)] px-4 text-[length:var(--text-body)] font-medium text-[var(--color-on-tint)]"
                data-testid="builder-analyze"
                onClick={handleSave}
              >
                Analyze
              </button>
            ) : (
              <button
                type="button"
                className="min-h-[var(--hit-min)] rounded-[var(--radius-sm)] bg-[var(--color-tint)] px-4 text-[length:var(--text-body)] font-medium text-[var(--color-on-tint)]"
                data-testid="builder-update"
                onClick={handleSave}
              >
                Update
              </button>
            )}
            <button
              type="button"
              className="min-h-[var(--hit-min)] px-4 text-[length:var(--text-body)] text-[var(--color-label-secondary)] hover:text-[var(--color-label)]"
              data-testid="position-builder-cancel"
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
