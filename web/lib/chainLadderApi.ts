/** SPX vertical chain ladder — poll API; apply strike-level diffs only. */

export type LadderRow = {
  strike: number;
  is_spot?: boolean;
  ticker?: string | null;
  mid?: number | null;
  bid?: number | null;
  ask?: number | null;
  volume?: number | null;
  open_interest?: number | null;
  delta?: number | null;
  gamma?: number | null;
  theta?: number | null;
  vega?: number | null;
  iv?: number | null;
};

export type LadderFull = {
  underlier: string;
  expiration: string;
  side: string;
  spot: number;
  vix?: number | null;
  dte?: number;
  wings?: number;
  strike_step?: number;
  band?: number;
  strike_lo?: number;
  strike_hi?: number;
  spot_strike?: number | null;
  fields: string[];
  rows: LadderRow[];
  row_count: number;
  as_of?: string;
  content_hash: string;
};

export type LadderPollResult =
  | { mode: "unchanged"; content_hash: string; as_of?: string }
  | {
      mode: "diff";
      content_hash: string;
      as_of?: string;
      spot: number;
      vix?: number | null;
      band?: number;
      spot_strike?: number | null;
      strike_lo?: number;
      strike_hi?: number;
      row_count?: number;
      upserts: LadderRow[];
      removes: number[];
      changed_strike_count?: number;
    }
  | { mode: "full"; content_hash: string; ladder: LadderFull };

async function parseJson<T>(r: Response): Promise<T> {
  if (!r.ok) {
    const t = await r.text();
    throw new Error(t || r.statusText || `HTTP ${r.status}`);
  }
  return r.json() as Promise<T>;
}

/** Next distinct listed expiration (SPX daily, some names M/W/F or Fridays only). */
export type LadderExpirationContract = {
  expiration: string;
  dte: number;
  label: string;
};

export async function fetchLadderExpirations(
  symbol = "SPX",
  limit = 3,
): Promise<{
  contracts: LadderExpirationContract[];
  default_expiration: string | null;
  symbol: string;
}> {
  const q = new URLSearchParams({
    symbol,
    limit: String(limit),
  });
  const r = await fetch(`/api/me/market/chain-ladder/expirations?${q}`, {
    credentials: "same-origin",
  });
  const d = await parseJson<{
    contracts?: LadderExpirationContract[];
    expirations?: string[];
    default_expiration?: string | null;
    symbol?: string;
  }>(r);
  // Prefer rich contracts[]; fall back to flat dates if older server
  let contracts = d.contracts || [];
  if (!contracts.length && d.expirations?.length) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    contracts = d.expirations.slice(0, limit).map((expiration) => {
      const exp = new Date(expiration + "T12:00:00");
      const dte = Math.max(
        0,
        Math.round((exp.getTime() - today.getTime()) / 86400000),
      );
      return {
        expiration,
        dte,
        label: dte === 0 ? `${expiration} · 0 DTE` : `${expiration} · ${dte} DTE`,
      };
    });
  }
  return {
    contracts,
    default_expiration:
      d.default_expiration ?? contracts[0]?.expiration ?? null,
    symbol: d.symbol || symbol,
  };
}

/** Strikes above and below ATM — broker-style wing choices. */
export const STRIKE_WING_CHOICES = [10, 25, 50, 100] as const;
export type StrikeWings = (typeof STRIKE_WING_CHOICES)[number];
export const DEFAULT_STRIKE_WINGS: StrikeWings = 25;

export async function pollChainLadder(opts: {
  expiration: string;
  /** Admin universe product symbol (SPX, AAPL, …) */
  symbol?: string;
  side?: "call" | "put";
  /** Strikes above and below ATM (10|25|50|100). Default 25. */
  wings?: number;
  since_hash?: string | null;
}): Promise<LadderPollResult> {
  const q = new URLSearchParams({
    expiration: opts.expiration,
    symbol: opts.symbol || "SPX",
    side: opts.side || "call",
    wings: String(opts.wings ?? DEFAULT_STRIKE_WINGS),
  });
  if (opts.since_hash) q.set("since_hash", opts.since_hash);
  const r = await fetch(`/api/me/market/chain-ladder?${q}`, {
    credentials: "same-origin",
  });
  const d = await parseJson<{
    mode?: string;
    unchanged?: boolean;
    content_hash?: string;
    as_of?: string;
    ladder?: LadderFull;
    upserts?: LadderRow[];
    removes?: number[];
    spot?: number;
    vix?: number | null;
    band?: number;
    spot_strike?: number | null;
    strike_lo?: number;
    strike_hi?: number;
    row_count?: number;
    changed_strike_count?: number;
  }>(r);

  if (d.unchanged || d.mode === "unchanged") {
    return {
      mode: "unchanged",
      content_hash: d.content_hash || opts.since_hash || "",
      as_of: d.as_of,
    };
  }
  if (d.mode === "diff") {
    return {
      mode: "diff",
      content_hash: d.content_hash || "",
      as_of: d.as_of,
      spot: Number(d.spot),
      vix: d.vix,
      band: d.band,
      spot_strike: d.spot_strike,
      strike_lo: d.strike_lo,
      strike_hi: d.strike_hi,
      row_count: d.row_count,
      upserts: d.upserts || [],
      removes: d.removes || [],
      changed_strike_count: d.changed_strike_count,
    };
  }
  if (!d.ladder) throw new Error("ladder missing in full response");
  return {
    mode: "full",
    content_hash: d.content_hash || d.ladder.content_hash,
    ladder: d.ladder,
  };
}

/** Apply server patch into local row map — only touched strikes change. */
export function applyLadderDiff(
  rowsByStrike: Map<number, LadderRow>,
  result: LadderPollResult,
): {
  next: Map<number, LadderRow>;
  touched: Set<number>;
  meta: Partial<LadderFull> | null;
  hash: string;
} {
  if (result.mode === "unchanged") {
    return {
      next: rowsByStrike,
      touched: new Set(),
      meta: null,
      hash: result.content_hash,
    };
  }
  if (result.mode === "full") {
    const next = new Map<number, LadderRow>();
    for (const row of result.ladder.rows) {
      next.set(Number(row.strike), row);
    }
    return {
      next,
      touched: new Set(next.keys()),
      meta: result.ladder,
      hash: result.content_hash,
    };
  }
  // diff
  const next = new Map(rowsByStrike);
  const touched = new Set<number>();
  for (const s of result.removes) {
    const k = Number(s);
    next.delete(k);
    touched.add(k);
  }
  for (const row of result.upserts) {
    const k = Number(row.strike);
    next.set(k, row);
    touched.add(k);
  }
  // spot flag may move without mid change — clear is_spot then set
  if (result.spot_strike != null) {
    for (const [k, row] of next) {
      const want = k === Number(result.spot_strike);
      if (Boolean(row.is_spot) !== want) {
        next.set(k, { ...row, is_spot: want });
        touched.add(k);
      }
    }
  }
  return {
    next,
    touched,
    meta: {
      spot: result.spot,
      vix: result.vix,
      band: result.band,
      spot_strike: result.spot_strike,
      strike_lo: result.strike_lo,
      strike_hi: result.strike_hi,
      row_count: result.row_count,
      as_of: result.as_of,
      content_hash: result.content_hash,
    },
    hash: result.content_hash,
  };
}
