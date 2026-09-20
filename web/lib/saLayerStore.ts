/** A8–A11 layer registry + prefs. L4/LP slot in here — do not edit L1–L3 to add them. */

export type LayerId = "L0" | "L1" | "L2" | "L3" | "L4" | "LP";
export type DialogPart =
  | LayerId
  | "axis"
  | "grid"
  | "legend"
  | "chips"
  | "range"
  | "mode";
export type AxisSide = "left" | "right" | "both";
export type BarOrient = "ltr" | "rtl";
export type PriceFormat = "line" | "candle" | "bar";
export type PriceTf = "1m" | "5m" | "15m" | "1h" | "1d";
export type WorkflowMode = "morning" | "entry" | "management";
export type CrosshairStyle = "solid" | "dotted" | "dashed" | "largeDashed";

export const AXIS_FONTS = [
  "Trebuchet MS",
  "Segoe UI",
  "Arial",
  "Verdana",
  "Georgia",
  "Courier New",
] as const;
export const AXIS_FONT_SIZES = [10, 11, 12, 13, 14, 16, 18, 20, 24, 26] as const;

export type LayerDef = {
  id: LayerId;
  label: string;
  defaultOn: boolean;
  reserved: boolean;
  inDevelopment?: boolean;
  note: string;
};

export const LAYER_REGISTRY: readonly LayerDef[] = [
  { id: "L0", label: "Backdrop", defaultOn: true, reserved: false, note: "A4 grid/axes" },
  { id: "L1", label: "Price", defaultOn: true, reserved: false, note: "A6 line/candle/bar" },
  { id: "L2", label: "Profile", defaultOn: true, reserved: false, note: "A2 histogram" },
  { id: "L3", label: "Analysis", defaultOn: false, reserved: false, note: "A2 overlay default off" },
  { id: "L4", label: "Footprint", defaultOn: false, reserved: true, note: "Named next — gate closed" },
  {
    id: "LP",
    label: "Position",
    defaultOn: false,
    reserved: true,
    inDevelopment: true,
    note: "L-POSITION in-development — strikes/wings/breakevens when the gate opens (SA-L11)",
  },
];

export type LayerVisible = Record<LayerId, boolean>;

export type ModeSlice = {
  visible: LayerVisible;
  axis: AxisSide;
  orientation: BarOrient;
  priceFormat: PriceFormat;
  priceTf: PriceTf;
  gridIntensity: number;
  canvasBg: string;
  gridColor: string;
  gridOpacity: number;
  vertGridOn: boolean;
  horzGridOn: boolean;
  crosshairColor: string;
  crosshairStyle: CrosshairStyle;
  axisFont: string;
  axisFontSize: number;
  axisTextColor: string;
  scaleLineColor: string;
  marginTop: number;
  marginBottom: number;
  rightOffsetBars: number;
  candleBodyOn: boolean;
  candleBorderOn: boolean;
  candleWickOn: boolean;
  colorByPrevClose: boolean;
  candleUp: string;
  candleDown: string;
  borderUp: string;
  borderDown: string;
  wickUp: string;
  wickDown: string;
  lastPriceOn: boolean;
  lastPriceColor: string;
  hiLoOn: boolean;
  hiColor: string;
  loColor: string;
  profileWidthFrac: number;
  profileOpacity: number;
  priceLookbackDays: number;
  profileMode: "visible-range" | "full-history";
};

export const MODE_SLICE_KEYS: (keyof ModeSlice)[] = [
  "visible",
  "axis",
  "orientation",
  "priceFormat",
  "priceTf",
  "gridIntensity",
  "canvasBg",
  "gridColor",
  "gridOpacity",
  "vertGridOn",
  "horzGridOn",
  "crosshairColor",
  "crosshairStyle",
  "axisFont",
  "axisFontSize",
  "axisTextColor",
  "scaleLineColor",
  "marginTop",
  "marginBottom",
  "rightOffsetBars",
  "candleBodyOn",
  "candleBorderOn",
  "candleWickOn",
  "colorByPrevClose",
  "candleUp",
  "candleDown",
  "borderUp",
  "borderDown",
  "wickUp",
  "wickDown",
  "lastPriceOn",
  "lastPriceColor",
  "hiLoOn",
  "hiColor",
  "loColor",
  "profileWidthFrac",
  "profileOpacity",
  "priceLookbackDays",
  "profileMode",
];

export type SaPrefs = ModeSlice & {
  mode: WorkflowMode;
  legendOn: boolean;
  dialogPos: { x: number; y: number };
  firstRunSeen: boolean;
  spanPreset: "coverage" | "full";
  overrides: Partial<Record<WorkflowMode, Partial<ModeSlice>>>;
  objectDefaults: Partial<Record<DialogPart, Record<string, unknown>>>;
};

export const PREFS_KEY = "ft_sa_lwc_prefs_v4";
export const SA_SURFACE_SCHEMA = 1;

function vis(on: Partial<LayerVisible>): LayerVisible {
  const v = {} as LayerVisible;
  for (const L of LAYER_REGISTRY) {
    v[L.id] = L.reserved ? false : (on[L.id] ?? L.defaultOn);
  }
  return v;
}

/** House defaults — stubbed until Coach tunes from the screen (A11.2). */
export function houseDefaults(mode: WorkflowMode): ModeSlice {
  const base: ModeSlice = {
    visible: vis({ L0: true, L1: true, L2: true, L3: false }),
    axis: "left",
    orientation: "ltr",
    priceFormat: "candle",
    priceTf: "5m",
    gridIntensity: 8,
    canvasBg: "#131722",
    gridColor: "#ffffff",
    gridOpacity: 0.08,
    vertGridOn: true,
    horzGridOn: true,
    crosshairColor: "#758696",
    crosshairStyle: "largeDashed",
    axisFont: "Trebuchet MS",
    axisFontSize: 12,
    axisTextColor: "#d1d4dc",
    scaleLineColor: "#2b2b43",
    marginTop: 0.05,
    marginBottom: 0.05,
    rightOffsetBars: 5,
    candleBodyOn: true,
    candleBorderOn: true,
    candleWickOn: true,
    colorByPrevClose: false,
    candleUp: "#26a69a",
    candleDown: "#ef5350",
    borderUp: "#26a69a",
    borderDown: "#ef5350",
    wickUp: "#26a69a",
    wickDown: "#ef5350",
    lastPriceOn: true,
    lastPriceColor: "#26a69a",
    hiLoOn: false,
    hiColor: "#4caf50",
    loColor: "#ef5350",
    profileWidthFrac: 0.62,
    profileOpacity: 0.42,
    priceLookbackDays: 1,
    profileMode: "visible-range",
  };
  if (mode === "entry") {
    return { ...base, visible: vis({ L0: true, L1: true, L2: true, L3: true }) };
  }
  if (mode === "management") {
    return {
      ...base,
      visible: vis({ L0: true, L1: true, L2: true, L3: true }),
      priceTf: "1h",
    };
  }
  return base;
}

export function defaultPrefs(): SaPrefs {
  const morning = houseDefaults("morning");
  return {
    ...morning,
    mode: "morning",
    legendOn: false,
    dialogPos: { x: 24, y: 72 },
    firstRunSeen: false,
    spanPreset: "coverage",
    overrides: {},
    objectDefaults: {},
  };
}

export function applyMode(
  prefs: SaPrefs,
  mode: WorkflowMode,
): SaPrefs {
  const house = houseDefaults(mode);
  const over = prefs.overrides[mode] || {};
  return {
    ...prefs,
    mode,
    visible: { ...house.visible, ...(over.visible || {}) },
    axis: over.axis ?? house.axis,
    orientation: over.orientation ?? house.orientation,
    priceFormat: over.priceFormat ?? house.priceFormat,
    priceTf: over.priceTf ?? house.priceTf,
    gridIntensity: over.gridIntensity ?? house.gridIntensity,
    canvasBg: over.canvasBg ?? house.canvasBg,
    gridColor: over.gridColor ?? house.gridColor,
    gridOpacity: over.gridOpacity ?? house.gridOpacity,
    vertGridOn: over.vertGridOn ?? house.vertGridOn,
    horzGridOn: over.horzGridOn ?? house.horzGridOn,
    crosshairColor: over.crosshairColor ?? house.crosshairColor,
    crosshairStyle: over.crosshairStyle ?? house.crosshairStyle,
    axisFont: over.axisFont ?? house.axisFont,
    axisFontSize: over.axisFontSize ?? house.axisFontSize,
    axisTextColor: over.axisTextColor ?? house.axisTextColor,
    scaleLineColor: over.scaleLineColor ?? house.scaleLineColor,
    marginTop: over.marginTop ?? house.marginTop,
    marginBottom: over.marginBottom ?? house.marginBottom,
    rightOffsetBars: over.rightOffsetBars ?? house.rightOffsetBars,
    candleBodyOn: over.candleBodyOn ?? house.candleBodyOn,
    candleBorderOn: over.candleBorderOn ?? house.candleBorderOn,
    candleWickOn: over.candleWickOn ?? house.candleWickOn,
    colorByPrevClose: over.colorByPrevClose ?? house.colorByPrevClose,
    candleUp: over.candleUp ?? house.candleUp,
    candleDown: over.candleDown ?? house.candleDown,
    borderUp: over.borderUp ?? house.borderUp,
    borderDown: over.borderDown ?? house.borderDown,
    wickUp: over.wickUp ?? house.wickUp,
    wickDown: over.wickDown ?? house.wickDown,
    lastPriceOn: over.lastPriceOn ?? house.lastPriceOn,
    lastPriceColor: over.lastPriceColor ?? house.lastPriceColor,
    hiLoOn: over.hiLoOn ?? house.hiLoOn,
    hiColor: over.hiColor ?? house.hiColor,
    loColor: over.loColor ?? house.loColor,
    profileWidthFrac: over.profileWidthFrac ?? house.profileWidthFrac,
    profileOpacity: over.profileOpacity ?? house.profileOpacity,
    priceLookbackDays: over.priceLookbackDays ?? house.priceLookbackDays,
    profileMode: over.profileMode ?? house.profileMode,
  };
}

export function recordOverride(
  prefs: SaPrefs,
  slice: Partial<ModeSlice>,
): SaPrefs {
  const prev = prefs.overrides[prefs.mode] || {};
  return {
    ...prefs,
    ...slice,
    overrides: {
      ...prefs.overrides,
      [prefs.mode]: { ...prev, ...slice },
    },
  };
}

export function resetMode(prefs: SaPrefs): SaPrefs {
  const next = { ...prefs.overrides };
  delete next[prefs.mode];
  return applyMode({ ...prefs, overrides: next }, prefs.mode);
}

function mergeLoaded(p: Partial<SaPrefs> | undefined): SaPrefs {
  const base = defaultPrefs();
  if (!p) return base;
  const merged: SaPrefs = {
    ...base,
    ...p,
    visible: { ...base.visible, ...(p.visible || {}) },
    dialogPos: p.dialogPos || base.dialogPos,
    overrides: p.overrides || {},
    objectDefaults: p.objectDefaults || {},
    canvasBg: p.canvasBg || base.canvasBg,
    gridColor: p.gridColor || base.gridColor,
    gridOpacity:
      p.gridOpacity != null
        ? p.gridOpacity
        : typeof p.gridIntensity === "number"
          ? p.gridIntensity / 100
          : base.gridOpacity,
  };
  return applyMode(merged, merged.mode || "morning");
}

/** Browser cache only (A22). Accepts schema-wrapped docs and raw prefs. */
export function loadPrefs(): SaPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return defaultPrefs();
    const parsed = JSON.parse(raw) as
      | { schema?: number; prefs?: Partial<SaPrefs> }
      | Partial<SaPrefs>;
    if (parsed && typeof parsed === "object" && "prefs" in parsed && parsed.prefs) {
      return mergeLoaded(parsed.prefs);
    }
    return mergeLoaded(parsed as Partial<SaPrefs>);
  } catch {
    return defaultPrefs();
  }
}

export function savePrefs(p: SaPrefs): void {
  try {
    localStorage.setItem(
      PREFS_KEY,
      JSON.stringify({ schema: SA_SURFACE_SCHEMA, prefs: p }),
    );
  } catch {
    /* ignore */
  }
}

/** Server document → prefs. Null when the account has no stored surface. */
export function prefsFromServerDoc(doc: unknown): SaPrefs | null {
  if (!doc || typeof doc !== "object") return null;
  const prefs = (doc as { prefs?: unknown }).prefs;
  if (!prefs || typeof prefs !== "object") return null;
  return mergeLoaded(prefs as Partial<SaPrefs>);
}

export function surfaceDoc(prefs: SaPrefs): {
  schema: number;
  prefs: SaPrefs;
} {
  return { schema: SA_SURFACE_SCHEMA, prefs };
}

/** A20 — map a pointer on the price chart to the A10 dialog part. */
export function partFromPointer(opts: {
  x: number;
  y: number;
  w: number;
  h: number;
  axis: AxisSide;
  profileHit?: boolean;
}): DialogPart {
  if (opts.profileHit) return "L2";
  const axisW = 72;
  const timeH = 28;
  if (opts.h > 0 && opts.y > opts.h - timeH) return "range";
  if (opts.axis === "left" || opts.axis === "both") {
    if (opts.x < axisW) return "axis";
  }
  if (opts.axis === "right" || opts.axis === "both") {
    if (opts.w > 0 && opts.x > opts.w - axisW) return "axis";
  }
  return "L0";
}

export function sliceForPart(
  prefs: SaPrefs,
  part: DialogPart,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of lawfulFields(part)) {
    if (f.startsWith("visible.")) {
      const id = f.split(".")[1] as LayerId;
      const vis = (out.visible as LayerVisible) || { ...prefs.visible };
      vis[id] = prefs.visible[id];
      out.visible = vis;
    } else {
      out[f] = (prefs as unknown as Record<string, unknown>)[f];
    }
  }
  return out;
}

export function applyPartSlice(
  prefs: SaPrefs,
  slice: Record<string, unknown>,
): SaPrefs {
  return { ...prefs, ...slice, visible: { ...prefs.visible, ...((slice.visible as LayerVisible) || {}) } };
}

export function saveObjectDefault(prefs: SaPrefs, part: DialogPart): SaPrefs {
  return {
    ...prefs,
    objectDefaults: {
      ...prefs.objectDefaults,
      [part]: sliceForPart(prefs, part),
    },
  };
}

export function resetToObjectDefault(prefs: SaPrefs, part: DialogPart): SaPrefs {
  const saved = prefs.objectDefaults[part];
  if (saved) return applyPartSlice(prefs, saved);
  return resetPartToHouse(prefs, part);
}

export function resetPartToHouse(prefs: SaPrefs, part: DialogPart): SaPrefs {
  const house = houseDefaults(prefs.mode);
  const slice = sliceForPart({ ...prefs, ...house, visible: house.visible }, part);
  return applyPartSlice(prefs, slice);
}

export function lawfulFields(part: DialogPart): string[] {
  switch (part) {
    case "L0":
    case "grid":
      return [
        "canvasBg",
        "vertGridOn",
        "horzGridOn",
        "gridColor",
        "gridOpacity",
        "crosshairColor",
        "crosshairStyle",
        "axisFont",
        "axisFontSize",
        "axisTextColor",
        "scaleLineColor",
        "marginTop",
        "marginBottom",
        "rightOffsetBars",
      ];
    case "L1":
      return [
        "visible.L1",
        "priceFormat",
        "colorByPrevClose",
        "candleBodyOn",
        "candleUp",
        "candleDown",
        "candleBorderOn",
        "borderUp",
        "borderDown",
        "candleWickOn",
        "wickUp",
        "wickDown",
      ];
    case "L2":
      return [
        "visible.L2",
        "orientation",
        "profileWidthFrac",
        "profileOpacity",
        "profileMode",
      ];
    case "L3":
      return ["visible.L3"];
    case "L4":
    case "LP":
      return [];
    case "axis":
      return [
        "axis",
        "lastPriceOn",
        "lastPriceColor",
        "hiLoOn",
        "hiColor",
        "loColor",
      ];
    case "legend":
      return ["legendOn"];
    case "chips":
      return [];
    case "range":
      return ["priceLookbackDays"];
    case "mode":
      return ["mode"];
    default:
      return [];
  }
}

export function spanChipText(opts: {
  floor?: string | null;
  ceiling?: string | null;
  truncated?: boolean;
  spanPreset?: "coverage" | "full";
}): string {
  const since = opts.floor ? fmtMd(opts.floor) : "coverage floor";
  const core = `Full history · since ${since}`;
  return opts.truncated ? `${core} (truncated)` : core;
}

function fmtMd(iso?: string | null, sameMonthAs?: string | null): string {
  if (!iso) return "";
  const p = iso.split("-");
  if (p.length < 3) return iso;
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const m = months[Number(p[1]) - 1] || p[1];
  const day = String(Number(p[2]));
  if (sameMonthAs) {
    const q = sameMonthAs.split("-");
    if (q.length >= 2 && q[1] === p[1] && q[0] === p[0]) return day;
  }
  return `${m} ${day}`;
}
