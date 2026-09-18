/** Shared SA surface types + viewport stub (SA-Q2 grouping snap not calibrated). */

export type SaEdge = {
  price: number;
  direction: string;
  contrast: number;
  span: number;
};
export type SaNode = {
  span: [number, number];
  attributed_volume: number;
  median: number;
};
export type SaCrevasse = {
  span: [number, number];
  floor: number;
  tag: string;
};
export type SaGrouping = { span: [number, number] };

export type SaBin = { price: number; volume: number };

export type SaStructure = {
  source?: string;
  target_symbol?: string;
  session_date?: string | null;
  status?: string;
  caption?: string;
  flags?: { mapping?: string };
  mapping?: {
    ratio?: number;
    offset_published?: number;
    mark_source?: string;
  };
  named_state?: string | null;
  vp_api_base?: string | null;
  harness?: string | null;
  bin_count?: number;
  vp_row?: number | null;
  attributed_volume?: number;
  coverage?: {
    floor_session?: string | null;
    ceiling_session?: string | null;
    truncated?: boolean;
  } | null;
  detail?: string;
  edges?: SaEdge[];
  nodes?: SaNode[];
  crevasses?: SaCrevasse[];
  uncharted?: { span: [number, number] }[];
  groupings?: SaGrouping[];
  bins?: SaBin[];
};

/** Display-only rebin (SA-L8). Never used as detection input. */
export function rebinDisplay(bins: SaBin[], maxSlots = 280): SaBin[] {
  if (bins.length <= maxSlots) return bins;
  const ordered = [...bins].sort((a, b) => a.price - b.price);
  const lo = ordered[0].price;
  const hi = ordered[ordered.length - 1].price;
  const step = (hi - lo) / maxSlots || 1;
  const acc = new Map<number, number>();
  for (const b of ordered) {
    const slot = Math.min(maxSlots - 1, Math.floor((b.price - lo) / step));
    const key = lo + slot * step;
    acc.set(key, (acc.get(key) || 0) + b.volume);
  }
  return [...acc.entries()].map(([price, volume]) => ({ price, volume }));
}

export type ViewportStub = {
  lo: number | null;
  hi: number | null;
  label: string;
};

const MARGIN = 0.08;

/** §7 snap-outward scaffold. Grouping severity STUBBED-AWAITING-SA-Q2. */
export function stubViewport(data: SaStructure): ViewportStub {
  const groupings = data.groupings || [];
  const nodes = data.nodes || [];
  const prices: number[] = [];
  for (const g of groupings) prices.push(g.span[0], g.span[1]);
  for (const n of nodes) prices.push(n.span[0], n.span[1]);
  for (const e of data.edges || []) prices.push(e.price);
  if (prices.length === 0) {
    return {
      lo: null,
      hi: null,
      label: "STUBBED-AWAITING-SA-Q2 · no grouping to snap",
    };
  }
  const lo0 = Math.min(...prices);
  const hi0 = Math.max(...prices);
  const pad = Math.max((hi0 - lo0) * MARGIN, 0.25);
  return {
    lo: lo0 - pad,
    hi: hi0 + pad,
    label:
      "STUBBED-AWAITING-SA-Q2 · widest detected span + margin (not a grouping snap)",
  };
}

export function sourceForUnderlier(symbol: string): {
  source: string;
  target: string;
} {
  const s = symbol.toUpperCase();
  if (s === "SPX" || s === "ES") return { source: "ES", target: "SPX" };
  if (s === "MES") return { source: "MES", target: "XSP" };
  if (s === "SPY" || s === "XSP") return { source: "SPY", target: "XSP" };
  return { source: s, target: s };
}

/** Pairing for the contract path — not a menu. Menu is servedFromHealth. */
export function targetForSource(source: string): string {
  const s = source.toUpperCase();
  if (s === "ES") return "SPX";
  if (s === "MES" || s === "SPY") return "XSP";
  return s;
}

export type ServedSource = {
  id: string;
  source: string;
  target: string;
  label: string;
};

/** Symbols with live coverage per /health. Never a hardcoded menu. */
export function servedFromHealth(health: {
  coverage?: Record<
    string,
    { sessions_binned?: number; floor_session?: string | null }
  >;
  collectors?: Record<string, { live?: boolean }>;
} | null | undefined): ServedSource[] {
  const names = new Set<string>();
  for (const [k, rec] of Object.entries(health?.coverage || {})) {
    if (!rec) continue;
    if (Number(rec.sessions_binned) > 0 || rec.floor_session) {
      names.add(k.toUpperCase());
    }
  }
  for (const [k, rec] of Object.entries(health?.collectors || {})) {
    if (rec?.live) names.add(k.toUpperCase());
  }
  return [...names].sort().map((source) => ({
    id: source,
    source,
    target: targetForSource(source),
    label: source,
  }));
}
