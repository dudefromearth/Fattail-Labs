/**
 * ToS card — columns, field exposure, rebuild, per-leg patch (PC8).
 */

import {
  applyEditPatch,
  scaleCardPos,
  type AnalyzerPosition,
} from "./analyzerBook";
import { bsGreeks, fractionalT } from "./blackScholes";
import {
  boundSelectValue,
  offeredTemplates,
  stepListedStrike,
} from "./chainControls";
import {
  buildListedStructure,
  inferStructureCenter,
  type StructureTemplate,
} from "./listedStructure";
import { buildLabel, buildNotation } from "./positionLabels";
import { posAndRatio, scaleLegPos, signedActualQty } from "./positionQty";
import { flipLegs } from "./positionTemplates";
import type { LegInput, OptionRight, TemplateType } from "./positionTypes";
import {
  catalogName,
  type CatalogName,
} from "./structureClassifier";
import { tickSize } from "./tickSize";

export const CARD_COLUMNS = [
  "SPREAD",
  "SIDE",
  "QTY",
  "SYMBOL",
  "EXP",
  "STRIKE",
  "TYPE",
  "PRICE",
  "VOL",
  "DELTA",
] as const;

export type CardColumn = (typeof CARD_COLUMNS)[number];

export const QTY_QUICK_PICK = [1, 2, 5, 10, 20] as const;

export const SPREAD_TEMPLATES: TemplateType[] = [
  "single",
  "vertical",
  "butterfly",
  "bwb",
  "condor",
  "straddle",
  "strangle",
  "iron_fly",
  "iron_condor",
  "calendar",
  "diagonal",
];

export const TEMPLATE_LABELS: Record<TemplateType, string> = {
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

const NAME_TO_TEMPLATE: Record<CatalogName, TemplateType | null> = {
  Single: "single",
  Vertical: "vertical",
  Butterfly: "butterfly",
  BWB: "bwb",
  Condor: "condor",
  Straddle: "straddle",
  Strangle: "strangle",
  "Iron Fly": "iron_fly",
  "Iron Condor": "iron_condor",
  Calendar: "calendar",
  Diagonal: "diagonal",
  CUSTOM: null,
};

export type FieldExposure = "row1" | "per-leg" | "inert";

export type CardFieldExposure = {
  spread: FieldExposure;
  side: FieldExposure;
  qty: FieldExposure;
  expiration: FieldExposure;
  strike: FieldExposure;
  type: FieldExposure;
  price: FieldExposure;
};

export function catalogToTemplate(name: CatalogName): TemplateType | null {
  return NAME_TO_TEMPLATE[name];
}

export function templateToCatalog(t: TemplateType): CatalogName {
  return TEMPLATE_LABELS[t] as CatalogName;
}

/**
 * Which of the seven card fields are live for this classified name.
 * Per-leg strike / qty / date / right stay legal (PC-STRAT-9); this table
 * is the convenience / chrome exposure used by AT-PC-63.
 */
export function cardFieldExposure(name: CatalogName): CardFieldExposure {
  const twoDate = name === "Calendar" || name === "Diagonal";
  const bothRights =
    name === "Straddle" ||
    name === "Strangle" ||
    name === "Iron Fly" ||
    name === "Iron Condor";
  const custom = name === "CUSTOM";
  return {
    spread: "row1",
    side: "row1",
    qty: "row1",
    expiration: twoDate || custom ? "per-leg" : "row1",
    strike: "per-leg",
    type: custom ? "per-leg" : bothRights ? "inert" : "row1",
    price: "row1",
  };
}

export function offeredCardTemplates(expCount: number): TemplateType[] {
  return offeredTemplates(expCount, SPREAD_TEMPLATES);
}

export function groupPositionsBySymbol(
  positions: readonly AnalyzerPosition[],
  order: readonly string[],
): { symbol: string; positions: AnalyzerPosition[] }[] {
  const buckets = new Map<string, AnalyzerPosition[]>();
  for (const p of positions) {
    const s = (p.position.underlying || "").toUpperCase() || "—";
    const list = buckets.get(s);
    if (list) list.push(p);
    else buckets.set(s, [p]);
  }
  const seen = new Set<string>();
  const out: { symbol: string; positions: AnalyzerPosition[] }[] = [];
  for (const s of order) {
    const key = s.toUpperCase();
    const list = buckets.get(key);
    if (!list) continue;
    seen.add(key);
    out.push({ symbol: key, positions: list });
  }
  for (const [symbol, list] of buckets) {
    if (seen.has(symbol)) continue;
    out.push({ symbol, positions: list });
  }
  return out;
}

export function moveSymbolInOrder(
  order: readonly string[],
  symbol: string,
  dir: "up" | "down",
): string[] {
  const next = [...order];
  const i = next.findIndex((s) => s.toUpperCase() === symbol.toUpperCase());
  if (i < 0) return next;
  const j = dir === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= next.length) return next;
  const tmp = next[i];
  next[i] = next[j];
  next[j] = tmp;
  return next;
}

function inferWingWidth(legs: readonly LegInput[]): number {
  const center = inferStructureCenter(legs);
  const dists = [
    ...new Set(legs.map((l) => l.strike)),
  ]
    .map((s) => Math.abs(s - center))
    .filter((d) => d > 1e-9);
  if (!dists.length) return 5;
  return Math.min(...dists);
}

function majorityRight(legs: readonly LegInput[]): OptionRight {
  const calls = legs.filter((l) => l.type === "call").length;
  const puts = legs.length - calls;
  return puts > calls ? "put" : "call";
}

function applyTemplateExpirations(
  template: StructureTemplate,
  legs: LegInput[],
  front: string,
  back: string | null,
): LegInput[] {
  const f = front.slice(0, 10);
  const b = (back || front).slice(0, 10);
  if (template === "calendar" || template === "diagonal") {
    return legs.map((l) => ({
      ...l,
      expiration: l.side === "long" ? b : f,
    }));
  }
  return legs.map((l) => ({ ...l, expiration: f }));
}

/**
 * PC-VOCAB-9 / PC-STRAT-8: picker change rebuilds from the structure seed
 * and moves the basis to CHECK PRICE (via applyEditPatch).
 */
export function rebuildCardFromTemplate(
  pos: AnalyzerPosition,
  template: StructureTemplate,
  listed: readonly number[],
  listedExps?: readonly string[],
): AnalyzerPosition {
  const { pos: lot } = posAndRatio(pos.position.legs);
  const center = inferStructureCenter(pos.position.legs);
  const width = inferWingWidth(pos.position.legs);
  const side = majorityRight(pos.position.legs);
  const built = buildListedStructure({
    template,
    listed,
    preferCenter: center || listed[Math.floor(listed.length / 2)] || 0,
    preferWidth: width,
    optionSide: side,
  });
  if (!built) return pos;

  let legs = scaleLegPos(built.legs, lot);
  if (pos.position.direction === "sell") legs = flipLegs(legs);

  const front = (pos.position.expiration || "").slice(0, 10);
  const sorted = (listedExps || [])
    .map((e) => e.slice(0, 10))
    .filter((e) => /^\d{4}-\d{2}-\d{2}$/.test(e))
    .sort();
  const back =
    sorted.find((e) => e > front) || sorted[1] || sorted[0] || front;
  legs = applyTemplateExpirations(template, legs, front, back);

  const input = {
    ...pos.position,
    contracts: 1,
    legs,
  };
  return applyEditPatch(
    pos,
    input,
    buildLabel(input.underlying, legs, input.expiration),
    buildNotation(legs),
  );
}

export function patchCardLeg(
  pos: AnalyzerPosition,
  recordIndex: number,
  patch: Partial<LegInput>,
): AnalyzerPosition {
  if (recordIndex < 0 || recordIndex >= pos.position.legs.length) return pos;
  const legs = pos.position.legs.map((l, i) =>
    i === recordIndex ? { ...l, ...patch } : l,
  );
  const input = { ...pos.position, legs };
  return applyEditPatch(
    pos,
    input,
    buildLabel(input.underlying, legs, input.expiration),
    buildNotation(legs),
  );
}

export function setCardRight(
  pos: AnalyzerPosition,
  right: OptionRight,
): AnalyzerPosition {
  const legs = pos.position.legs.map((l) => ({ ...l, type: right }));
  const input = { ...pos.position, legs };
  return applyEditPatch(
    pos,
    input,
    buildLabel(input.underlying, legs, input.expiration),
    buildNotation(legs),
  );
}

export function stepCardPrice(
  product: string,
  premium: number,
  dir: "up" | "down",
): number {
  const mag = Math.abs(premium);
  const tick = tickSize(product, mag);
  const next = dir === "up" ? mag + tick : mag - tick;
  return Math.max(tick, Math.round(next / tick) * tick);
}

export function stepCardStrike(
  current: number,
  listed: readonly number[],
  dir: "up" | "down",
): number {
  return stepListedStrike(current, listed, dir);
}

export function packageDelta(
  legs: readonly LegInput[],
  spot: number,
  nowMs = Date.now(),
): number | null {
  if (!(spot > 0) || !legs.length) return null;
  let sum = 0;
  let any = false;
  for (const leg of legs) {
    const exp = (leg.expiration || "").slice(0, 10);
    if (!exp) continue;
    const T = fractionalT(exp, nowMs);
    let sigma = leg.volatility;
    if (sigma == null || !Number.isFinite(sigma) || sigma <= 0) continue;
    if (sigma > 2) sigma = sigma / 100;
    const g = bsGreeks(spot, leg.strike, T, 0.05, sigma, leg.type === "call");
    const signed = (leg.side === "long" ? 1 : -1) * Math.abs(leg.quantity);
    sum += g.delta * signed;
    any = true;
  }
  return any ? sum : null;
}

export function fmtPackageDelta(d: number | null): string {
  if (d == null || !Number.isFinite(d)) return "—";
  return d.toFixed(4);
}

/** Card and dialog — IV cell. Decimal or percent in, percent out. */
export function fmtIv(vol: number | undefined): string {
  if (vol == null || !Number.isFinite(vol)) return "—";
  const pct = vol > 0 && vol <= 2 ? vol * 100 : vol;
  return `${pct.toFixed(2)}%`;
}

export { boundSelectValue, signedActualQty, scaleCardPos, catalogName };
