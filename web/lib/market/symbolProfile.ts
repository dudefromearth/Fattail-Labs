/**
 * Per-symbol app profile — client mirror of server symbol_profile.
 * Options Lab (and other apps) configure wings, fly widths, templates from this.
 */

export type FlyWidthMode = "msc_spx" | "step_multiples" | "fixed_points";

export type SymbolAppProfile = {
  symbol: string;
  kind: string;
  role?: string;
  feed_symbol?: string | null;
  proxy_symbol?: string | null;
  options_cadence?: string;
  note?: string;
  enabled?: boolean;
  strike_step: number | null;
  default_wings: number;
  fly_width_mode: FlyWidthMode;
  fly_width_count: number;
  fly_widths: number[];
  fetch_step_floor: number;
  contract_multiplier: number;
  supports_options: boolean;
  default_view_side: "call" | "put";
  heatmap_default_template: string;
  ohlc_default_tf: string;
  source?: string;
};

const MSC_SPX = [20, 25, 30, 35, 40, 45, 50];

/** Kind defaults when API profile missing (offline / old payload). */
export function kindDefaultProfile(
  symbol: string,
  kind = "equity",
): SymbolAppProfile {
  const sym = (symbol || "SPX").toUpperCase();
  const k = (kind || "equity").toLowerCase();
  if (k === "index") {
    return {
      symbol: sym,
      kind: k,
      strike_step: 5,
      default_wings: 25,
      fly_width_mode: "msc_spx",
      fly_width_count: 7,
      fly_widths: [...MSC_SPX],
      fetch_step_floor: 5,
      contract_multiplier: 100,
      supports_options: true,
      default_view_side: "call",
      heatmap_default_template: "sym-fly",
      ohlc_default_tf: "1d",
      source: "client_kind_default",
    };
  }
  const step = k === "etf" ? 1 : 1;
  const count = 8;
  return {
    symbol: sym,
    kind: k,
    strike_step: step,
    default_wings: 25,
    fly_width_mode: "step_multiples",
    fly_width_count: count,
    fly_widths: Array.from({ length: count }, (_, i) =>
      Math.round(step * (i + 1) * 1000) / 1000,
    ),
    fetch_step_floor: 2.5,
    contract_multiplier: 100,
    supports_options: true,
    default_view_side: "call",
    heatmap_default_template: "sym-fly",
    ohlc_default_tf: "1d",
    source: "client_kind_default",
  };
}

export function coerceSymbolProfile(
  raw: Partial<SymbolAppProfile> | null | undefined,
  fallbackSymbol = "SPX",
  fallbackKind = "equity",
): SymbolAppProfile {
  const base = kindDefaultProfile(
    raw?.symbol || fallbackSymbol,
    raw?.kind || fallbackKind,
  );
  if (!raw) return base;
  const fly_widths =
    Array.isArray(raw.fly_widths) && raw.fly_widths.length
      ? raw.fly_widths.map(Number).filter((n) => Number.isFinite(n) && n > 0)
      : base.fly_widths;
  return {
    ...base,
    ...raw,
    symbol: (raw.symbol || base.symbol).toUpperCase(),
    kind: (raw.kind || base.kind).toLowerCase(),
    strike_step:
      raw.strike_step != null && Number.isFinite(Number(raw.strike_step))
        ? Number(raw.strike_step)
        : base.strike_step,
    default_wings: Math.max(
      5,
      Math.min(50, Number(raw.default_wings) || base.default_wings),
    ),
    fly_widths,
    fly_width_count: Math.max(
      1,
      Math.min(12, Number(raw.fly_width_count) || base.fly_width_count),
    ),
    default_view_side:
      raw.default_view_side === "put" ? "put" : "call",
    supports_options:
      raw.supports_options != null ? Boolean(raw.supports_options) : true,
  };
}

/** Concrete heatmap column widths from a resolved profile (+ optional live step). */
export function flyWidthsFromProfile(
  profile: SymbolAppProfile,
  liveStrikeStep?: number | null,
): number[] {
  if (
    profile.fly_width_mode === "msc_spx" ||
    (profile.fly_widths?.length && profile.fly_width_mode !== "step_multiples")
  ) {
    return profile.fly_widths?.length ? [...profile.fly_widths] : [...MSC_SPX];
  }
  const step =
    liveStrikeStep != null && liveStrikeStep > 0
      ? liveStrikeStep
      : profile.strike_step != null && profile.strike_step > 0
        ? profile.strike_step
        : 1;
  const n = profile.fly_width_count || 8;
  return Array.from(
    { length: n },
    (_, i) => Math.round(step * (i + 1) * 1000) / 1000,
  );
}
