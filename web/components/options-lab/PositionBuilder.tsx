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
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
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
  WINDOW_CLOSE_DOT,
  cardSelect,
} from "@/components/options-lab/TosControls";
import {
  calendarDteOf,
  lockLimit,
  lockNatural,
  positionFromInput,
  unlockCard,
  type AnalyzerPosition,
} from "@/lib/options-lab/analyzerBook";
import {
  BLOTTER_CSS_VARS,
  blotterCardBackground,
  blotterKindFromPackageSide,
  packageSideFromStructure,
  resolvePackageSide,
} from "@/lib/blotterTheme";
import {
  applyEtHm,
  resolveEntryAt,
} from "@/lib/options-lab/positionSession";
import {
  formatStrikeOnGrid,
  listedStepNear,
  listedWingChoices,
  nearestListedToSpot,
  normalizeStrike,
  snapToListed,
  snapWidthToListed,
  strikeGridDecimals,
} from "@/lib/options-lab/listedStrikes";
import {
  buildListedStructure,
  chromeFromLegs,
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
import {
  CARD_COLUMNS,
  catalogToTemplate,
  fmtIv,
  packageDelta,
  stepCardPrice,
} from "@/lib/options-lab/tosCard";
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
import type { CatalogName } from "@/lib/options-lab/structureClassifier";
import {
  formatHumanExpiration,
  generateTosScript,
} from "@/lib/options-lab/tosGenerator";
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
import { structureKeyFromInput } from "@/lib/options-lab/structureSignal";

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
  "min-h-[var(--hit-min)] cursor-pointer rounded-[var(--radius-sm)] " +
  "appearance-none bg-none bg-[var(--color-fill)] shadow-[var(--elevation-1)] " +
  "border-0 px-2 text-[length:var(--text-body)] tabular-nums text-[var(--color-label)] " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]";
/** DLG-LAYOUT-14 — content widths; EXPIRATION > STRIKE > DEBIT · POS · QTY. */
const W_QTY = "w-[5ch]";
const W_STRIKE = "w-[8ch]";
const W_EXP = "w-[12ch]";
const W_DEBIT = "w-[7ch]";
const W_POS = "w-[4ch]";
const dlgAction =
  "min-h-12 rounded-[var(--radius-sm)] px-6 py-3 text-[length:var(--text-body)] font-semibold shadow-[var(--elevation-1)] " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]";

export type PositionBuilderProps = {
  open: boolean;
  mode: "create" | "edit";
  symbol: string;
  spotPrice: number;
  chain: ChainAccessors;
  /** Draft or live record. Create seeds off-book; Edit is a copy of the book row. */
  initial?: AnalyzerPosition | null;
  /**
   * True when market session is Live (still in play). Used for create-default
   * front expiration: today if listed + live, else next listed after today.
   */
  marketLive?: boolean;
  /** Massive still printing (RTH or pre/post). False = dark plane, last print only. */
  planePrinting?: boolean;
  onSave: (record: AnalyzerPosition) => void;
  onCancel: () => void;
  /** Edit live bind — every patch writes the book. Create must not call this. */
  onLivePatch?: (record: AnalyzerPosition) => void;
  onLockLimit?: (magnitude: number) => void;
  onLockNatural?: () => void;
  onUnlock?: () => void;
  /** Edit-only. Card no longer hosts the time widget (PC8-D). */
  entryAt?: number | null;
  onSetEntryAt?: (entryAt: number) => void;
};

/** Dialog width is a constant. Height follows leg-row count only. */
const PANEL_INSET = 20;
const LEGS_PAD = 15;
/** Explicit gap after a field group — not leftover auto-distribution. */
const LEGS_GROUP_GAP = 32;
/**
 * Table + 15px pad + 20px dialog inset, both sides.
 * Measured against max-content legs (no w-full). Do not derive from the window.
 */
const PANEL_W = 756;
const PANEL_DEFAULT_OFFSET = { x: 48, y: 72 };

function legsGroupPad(col: string): CSSProperties | undefined {
  if (col === "QTY" || col === "TYPE" || col === "POS") {
    return { paddingRight: LEGS_GROUP_GAP };
  }
  return undefined;
}

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
  onLockLimit,
  onLockNatural,
  onUnlock,
  entryAt = null,
  onSetEntryAt,
}: PositionBuilderProps) {
  const { profile, universe, loading: universeLoading } = useOptionsLab();
  const profileMinWing =
    profile?.fly_widths?.[0] ??
    (profile?.strike_step != null && profile.strike_step > 0
      ? profile.strike_step
      : null);
  const hasExps = chain.expirations.length > 0;
  const frontDefault =
    initial?.position.expiration ||
    pickDefaultFrontExpiration(chain.expirations, marketLive) ||
    etYmd();

  const [draft, setDraft] = useState<AnalyzerPosition>(() =>
    positionFromInput({
      underlying: symbol,
      expiration: frontDefault,
      contracts: 1,
      legs: [],
      direction: "buy",
    }),
  );
  const record: AnalyzerPosition =
    mode === "edit" && initial ? initial : draft;
  const position = record.position;
  const setPosition = (
    update: PositionInput | ((prev: PositionInput) => PositionInput),
  ) => {
    const apply = (rec: AnalyzerPosition): AnalyzerPosition => {
      const nextPos = typeof update === "function" ? update(rec.position) : update;
      const label = buildLabel(
        nextPos.underlying,
        nextPos.legs,
        nextPos.expiration,
      );
      const notation = buildNotation(nextPos.legs);
      const next: AnalyzerPosition = {
        ...rec,
        position: nextPos,
        label,
        notation,
        updatedAt: Date.now(),
      };
      if (structureKeyFromInput(rec.position) === structureKeyFromInput(nextPos)) {
        return next;
      }
      const dirFlipped =
        (rec.position.direction ?? "buy") !== (nextPos.direction ?? "buy");
      return {
        ...next,
        priceSide: packageSideFromStructure(next),
        lastNatSigned:
          dirFlipped && rec.lastNatSigned != null
            ? -rec.lastNatSigned
            : rec.lastNatSigned,
      };
    };
    if (mode === "edit" && initial) {
      onLivePatch?.(apply(initial));
      return;
    }
    setDraft((d) => apply(d));
  };

  /* Dialog chrome (M3 keep): notices, menus, drag, seed refs — not model. */
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

  /** Effective spot mark for nearest-listed center. */
  const effectiveSpot = useMemo(() => {
    if (chain.spot != null && chain.spot > 0) return chain.spot;
    if (spotPrice > 0) return spotPrice;
    return 0;
  }, [chain.spot, spotPrice]);

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

  /** Family, center, width, right — views of the legs (M3). Not hooks. */
  const template: TemplateType =
    catalogToTemplate(detectFamily(position.legs) as CatalogName) ??
    "butterfly";
  const direction: TradeDirection = position.direction ?? "buy";
  const derivedChrome = chromeFromLegs(position.legs, frontStrikes);
  const centerStrike =
    derivedChrome?.center ||
    inferStructureCenter(position.legs) ||
    atmCenter;
  const wingWidth =
    derivedChrome?.width && derivedChrome.width > 0
      ? derivedChrome.width
      : DEFAULT_CREATE_WING_WIDTH;
  const optionSide: OptionRight = derivedChrome?.optionSide ?? "call";
  const backExpiration = (() => {
    const front = (position.expiration || "").slice(0, 10);
    const exps = [
      ...new Set(
        position.legs.map((l) => (l.expiration || front).slice(0, 10)),
      ),
    ].sort();
    return exps.find((e) => e > front) || "";
  })();

  const wingChoices = useMemo(
    () => listedWingChoices(centerStrike || atmCenter, frontStrikes, 60),
    [centerStrike, atmCenter, frontStrikes],
  );

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
      setPosition((prev) => ({
        ...prev,
        underlying: symbol,
        expiration: front || prev.expiration,
        legs,
        direction: dir,
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

    if (mode === "edit" && initial?.position.legs.length) {
      // Live bind: chrome only. Do not snap, reprice, or write the record.
      setStructureNotice(null);
      didSeed.current = true;
      return;
    }

    if (mode === "create" && initial?.position.legs.length) {
      setDraft({
        ...initial,
        position: {
          ...initial.position,
          legs: initial.position.legs.map((l) => ({ ...l })),
        },
      });
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
        chain.ensureExpiration(back);
      }
    }

    setPosition((prev) => ({
      ...prev,
      underlying: symbol,
      expiration: front,
      direction: seed.direction,
      contracts: Math.max(1, seed.contracts || 1),
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
    // Create seed owns first materialization (direction lives on the draft).
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
  const packageSide = resolvePackageSide(record);
  const blotterKind = blotterKindFromPackageSide(packageSide);
  const blotterBg = blotterCardBackground(blotterKind, false);
  const onFill = blotterKind === "open" || blotterKind === "close";
  const textMain = onFill
    ? "text-white"
    : "text-[var(--color-label)]";
  const textMuted = onFill
    ? "text-white/80"
    : "text-[var(--color-label-secondary)]";
  const pkgDelta = packageDelta(position.legs, effectiveSpot);
  const lockActive = record.lock.mode === "locked";
  const lockedMagnitude = lockActive
    ? Math.abs(record.lock.packageDebitPerShare)
    : null;
  const packageSessionLabel = marketLive
    ? lockActive
      ? "Limit"
      : "Live · unlocked"
    : lockActive
      ? "Limit"
      : "Close · held";

  const tosScript = useMemo(() => {
    if (!position.legs.length) return "";
    const pkgs = Math.max(1, position.contracts || 1);
    const listed = chain.getStrikes(
      (position.expiration || "").slice(0, 10),
    );
    return generateTosScript({
      symbol: position.underlying,
      strikeDecimals: strikeGridDecimals(listed),
      legs: position.legs.map((leg) => ({
        strike: leg.strike,
        expiration: leg.expiration || position.expiration,
        right: leg.type,
        quantity:
          (leg.side === "long" ? 1 : -1) * Math.abs(leg.quantity) * pkgs,
      })),
      costBasis:
        lockActive && lockedMagnitude != null
          ? lockedMagnitude
          : displayCost > 0
            ? displayCost
            : null,
    });
  }, [position, lockActive, lockedMagnitude, displayCost, chain]);

  const handleTemplate = (tmpl: TemplateType) => {
    const front =
      position.expiration ||
      pickDefaultFrontExpiration(chain.expirations, marketLive) ||
      frontDefault ||
      etYmd();
    const listed = chain.getStrikes(front);

    const useLab = isLabDefaultsActive();
    const lab = useLab ? labDefaultForStrategy(tmpl, symbol) : null;

    let dir: TradeDirection = direction;
    let side: OptionRight = TEMPLATE_HAS_SIDE[tmpl] ? optionSide : "call";
    let width = wingWidth > 0 ? wingWidth : DEFAULT_CREATE_WING_WIDTH;
    let center = centerStrike || atmCenter || spotPrice;

    if (lab) {
      dir = lab.direction;
      side = TEMPLATE_HAS_SIDE[tmpl] ? lab.optionSide : "call";
      const atm =
        atmCenter > 0
          ? atmCenter
          : snapToListed(
              chain.spotStrike ?? chain.spot ?? spotPrice,
              listed,
            ) ?? center;
      center =
        snapToListed(atm + (lab.centerOffsetPts || 0), listed) ?? atm;
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
    } else if (tmpl === "diagonal") {
      width =
        diagonalWidthFromLadder(
          centerStrike || atmCenter,
          listed.length ? listed : frontStrikes,
          2,
        ) ?? defaultDiagonalWidth(symbol);
    }

    let back = backExpiration;
    if (tmpl === "calendar" || tmpl === "diagonal") {
      const exps = chain.expirations;
      const idx = exps.indexOf(front);
      back =
        idx >= 0 && idx + 1 < exps.length
          ? exps[idx + 1]
          : nextListedBack(front, exps) || "";
      if (back) chain.ensureExpiration(back);
    } else {
      back = "";
    }

    const built = regenerate(
      tmpl,
      center,
      width,
      side,
      dir,
      front,
      back || undefined,
    );
    if (built) return;
    // pendingBuild or unplaceableDetail already set — do not leave a
    // picker that looks applied on the old legs (DLG-FN-1).
  };

  const handleDirection = (dir: TradeDirection) => {
    if (dir === direction) return;
    const built = regenerate(
      template,
      centerStrike || atmCenter || spotPrice,
      wingWidth || DEFAULT_CREATE_WING_WIDTH,
      optionSide,
      dir,
      position.expiration || frontDefault,
      backExpiration,
    );
    if (built) return;
    // Empty ladder → pendingBuild + notice. Unplaceable → CHECK STRUCTURE.
    // Toggle stays on the old direction until legs actually change.
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
      return { ...prev, legs };
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
    }));
  };

  const removeLeg = (i: number) => {
    setPosition((prev) => ({
      ...prev,
      legs: prev.legs.filter((_, j) => j !== i),
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
    const nextPos: PositionInput = {
      ...position,
      expiration: exp,
      legs,
      direction,
    };
    const nextRecord: AnalyzerPosition = {
      ...record,
      position: nextPos,
      label: buildLabel(nextPos.underlying, nextPos.legs, nextPos.expiration),
      notation: buildNotation(nextPos.legs),
      priceSide: packageSideFromStructure({ position: nextPos }),
      updatedAt: Date.now(),
    };
    onSave(nextRecord);
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
    record,
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
    lockActive && lockedMagnitude != null
      ? lockedMagnitude
      : record.livePackagePerShare != null
        ? Math.abs(record.livePackagePerShare)
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
      const isCredit = resolvePackageSide(record) === "credit";
      setDraft((d) => lockLimit(d, next, isCredit));
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
        "builder-steppers fixed z-50 flex max-h-[min(92vh,860px)] " +
        "flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-separator)] " +
        "bg-[var(--color-surface)] text-[var(--color-label)] shadow-[var(--elevation-3)]"
      }
      style={{ left: panelPos.x, top: panelPos.y, width: PANEL_W }}
      role="dialog"
      aria-modal="false"
      aria-label={mode === "edit" ? "Edit Position" : "Create Position"}
      data-testid="position-builder"
      data-panel-width={String(PANEL_W)}
      data-content-inset={String(PANEL_INSET)}
      data-content-width={String(PANEL_W - 2 * PANEL_INSET)}
      data-legs-pad={String(LEGS_PAD)}
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
        <button
          type="button"
          className="absolute left-5 top-1/2 flex min-h-[var(--hit-min)] min-w-[var(--hit-min)] -translate-y-1/2 items-center justify-center"
          aria-label="Close"
          data-testid="builder-window-close"
          onClick={onCancel}
        >
          <span className={WINDOW_CLOSE_DOT} aria-hidden />
        </button>
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
                className={dlgField + " w-full"}
                value={position.underlying || symbol}
                aria-label="Symbol"
                data-testid="builder-symbol"
                onChange={(e) => {
                  const next = e.target.value;
                  if (!next) return;
                  setPosition((p) => ({ ...p, underlying: next }));
                }}
              >
                {universeLoading && universe.length === 0 ? (
                  <option value="">Loading symbols…</option>
                ) : null}
                {(universe.some((u) => u.symbol === (position.underlying || symbol))
                  ? universe
                  : [{ symbol: position.underlying || symbol }, ...universe]
                ).map((u) => (
                  <option
                    key={u.symbol}
                    value={u.symbol}
                    disabled={"enabled" in u && u.enabled === false}
                  >
                    {"enabled" in u && u.enabled === false
                      ? `${u.symbol} — no chain held`
                      : u.symbol}
                  </option>
                ))}
              </select>
            </CardMenuField>
          </div>
          <div>
            <h4 className={sectionLabel}>Strategy</h4>
            <CardMenuField surface="dialog">
              <select
                className={dlgField + " w-full"}
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
            <div
              className="mt-3 flex items-center gap-3"
              data-testid="builder-direction-row"
            >
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
              stroke={
                direction === "buy"
                  ? "var(--color-success)"
                  : "var(--color-destructive)"
              }
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div
            role="radiogroup"
            aria-label="Buy or Sell"
            data-testid="builder-side"
            className="inline-flex min-h-[var(--hit-min)] rounded-[var(--radius-md)] bg-[var(--color-fill)] p-1 shadow-[var(--elevation-1)]"
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
            </div>
          </div>
        </section>

        <section aria-label="Legs">
          <h4 className={sectionLabel}>Legs</h4>
          <div
            data-testid="builder-legs-surface"
            data-blotter-kind={blotterKind}
            data-pkg-delta={pkgDelta == null ? "" : String(pkgDelta)}
            data-iv={fmtIv(position.legs[0]?.volatility)}
            className="rounded border border-[var(--color-separator)]"
            style={{
              ...BLOTTER_CSS_VARS,
              backgroundColor: blotterBg,
              padding: LEGS_PAD,
              width: "max-content",
            }}
          >
          <table
            data-testid="builder-legs-table"
            className={
              "border-separate border-spacing-0 text-left " +
              DATA +
              " leading-tight whitespace-nowrap tabular-nums"
            }
            style={{ width: "max-content" }}
          >
            <thead className={CARD_THEAD}>
              <tr data-testid="builder-legs-header">
                {CARD_COLUMNS.filter(
                  (c) =>
                    c !== "SPREAD" &&
                    c !== "SYMBOL" &&
                    c !== "VOL" &&
                    c !== "DELTA",
                ).flatMap((col) => {
                  const heading = (
                    <th
                      key={col}
                      className={
                        CARD_TH +
                        (col === "QTY" ||
                        col === "STRIKE" ||
                        col === "PRICE"
                          ? " text-right"
                          : "")
                      }
                      style={legsGroupPad(col)}
                    >
                      {col}
                    </th>
                  );
                  if (col !== "PRICE") return [heading];
                  return [
                    heading,
                    <th
                      key="pos"
                      className={CARD_TH + " text-right"}
                      style={legsGroupPad("POS")}
                    >
                      POS
                    </th>,
                  ];
                })}
                <th className={CARD_TH} />
              </tr>
            </thead>
            <tbody>
              {orderedLegs.map(({ leg, origIdx: i }, row) => {
                const exp = (leg.expiration || position.expiration).slice(0, 10);
                const legStrikes = chain.getStrikes(exp);
                const strikeDecimals = strikeGridDecimals(legStrikes);
                const signed = signedActualQty(leg);
                const isTop = row === 0;
                const legSide = leg.side === "long" ? "BUY" : "SELL";
                const valueField =
                  "inline-flex h-[18px] items-center justify-end rounded-sm " +
                  FIELD_FILL +
                  " px-1 font-mono " +
                  DATA +
                  " " +
                  textMain;
                return (
                  <tr
                    key={`${i}-${leg.strike}-${leg.type}`}
                    className="tabular-nums"
                    style={{ backgroundColor: blotterBg }}
                  >
                    <td
                      className={CARD_TD + " " + textMain}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isTop ? (
                        <CardMenuField surface="card">
                          <select
                            className={cardSelect + " " + textMain}
                            value={direction === "sell" ? "sell" : "buy"}
                            aria-label="Structure side BUY or SELL"
                            data-testid={`builder-leg-side-${i}`}
                            onChange={(e) => {
                              const v =
                                e.target.value === "sell" ? "sell" : "buy";
                              handleDirection(v);
                            }}
                          >
                            <option value="buy">BUY</option>
                            <option value="sell">SELL</option>
                          </select>
                        </CardMenuField>
                      ) : (
                        <span data-testid={`builder-leg-side-${i}`}>{legSide}</span>
                      )}
                    </td>
                    <td
                      className={CARD_TD + " text-right font-mono " + textMain}
                      style={legsGroupPad("QTY")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span
                          className={valueField + " " + W_QTY}
                          data-testid={`builder-leg-qty-${i}`}
                          data-field="qty"
                          data-value-field="1"
                        >
                          {signed}
                        </span>
                        <TosStepper surface="card"
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
                    <td className={CARD_TD} onClick={(e) => e.stopPropagation()}>
                      {hasExps ? (
                        <CardMenuField surface="card" fit="min">
                          <select
                            className={
                              cardSelect + " !w-[12ch] " + W_EXP + " " + textMain
                            }
                            value={boundSelectValue(exp, chain.expirations).value}
                            data-invalid={
                              boundSelectValue(exp, chain.expirations).invalid
                                ? "1"
                                : "0"
                            }
                            data-testid={`builder-leg-exp-${i}`}
                            data-field="expiration"
                            aria-label="Expiration"
                            onChange={(e) => {
                              const nextExp = e.target.value;
                              if (!nextExp) return;
                              chain.ensureExpiration(nextExp);
                              updateLeg(i, { expiration: nextExp });
                            }}
                          >
                            {boundSelectValue(exp, chain.expirations).invalid ? (
                              <option value="">{formatHumanExpiration(exp) || "—"}</option>
                            ) : null}
                            {chain.expirations.map((e) => (
                              <option key={e} value={e}>
                                {formatHumanExpiration(e)}
                              </option>
                            ))}
                          </select>
                        </CardMenuField>
                      ) : (
                        <span className={"font-mono " + textMuted}>
                          {formatHumanExpiration(exp)}
                        </span>
                      )}
                    </td>
                    <td className={CARD_TD + " text-right font-mono " + textMain}>
                      <div className="flex items-center justify-end gap-1">
                        {legStrikes.length ? (
                          <CardMenuField surface="card" fit="min">
                            <select
                              className={
                                cardSelect +
                                " !w-[8ch] " +
                                W_STRIKE +
                                " text-right font-mono " +
                                textMain
                              }
                              value={String(leg.strike)}
                              data-testid={`builder-leg-strike-${i}`}
                              data-field="strike"
                              data-value-field="1"
                              aria-label="Strike"
                              onChange={(e) => {
                                const s = parseFloat(e.target.value);
                                if (!Number.isFinite(s)) return;
                                updateLeg(i, { strike: s });
                              }}
                            >
                              {legStrikes.some((s) => s === leg.strike) ? null : (
                                <option value={leg.strike}>
                                  {formatStrikeOnGrid(leg.strike, strikeDecimals)}
                                </option>
                              )}
                              {legStrikes.map((s) => (
                                <option key={s} value={s}>
                                  {formatStrikeOnGrid(s, strikeDecimals)}
                                </option>
                              ))}
                            </select>
                          </CardMenuField>
                        ) : (
                          <span className="font-mono">
                            {formatStrikeOnGrid(leg.strike, strikeDecimals)}
                          </span>
                        )}
                        <TosStepper surface="card"
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
                    <td
                      className={CARD_TD + " " + textMain}
                      style={legsGroupPad("TYPE")}
                    >
                      <CardMenuField surface="card" fit="min">
                        <button
                          type="button"
                          className={
                            "h-[18px] rounded-sm " +
                            FIELD_FILL +
                            " px-1 py-0 " +
                            textMain
                          }
                          data-testid={`builder-leg-type-${i}`}
                          data-field="type"
                          aria-label="Leg type"
                          onClick={() =>
                            updateLeg(i, {
                              type: leg.type === "call" ? "put" : "call",
                            })
                          }
                        >
                          {leg.type === "call" ? "CALL" : "PUT"}
                        </button>
                      </CardMenuField>
                    </td>
                    <td className={CARD_TD + " text-right font-mono " + textMain}>
                      {isTop ? (
                        <div className="flex items-center justify-end gap-1">
                          <span
                            className={valueField + " " + W_DEBIT}
                            data-testid="builder-live-package-price"
                            data-field="debit"
                            data-value-field="1"
                          >
                            {debitShown != null && Number.isFinite(debitShown)
                              ? debitShown.toFixed(2)
                              : "—"}
                          </span>
                          <TosStepper surface="card"
                            testId="builder-debit-step"
                            ariaLabel="Package debit"
                            disabled={debitShown == null}
                            onUp={() => stepDebit("up")}
                            onDown={() => stepDebit("down")}
                          />
                          <TosPadlock surface="card"
                            locked={lockActive}
                            testId="builder-padlock"
                            onToggle={() => {
                              if (mode === "edit") {
                                if (lockActive) onUnlock?.();
                                else onLockNatural?.();
                                return;
                              }
                              if (lockActive) setDraft((d) => unlockCard(d));
                              else {
                                try {
                                  setDraft((d) => lockNatural(d));
                                } catch {
                                  /* incomplete quote — stay unlocked */
                                }
                              }
                            }}
                          />
                        </div>
                      ) : null}
                    </td>
                    <td
                      className={CARD_TD + " text-right font-mono " + textMain}
                      style={legsGroupPad("POS")}
                    >
                      {isTop ? (
                        <div className="flex items-center justify-end gap-1">
                          <span
                            className={valueField + " " + W_POS}
                            data-testid="builder-pos"
                            data-field="pos"
                            data-value-field="1"
                          >
                            {pkgPos}
                          </span>
                          <TosQtyControl surface="card"
                            testId="builder-pos-step"
                            onUp={() => scalePos(pkgPos + 1)}
                            onDown={() => scalePos(Math.max(1, pkgPos - 1))}
                            onPick={(n) => scalePos(n)}
                          />
                        </div>
                      ) : null}
                    </td>
                    <td className={CARD_TD}>
                      <button
                        type="button"
                        className={
                          "px-1 " +
                          CHROME +
                          " font-normal leading-none text-white/35 hover:text-white/80"
                        }
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
                className={dlgAction + " bg-[var(--color-tint)] text-[var(--color-on-tint)]"}
                data-testid="builder-analyze"
                onClick={handleSave}
              >
                Analyze
              </button>
            ) : (
              <button
                type="button"
                className={dlgAction + " bg-[var(--color-tint)] text-[var(--color-on-tint)]"}
                data-testid="builder-update"
                onClick={handleSave}
              >
                Update
              </button>
            )}
            <button
              type="button"
              className={dlgAction + " bg-[var(--color-fill)] text-[var(--color-label)]"}
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
