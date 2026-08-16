/**
 * Strategy list shared with Options Lab Create Position.
 * Batman is a FatTail favorite (call fly + put fly), not an OL template.
 */

import type { TemplateType } from "@/lib/options-lab/positionTypes";

export type DesignStrategyId = TemplateType | "batman";

export const TEMPLATE_LABELS: Record<DesignStrategyId, string> = {
  batman: "Batman",
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

/** Other (non-fly) strategies — fully supported, used less often. */
export const OTHER_STRATEGIES: DesignStrategyId[] = [
  "vertical",
  "single",
  "condor",
  "straddle",
  "strangle",
  "iron_fly",
  "iron_condor",
  "calendar",
  "diagonal",
];

/** Design picker: Butterflies first, then Other. */
export const STRATEGY_GROUPS: { label: string; items: DesignStrategyId[] }[] = [
  { label: "Butterflies", items: ["batman", "butterfly", "bwb"] },
  { label: "Other", items: OTHER_STRATEGIES },
];

export type BrokenSide = "far" | "near";

export type FlyTypeId =
  | "batman_sym"
  | "batman_far"
  | "fly_atm"
  | "fly_otm_call"
  | "fly_otm_put"
  | "fly_otm_call_far"
  | "fly_otm_call_near";

export type FlyType = {
  id: FlyTypeId;
  label: string;
  template: "batman" | "butterfly";
  placement: "atm" | "otm";
  right?: "call" | "put";
  style: "symmetric" | "broken";
  brokenSide?: BrokenSide;
  diagram: string;
};

/** The fly book — primary Strategy Lab set (Pictures/flies). */
export const FLY_TYPES: FlyType[] = [
  {
    id: "batman_sym",
    label: "Symmetric Batman",
    template: "batman",
    placement: "atm",
    style: "symmetric",
    diagram: "M2,20 L8,20 L16,5 L24,20 L36,20 L44,5 L52,20 L58,20",
  },
  {
    id: "batman_far",
    label: "Broken Far Wing Batman",
    template: "batman",
    placement: "atm",
    style: "broken",
    brokenSide: "far",
    diagram: "M8,20 L14,6 L30,20 L34,20 L50,6 L56,20",
  },
  {
    id: "fly_atm",
    label: "ATM Symmetric Fly",
    template: "butterfly",
    placement: "atm",
    style: "symmetric",
    diagram: "M2,18 L12,18 L30,4 L48,18 L58,18",
  },
  {
    id: "fly_otm_call",
    label: "OTM Symmetric Call Fly",
    template: "butterfly",
    placement: "otm",
    right: "call",
    style: "symmetric",
    diagram: "M2,18 L18,18 L38,4 L52,18 L58,18",
  },
  {
    id: "fly_otm_put",
    label: "OTM Symmetric Put Fly",
    template: "butterfly",
    placement: "otm",
    right: "put",
    style: "symmetric",
    diagram: "M2,18 L8,18 L22,4 L42,18 L58,18",
  },
  {
    id: "fly_otm_call_far",
    label: "OTM Broken Far Wing Call Fly",
    template: "butterfly",
    placement: "otm",
    right: "call",
    style: "broken",
    brokenSide: "far",
    diagram: "M2,18 L20,18 L36,5 L44,12 L58,12",
  },
  {
    id: "fly_otm_call_near",
    label: "OTM Broken Near Wing Call Fly",
    template: "butterfly",
    placement: "otm",
    right: "call",
    style: "broken",
    brokenSide: "near",
    diagram: "M2,12 L20,12 L34,5 L50,20 L58,20",
  },
];

export function isFlyTypeId(v: unknown): v is FlyTypeId {
  return typeof v === "string" && FLY_TYPES.some((f) => f.id === v);
}

export function flyTypeById(id: FlyTypeId): FlyType {
  return FLY_TYPES.find((f) => f.id === id) ?? FLY_TYPES[0];
}

/** Derive the fly-book type from saved config, or null if an Other strategy. */
export function flyTypeFromConfig(config: {
  strategy_template?: unknown;
  butterfly_family?: unknown;
  batman_style?: unknown;
  placement?: unknown;
  option_right?: unknown;
  broken_side?: unknown;
}): FlyType | null {
  const raw = String(config.strategy_template || "");
  const fam = String(config.butterfly_family || "");
  const isBatman = raw === "batman" || fam === "batman" || fam === "symmetric";
  const isFly = raw === "butterfly" || raw === "bwb";
  if (isBatman) {
    return flyTypeById(
      config.batman_style === "broken" ? "batman_far" : "batman_sym",
    );
  }
  if (!isFly) return null;
  const otm = config.placement === "otm";
  const put = config.option_right === "put";
  const broken =
    raw === "bwb" ||
    config.batman_style === "broken" ||
    config.broken_side === "far" ||
    config.broken_side === "near";
  const near = config.broken_side === "near";
  if (!otm && !broken) return flyTypeById("fly_atm");
  if (!broken && put) return flyTypeById("fly_otm_put");
  if (!broken) return flyTypeById("fly_otm_call");
  if (near) return flyTypeById("fly_otm_call_near");
  return flyTypeById("fly_otm_call_far");
}

export const TEMPLATE_HAS_RIGHT: Record<DesignStrategyId, boolean> = {
  batman: false,
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

/** Symmetric Batman — two equal OTM flies (ears). */
export const BATMAN_DIAGRAM =
  "M2,20 L8,20 L16,5 L24,20 L36,20 L44,5 L52,20 L58,20";

/** Broken Batman — far wing tighter than the inner (closest-to-spot) wing. */
export const BATMAN_BROKEN_DIAGRAM =
  "M8,20 L14,6 L30,20 L34,20 L50,6 L56,20";

export const STRATEGY_DIAGRAMS: Record<DesignStrategyId, string> = {
  batman: BATMAN_DIAGRAM,
  single: "M2,22 L58,6",
  vertical: "M2,22 L20,22 L40,6 L58,6",
  butterfly: "M2,18 L12,18 L30,4 L48,18 L58,18",
  bwb: "M2,18 L12,18 L28,4 L52,18 L58,18",
  condor: "M2,18 L10,18 L20,6 L40,6 L50,18 L58,18",
  straddle: "M2,6 L30,22 L58,6",
  strangle: "M2,6 L18,18 L42,18 L58,6",
  iron_fly: "M2,6 L12,6 L30,20 L48,6 L58,6",
  iron_condor: "M2,6 L10,6 L20,18 L40,18 L50,6 L58,6",
  calendar: "M2,16 L20,10 L30,6 L40,10 L58,16",
  diagonal: "M2,18 L20,12 L32,6 L44,10 L58,16",
};

export const FLY_TEMPLATES = new Set<DesignStrategyId>([
  "batman",
  "butterfly",
  "bwb",
]);

/** Width + short-strike gap apply. */
export const SYMMETRIC_TEMPLATES = new Set<DesignStrategyId>([
  "batman",
  "butterfly",
  "bwb",
  "condor",
  "iron_fly",
  "iron_condor",
]);

export function isSymmetricStrategy(t: DesignStrategyId): boolean {
  return SYMMETRIC_TEMPLATES.has(t);
}

export function hasSpreadWidth(t: DesignStrategyId): boolean {
  return t !== "single" && t !== "straddle" && t !== "calendar";
}

export function isDesignStrategy(v: unknown): v is DesignStrategyId {
  return typeof v === "string" && v in TEMPLATE_LABELS;
}

export function batmanDiagram(style: unknown): string {
  return style === "broken" ? BATMAN_BROKEN_DIAGRAM : BATMAN_DIAGRAM;
}

export function familyFromTemplate(t: DesignStrategyId): string {
  if (t === "batman") return "batman";
  if (t === "bwb") return "broken_wing";
  if (t === "butterfly") return "single";
  return "single";
}
