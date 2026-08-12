"use client";

/**
 * Live Position Builder for Options Lab Analyzer.
 *
 * Client data plane only:
 *  - Listed strikes from dual-side chain ladders (PB6 / OC6a)
 *  - Center on ATM (spot strike) when opening / product hydrates
 *  - Live package DEBIT|CREDIT from chain mids (PB4 incomplete → —)
 *  - Per-leg mid + package contribution while the dialog is open
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
import {
  listedWingChoices,
  listedWidthPoints,
  normalizeStrike,
  snapToListed,
} from "@/lib/options-lab/listedStrikes";
import {
  formatPackageSide,
  packageEconomics,
} from "@/lib/options-lab/packageEconomics";
import { useOptionsLab } from "@/lib/optionsLabContext";
import type {
  ChainAccessors,
  LegInput,
  OptionRight,
  PositionInput,
  TemplateType,
  TradeDirection,
} from "@/lib/options-lab/positionTypes";
import {
  butterflyLegs,
  bwbLegs,
  calendarLegs,
  condorLegs,
  diagonalLegs,
  diagonalWidthFromLadder,
  flipLegs,
  ironCondorLegs,
  ironFlyLegs,
  singleLeg,
  straddleLegs,
  strangleLegs,
  verticalLegs,
} from "@/lib/options-lab/positionTemplates";
import {
  buildLabel,
  buildNotation,
} from "@/lib/options-lab/positionLabels";
import { generateTosScript } from "@/lib/options-lab/tosGenerator";

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

const STRATEGY_DIAGRAMS: Record<TemplateType, string> = {
  single: "M2,22 L58,6",
  vertical: "M2,22 L20,22 L40,6 L58,6",
  butterfly: "M2,18 L12,18 L30,4 L48,18 L58,18",
  bwb: "M2,18 L12,18 L28,4 L52,18 L58,18",
  condor: "M2,18 L10,18 L20,6 L40,6 L50,18 L58,18",
  straddle: "M2,6 L30,22 L58,6",
  strangle: "M2,6 L18,18 L42,18 L58,6",
  iron_fly: "M2,6 L10,18 L30,4 L50,18 L58,6",
  iron_condor: "M2,6 L15,18 L45,18 L58,6",
  calendar: "M2,16 L20,10 L30,6 L40,10 L58,16",
  diagonal: "M2,18 L20,12 L32,6 L44,10 L58,16",
};

/** Create-default wing: always 20 when listed; else profile / product fallback. */
export const DEFAULT_CREATE_WING_WIDTH = 20;

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

/** Snap preferred wing onto listed choices; prefer exact 20 for create. */
function resolveCreateWingWidth(
  center: number,
  listed: number[],
  prefer: number = DEFAULT_CREATE_WING_WIDTH,
): number {
  if (!listed.length) return prefer;
  const choices = listedWingChoices(center, listed, 16);
  if (!choices.length) return prefer;
  if (choices.includes(prefer)) return prefer;
  // Nearest listed wing at or above prefer, else closest
  const atOrAbove = choices.find((c) => c >= prefer);
  if (atOrAbove != null) return atOrAbove;
  return choices.reduce((best, c) =>
    Math.abs(c - prefer) < Math.abs(best - prefer) ? c : best,
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

const field =
  "w-full rounded-md border border-[var(--color-separator)] bg-[var(--color-surface)] " +
  "px-2 py-1.5 text-sm text-[var(--color-label)]";
const labelCls =
  "mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]";
const btn =
  "inline-flex min-h-9 items-center justify-center rounded-full border border-[var(--color-separator)] " +
  "bg-[var(--color-surface)] px-3 text-sm font-medium text-[var(--color-label)] hover:bg-[var(--color-fill)] disabled:opacity-45";
const btnPrimary =
  "inline-flex min-h-9 items-center justify-center rounded-full border border-transparent " +
  "bg-[var(--color-tint)] px-4 text-sm font-semibold text-white disabled:opacity-45";

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
  onSave: (position: PositionInput, label: string, notation: string) => void;
  onCancel: () => void;
};

const PANEL_W = 780;
const PANEL_DEFAULT_OFFSET = { x: 48, y: 72 };

export default function PositionBuilder({
  open,
  mode,
  symbol,
  spotPrice,
  chain,
  initial,
  marketLive = true,
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
  const [wingWidth, setWingWidth] = useState(DEFAULT_CREATE_WING_WIDTH);
  const [backExpiration, setBackExpiration] = useState("");
  const [copied, setCopied] = useState(false);
  /** One seed per open — never re-seed over the user's structure. */
  const didSeed = useRef(false);
  /** Last chain rev we applied prices for (reprice only, no structure rewrite). */
  const lastPriceRev = useRef(-1);
  /** User explicitly changed front exp — do not auto-roll it. */
  const userPickedExp = useRef(false);

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

  const atmCenter = useMemo(() => {
    const listed = frontStrikes;
    const prefer =
      chain.spotStrike ??
      (chain.spot != null && chain.spot > 0 ? chain.spot : null) ??
      (spotPrice > 0 ? spotPrice : null);
    if (prefer != null && listed.length) {
      return snapToListed(prefer, listed) ?? listed[Math.floor(listed.length / 2)];
    }
    if (listed.length) return listed[Math.floor(listed.length / 2)];
    return prefer != null ? normalizeStrike(prefer) : 0;
  }, [frontStrikes, chain.spotStrike, chain.spot, spotPrice]);

  // Full listed wing ladder so any lawful width is selectable (not a short list)
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
    for (const e of need) chain.ensureExpiration(e);
  }, [
    open,
    position.expiration,
    position.legs,
    backExpiration,
    chain,
  ]);

  useEffect(() => {
    setPosition((p) =>
      p.underlying === symbol ? p : { ...p, underlying: symbol },
    );
  }, [symbol]);

  const isTimeSpread = template === "calendar" || template === "diagonal";

  const priceLegs = useCallback(
    (legs: LegInput[], frontExp: string): LegInput[] => {
      // Always return legs — never strip structure when chain is cold
      return legs.map((leg) => {
        const exp = (leg.expiration || frontExp).slice(0, 10);
        const listed = chain.getStrikes(exp);
        const strike =
          snapToListed(leg.strike, listed) ??
          (listed.length ? listed[0] : normalizeStrike(leg.strike));
        const c = chain.getContract(exp, strike, leg.type);
        return {
          ...leg,
          strike: Number.isFinite(strike) && strike > 0 ? strike : leg.strike,
          entry_price: c?.mid ?? leg.entry_price ?? 0,
          volatility: c?.iv ?? leg.volatility,
        };
      });
    },
    [chain],
  );

  /**
   * Materialize full leg table from quick-build controls.
   * Always produces legs. Honors the caller's center/width/exp when valid —
   * does not yank the structure back to ATM after the user has chosen.
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
    ) => {
      const front = (frontExp || "").slice(0, 10) || etYmd();
      // Ensure ladder for the chosen exp so any OPF-listed trade can price
      chain.ensureExpiration(front);
      if (backExp) chain.ensureExpiration(backExp.slice(0, 10));

      const listed = chain.getStrikes(front);
      // Prefer explicit user center; only fall back to ATM/spot when unset
      const prefer =
        (Number.isFinite(center) && center > 0 ? center : null) ??
        (chain.spotStrike != null && chain.spotStrike > 0
          ? chain.spotStrike
          : null) ??
        (chain.spot != null && chain.spot > 0 ? chain.spot : null) ??
        (spotPrice > 0 ? spotPrice : null) ??
        0;
      // Snap to listed when available; otherwise keep the arithmetic center
      // so OTM / far structures remain selectable while the ladder hydrates.
      const c =
        (listed.length
          ? snapToListed(prefer, listed)
          : null) ??
        (prefer > 0
          ? normalizeStrike(prefer)
          : listed.length
            ? listed[Math.floor(listed.length / 2)]
            : 0);
      // Map width onto listed grid so wings land on OPF-listed strikes
      let w =
        listed.length && width > 0
          ? listedWidthPoints(c, width, listed)
          : width > 0
            ? width
            : DEFAULT_CREATE_WING_WIDTH;
      if (!(w > 0)) w = DEFAULT_CREATE_WING_WIDTH;

      // Guard: still no center — placeholder so the leg table is never empty
      const body = c > 0 ? c : 100;

      let legs: LegInput[];
      switch (tmpl) {
        case "single":
          legs = singleLeg(body, side);
          break;
        case "vertical":
          legs = verticalLegs(body, body + w, side);
          break;
        case "butterfly":
          legs = butterflyLegs(body, w, side);
          break;
        case "bwb":
          legs = bwbLegs(body, w, side);
          break;
        case "condor":
          legs = condorLegs(body, w, side);
          break;
        case "straddle":
          legs = straddleLegs(body);
          break;
        case "strangle":
          legs = strangleLegs(
            body,
            w || defaultWidth(symbol, profileMinWing),
          );
          break;
        case "iron_fly":
          legs = ironFlyLegs(
            body,
            w || defaultWidth(symbol, profileMinWing),
          );
          break;
        case "iron_condor":
          legs = ironCondorLegs(
            body - w * 2,
            body - w,
            body + w,
            body + w * 2,
          );
          break;
        case "calendar":
          legs = calendarLegs(body, side);
          break;
        case "diagonal":
          legs = diagonalLegs(body, w, side);
          break;
        default:
          legs = butterflyLegs(body, w, side);
      }

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
      if (dir === "sell") legs = flipLegs(legs);

      // Absolute guarantee: template always yields ≥1 leg
      if (!legs.length) {
        legs = butterflyLegs(body, w, side);
        legs = priceLegs(legs, front);
        if (dir === "sell") legs = flipLegs(legs);
      }

      setCenterStrike(body);
      if (w > 0) setWingWidth(w);
      setPosition((prev) => ({
        ...prev,
        underlying: symbol,
        expiration: front || prev.expiration,
        legs,
        direction: dir,
        net_debit_override: null,
      }));
    },
    [chain, priceLegs, symbol, spotPrice, profileMinWing],
  );

  // Reset float position + seed flags when dialog opens
  useEffect(() => {
    if (!open) return;
    didSeed.current = false;
    lastPriceRev.current = -1;
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
   * Seed once per open.
   * Create → always a ready 20-wide ATM butterfly on a valid front exp.
   * Edit → load the card. Never re-seed after the user starts editing.
   */
  useEffect(() => {
    if (!open || didSeed.current) return;
    didSeed.current = true;

    if (mode === "edit" && initial?.legs.length) {
      const front = initial.expiration || frontDefault;
      const priced = priceLegs(
        initial.legs.map((l) => ({ ...l })),
        front,
      );
      setPosition({ ...initial, legs: priced.length ? priced : initial.legs });
      setDirection(initial.direction || "buy");
      const body =
        priced.find((l) => l.side === "short")?.strike ??
        priced[0]?.strike ??
        (atmCenter > 0 ? atmCenter : spotPrice > 0 ? spotPrice : 100);
      setCenterStrike(body > 0 ? body : 100);
      return;
    }

    const front =
      pickDefaultFrontExpiration(chain.expirations, marketLive) ||
      frontDefault ||
      etYmd();
    const listed = chain.getStrikes(front);
    let center =
      atmCenter > 0
        ? atmCenter
        : spotPrice > 0
          ? spotPrice
          : chain.spot != null && chain.spot > 0
            ? chain.spot
            : 100;
    if (listed.length) {
      center =
        snapToListed(
          chain.spotStrike ?? chain.spot ?? spotPrice ?? center,
          listed,
        ) ?? listed[Math.floor(listed.length / 2)];
    }
    const width = resolveCreateWingWidth(
      center,
      listed,
      DEFAULT_CREATE_WING_WIDTH,
    );
    setTemplate("butterfly");
    setDirection("buy");
    setOptionSide("call");
    setCenterStrike(center);
    setWingWidth(width);
    regenerate("butterfly", center, width, "call", "buy", front);
  }, [
    open,
    mode,
    initial,
    chain,
    frontDefault,
    spotPrice,
    regenerate,
    priceLegs,
    atmCenter,
    marketLive,
  ]);

  /**
   * Chain tick: reprice + snap only. Never rewrite the user's structure.
   * One exception: create mode + still on expired same-day front (after 4 PM ET)
   * and user never picked exp → silent roll to next listed.
   */
  useEffect(() => {
    if (!open) return;
    const rev = chain.rev ?? 0;
    if (rev === lastPriceRev.current && position.legs.length > 0) return;
    lastPriceRev.current = rev;

    // Empty legs should never stick — rebuild current quick-build once
    if (position.legs.length === 0) {
      const front =
        pickDefaultFrontExpiration(chain.expirations, marketLive) ||
        position.expiration ||
        frontDefault ||
        etYmd();
      regenerate(
        template,
        centerStrike || atmCenter || spotPrice || 100,
        wingWidth || DEFAULT_CREATE_WING_WIDTH,
        optionSide,
        direction,
        front,
        backExpiration,
      );
      return;
    }

    // Silent same-day roll only when user has not chosen an expiration
    if (
      mode === "create" &&
      !userPickedExp.current &&
      position.expiration === etYmd() &&
      !isSameDayExpirationValid()
    ) {
      const nextFront = pickDefaultFrontExpiration(
        chain.expirations,
        marketLive,
      );
      if (nextFront && nextFront !== position.expiration) {
        regenerate(
          template,
          centerStrike || atmCenter || spotPrice || 100,
          wingWidth || DEFAULT_CREATE_WING_WIDTH,
          optionSide,
          direction,
          nextFront,
          backExpiration,
        );
        return;
      }
    }

    // Soft reprice only — keep structure, fill mids as they arrive
    setPosition((prev) => {
      if (!prev.legs.length) return prev;
      const next = priceLegs(prev.legs, prev.expiration);
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

  const costLabel = eco.side ?? "—";
  const displayCost = eco.absMid ?? 0;
  const overrideActive = position.net_debit_override != null;

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
    return generateTosScript({
      symbol: position.underlying,
      legs: position.legs.map((leg) => ({
        strike: leg.strike,
        expiration: leg.expiration || position.expiration,
        right: leg.type,
        quantity: leg.side === "long" ? leg.quantity : -leg.quantity,
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
    const side = TEMPLATE_HAS_SIDE[tmpl] ? optionSide : "call";
    let width = wingWidth > 0 ? wingWidth : DEFAULT_CREATE_WING_WIDTH;
    let back = backExpiration;
    const front =
      position.expiration ||
      pickDefaultFrontExpiration(chain.expirations, marketLive) ||
      frontDefault ||
      etYmd();
    if (tmpl === "calendar" || tmpl === "diagonal") {
      const exps = chain.expirations;
      const idx = exps.indexOf(front);
      back =
        idx >= 0 && idx + 1 < exps.length
          ? exps[idx + 1]
          : nextListedBack(front, exps) || "";
      setBackExpiration(back);
    }
    if (tmpl === "diagonal") {
      const ladder = frontStrikes;
      width =
        diagonalWidthFromLadder(centerStrike || atmCenter, ladder, 2) ??
        defaultDiagonalWidth(symbol);
      setWingWidth(width);
    }
    // Quick-build always fills the full leg table
    regenerate(
      tmpl,
      centerStrike || atmCenter || spotPrice,
      width,
      side,
      direction,
      front,
      back,
    );
  };

  const handleDirection = (dir: TradeDirection) => {
    if (dir === direction) return;
    setDirection(dir);
    // Empty legs (or first paint): rebuild structure for the new side
    if (position.legs.length === 0) {
      regenerate(
        template,
        centerStrike || atmCenter || spotPrice,
        wingWidth || DEFAULT_CREATE_WING_WIDTH,
        optionSide,
        dir,
        position.expiration || frontDefault,
        backExpiration,
      );
      return;
    }
    setPosition((prev) => ({
      ...prev,
      direction: dir,
      legs: flipLegs(prev.legs),
      net_debit_override: null,
    }));
  };

  const updateLeg = (index: number, patch: Partial<LegInput>) => {
    setPosition((prev) => {
      const legs = prev.legs.map((l, i) => {
        if (i !== index) return l;
        const next = { ...l, ...patch };
        if (patch.strike != null) {
          const exp = (next.expiration || prev.expiration).slice(0, 10);
          const listed = chain.getStrikes(exp);
          next.strike =
            snapToListed(next.strike, listed) ?? normalizeStrike(next.strike);
        }
        if (hasExps && (patch.strike != null || patch.type != null)) {
          const exp = (next.expiration || prev.expiration).slice(0, 10);
          const c = chain.getContract(exp, next.strike, next.type);
          if (c) {
            next.entry_price = c.mid ?? next.entry_price;
            next.volatility = c.iv ?? next.volatility;
          }
        }
        return next;
      });
      return { ...prev, legs, net_debit_override: null };
    });
  };

  const addLeg = () => {
    const strike = centerStrike || atmCenter;
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

  if (!open) return null;

  return (
    <div
      className={
        "fixed z-50 flex max-h-[min(92vh,820px)] w-[min(780px,calc(100vw-1.5rem))] " +
        "flex-col overflow-hidden rounded-2xl border border-[var(--color-separator)] " +
        "bg-[var(--color-surface)] shadow-2xl ring-1 ring-black/20"
      }
      style={{ left: panelPos.x, top: panelPos.y }}
      role="dialog"
      aria-modal="false"
      aria-label={mode === "edit" ? "Edit position" : "Create position"}
      data-testid="position-builder"
    >
        <div
          className="flex cursor-grab items-center justify-between border-b border-[var(--color-separator)] px-4 py-3 active:cursor-grabbing"
          onPointerDown={onPanelPointerDown}
          onPointerMove={onPanelPointerMove}
          onPointerUp={onPanelPointerUp}
          onPointerCancel={onPanelPointerUp}
          data-testid="position-builder-drag-handle"
          title="Drag to move"
        >
          <div>
            <h3 className="text-base font-semibold text-[var(--color-label)]">
              {mode === "edit" ? "Edit Position" : "Create Position"}
            </h3>
            <p className="text-[11px] text-[var(--color-label-tertiary)]">
              Quick-build any OPF-listed structure · live unlocked
              {chain.spot != null ? ` · spot ${chain.spot.toFixed(2)}` : ""}
              {chain.spotStrike != null
                ? ` · ATM ${chain.spotStrike}`
                : ""}
              {chain.expirations.length
                ? ` · ${chain.expirations.length} exps`
                : ""}
            </p>
          </div>
          <button type="button" className={btn} onClick={onCancel}>
            Close
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={labelCls}>Symbol</span>
              <input className={field} value={position.underlying} readOnly />
            </label>
            <label className="block">
              <span className={labelCls}>Strategy</span>
              <select
                className={field}
                value={template}
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
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <svg
              viewBox="0 0 60 24"
              width={60}
              height={24}
              style={
                direction === "sell" ? { transform: "scaleY(-1)" } : undefined
              }
            >
              <path
                d={STRATEGY_DIAGRAMS[template]}
                fill="none"
                stroke={direction === "buy" ? "#22c55e" : "#ef4444"}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <div className="inline-flex rounded-full border border-[var(--color-separator)] p-0.5">
              <button
                type="button"
                className={
                  "rounded-full px-3 py-1 text-xs font-semibold " +
                  (direction === "buy"
                    ? "bg-emerald-600 text-white"
                    : "text-[var(--color-label-secondary)]")
                }
                onClick={() => handleDirection("buy")}
              >
                Buy
              </button>
              <button
                type="button"
                className={
                  "rounded-full px-3 py-1 text-xs font-semibold " +
                  (direction === "sell"
                    ? "bg-red-600 text-white"
                    : "text-[var(--color-label-secondary)]")
                }
                onClick={() => handleDirection("sell")}
              >
                Sell
              </button>
            </div>
            <span className="text-sm text-[var(--color-label-secondary)]">
              {direction === "buy" ? "Buy" : "Sell"} {TEMPLATE_LABELS[template]}
            </span>
            {TEMPLATE_HAS_SIDE[template] && (
              <select
                className={field + " w-auto"}
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
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <label className="block">
              <span className={labelCls}>Center (listed)</span>
              <StrikeSelect
                listed={frontStrikes}
                value={centerStrike || atmCenter || spotPrice}
                center={atmCenter || spotPrice}
                radiusN={80}
                testId="builder-center-strike"
                onChange={(c) => {
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
            </label>
            <label className="block">
              <span className={labelCls}>Width (listed points)</span>
              <div className="flex gap-1">
                {wingChoices.length > 0 ? (
                  <select
                    className={field}
                    value={
                      wingChoices.includes(wingWidth)
                        ? wingWidth
                        : wingChoices.find((c) => c >= wingWidth) ??
                          wingChoices[0]
                    }
                    onChange={(e) => {
                      const w = Math.max(0, parseFloat(e.target.value) || 0);
                      setWingWidth(w);
                      regenerate(
                        template,
                        centerStrike || atmCenter || spotPrice,
                        w,
                        optionSide,
                        direction,
                        position.expiration,
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
                ) : null}
                <input
                  className={field + (wingChoices.length ? " w-24" : "")}
                  type="number"
                  min={1}
                  step={1}
                  title="Any width — snaps to listed wings on regenerate"
                  value={wingWidth || ""}
                  onChange={(e) => {
                    const w = Math.max(0, parseFloat(e.target.value) || 0);
                    setWingWidth(w);
                    regenerate(
                      template,
                      centerStrike || atmCenter || spotPrice,
                      w || DEFAULT_CREATE_WING_WIDTH,
                      optionSide,
                      direction,
                      position.expiration,
                      backExpiration,
                    );
                  }}
                />
              </div>
            </label>
            <label className="block">
              <span className={labelCls}>Front exp</span>
              {hasExps ? (
                <select
                  className={field}
                  value={
                    // Always show a listed value if possible (never blank/fault)
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
                  className={field}
                  type="date"
                  value={position.expiration}
                  onChange={(e) =>
                    setPosition((p) => ({ ...p, expiration: e.target.value }))
                  }
                />
              )}
            </label>
          </div>

          {isTimeSpread && (
            <label className="block max-w-xs">
              <span className={labelCls}>Back exp</span>
              {(() => {
                const after = chain.expirations.filter(
                  (e) => e > position.expiration,
                );
                // Always offer something — prefer next after front, else any listed
                const choices =
                  after.length > 0
                    ? after
                    : chain.expirations.length
                      ? chain.expirations
                      : [position.expiration || frontDefault || etYmd()];
                const value = choices.includes(backExpiration)
                  ? backExpiration
                  : choices[0];
                if (value && value !== backExpiration) {
                  // keep state coherent without faulting the UI
                  // (sync on next interaction / regenerate)
                }
                return (
                  <select
                    className={field}
                    value={value}
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
                    {choices.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                );
              })()}
            </label>
          )}

          {/* Live package DEBIT / CREDIT strip — unlocked unless limit override set */}
          <div
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--color-separator)] bg-[var(--color-fill)]/50 px-3 py-2"
            data-testid="builder-package-economics"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                  Package (natural mid)
                </span>
                <span
                  className={
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide " +
                    (overrideActive
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-emerald-500/20 text-emerald-300")
                  }
                  data-testid="builder-price-lock-state"
                  data-locked={overrideActive ? "1" : "0"}
                >
                  {overrideActive ? "Limit override" : "Live · unlocked"}
                </span>
              </div>
              <div
                className={
                  "font-mono text-xl font-semibold tabular-nums " +
                  (eco.side === "CREDIT"
                    ? "text-emerald-600"
                    : eco.side === "DEBIT"
                      ? "text-rose-600"
                      : "text-[var(--color-label-tertiary)]")
                }
                data-testid="builder-live-package-price"
              >
                {overrideActive && position.net_debit_override != null
                  ? `LIMIT ${Math.abs(position.net_debit_override).toFixed(2)}`
                  : formatPackageSide(eco)}
              </div>
            </div>
            <div className="text-right text-[11px] text-[var(--color-label-secondary)]">
              {chain.loading ? (
                <span>Updating mids…</span>
              ) : overrideActive ? (
                <span>Limit set · live tracks when unlocked</span>
              ) : !eco.complete ? (
                <span>
                  Filling mids
                  {eco.missingMids > 0
                    ? ` (${eco.missingMids} pending)`
                    : ""}
                  · structure ready
                </span>
              ) : (
                <span>
                  Live · unlocked · tracks mids
                  {eco.signedNatural != null &&
                  eco.signedMid != null &&
                  Math.abs(eco.signedNatural - eco.signedMid) > 0.005
                    ? ` · nat≈ ${eco.signedNatural >= 0 ? "CREDIT" : "DEBIT"} ${Math.abs(eco.signedNatural).toFixed(2)}`
                    : ""}
                </span>
              )}
            </div>
          </div>

          <div>
            <span className={labelCls}>Legs · live mids · package contrib</span>
            <div className="overflow-x-auto rounded-lg border border-[var(--color-separator)]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--color-fill)] text-[10px] uppercase text-[var(--color-label-tertiary)]">
                  <tr>
                    <th className="px-2 py-1.5">Qty</th>
                    <th className="px-2 py-1.5">Strike</th>
                    <th className="px-2 py-1.5">Type</th>
                    <th className="px-2 py-1.5">Exp</th>
                    <th className="px-2 py-1.5">Mid</th>
                    <th className="px-2 py-1.5">Contrib</th>
                    <th className="px-2 py-1.5">IV</th>
                    <th className="px-2 py-1.5" />
                  </tr>
                </thead>
                <tbody>
                  {position.legs.map((leg, i) => {
                    const exp = (leg.expiration || position.expiration).slice(
                      0,
                      10,
                    );
                    const legStrikes = chain.getStrikes(exp);
                    const legEco = eco.legs[i];
                    const contrib = legEco?.contribMid;
                    return (
                      <tr
                        key={i}
                        className="border-t border-[var(--color-separator)]"
                      >
                        <td className="px-2 py-1">
                          <input
                            className={field + " w-16"}
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
                        <td className="px-2 py-1">
                          <StrikeSelect
                            listed={legStrikes}
                            value={leg.strike}
                            center={atmCenter || spotPrice}
                            radiusN={80}
                            className="min-w-[5.5rem]"
                            testId={`builder-leg-strike-${i}`}
                            onChange={(s) => updateLeg(i, { strike: s })}
                          />
                        </td>
                        <td className="px-2 py-1">
                          <button
                            type="button"
                            className={btn + " !min-h-8 !px-2 !text-xs"}
                            onClick={() =>
                              updateLeg(i, {
                                type: leg.type === "call" ? "put" : "call",
                              })
                            }
                          >
                            {leg.type === "call" ? "Call" : "Put"}
                          </button>
                        </td>
                        <td
                          className="px-2 py-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {hasExps ? (
                            <select
                              className={field + " min-w-[6.5rem] !py-1 !text-[11px]"}
                              value={
                                chain.expirations.includes(exp)
                                  ? exp
                                  : chain.expirations[0] || exp
                              }
                              title="Per-leg expiration (any listed)"
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
                            <span className="font-mono text-[11px]">
                              {exp.slice(5)}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-1 font-mono text-emerald-600 dark:text-emerald-400">
                          {leg.entry_price > 0
                            ? leg.entry_price.toFixed(2)
                            : "—"}
                        </td>
                        <td
                          className={
                            "px-2 py-1 font-mono tabular-nums " +
                            (contrib == null
                              ? "text-[var(--color-label-tertiary)]"
                              : contrib >= 0
                                ? "text-emerald-600"
                                : "text-rose-600")
                          }
                          title="Contribution to package (long −mid · short +mid)"
                        >
                          {contrib == null
                            ? "—"
                            : `${contrib >= 0 ? "+" : ""}${contrib.toFixed(2)}`}
                        </td>
                        <td className="px-2 py-1 font-mono text-[var(--color-label-tertiary)]">
                          {leg.volatility != null
                            ? (leg.volatility * 100).toFixed(1) + "%"
                            : "—"}
                        </td>
                        <td className="px-2 py-1">
                          <button
                            type="button"
                            className="text-red-400"
                            disabled={position.legs.length <= 1}
                            onClick={() => removeLeg(i)}
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
            <button type="button" className={btn + " mt-2"} onClick={addLeg}>
              + Add leg
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={labelCls}>
                Limit override (optional — leave empty for live unlocked)
              </span>
              <input
                className={field}
                type="number"
                step="0.01"
                value={
                  position.net_debit_override != null
                    ? position.net_debit_override
                    : ""
                }
                placeholder={
                  eco.complete && displayCost > 0
                    ? `live ${displayCost.toFixed(2)} · unlocked`
                    : "awaiting mids · unlocked"
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
              <p className="mt-0.5 text-[10px] text-[var(--color-label-tertiary)]">
                Live {formatPackageSide(eco)}
                {overrideActive
                  ? " · limit override active (locked basis on save)"
                  : " · unlocked — tracks chain mids"}
              </p>
            </label>
            <label className="block">
              <span className={labelCls}>Packages</span>
              <input
                className={field}
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
            </label>
          </div>

          <div>
            <span className={labelCls}>ToS script</span>
            <button
              type="button"
              className="block w-full rounded-lg border border-emerald-900/50 bg-black px-3 py-2 text-left font-mono text-[11px] text-emerald-400 hover:bg-zinc-950"
              data-testid="builder-tos-script"
              onClick={() => {
                if (!tosScript) return;
                void navigator.clipboard.writeText(tosScript).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1200);
                });
              }}
            >
              {tosScript || "—"}
              <span className="ml-2 text-[10px] text-emerald-600/80">
                {copied ? "Copied" : "click to copy"}
              </span>
            </button>
          </div>

          <div className="rounded-lg border border-[var(--color-separator)] bg-[var(--color-fill)]/40 p-3 text-sm">
            <div className="font-semibold text-[var(--color-label)]">
              {previewLabel}
            </div>
            <div className="font-mono text-xs text-[var(--color-label-secondary)]">
              {previewNotation}
            </div>
            <div
              className={
                "mt-1 font-mono text-sm font-semibold " +
                (eco.side === "CREDIT"
                  ? "text-emerald-600"
                  : eco.side === "DEBIT"
                    ? "text-rose-600"
                    : "text-[var(--color-label-tertiary)]")
              }
            >
              {overrideActive && position.net_debit_override != null
                ? `LIMIT ${Math.abs(position.net_debit_override).toFixed(2)}`
                : formatPackageSide(eco)}
              {position.contracts > 1 ? ` × ${position.contracts}` : ""}
              <span className="ml-2 text-[10px] font-medium text-[var(--color-label-tertiary)]">
                {overrideActive ? "override" : "live · unlocked"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--color-separator)] px-4 py-3">
          <button type="button" className={btn} onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={btnPrimary}
            data-testid="position-builder-analyze"
            onClick={() => {
              // Never fault — ensure a structure exists, then hand off
              let legs = position.legs;
              let exp = position.expiration;
              if (!legs.length) {
                const front =
                  pickDefaultFrontExpiration(chain.expirations, marketLive) ||
                  exp ||
                  frontDefault ||
                  etYmd();
                exp = front;
                regenerate(
                  template,
                  centerStrike || atmCenter || spotPrice || 100,
                  wingWidth || DEFAULT_CREATE_WING_WIDTH,
                  optionSide,
                  direction,
                  front,
                  backExpiration,
                );
                // regenerate is async to state — build legs synchronously for save
                const listed = chain.getStrikes(front);
                const body =
                  snapToListed(
                    centerStrike || atmCenter || spotPrice || 100,
                    listed,
                  ) ??
                  (listed.length
                    ? listed[Math.floor(listed.length / 2)]
                    : centerStrike || atmCenter || spotPrice || 100);
                const w =
                  listed.length
                    ? listedWidthPoints(
                        body,
                        wingWidth || DEFAULT_CREATE_WING_WIDTH,
                        listed,
                      ) || DEFAULT_CREATE_WING_WIDTH
                    : wingWidth || DEFAULT_CREATE_WING_WIDTH;
                legs = butterflyLegs(body, w, optionSide);
                if (direction === "sell") legs = flipLegs(legs);
                legs = priceLegs(legs, front);
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
            }}
          >
            {mode === "edit" ? "Update" : "Analyze"}
          </button>
        </div>
    </div>
  );
}
