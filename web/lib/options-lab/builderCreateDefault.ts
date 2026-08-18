/**
 * Create Position defaults — Options Lab recipes + up to 3 user presets.
 *
 * Law:
 *  - Exactly **one** active seed for Create open (Lab defaults OR one user preset).
 *  - Member may store **up to three** named presets and switch among them.
 *  - Reset → Lab defaults active (presets retained unless deleted).
 *  - Center is ATM offset so defaults track spot; structure is re-placed on OPF.
 */

import type {
  OptionRight,
  TemplateType,
  TradeDirection,
} from "@/lib/options-lab/positionTypes";

export const BUILDER_CREATE_DEFAULT_KEY =
  "ft_options_lab_builder_create_default_v2";
/** Legacy single-default key — migrated into slot 1 once. */
const LEGACY_V1_KEY = "ft_options_lab_builder_create_default_v1";

export const MAX_USER_PRESETS = 3;

/** Create-open default: 20-wide butterfly at spot (ATM). Listed grid only. */
export const DEFAULT_CREATE_WING_WIDTH = 20;

export type ShapeSnapshot = {
  template: TemplateType;
  direction: TradeDirection;
  optionSide: OptionRight;
  wingWidth: number;
  centerOffsetPts: number;
  contracts: number;
};

export type UserCreatePreset = ShapeSnapshot & {
  id: string;
  /** Short label in the Defaults menu */
  name: string;
  symbol: string;
  savedAt: number;
};

export type CreateDefaultsStore = {
  version: 2;
  presets: UserCreatePreset[];
  /** `null` ⇒ Options Lab defaults are active */
  activeId: string | null;
};

export type LabStrategyDefault = ShapeSnapshot & {
  /** Menu / presentation name */
  label: string;
  /** One-line teaching blurb for UI */
  blurb: string;
};

const TEMPLATES = new Set<string>([
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
]);

function isTemplate(v: unknown): v is TemplateType {
  return typeof v === "string" && TEMPLATES.has(v);
}

function storage(): Storage | null {
  try {
    if (typeof localStorage !== "undefined" && localStorage != null) {
      return localStorage;
    }
  } catch {
    /* private mode / SSR */
  }
  return null;
}

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function productWingHint(symbol: string): number {
  const s = (symbol || "").toUpperCase();
  if (s === "NDX" || s.startsWith("NQ")) return 50;
  if (s === "RUT") return 20;
  if (s === "SPX" || s === "XSP") return 20;
  return 5;
}

/**
 * Options Lab canonical presentation defaults **per strategy**.
 * These are the product recipes members reset to — not brokerage advice.
 * Center is always ATM (offset 0) unless noted; wings product-scaled.
 */
export function labDefaultForStrategy(
  template: TemplateType,
  symbol = "SPX",
): LabStrategyDefault {
  const w = productWingHint(symbol);
  const base = {
    centerOffsetPts: 0,
    contracts: 1,
    wingWidth: w,
  };

  switch (template) {
    case "single":
      return {
        ...base,
        template: "single",
        direction: "buy",
        optionSide: "call",
        wingWidth: w,
        label: "Long call",
        blurb: "ATM long call — simplest directional debit.",
      };
    /**
     * Wave 1 Lab recipes (Coach order): Butterfly → Vertical → Condor → Calendar.
     * Presentation is OPF-listed only; wings product-scaled (SPX 20, NDX 50, …).
     */
    case "vertical":
      return {
        ...base,
        template: "vertical",
        direction: "buy",
        optionSide: "call",
        wingWidth: w,
        label: "Call debit vertical",
        blurb:
          "Buy ATM call, sell higher call — defined-risk directional debit on the listed grid.",
      };
    case "butterfly":
      return {
        ...base,
        template: "butterfly",
        direction: "buy",
        optionSide: "call",
        wingWidth: DEFAULT_CREATE_WING_WIDTH,
        centerOffsetPts: 0,
        label: "ATM call butterfly",
        blurb:
          "Long wing / short 2× body / long wing — 20-wide butterfly at spot (Labs Create seed).",
      };
    case "bwb":
      return {
        ...base,
        template: "bwb",
        direction: "buy",
        optionSide: "call",
        wingWidth: w,
        label: "Broken-wing call fly",
        blurb: "ATM-biased BWB — skewed wings on the listed grid.",
      };
    case "condor":
      return {
        ...base,
        template: "condor",
        direction: "buy",
        optionSide: "call",
        // Condor needs two wing steps each side — prefer 1× product step for
        // the inner gap; listedStructure doubles outer (center±2steps).
        wingWidth: w,
        label: "Call condor",
        blurb:
          "Long call condor centered on ATM — wider range debit; four listed strikes.",
      };
    case "straddle":
      return {
        ...base,
        template: "straddle",
        direction: "buy",
        optionSide: "call",
        wingWidth: w,
        label: "Long straddle",
        blurb: "ATM long straddle — pure volatility debit.",
      };
    case "strangle":
      return {
        ...base,
        template: "strangle",
        direction: "buy",
        optionSide: "call",
        wingWidth: w,
        label: "Long strangle",
        blurb: "OTM long strangle — cheaper vol than a straddle.",
      };
    case "iron_fly":
      return {
        ...base,
        template: "iron_fly",
        direction: "sell",
        optionSide: "call",
        wingWidth: w,
        label: "Short iron fly",
        blurb: "Short iron fly — credit, pin risk at ATM.",
      };
    case "iron_condor":
      return {
        ...base,
        template: "iron_condor",
        direction: "sell",
        optionSide: "call",
        wingWidth: Math.max(w, w * 2),
        label: "Short iron condor",
        blurb: "Short iron condor — credit range, defined risk.",
      };
    case "calendar":
      return {
        ...base,
        template: "calendar",
        direction: "buy",
        optionSide: "call",
        // Same strike both exps; width unused for structure but kept for UI
        wingWidth: w,
        label: "Call calendar",
        blurb:
          "Long back-month call / short front-month call at ATM — multi-expiration time spread (front + next listed).",
      };
    case "diagonal":
      return {
        ...base,
        template: "diagonal",
        direction: "buy",
        optionSide: "call",
        wingWidth: w,
        label: "Call diagonal",
        blurb: "Long call diagonal — time + strike skew.",
      };
    default:
      return {
        ...base,
        template: "butterfly",
        direction: "buy",
        optionSide: "call",
        label: "ATM call butterfly",
        blurb: "Long call fly at ATM.",
      };
  }
}

/** Create-open Lab seed: 20-wide butterfly at spot. */
export function labCreateOpenDefault(symbol: string): ShapeSnapshot {
  const lab = labDefaultForStrategy("butterfly", symbol);
  return {
    template: "butterfly",
    direction: lab.direction,
    optionSide: lab.optionSide,
    wingWidth: DEFAULT_CREATE_WING_WIDTH,
    centerOffsetPts: 0,
    contracts: lab.contracts,
  };
}

/** @deprecated use labCreateOpenDefault — kept for tests/compat */
export function factoryCreateDefault(symbol: string): ShapeSnapshot & {
  version: 1;
  symbol: string;
  savedAt: number;
} {
  const s = labCreateOpenDefault(symbol);
  return {
    version: 1,
    symbol: (symbol || "").toUpperCase(),
    ...s,
    savedAt: 0,
  };
}

function emptyStore(): CreateDefaultsStore {
  return { version: 2, presets: [], activeId: null };
}

function parseShape(j: Partial<ShapeSnapshot>): ShapeSnapshot | null {
  if (!isTemplate(j.template)) return null;
  if (j.direction !== "buy" && j.direction !== "sell") return null;
  if (j.optionSide !== "call" && j.optionSide !== "put") return null;
  const wing = Number(j.wingWidth);
  const off = Number(j.centerOffsetPts ?? 0);
  const contracts = Math.max(1, Math.floor(Number(j.contracts) || 1));
  if (!(wing > 0) || !Number.isFinite(wing)) return null;
  if (!Number.isFinite(off)) return null;
  return {
    template: j.template,
    direction: j.direction,
    optionSide: j.optionSide,
    wingWidth: wing,
    centerOffsetPts: off,
    contracts,
  };
}

function migrateV1(raw: string): CreateDefaultsStore | null {
  try {
    const j = JSON.parse(raw) as Partial<ShapeSnapshot> & {
      version?: number;
      symbol?: string;
      savedAt?: number;
    };
    if (j.version !== 1) return null;
    const shape = parseShape(j);
    if (!shape) return null;
    const preset: UserCreatePreset = {
      ...shape,
      id: uid("preset"),
      name: "My default",
      symbol: String(j.symbol || "").toUpperCase(),
      savedAt: Number(j.savedAt) || Date.now(),
    };
    return { version: 2, presets: [preset], activeId: preset.id };
  } catch {
    return null;
  }
}

export function loadCreateDefaultsStore(): CreateDefaultsStore {
  const ls = storage();
  if (!ls) return emptyStore();
  try {
    const raw2 = ls.getItem(BUILDER_CREATE_DEFAULT_KEY);
    if (raw2) {
      const j = JSON.parse(raw2) as Partial<CreateDefaultsStore>;
      if (j.version === 2 && Array.isArray(j.presets)) {
        const presets: UserCreatePreset[] = [];
        for (const p of j.presets.slice(0, MAX_USER_PRESETS)) {
          const shape = parseShape(p);
          if (!shape || !p?.id || !p?.name) continue;
          presets.push({
            ...shape,
            id: String(p.id),
            name: String(p.name).slice(0, 40),
            symbol: String(p.symbol || "").toUpperCase(),
            savedAt: Number(p.savedAt) || 0,
          });
        }
        let activeId =
          j.activeId == null || j.activeId === ""
            ? null
            : String(j.activeId);
        if (activeId && !presets.some((p) => p.id === activeId)) {
          activeId = null;
        }
        return { version: 2, presets, activeId };
      }
    }
    // Migrate v1 once
    const raw1 = ls.getItem(LEGACY_V1_KEY);
    if (raw1) {
      const migrated = migrateV1(raw1);
      if (migrated) {
        saveCreateDefaultsStore(migrated);
        try {
          ls.removeItem(LEGACY_V1_KEY);
        } catch {
          /* ignore */
        }
        return migrated;
      }
    }
  } catch {
    /* corrupt */
  }
  return emptyStore();
}

export function saveCreateDefaultsStore(store: CreateDefaultsStore): void {
  const ls = storage();
  if (!ls) return;
  const presets = store.presets.slice(0, MAX_USER_PRESETS);
  let activeId = store.activeId;
  if (activeId && !presets.some((p) => p.id === activeId)) activeId = null;
  const payload: CreateDefaultsStore = {
    version: 2,
    presets,
    activeId,
  };
  ls.setItem(BUILDER_CREATE_DEFAULT_KEY, JSON.stringify(payload));
}

/** Snapshot currently shown in the Builder → ShapeSnapshot. */
export function shapeFromBuilderState(opts: {
  template: TemplateType;
  direction: TradeDirection;
  optionSide: OptionRight;
  wingWidth: number;
  centerStrike: number;
  atmCenter: number;
  contracts: number;
}): ShapeSnapshot {
  const atm = opts.atmCenter > 0 ? opts.atmCenter : opts.centerStrike;
  const body = opts.centerStrike > 0 ? opts.centerStrike : atm;
  const offset =
    atm > 0 && body > 0 ? Math.round((body - atm) * 10000) / 10000 : 0;
  return {
    template: opts.template,
    direction: opts.direction,
    optionSide: opts.optionSide,
    wingWidth: opts.wingWidth > 0 ? opts.wingWidth : 20,
    centerOffsetPts: offset,
    contracts: Math.max(1, Math.floor(opts.contracts) || 1),
  };
}

function defaultNameForShape(shape: ShapeSnapshot): string {
  const dir = shape.direction === "buy" ? "Long" : "Short";
  const t = shape.template.replace(/_/g, " ");
  return `${dir} ${t}`.replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 40);
}

/**
 * Save current shape into the store.
 * - If fewer than 3 presets: append and make active.
 * - If 3 full and an active user preset: overwrite that slot.
 * - If 3 full and Lab active: overwrite the oldest preset.
 */
export function saveShapeAsUserPreset(
  shape: ShapeSnapshot,
  symbol: string,
  name?: string,
): CreateDefaultsStore {
  const store = loadCreateDefaultsStore();
  const now = Date.now();
  const label = (name || defaultNameForShape(shape)).slice(0, 40);

  if (store.activeId) {
    const idx = store.presets.findIndex((p) => p.id === store.activeId);
    if (idx >= 0) {
      const next = [...store.presets];
      next[idx] = {
        ...shape,
        id: next[idx].id,
        name: label,
        symbol: (symbol || "").toUpperCase(),
        savedAt: now,
      };
      const out = { version: 2 as const, presets: next, activeId: next[idx].id };
      saveCreateDefaultsStore(out);
      return out;
    }
  }

  if (store.presets.length < MAX_USER_PRESETS) {
    const preset: UserCreatePreset = {
      ...shape,
      id: uid("preset"),
      name: label,
      symbol: (symbol || "").toUpperCase(),
      savedAt: now,
    };
    const out: CreateDefaultsStore = {
      version: 2,
      presets: [...store.presets, preset],
      activeId: preset.id,
    };
    saveCreateDefaultsStore(out);
    return out;
  }

  // Full: replace oldest
  const sorted = [...store.presets].sort((a, b) => a.savedAt - b.savedAt);
  const victim = sorted[0];
  const next = store.presets.map((p) =>
    p.id === victim.id
      ? {
          ...shape,
          id: p.id,
          name: label,
          symbol: (symbol || "").toUpperCase(),
          savedAt: now,
        }
      : p,
  );
  const out: CreateDefaultsStore = {
    version: 2,
    presets: next,
    activeId: victim.id,
  };
  saveCreateDefaultsStore(out);
  return out;
}

export function setActiveCreateDefault(id: string | null): CreateDefaultsStore {
  const store = loadCreateDefaultsStore();
  if (id != null && !store.presets.some((p) => p.id === id)) {
    return store;
  }
  const out = { ...store, activeId: id };
  saveCreateDefaultsStore(out);
  return out;
}

/** Activate Lab defaults; keep user presets for later selection. */
export function resetToLabDefaults(): CreateDefaultsStore {
  const store = loadCreateDefaultsStore();
  const out = { ...store, activeId: null };
  saveCreateDefaultsStore(out);
  return out;
}

export function deleteUserPreset(id: string): CreateDefaultsStore {
  const store = loadCreateDefaultsStore();
  const presets = store.presets.filter((p) => p.id !== id);
  const activeId =
    store.activeId === id ? null : store.activeId;
  const out = { version: 2 as const, presets, activeId };
  saveCreateDefaultsStore(out);
  return out;
}

/** Shape used when Create dialog opens. */
export function resolveCreateSeed(symbol: string): ShapeSnapshot {
  const store = loadCreateDefaultsStore();
  if (store.activeId) {
    const hit = store.presets.find((p) => p.id === store.activeId);
    if (hit) {
      return {
        template: hit.template,
        direction: hit.direction,
        optionSide: hit.optionSide,
        wingWidth: hit.wingWidth,
        centerOffsetPts: hit.centerOffsetPts,
        contracts: hit.contracts,
      };
    }
  }
  return labCreateOpenDefault(symbol);
}

export function isLabDefaultsActive(): boolean {
  return loadCreateDefaultsStore().activeId == null;
}

export function formatShapeSummary(shape: ShapeSnapshot): string {
  const dir = shape.direction === "buy" ? "Buy" : "Sell";
  const t = shape.template.replace(/_/g, " ");
  const side =
    shape.template === "straddle" ||
    shape.template === "strangle" ||
    shape.template === "iron_fly" ||
    shape.template === "iron_condor"
      ? ""
      : ` ${shape.optionSide}`;
  const atm =
    shape.centerOffsetPts === 0
      ? "ATM"
      : `ATM${shape.centerOffsetPts > 0 ? "+" : ""}${shape.centerOffsetPts}`;
  return `${dir}${side} ${t} · ${shape.wingWidth}w · ${atm}`;
}

// —— Legacy API shims (v1 single-default) ——

/** @deprecated use resolveCreateSeed / loadCreateDefaultsStore */
export function loadCreateDefault(
  symbol?: string,
): (ShapeSnapshot & { version: 1; symbol: string; savedAt: number }) | null {
  const store = loadCreateDefaultsStore();
  if (!store.activeId) return null;
  const hit = store.presets.find((p) => p.id === store.activeId);
  if (!hit) return null;
  void symbol;
  return {
    version: 1,
    symbol: hit.symbol,
    template: hit.template,
    direction: hit.direction,
    optionSide: hit.optionSide,
    wingWidth: hit.wingWidth,
    centerOffsetPts: hit.centerOffsetPts,
    contracts: hit.contracts,
    savedAt: hit.savedAt,
  };
}

/** @deprecated use saveShapeAsUserPreset */
export function saveCreateDefault(def: {
  version?: number;
  symbol: string;
  template: TemplateType;
  direction: TradeDirection;
  optionSide: OptionRight;
  wingWidth: number;
  centerOffsetPts: number;
  contracts: number;
  savedAt?: number;
}): void {
  saveShapeAsUserPreset(
    {
      template: def.template,
      direction: def.direction,
      optionSide: def.optionSide,
      wingWidth: def.wingWidth,
      centerOffsetPts: def.centerOffsetPts,
      contracts: def.contracts,
    },
    def.symbol,
  );
}

/** @deprecated use resetToLabDefaults */
export function clearCreateDefault(): void {
  resetToLabDefaults();
}
