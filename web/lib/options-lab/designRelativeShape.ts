/**
 * Relative expiration shape for Design Position Builder.
 * Strikes are offsets from a fictional ATM (100). Not listed OPF strikes.
 */

import type { StrategyConfig } from "@/lib/strategyPacks";
import { isDesignStrategy, type DesignStrategyId } from "./strategyCatalog";
import type { ParsedTosLeg } from "./tosParser";

export const SHAPE_ATM = 100;

export type ShapeHandleKind = "center" | "wing" | "body" | "extra";

export type ShapeHandle = {
  id: string;
  kind: ShapeHandleKind;
  strike: number;
  /** Batman ear short — drag widths from here, not package ATM. */
  ear?: number;
};

export type RelativeShape = {
  template: DesignStrategyId;
  legs: ParsedTosLeg[];
  debit: number;
  handles: ShapeHandle[];
  center: number;
  wing: number;
};

function currentTemplate(config: StrategyConfig): DesignStrategyId {
  const raw = config.strategy_template;
  if (isDesignStrategy(raw)) return raw;
  const fam = String(config.butterfly_family || "");
  if (fam === "batman" || fam === "symmetric") return "batman";
  if (fam === "broken_wing") return "bwb";
  if (fam === "single") return "butterfly";
  return "batman";
}

function signed(qty: number, side: "buy" | "sell"): number {
  return side === "sell" ? -qty : qty;
}

function leg(
  strike: number,
  right: "call" | "put",
  qty: number,
  side: "buy" | "sell",
): ParsedTosLeg {
  return {
    strike,
    quantity: signed(qty, side),
    right,
    expiration: "2099-01-01",
  };
}

/** Visual points per listed-strike step (Design relative plane only). */
export const STRIKE_PT = 5;

/** Default fly width, in strikes. */
export const DEFAULT_WING_STRIKES = 4;

/**
 * Batman short-strike gap so the two ears stay OTM about ATM.
 * gap = 2 × width → inner longs meet at ATM (two peaks).
 * gap = width collapses the package into a condor plateau — never the default.
 */
export function batmanDefaultShorts(wingStrikes: number): number {
  const w = asStrikes(wingStrikes, DEFAULT_WING_STRIKES);
  return Math.max(2, 2 * w);
}

/** Design widths are strike counts. Legacy point values (≥10) convert. */
export function asStrikes(raw: unknown, fallback = DEFAULT_WING_STRIKES): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  if (n >= 10) return Math.max(1, Math.round(n / STRIKE_PT));
  return Math.max(1, Math.round(n));
}

export function strikesToPts(n: number): number {
  return Math.max(1, Math.round(n)) * STRIKE_PT;
}

export function relativeShape(config: StrategyConfig): RelativeShape {
  const template = currentTemplate(config);
  const side = config.trade_side === "sell" ? "sell" : "buy";
  const placement = config.placement === "otm" ? "otm" : "atm";
  const right = config.option_right === "put" ? "put" : "call";
  const dir = right === "put" ? -1 : 1;
  const wingStrikes = asStrikes(config.wing_width);
  const wing = strikesToPts(wingStrikes);
  const shorts = Math.max(0, Math.round(Number(config.short_gap) || 0));
  const body = shorts > 0 ? strikesToPts(shorts) : 0;
  // OTM geometry only — R2R is Risk & Capital, not a strike offset.
  const center = placement === "otm" ? SHAPE_ATM + dir * wing : SHAPE_ATM;

  const legs: ParsedTosLeg[] = [];
  const handles: ShapeHandle[] = [
    { id: "center", kind: "center", strike: center },
  ];

  const addFly = (c: number, w: number, r: "call" | "put", extraHi = 0) => {
    const hi = w + extraHi;
    legs.push(
      leg(c - w, r, 1, side),
      leg(c, r, -2, side),
      leg(c + hi, r, 1, side),
    );
    handles.push(
      { id: `wing-lo-${r}`, kind: "wing", strike: c - w },
      { id: `wing-hi-${r}`, kind: extraHi ? "extra" : "wing", strike: c + hi },
    );
  };

  switch (template) {
    case "single":
      legs.push(leg(center, right, 1, side));
      break;
    case "vertical":
      if (right === "call") {
        legs.push(leg(center, "call", 1, side), leg(center + wing, "call", -1, side));
        handles.push({ id: "wing", kind: "wing", strike: center + wing });
      } else {
        legs.push(leg(center, "put", 1, side), leg(center - wing, "put", -1, side));
        handles.push({ id: "wing", kind: "wing", strike: center - wing });
      }
      break;
    case "batman": {
      // Two butterflies, mirrored OTM about spot — two peaks (ears).
      // Default gap is 2×width so inner longs meet at ATM. gap===width is a condor.
      // Symmetric: equal wings. Broken: further-out wing < inner (closest) wing.
      const gapStrikes =
        shorts > 0 ? shorts : batmanDefaultShorts(wingStrikes);
      const ear = strikesToPts(gapStrikes);
      const putC = center - ear / 2;
      const callC = center + ear / 2;
      const broken = String(config.batman_style || "") === "broken";
      const inner = wing;
      const outerStrikes = broken
        ? Math.min(asStrikes(config.outer_width, Math.max(1, wingStrikes - 1)), wingStrikes - 1)
        : wingStrikes;
      const outer = strikesToPts(Math.max(1, outerStrikes));
      const addEar = (c: number, r: "call" | "put") => {
        const toward = r === "call" ? c - inner : c + inner;
        const away = r === "call" ? c + outer : c - outer;
        legs.push(leg(toward, r, 1, side), leg(c, r, -2, side), leg(away, r, 1, side));
        handles.push(
          { id: `inner-${r}`, kind: "wing", strike: toward, ear: c },
          { id: `outer-${r}`, kind: "extra", strike: away, ear: c },
        );
      };
      addEar(putC, "put");
      addEar(callC, "call");
      handles.push(
        { id: "body-lo", kind: "body", strike: putC, ear: putC },
        { id: "body-hi", kind: "body", strike: callC, ear: callC },
      );
      break;
    }
    case "butterfly":
    case "bwb": {
      const broken =
        template === "bwb" ||
        String(config.batman_style || "") === "broken" ||
        config.broken_side === "far" ||
        config.broken_side === "near";
      const near = String(config.broken_side || "") === "near";
      const inner = wing;
      const outerStrikes = !broken
        ? wingStrikes
        : near
          ? Math.max(wingStrikes + 1, asStrikes(config.outer_width, wingStrikes + 2))
          : Math.min(asStrikes(config.outer_width, Math.max(1, wingStrikes - 1)), wingStrikes - 1);
      const outer = strikesToPts(Math.max(1, outerStrikes));
      const toward = right === "call" ? center - inner : center + inner;
      const away = right === "call" ? center + outer : center - outer;
      legs.push(
        leg(toward, right, 1, side),
        leg(center, right, -2, side),
        leg(away, right, 1, side),
      );
      handles.push(
        { id: "inner", kind: "wing", strike: toward, ear: center },
        { id: "outer", kind: "extra", strike: away, ear: center },
      );
      break;
    }
    case "condor":
    case "iron_condor":
    case "iron_fly": {
      const gap = template === "iron_fly" && body <= 0 ? 0 : Math.max(body, 0);
      const lo = center - gap / 2 - wing;
      const li = center - gap / 2;
      const ri = center + gap / 2;
      const ro = center + gap / 2 + wing;
      if (template === "condor") {
        legs.push(
          leg(lo, right, 1, side),
          leg(li, right, -1, side),
          leg(ri, right, -1, side),
          leg(ro, right, 1, side),
        );
      } else {
        legs.push(
          leg(lo, "put", 1, side),
          leg(li, "put", -1, side),
          leg(ri, "call", -1, side),
          leg(ro, "call", 1, side),
        );
      }
      handles.push(
        { id: "body-lo", kind: "body", strike: li },
        { id: "body-hi", kind: "body", strike: ri },
        { id: "wing-lo", kind: "wing", strike: lo },
        { id: "wing-hi", kind: "wing", strike: ro },
      );
      break;
    }
    case "straddle":
      legs.push(leg(center, "call", 1, side), leg(center, "put", 1, side));
      break;
    case "strangle": {
      const lo = center - wing;
      const hi = center + wing;
      legs.push(leg(lo, "put", 1, side), leg(hi, "call", 1, side));
      handles.push(
        { id: "wing-lo", kind: "wing", strike: lo },
        { id: "wing-hi", kind: "wing", strike: hi },
      );
      break;
    }
    case "calendar":
    case "diagonal":
      legs.push(leg(center, right, 1, side), leg(center + (template === "diagonal" ? wing : 0), right, -1, side));
      if (template === "diagonal") {
        handles.push({ id: "wing", kind: "wing", strike: center + wing });
      }
      break;
    default:
      addFly(center, wing, "call");
  }

  const debit =
    template === "vertical"
      ? wing * 0.4
      : template === "single"
        ? 4
        : wing * 0.12;

  return { template, legs, debit: side === "sell" ? -debit : debit, handles, center, wing };
}

const WIDTH_SNAPS = [10, 15, 20, 25, 30, 50];

export function snapWidth(n: number): number {
  let best = WIDTH_SNAPS[0];
  let d = Math.abs(n - best);
  for (const w of WIDTH_SNAPS) {
    const dd = Math.abs(n - w);
    if (dd < d) {
      best = w;
      d = dd;
    }
  }
  return best;
}

export function snapSteps(offsetPts: number, wing: number): number {
  const raw = Math.round(Math.abs(offsetPts) / Math.max(wing, 1));
  return Math.min(5, Math.max(1, raw || 1));
}
