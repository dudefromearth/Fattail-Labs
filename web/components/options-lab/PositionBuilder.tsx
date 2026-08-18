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
} from "react";
import StrikeSelect from "@/components/options-lab/StrikeSelect";
import Button from "@/components/ui/Button";
import { IconLock, IconUnlock } from "@/components/ui/icons";
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
  formatPackageSide,
  packageEconomics,
} from "@/lib/options-lab/packageEconomics";
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

/** HIG form control — inset field on grouped surface */
const field =
  "w-full min-h-11 rounded-[var(--radius-md)] border-0 bg-transparent " +
  "px-3 py-2.5 text-[22.5px] text-[var(--color-label)] outline-none " +
  "focus-visible:bg-[var(--color-fill)]/60";
const fieldInset =
  "w-full min-h-11 rounded-[var(--radius-md)] border border-[var(--color-separator)] " +
  "bg-[var(--color-surface)] px-3 py-2 text-[22.5px] text-[var(--color-label)] " +
  "outline-none focus-visible:outline focus-visible:outline-2 " +
  "focus-visible:outline-offset-1 focus-visible:outline-[var(--color-tint)]";
const sectionLabel =
  "px-1 pb-1.5 text-[19.5px] font-semibold tracking-tight text-[var(--color-label-secondary)]";
const rowLabel =
  "shrink-0 w-[10rem] text-[22.5px] text-[var(--color-label)]";
const group =
  "overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-separator)] " +
  "bg-[var(--color-surface)] shadow-[var(--elevation-1)]";
const groupRow =
  "flex items-center gap-3 border-b border-[var(--color-separator)] last:border-b-0 " +
  "bg-[var(--color-surface)] px-3 min-h-12";
const footerBar =
  "flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-separator)] " +
  "bg-[var(--color-surface-secondary)]/80 px-4 py-3 backdrop-blur-md";

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
};

/** Wide enough for full Legs table (Qty · Strike · Type · Exp · Mid · ± · IV). */
const PANEL_W = 770;
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

  const [position, setPosition] = useState<PositionInput>(() =>
    initial
      ? { ...initial, legs: initial.legs.map((l) => ({ ...l })) }
      : {
          underlying: symbol,
          expiration: frontDefault,
          contracts: 1,
          legs: [],
          direction: "buy",
          net_debit_override: null,
        },
  );

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

  /**
   * Seed once per open — **only after OPF can support a real structure**.
   * Create must not mark seeded until legs land on the OPF grid (ATM center
   * listed, priced). Retries on chain.rev / expirations until ready.
   */
  useEffect(() => {
    if (!open || didSeed.current) return;

    if (mode === "edit" && initial?.legs.length) {
      const front = (initial.expiration || frontDefault).slice(0, 10);
      chain.ensureExpiration(front);
      const listed = chain.getStrikes(front);
      let legs = initial.legs.map((l) => ({ ...l }));
      if (listed.length) {
        legs = legs.map((l) => {
          const s = snapToListed(l.strike, listed);
          return s != null ? { ...l, strike: s } : l;
        });
      }
      const priced = priceLegs(legs, front);
      setPosition({ ...initial, legs: priced.length ? priced : legs });
      setDirection(initial.direction || "buy");
      const body =
        priced.find((l) => l.side === "short")?.strike ??
        priced[0]?.strike ??
        (atmCenter > 0 ? atmCenter : spotPrice > 0 ? spotPrice : 0);
      if (body > 0) {
        setCenterStrike(body);
        centerPinnedRef.current = true;
      }
      if (!listed.length) {
        setStructureNotice(
          "Loading OPF chain… center and position update when strikes arrive.",
        );
        // Keep retrying until ladder exists so Center dropdown is real
        return;
      }
      setStructureNotice(null);
      didSeed.current = true;
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

    const seed = resolveCreateSeed(symbol);
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

    // Soft reprice + snap any drift onto listed (edit seed race)
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
  const overrideActive = position.net_debit_override != null;
  const packageSessionLabel = marketLive
    ? overrideActive
      ? "Limit"
      : "Live · unlocked"
    : overrideActive
      ? "Limit"
      : "Close · held";

  const previewLabel = useMemo(
    () => buildLabel(position.underlying, position.legs, position.expiration),
    [position],
  );
  const previewNotation = useMemo(
    () => buildNotation(position.legs),
    [position.legs],
  );

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
          const snapped = snapToListed(next.strike, listed);
          if (snapped == null) return l;
          next.strike = snapped;
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

  const timeSpreadBackChoices = useMemo(() => {
    const after = chain.expirations.filter((e) => e > position.expiration);
    if (after.length > 0) return after;
    if (chain.expirations.length) return chain.expirations;
    return [position.expiration || frontDefault || etYmd()];
  }, [chain.expirations, position.expiration, frontDefault]);

  if (!open) return null;

  return (
    <div
      className={
        "builder-steppers fixed z-50 flex max-h-[min(92vh,860px)] w-[min(770px,calc(100vw-1.5rem))] " +
        "flex-col overflow-hidden rounded-[var(--radius-xl)] " +
        "border border-[var(--color-separator)] bg-[var(--color-surface-secondary)] " +
        "shadow-[var(--elevation-3,0_25px_50px_-12px_rgba(0,0,0,0.45))]"
      }
      style={{ left: panelPos.x, top: panelPos.y }}
      role="dialog"
      aria-modal="false"
      aria-label={mode === "edit" ? "Edit position" : "Create position"}
      data-testid="position-builder"
    >
      {/* Navigation bar */}
      <div
        className={
          "flex cursor-grab items-center justify-between gap-3 " +
          "border-b border-[var(--color-separator)] bg-[var(--color-surface)]/90 " +
          "px-4 py-3 backdrop-blur-md active:cursor-grabbing"
        }
        onPointerDown={onPanelPointerDown}
        onPointerMove={onPanelPointerMove}
        onPointerUp={onPanelPointerUp}
        onPointerCancel={onPanelPointerUp}
        data-testid="position-builder-drag-handle"
        title="Drag to move"
      >
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[25.5px] font-semibold tracking-tight text-[var(--color-label)]">
            {mode === "edit" ? "Edit Position" : "Create Position"}
          </h3>
          <p className="truncate text-[18px] text-[var(--color-label-tertiary)]">
            {position.underlying || symbol}
            {chain.spot != null ? ` · ${chain.spot.toFixed(2)}` : ""}
            {chain.spotStrike != null ? ` · ATM ${chain.spotStrike}` : ""}
          </p>
        </div>
        <Button variant="plain" className="!min-h-9 !px-2" onClick={onCancel}>
          Done
        </Button>
      </div>

      {planeState.kind !== "ready" ? (
        <div
          className={
            "flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5 " +
            (planeState.kind === "plane_unavailable"
              ? "border-amber-500/30 bg-amber-500/10"
              : planeState.kind === "off_market"
                ? "border-[var(--color-separator)] bg-[var(--color-fill)]/80"
                : planeState.kind === "unplaceable"
                  ? "border-[var(--color-separator)] bg-[var(--color-fill)]"
                  : "border-[var(--color-separator)] bg-[var(--color-fill)]/60")
          }
          role="status"
          data-testid="builder-structure-notice"
          data-plane-kind={planeState.kind}
        >
          <div className="min-w-0 flex-1">
            <div className="text-[18px] font-semibold tracking-wide text-[var(--color-label)]">
              {planeState.title}
            </div>
            <p className="mt-0.5 text-[18px] leading-snug text-[var(--color-label-secondary)]">
              {structureNotice || planeState.detail}
            </p>
          </div>
          {planeState.kind === "plane_unavailable" ||
          (planeState.kind === "updating" && marketLive) ? (
            <Button
              variant="secondary"
              className="!min-h-8 shrink-0 !px-3 !text-[18px]"
              data-testid="builder-retry-opf"
              onClick={() => retryOpfChain()}
            >
              Retry
            </Button>
          ) : null}
        </div>
      ) : null}

      {/* Grouped content */}
      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
        {/* —— Structure —— */}
        <section>
          <h4 className={sectionLabel}>Structure</h4>
          <div className={group}>
            <div className={groupRow}>
              <span className={rowLabel}>Strategy</span>
              <select
                className={field + " flex-1 text-right"}
                value={template}
                data-testid="builder-template"
                onChange={(e) => handleTemplate(e.target.value as TemplateType)}
              >
                {STRATEGY_GROUPS.map((g) => (
                  <optgroup key={g.label} label={g.label}>
                    {g.items.map((t) => (
                      <option key={t} value={t}>
                        {TEMPLATE_LABELS[t]}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className={groupRow + " justify-between py-2"}>
              <span className={rowLabel}>Side</span>
              <div className="inline-flex rounded-full bg-[var(--color-fill)] p-0.5">
                <button
                  type="button"
                  className={
                    "min-h-9 rounded-full px-4 text-[19.5px] font-semibold transition-colors " +
                    (direction === "buy"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-[var(--color-label-secondary)]")
                  }
                  onClick={() => handleDirection("buy")}
                >
                  Buy
                </button>
                <button
                  type="button"
                  className={
                    "min-h-9 rounded-full px-4 text-[19.5px] font-semibold transition-colors " +
                    (direction === "sell"
                      ? "bg-red-600 text-white shadow-sm"
                      : "text-[var(--color-label-secondary)]")
                  }
                  onClick={() => handleDirection("sell")}
                >
                  Sell
                </button>
              </div>
            </div>
            {TEMPLATE_HAS_SIDE[template] ? (
              <div className={groupRow}>
                <span className={rowLabel}>Right</span>
                <select
                  className={field + " flex-1 text-right"}
                  value={optionSide}
                  onChange={(e) => {
                    const s = e.target.value as OptionRight;
                    setOptionSide(s);
                    regenerate(
                      template,
                      centerStrike || atmCenter,
                      wingWidth,
                      s,
                      direction,
                      position.expiration,
                      backExpiration,
                    );
                  }}
                >
                  <option value="call">Call</option>
                  <option value="put">Put</option>
                </select>
              </div>
            ) : null}
            <div className={groupRow + " justify-between py-3"}>
              <div className="min-w-0">
                <div className="text-[22.5px] font-medium text-[var(--color-label)]">
                  {direction === "buy" ? "Long" : "Short"}{" "}
                  {TEMPLATE_LABELS[template]}
                </div>
                <div className="text-[18px] text-[var(--color-label-tertiary)]">
                  OPF-held chain only
                </div>
              </div>
              <svg
                viewBox="0 0 60 24"
                width={72}
                height={28}
                className="shrink-0 opacity-90"
                style={
                  // Sell = invert long debit silhouette → short/credit payoff.
                  direction === "sell"
                    ? { transform: "scaleY(-1)" }
                    : undefined
                }
                aria-hidden
              >
                <path
                  d={STRATEGY_DIAGRAMS[template]}
                  fill="none"
                  stroke={direction === "buy" ? "#22c55e" : "#ef4444"}
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </section>

        {/* —— Shape —— */}
        <section>
          <h4 className={sectionLabel}>Shape</h4>
          <div className={group}>
            <div className={groupRow}>
              <span className={rowLabel}>Spot</span>
              <input
                className={field + " flex-1 text-right font-mono tabular-nums"}
                type="number"
                step="0.01"
                inputMode="decimal"
                data-testid="builder-spot"
                value={
                  effectiveSpot > 0
                    ? Number.isInteger(effectiveSpot)
                      ? String(effectiveSpot)
                      : String(Math.round(effectiveSpot * 100) / 100)
                    : ""
                }
                placeholder="OPF mark"
                onChange={(e) => {
                  const raw = e.target.value.trim();
                  const v = parseFloat(raw);
                  setUserSpotDirty(true);
                  centerPinnedRef.current = false; // spot edit re-owns Center
                  if (!Number.isFinite(v) || v <= 0) {
                    setUserSpot(0);
                    return;
                  }
                  setUserSpot(v);
                  // Re-snap Center to nearest OPF listed strike at this spot
                  if (frontStrikes.length) {
                    const n = nearestListedToSpot(v, frontStrikes);
                    if (n != null && n > 0) {
                      setCenterStrike(n);
                      regenerate(
                        template,
                        n,
                        wingWidth || DEFAULT_CREATE_WING_WIDTH,
                        optionSide,
                        direction,
                        position.expiration,
                        backExpiration,
                      );
                    }
                  }
                }}
              />
            </div>
            <div className={groupRow}>
              <span className={rowLabel}>Center</span>
              <div className="min-w-0 flex-1">
                <StrikeSelect
                  listed={frontStrikes}
                  value={
                    centerStrike > 0
                      ? centerStrike
                      : inferStructureCenter(position.legs) ||
                        (nearestCenter > 0 ? nearestCenter : 0)
                  }
                  center={
                    centerStrike > 0
                      ? centerStrike
                      : nearestCenter > 0
                        ? nearestCenter
                        : effectiveSpot
                  }
                  /*
                   * Full OPF list in the menu (scroll for strikes beyond ±5).
                   * Selection defaults to nearest-to-spot; radius covers all
                   * listed so nothing is clipped.
                   */
                  radiusN={Math.max(5, frontStrikes.length || 5)}
                  emptyLabel={
                    !planePrinting
                      ? "Off market — last print"
                      : chain.loading
                        ? "Loading OPF strikes…"
                        : chain.error
                          ? "OPF unavailable"
                          : "Loading OPF strikes…"
                  }
                  className="!min-h-11 !border-0 bg-transparent text-right font-mono text-[22.5px]"
                  testId="builder-center-strike"
                  onChange={(c) => {
                    centerPinnedRef.current = true;
                    setCenterStrike(c);
                    regenerate(
                      template,
                      c,
                      wingWidth || DEFAULT_CREATE_WING_WIDTH,
                      optionSide,
                      direction,
                      position.expiration,
                      backExpiration,
                    );
                  }}
                />
              </div>
            </div>
            {nearestCenter > 0 && frontStrikes.length > 0 ? (
              <div className="border-b border-[var(--color-separator)] px-3 py-1.5 last:border-b-0">
                <p className="text-right text-[16.5px] text-[var(--color-label-tertiary)]">
                  Nearest to spot {effectiveSpot > 0 ? effectiveSpot.toFixed(2) : "—"}{" "}
                  → {nearestCenter}
                  {frontStrikes.length
                    ? ` · ${frontStrikes.length} OPF strikes`
                    : ""}
                </p>
              </div>
            ) : null}
            <div className={groupRow}>
              <span className={rowLabel}>Width</span>
              <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                {wingChoices.length > 0 ? (
                  <select
                    className={
                      field + " max-w-[8rem] text-right font-mono tabular-nums"
                    }
                    data-testid="builder-width"
                    data-listed-count={wingChoices.length}
                    value={String(
                      wingChoices.includes(wingWidth)
                        ? wingWidth
                        : wingChoices.find((c) => c >= wingWidth) ??
                            wingChoices[0],
                    )}
                    onChange={(e) => {
                      const w = normalizeStrike(parseFloat(e.target.value));
                      // Refuse non-listed widths even if the option list is stale
                      if (!wingChoices.includes(w)) return;
                      setWingWidth(w);
                      regenerate(
                        template,
                        centerStrike || atmCenter || nearestCenter,
                        w,
                        optionSide,
                        direction,
                        position.expiration,
                        backExpiration,
                      );
                    }}
                  >
                    {wingChoices.map((w) => (
                      <option key={String(w)} value={String(w)}>
                        {w} pts
                      </option>
                    ))}
                  </select>
                ) : (
                  <span
                    className={
                      field +
                      " max-w-[8rem] text-right text-[var(--color-label-tertiary)]"
                    }
                    data-testid="builder-width"
                    data-listed-count={0}
                    role="status"
                    title="Waiting for OPF listed strikes to derive lawful widths"
                  >
                    …
                  </span>
                )}
              </div>
            </div>
            {wingChoices.length > 0 ? (
              <div className="border-b border-[var(--color-separator)] px-3 py-1.5 last:border-b-0">
                <p className="text-right text-[16.5px] text-[var(--color-label-tertiary)]">
                  OPF listed wings only
                  {listedStepNearLabel(frontStrikes, centerStrike || nearestCenter)}
                </p>
              </div>
            ) : null}
            <div className={groupRow}>
              <span className={rowLabel}>Expiration</span>
              {hasExps ? (
                <select
                  className={field + " flex-1 text-right"}
                  value={
                    chain.expirations.includes(position.expiration)
                      ? position.expiration
                      : chain.expirations[0] || position.expiration
                  }
                  onChange={(e) => {
                    const exp = e.target.value;
                    userPickedExp.current = true;
                    let back = backExpiration;
                    if (isTimeSpread) {
                      const exps = chain.expirations;
                      const idx = exps.indexOf(exp);
                      back =
                        idx >= 0 && idx + 1 < exps.length
                          ? exps[idx + 1]
                          : nextListedBack(exp, exps) || exp;
                      setBackExpiration(back);
                    }
                    regenerate(
                      template,
                      centerStrike || atmCenter || spotPrice,
                      wingWidth || DEFAULT_CREATE_WING_WIDTH,
                      optionSide,
                      direction,
                      exp,
                      back,
                    );
                  }}
                >
                  {chain.expirations.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className={field + " flex-1 text-right"}
                  type="date"
                  value={position.expiration}
                  onChange={(e) =>
                    setPosition((p) => ({ ...p, expiration: e.target.value }))
                  }
                />
              )}
            </div>
            {isTimeSpread ? (
              <div className={groupRow}>
                <span className={rowLabel}>Back exp</span>
                <select
                  className={field + " flex-1 text-right"}
                  value={
                    timeSpreadBackChoices.includes(backExpiration)
                      ? backExpiration
                      : timeSpreadBackChoices[0]
                  }
                  onChange={(e) => {
                    const b = e.target.value;
                    setBackExpiration(b);
                    setPosition((prev) => ({
                      ...prev,
                      legs: prev.legs.map((leg) =>
                        leg.side === "long" ? { ...leg, expiration: b } : leg,
                      ),
                      net_debit_override: null,
                    }));
                  }}
                >
                  {timeSpreadBackChoices.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>
        </section>

        {/* —— Package hero —— */}
        <section>
          <h4 className={sectionLabel}>Position</h4>
          <div
            className={
              group +
              " flex flex-col items-center gap-1 px-4 py-5 text-center"
            }
            data-testid="builder-package-economics"
          >
            <div className="flex items-center gap-2">
              <span className="text-[18px] font-medium text-[var(--color-label-tertiary)]">
                {planeState.kind === "plane_unavailable"
                  ? "Position"
                  : planeState.kind === "updating"
                    ? "Position"
                    : marketLive
                      ? "Natural mid"
                      : "Closing mid"}
              </span>
              <span
                className={
                  "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[16.5px] font-semibold " +
                  (planeState.kind === "plane_unavailable"
                    ? "bg-amber-500/15 text-amber-800 dark:text-amber-200"
                    : planeState.kind === "updating"
                      ? "bg-[var(--color-fill)] text-[var(--color-label-secondary)]"
                      : overrideActive
                        ? "bg-amber-500/15 text-amber-300"
                        : marketLive
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-[var(--color-fill)] text-[var(--color-label-secondary)]")
                }
                data-testid="builder-price-lock-state"
                data-locked={overrideActive ? "1" : "0"}
                data-plane-kind={planeState.kind}
              >
                {planeState.kind === "ready" || overrideActive ? (
                  overrideActive ? (
                    <IconLock size={12} tone="inherit" />
                  ) : (
                    <IconUnlock size={12} tone="inherit" />
                  )
                ) : null}
                {planeState.kind === "plane_unavailable"
                  ? planeState.title
                  : planeState.kind === "updating"
                    ? planeState.title
                    : planeState.kind === "unplaceable"
                      ? planeState.title
                      : preOpenPackage
                        ? "Theo · until open"
                        : packageSessionLabel}
              </span>
            </div>
            <div
              className={
                "font-mono text-[51px] font-semibold tabular-nums tracking-tight " +
                (planeState.kind !== "ready" &&
                !(overrideActive && position.net_debit_override != null)
                  ? "text-[var(--color-label-tertiary)]"
                  : eco.side === "CREDIT"
                    ? "text-emerald-500"
                    : eco.side === "DEBIT"
                      ? "text-rose-500"
                      : "text-[var(--color-label-tertiary)]")
              }
              data-testid="builder-live-package-price"
            >
              {overrideActive && position.net_debit_override != null
                ? Math.abs(position.net_debit_override).toFixed(2)
                : planeState.kind === "ready" && eco.absMid != null
                  ? eco.absMid.toFixed(2)
                  : planeState.kind === "updating"
                    ? "…"
                    : planeState.kind === "plane_unavailable"
                      ? "—"
                      : eco.absMid != null
                        ? eco.absMid.toFixed(2)
                        : "…"}
            </div>
            <div className="text-[19.5px] font-medium text-[var(--color-label-secondary)]">
              {planeState.kind === "ready" || eco.side
                ? overrideActive && position.net_debit_override != null
                  ? "LIMIT"
                  : eco.side ?? "—"
                : planeState.title}
              {eco.packages > 1 &&
              planeState.kind === "ready" &&
              eco.absMid != null ? (
                <span data-testid="builder-package-total">
                  {` · Qty ${eco.packages} · Total ${(
                    (overrideActive && position.net_debit_override != null
                      ? Math.abs(position.net_debit_override)
                      : eco.absMid) * eco.packages
                  ).toFixed(2)}`}
                </span>
              ) : null}
              {packageSpread != null &&
              !overrideActive &&
              planeState.kind === "ready" ? (
                <span
                  className="ml-2 font-mono text-[18px] tabular-nums text-[var(--color-label-tertiary)]"
                  data-testid="builder-package-spread"
                >
                  spread {packageSpread.toFixed(2)}
                </span>
              ) : null}
            </div>
            <p className="max-w-[18rem] text-[18px] leading-snug text-[var(--color-label-tertiary)]">
              {planeState.kind !== "ready"
                ? planeState.detail
                : packageDisclaimer
                  ? packageDisclaimer
                  : overrideActive
                    ? "Limit override active — clear limit for natural position"
                    : marketLive
                      ? "Live position from dual-side OPF mids"
                      : "Closing position mid and spread from last OPF marks"}
            </p>
          </div>
        </section>

        {packageDisclaimer && planeState.kind === "ready" ? (
          <div
            className="rounded-[var(--radius-md)] border border-amber-500/25 bg-amber-500/10 px-3 py-2.5 text-[18px] leading-snug text-[var(--color-label)]"
            role="note"
            data-testid="builder-preopen-disclaimer"
          >
            <span className="font-semibold">Disclaimer · pre-open marks. </span>
            {packageDisclaimer}
          </div>
        ) : null}

        {/* —— Legs —— */}
        <section>
          <div className="mb-1.5 flex items-end justify-between px-1">
            <h4 className="text-[19.5px] font-semibold tracking-tight text-[var(--color-label-secondary)]">
              Legs
            </h4>
            <Button
              variant="plain"
              className="!min-h-8 !px-2 !text-[19.5px]"
              onClick={addLeg}
            >
              Add Leg
            </Button>
          </div>
          <div className={group + " overflow-x-auto"}>
            <table className="w-full min-w-0 table-fixed text-left text-[19.5px]">
              <thead>
                <tr className="border-b border-[var(--color-separator)] text-[16.5px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                  <th className="px-3 py-2 font-semibold">Qty</th>
                  <th className="px-2 py-2 font-semibold">Strike</th>
                  <th className="px-2 py-2 font-semibold">Type</th>
                  <th className="px-2 py-2 font-semibold">Exp</th>
                  <th className="px-2 py-2 text-right font-semibold">Mid</th>
                  <th className="px-2 py-2 text-right font-semibold">±</th>
                  <th className="px-2 py-2 text-right font-semibold">IV</th>
                  <th className="w-8 px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {[...position.legs]
                  .map((leg, origIdx) => ({ leg, origIdx }))
                  .sort((a, b) => {
                    // ToS: calls above puts, then ascending strike
                    if (a.leg.type !== b.leg.type)
                      return a.leg.type === "call" ? -1 : 1;
                    return a.leg.strike - b.leg.strike;
                  })
                  .map(({ leg, origIdx: i }) => {
                  const exp = (leg.expiration || position.expiration).slice(
                    0,
                    10,
                  );
                  const legStrikes = chain.getStrikes(exp);
                  const contrib = eco.legs[i]?.contribMid;
                  return (
                    <tr
                      key={i}
                      className="border-b border-[var(--color-separator)] last:border-b-0"
                    >
                      <td className="px-2 py-1.5">
                        <input
                          className={
                            fieldInset + " w-16 !min-h-9 !px-2 text-center"
                          }
                          type="number"
                          value={
                            leg.side === "long" ? leg.quantity : -leg.quantity
                          }
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10) || 1;
                            updateLeg(i, {
                              quantity: Math.max(1, Math.abs(v)),
                              side: v >= 0 ? "long" : "short",
                            });
                          }}
                        />
                      </td>
                      <td className="px-1 py-1.5">
                        <StrikeSelect
                          listed={legStrikes}
                          value={leg.strike}
                          center={atmCenter || spotPrice}
                          radiusN={80}
                          className="min-w-[6.75rem] !min-h-9"
                          testId={`builder-leg-strike-${i}`}
                          onChange={(s) => updateLeg(i, { strike: s })}
                        />
                      </td>
                      <td className="px-1 py-1.5">
                        <button
                          type="button"
                          className={
                            "min-h-9 rounded-full bg-[var(--color-fill)] px-2.5 " +
                            "text-[18px] font-semibold text-[var(--color-label)]"
                          }
                          onClick={() =>
                            updateLeg(i, {
                              type: leg.type === "call" ? "put" : "call",
                            })
                          }
                        >
                          {leg.type === "call" ? "C" : "P"}
                        </button>
                      </td>
                      <td className="px-1 py-1.5" onClick={(e) => e.stopPropagation()}>
                        {hasExps ? (
                          <select
                            className={fieldInset + " min-w-[6.75rem] !min-h-9 !py-1"}
                            value={
                              chain.expirations.includes(exp)
                                ? exp
                                : chain.expirations[0] || exp
                            }
                            data-testid={`builder-leg-exp-${i}`}
                            onChange={(e) => {
                              const nextExp = e.target.value;
                              chain.ensureExpiration(nextExp);
                              updateLeg(i, { expiration: nextExp });
                            }}
                          >
                            {chain.expirations.map((e) => (
                              <option key={e} value={e}>
                                {e.slice(5)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="font-mono text-[18px] text-[var(--color-label-tertiary)]">
                            {exp.slice(5)}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono tabular-nums text-emerald-500">
                        {leg.entry_price > 0
                          ? leg.entry_price.toFixed(2)
                          : "—"}
                      </td>
                      <td
                        className={
                          "px-2 py-1.5 text-right font-mono tabular-nums " +
                          (contrib == null
                            ? "text-[var(--color-label-tertiary)]"
                            : contrib >= 0
                              ? "text-emerald-500"
                              : "text-rose-500")
                        }
                      >
                        {contrib == null
                          ? "—"
                          : `${contrib >= 0 ? "+" : ""}${contrib.toFixed(2)}`}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono text-[var(--color-label-tertiary)]">
                        {leg.volatility != null
                          ? (leg.volatility * 100).toFixed(0) + "%"
                          : "—"}
                      </td>
                      <td className="px-1 py-1.5">
                        <button
                          type="button"
                          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-destructive)] hover:bg-[var(--color-fill)] disabled:opacity-30"
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
        </section>

        {/* —— Basis —— */}
        <section>
          <h4 className={sectionLabel}>Basis</h4>
          <div className={group}>
            <div className={groupRow}>
              <span className={rowLabel}>Limit</span>
              <input
                className={field + " flex-1 text-right"}
                type="number"
                step="0.01"
                value={
                  position.net_debit_override != null
                    ? position.net_debit_override
                    : ""
                }
                placeholder={
                  eco.complete && displayCost > 0
                    ? `Live ${displayCost.toFixed(2)}`
                    : "Optional"
                }
                onChange={(e) => {
                  const raw = e.target.value.trim();
                  if (raw === "") {
                    setPosition((p) => ({ ...p, net_debit_override: null }));
                    return;
                  }
                  const v = parseFloat(raw);
                  setPosition((p) => ({
                    ...p,
                    net_debit_override: Number.isFinite(v) ? v : null,
                  }));
                }}
              />
            </div>
            <div className={groupRow}>
              <span className={rowLabel}>Positions</span>
              <input
                className={field + " max-w-[5rem] text-right"}
                type="number"
                min={1}
                value={position.contracts}
                onChange={(e) =>
                  setPosition((p) => ({
                    ...p,
                    contracts: Math.max(1, parseInt(e.target.value, 10) || 1),
                  }))
                }
              />
            </div>
          </div>
          <p className="mt-1.5 px-1 text-[18px] text-[var(--color-label-tertiary)]">
            Debit/credit is per position. Total = Qty × debit. Leave limit
            empty for unlocked live position from OPF.
          </p>
        </section>

        {/* —— Preview —— */}
        <section>
          <h4 className={sectionLabel}>Preview</h4>
          <div className={group + " space-y-3 p-4"}>
            <div>
              <div className="text-[22.5px] font-semibold text-[var(--color-label)]">
                {previewLabel}
              </div>
              <div className="mt-0.5 font-mono text-[18px] text-[var(--color-label-secondary)]">
                {previewNotation || "—"}
              </div>
            </div>
            <button
              type="button"
              className="block w-full rounded-[var(--radius-md)] bg-black px-3 py-2.5 text-left font-mono text-[16.5px] leading-relaxed text-emerald-400 ring-1 ring-emerald-900/40"
              data-testid="builder-tos-script"
              onClick={() => {
                if (!tosScript) return;
                rememberTosScript(tosScript);
                void navigator.clipboard.writeText(tosScript).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1200);
                });
              }}
            >
              <span className="mb-1 block text-[15px] font-semibold uppercase tracking-wide text-emerald-600/80">
                ToS · {copied ? "Copied" : "Tap to copy"}
              </span>
              {tosScript || "—"}
            </button>
          </div>
        </section>
      </div>

      <div className={footerBar}>
        {/* Defaults — Lab active or one of up to 3 user presets */}
        <div className="relative min-w-0">
          {mode === "create" ? (
            <>
              <Button
                variant="plain"
                className="!min-h-9 !px-2.5 !text-[19.5px]"
                data-testid="builder-defaults-menu"
                aria-haspopup="menu"
                aria-expanded={defaultsMenuOpen}
                onClick={() => {
                  setDefaultsStore(loadCreateDefaultsStore());
                  setDefaultsMenuOpen((o) => !o);
                }}
              >
                Defaults
                <span className="ml-1 max-w-[7rem] truncate text-[16.5px] font-normal text-[var(--color-label-tertiary)]">
                  {defaultsStore.activeId == null
                    ? "· Lab"
                    : `· ${
                        defaultsStore.presets.find(
                          (p) => p.id === defaultsStore.activeId,
                        )?.name ?? "Custom"
                      }`}
                </span>
                <span className="text-[15px] opacity-60" aria-hidden>
                  ▾
                </span>
              </Button>
              {defaultsMenuOpen ? (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-[60] cursor-default bg-transparent"
                    aria-label="Close defaults menu"
                    onClick={() => setDefaultsMenuOpen(false)}
                  />
                  <div
                    role="menu"
                    className={
                      "absolute bottom-full left-0 z-[61] mb-1 w-[min(20rem,calc(100vw-2rem))] overflow-hidden " +
                      "rounded-[var(--radius-lg)] border border-[var(--color-separator)] " +
                      "bg-[var(--color-surface)] py-1 shadow-[var(--elevation-2)]"
                    }
                    data-testid="builder-defaults-popover"
                  >
                    <p className="px-3 pb-1 pt-2 text-[16.5px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                      Active on Create
                    </p>
                    {/* Lab defaults */}
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={defaultsStore.activeId == null}
                      className={
                        "flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-[var(--color-fill)] " +
                        (defaultsStore.activeId == null
                          ? "bg-[var(--color-tint-soft)]"
                          : "")
                      }
                      data-testid="builder-default-lab"
                      onClick={() => {
                        const next = resetToLabDefaults();
                        setDefaultsStore(next);
                        setDefaultsFlash("Lab defaults active");
                        setDefaultsMenuOpen(false);
                        window.setTimeout(() => setDefaultsFlash(null), 2000);
                        // Re-apply flagship Lab butterfly now
                        const lab = labDefaultForStrategy("butterfly", symbol);
                        handleTemplate(lab.template);
                      }}
                    >
                      <span className="mt-0.5 w-4 shrink-0 text-[var(--color-tint)]">
                        {defaultsStore.activeId == null ? "●" : "○"}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[21px] font-medium text-[var(--color-label)]">
                          Options Lab defaults
                        </span>
                        <span className="block text-[16.5px] leading-snug text-[var(--color-label-tertiary)]">
                          {labDefaultForStrategy("butterfly", symbol).blurb}
                        </span>
                      </span>
                    </button>
                    {/* Up to 3 user presets */}
                    {defaultsStore.presets.map((p, i) => (
                      <button
                        key={p.id}
                        type="button"
                        role="menuitemradio"
                        aria-checked={defaultsStore.activeId === p.id}
                        className={
                          "flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-[var(--color-fill)] " +
                          (defaultsStore.activeId === p.id
                            ? "bg-[var(--color-tint-soft)]"
                            : "")
                        }
                        data-testid={`builder-default-slot-${i}`}
                        onClick={() => {
                          const next = setActiveCreateDefault(p.id);
                          setDefaultsStore(next);
                          setDefaultsFlash(`Active: ${p.name}`);
                          setDefaultsMenuOpen(false);
                          window.setTimeout(() => setDefaultsFlash(null), 2000);
                          // Apply this preset shape immediately
                          setTemplate(p.template);
                          setDirection(p.direction);
                          setOptionSide(p.optionSide);
                          setWingWidth(p.wingWidth);
                          const front =
                            position.expiration ||
                            pickDefaultFrontExpiration(
                              chain.expirations,
                              marketLive,
                            ) ||
                            frontDefault;
                          const listed = chain.getStrikes(front);
                          const atm =
                            atmCenter > 0
                              ? atmCenter
                              : snapToListed(
                                  chain.spotStrike ?? chain.spot ?? spotPrice,
                                  listed,
                                ) ?? spotPrice;
                          const c =
                            snapToListed(atm + p.centerOffsetPts, listed) ??
                            atm;
                          setCenterStrike(c);
                          let back: string | undefined;
                          if (
                            p.template === "calendar" ||
                            p.template === "diagonal"
                          ) {
                            const exps = chain.expirations;
                            const idx = exps.indexOf(front);
                            back =
                              idx >= 0 && idx + 1 < exps.length
                                ? exps[idx + 1]
                                : nextListedBack(front, exps) || undefined;
                            if (back) setBackExpiration(back);
                          }
                          regenerate(
                            p.template,
                            c,
                            p.wingWidth,
                            p.optionSide,
                            p.direction,
                            front,
                            back,
                          );
                        }}
                      >
                        <span className="mt-0.5 w-4 shrink-0 text-[var(--color-tint)]">
                          {defaultsStore.activeId === p.id ? "●" : "○"}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[21px] font-medium text-[var(--color-label)]">
                            {p.name}
                          </span>
                          <span className="block font-mono text-[16.5px] text-[var(--color-label-tertiary)]">
                            {formatShapeSummary(p)}
                          </span>
                        </span>
                      </button>
                    ))}
                    {defaultsStore.presets.length < MAX_USER_PRESETS ? (
                      <p className="px-3 py-1.5 text-[16.5px] text-[var(--color-label-tertiary)]">
                        {MAX_USER_PRESETS - defaultsStore.presets.length} slot
                        {MAX_USER_PRESETS - defaultsStore.presets.length === 1
                          ? ""
                          : "s"}{" "}
                        free — Save stores current shape
                        {defaultsStore.activeId
                          ? " (overwrites active)"
                          : " (new slot)"}
                        .
                      </p>
                    ) : (
                      <p className="px-3 py-1.5 text-[16.5px] text-[var(--color-label-tertiary)]">
                        3 presets full — Save overwrites the active slot (or
                        oldest if Lab is active).
                      </p>
                    )}
                    <div className="my-1 border-t border-[var(--color-separator)]" />
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center px-3 py-2.5 text-left text-[21px] text-[var(--color-label)] hover:bg-[var(--color-fill)]"
                      data-testid="builder-save-as-default"
                      onClick={() => {
                        const shape = shapeFromBuilderState({
                          template,
                          direction,
                          optionSide,
                          wingWidth:
                            wingWidth > 0
                              ? wingWidth
                              : DEFAULT_CREATE_WING_WIDTH,
                          centerStrike:
                            centerStrike || atmCenter || spotPrice,
                          atmCenter:
                            atmCenter ||
                            chain.spotStrike ||
                            chain.spot ||
                            centerStrike ||
                            spotPrice,
                          contracts: position.contracts,
                        });
                        const next = saveShapeAsUserPreset(
                          shape,
                          symbol,
                          undefined,
                        );
                        setDefaultsStore(next);
                        setDefaultsFlash("Saved · now active");
                        setDefaultsMenuOpen(false);
                        window.setTimeout(() => setDefaultsFlash(null), 2200);
                      }}
                    >
                      Save as Default
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center px-3 py-2.5 text-left text-[21px] text-[var(--color-label-secondary)] hover:bg-[var(--color-fill)]"
                      data-testid="builder-reset-default"
                      onClick={() => {
                        const next = resetToLabDefaults();
                        setDefaultsStore(next);
                        setDefaultsFlash("Reset to Options Lab defaults");
                        setDefaultsMenuOpen(false);
                        window.setTimeout(() => setDefaultsFlash(null), 2200);
                        handleTemplate("butterfly");
                      }}
                    >
                      Reset to Lab defaults
                    </button>
                    <div className="border-t border-[var(--color-separator)] px-3 py-2 text-[16.5px] leading-snug text-[var(--color-label-tertiary)]">
                      Wave 1 Lab recipes: Butterfly · Vertical · Condor ·
                      Calendar (multi-exp). Strategy change while Lab is active
                      applies that recipe on OPF.
                    </div>
                  </div>
                </>
              ) : null}
              {defaultsFlash ? (
                <span
                  className="ml-2 text-[18px] text-[var(--color-tint)]"
                  data-testid="builder-defaults-flash"
                  role="status"
                >
                  {defaultsFlash}
                </span>
              ) : null}
            </>
          ) : (
            <span className="text-[18px] text-[var(--color-label-tertiary)]">
              Edit mode
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            data-testid="position-builder-analyze"
            onClick={handleSave}
          >
            {mode === "edit" ? "Update" : "Analyze"}
          </Button>
        </div>
      </div>
    </div>
  );
}
