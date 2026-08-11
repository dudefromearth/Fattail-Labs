/** Trade Log v1.1 client types — Spec FatTail-Labs-Trade-Log-Spec-v1.1 */

export type Venue = {
  code: string;
  label: string;
  kind: "live" | "sim";
};

export type StrategyMeta = {
  code: string;
  label: string;
  group: string;
};

export type Account = {
  id: number;
  label: string;
  broker: string;
  broker_label?: string | null;
  currency: string;
  starting_balance?: number | null;
  status: string;
  venue_kind: string;
  sort_order: number;
  /** Present on list accounts API — fills on this book. */
  trade_count?: number;
};

export type Leg = {
  id?: number;
  leg_index?: number;
  side: "BUY" | "SELL";
  quantity: number;
  pos_effect?: "TO_OPEN" | "TO_CLOSE" | null;
  asset_class?: string;
  underlier?: string | null;
  symbol?: string | null;
  expiry?: string | null;
  strike?: number | null;
  right?: "PUT" | "CALL" | null;
  fill_price: number;
  fees?: number | null;
};

/**
 * How the fill entered the book — three channels, never conflated:
 * - manual: member structure form / legs sheet
 * - import: ToS/CSV/canonical file or paste
 * - automated: Strategy Lab process runtime or other Labs automations
 */
export type EntrySource = "manual" | "import" | "automated";

export type Trade = {
  id: number;
  account_id: number;
  exec_at: string | null;
  asset_class: string;
  strategy: string;
  order_type: string;
  net_price: number | null;
  net_side: string | null;
  setup_md: string;
  plan_md: string;
  rules_md: string;
  adherence: string;
  deviation_md: string;
  lesson_md: string;
  pnl_amount: number | null;
  legs: Leg[];
  entry_source?: EntrySource | string | null;
  trash_reason?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  external_adapter?: string | null;
  playbook_entry_id?: number | null;
  practice_campaign_id?: number | null;
  /** member | memory | null — stamp provenance (Spec §9 badge tier). */
  stamped_by?: string | null;
};

/** Normalize API/legacy values for display and policy. */
export function normalizeEntrySource(
  raw: string | null | undefined,
): EntrySource {
  const s = (raw || "manual").toLowerCase();
  if (s === "machine") return "automated";
  if (s === "import" || s === "automated" || s === "manual") return s;
  return "manual";
}

export function entrySourceLabel(raw: string | null | undefined): string {
  switch (normalizeEntrySource(raw)) {
    case "import":
      return "Import";
    case "automated":
      return "Automated";
    default:
      return "Manual";
  }
}


export type Catalog = {
  venues: Venue[];
  strategies: StrategyMeta[];
};

/** Strategies that support one-shot structure entry (not leg-by-leg). */
export const STRUCTURE_SIMPLE_STRATEGIES = new Set([
  "BUTTERFLY",
  "BROKEN_WING_FLY",
  "VERTICAL",
  "SINGLE",
  "CONDOR",
  "IRON_FLY",
  "IRON_CONDOR",
  "STRADDLE",
  "STRANGLE",
]);

export function strategySupportsStructureSimple(code: string): boolean {
  return STRUCTURE_SIMPLE_STRATEGIES.has(code);
}

export type StructureSimpleParams = {
  strategy: string;
  underlier: string;
  expiry: string; // YYYY-MM-DD
  /** Body / center strike (or long strike for vertical). */
  centerStrike: number;
  /** Wing spacing in points (0 for SINGLE / STRADDLE). Symmetric flies use this alone. */
  width: number;
  /**
   * Upper wing width for BROKEN_WING_FLY (points). When set and ≠ width,
   lower wing = width (center − lower), upper wing = widthRight (upper − center).
   */
  widthRight?: number;
  right: "PUT" | "CALL";
  /** Unit size: 1 fly = body 2, wings 1. */
  units: number;
  posEffect: "TO_OPEN" | "TO_CLOSE";
};

function optLeg(
  side: "BUY" | "SELL",
  quantity: number,
  strike: number,
  right: "PUT" | "CALL",
  p: StructureSimpleParams,
): Leg {
  return {
    side,
    quantity,
    pos_effect: p.posEffect,
    asset_class: "equity_option",
    underlier: p.underlier,
    symbol: p.underlier,
    expiry: p.expiry,
    strike,
    right,
    fill_price: 0,
  };
}

/**
 * Build option legs from strategy + center/width (FatTail teaching defaults).
 * Long debit structures unless strategy is credit-native (iron*).
 */
export function buildStructureLegs(p: StructureSimpleParams): Leg[] {
  const c = p.centerStrike;
  const w = Math.abs(p.width);
  const u = Math.max(1, Math.floor(p.units) || 1);
  const r = p.right;

  switch (p.strategy) {
    case "SINGLE":
      return [optLeg("BUY", u, c, r, p)];
    case "VERTICAL": {
      // Debit vertical: long at center, short wing.
      // Put: long higher, short lower (center − width). Call: long lower, short higher.
      const shortK = r === "PUT" ? c - w : c + w;
      return [
        optLeg("BUY", u, c, r, p),
        optLeg("SELL", u, shortK, r, p),
      ];
    }
    case "BUTTERFLY": {
      // Long fly: buy wings, sell 2× body at center (symmetric).
      return [
        optLeg("BUY", u, c - w, r, p),
        optLeg("SELL", 2 * u, c, r, p),
        optLeg("BUY", u, c + w, r, p),
      ];
    }
    case "BROKEN_WING_FLY": {
      // Long broken wing: +1 / −2 / +1, unequal wing widths.
      const wLo = w;
      const wHi =
        p.widthRight != null && !Number.isNaN(Number(p.widthRight))
          ? Math.abs(Number(p.widthRight))
          : w;
      return [
        optLeg("BUY", u, c - wLo, r, p),
        optLeg("SELL", 2 * u, c, r, p),
        optLeg("BUY", u, c + wHi, r, p),
      ];
    }
    case "CONDOR": {
      // Long condor (same right): buy outer, sell inner.
      if (w <= 0) return [];
      return [
        optLeg("BUY", u, c - 2 * w, r, p),
        optLeg("SELL", u, c - w, r, p),
        optLeg("SELL", u, c + w, r, p),
        optLeg("BUY", u, c + 2 * w, r, p),
      ];
    }
    case "IRON_FLY": {
      // Short iron fly: sell ATM straddle, buy wings (credit structure).
      return [
        optLeg("SELL", u, c, "PUT", p),
        optLeg("SELL", u, c, "CALL", p),
        optLeg("BUY", u, c - w, "PUT", p),
        optLeg("BUY", u, c + w, "CALL", p),
      ];
    }
    case "IRON_CONDOR": {
      // Short IC: sell put vertical + sell call vertical, wing width w.
      return [
        optLeg("BUY", u, c - 2 * w, "PUT", p),
        optLeg("SELL", u, c - w, "PUT", p),
        optLeg("SELL", u, c + w, "CALL", p),
        optLeg("BUY", u, c + 2 * w, "CALL", p),
      ];
    }
    case "STRADDLE":
      return [
        optLeg("BUY", u, c, "PUT", p),
        optLeg("BUY", u, c, "CALL", p),
      ];
    case "STRANGLE":
      return [
        optLeg("BUY", u, c - w, "PUT", p),
        optLeg("BUY", u, c + w, "CALL", p),
      ];
    default:
      return [];
  }
}

/** One-line leg preview for structure entry. */
export function formatStructurePreview(legs: Leg[]): string {
  if (!legs.length) return "—";
  return legs
    .map((l) => {
      const side = l.side === "BUY" ? "B" : "S";
      const k = l.strike != null ? String(l.strike) : "?";
      const rt = l.right ? l.right[0] : "";
      return `${side}${l.quantity} ${k}${rt}`;
    })
    .join(" · ");
}

/** Default net side for open of this strategy (process convenience). */
export function defaultNetSideForStrategy(strategy: string): "DEBIT" | "CREDIT" {
  if (strategy === "IRON_FLY" || strategy === "IRON_CONDOR") return "CREDIT";
  return "DEBIT";
}

/** Seed legs for common strategies (member fills strikes/prices). */
export function templateLegs(strategy: string, underlier = "SPX"): Leg[] {
  const exp = new Date().toISOString().slice(0, 10);
  if (strategySupportsStructureSimple(strategy)) {
    return buildStructureLegs({
      strategy,
      underlier,
      expiry: exp,
      centerStrike: 100,
      width: strategy === "SINGLE" || strategy === "STRADDLE" ? 0 : 5,
      widthRight: strategy === "BROKEN_WING_FLY" ? 10 : undefined,
      right: "PUT",
      units: 1,
      posEffect: "TO_OPEN",
    });
  }
  switch (strategy) {
    case "STOCK":
      return [
        {
          side: "BUY",
          quantity: 100,
          pos_effect: "TO_OPEN",
          asset_class: "equity",
          symbol: "SPY",
          fill_price: 0,
        },
      ];
    case "FUTURE":
      return [
        {
          side: "BUY",
          quantity: 1,
          pos_effect: "TO_OPEN",
          asset_class: "future",
          symbol: "/ES",
          fill_price: 0,
        },
      ];
    case "CRYPTO":
      return [
        {
          side: "BUY",
          quantity: 1,
          pos_effect: null,
          asset_class: "crypto",
          symbol: "BTC-USD",
          fill_price: 0,
        },
      ];
    case "NOTE":
      return [];
    default:
      return [
        {
          side: "BUY",
          quantity: 1,
          pos_effect: "TO_OPEN",
          asset_class: "equity_option",
          underlier,
          expiry: exp,
          strike: 100,
          right: "CALL",
          fill_price: 0,
        },
      ];
  }
}

export function formatQtyEffect(leg: Leg): string {
  const sign = leg.side === "BUY" ? "+" : "−";
  const pe = leg.pos_effect ? ` ${leg.pos_effect.replace("_", " ")}` : "";
  return `${sign}${leg.quantity}${pe}`;
}

/** Majority leg pos_effect → close vs open fill (mirrors server structure.py). */
export function tradeIsCloseFill(trade: Trade): boolean {
  const effects = (trade.legs || [])
    .map((l) => l.pos_effect)
    .filter((e): e is "TO_OPEN" | "TO_CLOSE" => e === "TO_OPEN" || e === "TO_CLOSE");
  if (!effects.length) return false;
  const closes = effects.filter((e) => e === "TO_CLOSE").length;
  const opens = effects.filter((e) => e === "TO_OPEN").length;
  return closes > opens;
}

function ymdFromExec(execAt: string | null | undefined): string | null {
  if (!execAt || execAt.length < 10) return null;
  if (execAt[4] === "-" && execAt[7] === "-") return execAt.slice(0, 10);
  return null;
}

function unitQty(trade: Trade): number {
  const qs = (trade.legs || [])
    .map((l) => Math.abs(Number(l.quantity) || 0))
    .filter((q) => q > 0);
  if (!qs.length) return 1;
  const gcd = (a: number, b: number): number => {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y) {
      const t = y;
      y = x % y;
      x = t;
    }
    return x || 1;
  };
  return qs.reduce((g, q) => gcd(g, q), qs[0]);
}

function tradeExpiry(trade: Trade): string | null {
  const exp = (trade.legs || [])
    .map((l) => l.expiry)
    .filter((e): e is string => !!e)
    .map((e) => (e.length >= 10 && e[4] === "-" ? e.slice(0, 10) : e));
  if (!exp.length) return null;
  return [...exp].sort()[0];
}

/** Open↔close match key (mirrors server structure_key). */
export function structureKey(trade: Trade): string {
  const legs = trade.legs || [];
  let under: string | null = null;
  for (const l of legs) {
    if (l.underlier) {
      under = l.underlier;
      break;
    }
  }
  if (!under) {
    for (const l of legs) {
      if (l.symbol) {
        under = l.symbol;
        break;
      }
    }
  }
  if (!under) under = trade.strategy;
  const exp = tradeExpiry(trade) || "";
  const g = unitQty(trade);
  const parts: string[] = [];
  for (const l of legs) {
    const qRaw = Math.abs(Number(l.quantity) || 0) / g;
    const qS = qRaw === Math.floor(qRaw) ? String(Math.floor(qRaw)) : String(qRaw);
    const strike = l.strike == null ? "" : String(l.strike);
    const right = l.right || "";
    const ac = l.asset_class || "";
    parts.push(`${qS}@${strike}${right}:${ac}`);
  }
  parts.sort();
  return `${trade.account_id}|${trade.strategy}|${under}|${exp}|${parts.join("|")}`;
}

const MAX_STRUCTURE_HOLD_DAYS = 30;

function holdWithinLimit(openDay: string, closeDay: string): boolean {
  const a = Date.parse(openDay);
  const b = Date.parse(closeDay);
  if (Number.isNaN(a) || Number.isNaN(b)) return false;
  const span = Math.round((b - a) / 86400000);
  return span >= 0 && span <= MAX_STRUCTURE_HOLD_DAYS;
}

export type OpenCloseMatch = {
  open: Trade;
  open_day: string;
  close: Trade | null;
  close_day: string | null;
};

/** FIFO open→close by structure key (mirrors server matching.py). */
export function matchOpenClose(trades: Trade[]): OpenCloseMatch[] {
  const sorted = [...trades].sort((a, b) => {
    const ea = a.exec_at || "";
    const eb = b.exec_at || "";
    if (ea !== eb) return ea < eb ? -1 : 1;
    return a.id - b.id;
  });
  const queues = new Map<string, OpenCloseMatch[]>();
  const result: OpenCloseMatch[] = [];

  for (const t of sorted) {
    const day = ymdFromExec(t.exec_at);
    if (!day) continue;
    if (t.strategy === "NOTE" && !(t.legs || []).length) continue;

    const key = structureKey(t);
    const isClose = tradeIsCloseFill(t);

    if (!isClose) {
      const m: OpenCloseMatch = {
        open: t,
        open_day: day,
        close: null,
        close_day: null,
      };
      const q = queues.get(key) || [];
      q.push(m);
      queues.set(key, q);
      result.push(m);
      continue;
    }

    const q = queues.get(key) || [];
    const openSlot = q.find(
      (m) => m.close === null && holdWithinLimit(m.open_day, day),
    );
    if (openSlot) {
      openSlot.close = t;
      openSlot.close_day = day;
    }
  }
  return result;
}

/** Opens still without a paired close (still “on the book”). */
export function listUnmatchedOpens(trades: Trade[]): Trade[] {
  return matchOpenClose(trades)
    .filter((m) => m.close === null)
    .map((m) => m.open);
}

export function findPairedClose(
  trades: Trade[],
  openId: number,
): Trade | null {
  const m = matchOpenClose(trades).find((x) => x.open.id === openId);
  return m?.close ?? null;
}

/** Given a close fill id, the open it is paired with (if any). */
export function findPairedOpen(
  trades: Trade[],
  closeId: number,
): Trade | null {
  const m = matchOpenClose(trades).find(
    (x) => x.close != null && x.close.id === closeId,
  );
  return m?.open ?? null;
}

/**
 * Delete order rule: a paired open cannot be deleted while its TO_CLOSE still exists.
 * Delete the close first; then the open may be deleted.
 */
export function canDeleteTrade(
  trade: Trade,
  all: Trade[],
): { ok: boolean; reason?: string; blockingClose?: Trade } {
  if (tradeIsCloseFill(trade)) {
    return { ok: true };
  }
  // Open (or non-close) fill
  const close = findPairedClose(all, trade.id);
  if (close) {
    return {
      ok: false,
      reason: `Delete the TO CLOSE fill (#${close.id}) first. Only then can this TO OPEN be deleted.`,
      blockingClose: close,
    };
  }
  return { ok: true };
}

export function isManualEntry(trade: Trade | null | undefined): boolean {
  if (!trade) return true;
  return normalizeEntrySource(trade.entry_source) === "manual";
}

/**
 * Prefill a closing fill from an open: reverse BUY/SELL, TO_CLOSE,
 * flip debit/credit, clear fill prices for the member to enter.
 */
export function buildCloseDraftFromOpen(open: Trade): {
  account_id: number;
  strategy: string;
  asset_class: string;
  order_type: string;
  net_price: string;
  net_side: string;
  legs: Leg[];
  source_open_id: number;
} {
  const flipSide = (s: "BUY" | "SELL"): "BUY" | "SELL" =>
    s === "BUY" ? "SELL" : "BUY";
  let netSide = open.net_side || "";
  if (netSide === "DEBIT") netSide = "CREDIT";
  else if (netSide === "CREDIT") netSide = "DEBIT";

  return {
    account_id: open.account_id,
    strategy: open.strategy,
    asset_class: open.asset_class || "equity_option",
    order_type: open.order_type || "LMT",
    net_price: "",
    net_side: netSide,
    source_open_id: open.id,
    legs: (open.legs || []).map((l) => ({
      side: flipSide(l.side),
      quantity: l.quantity,
      pos_effect: "TO_CLOSE" as const,
      asset_class: l.asset_class || open.asset_class,
      underlier: l.underlier ?? null,
      symbol: l.symbol ?? null,
      expiry: l.expiry ?? null,
      strike: l.strike ?? null,
      right: l.right ?? null,
      fill_price: 0,
    })),
  };
}

export function describeOpenTrade(t: Trade): string {
  const under =
    t.legs?.find((l) => l.underlier)?.underlier ||
    t.legs?.find((l) => l.symbol)?.symbol ||
    "—";
  const exp = tradeExpiry(t) || "—";
  const day = ymdFromExec(t.exec_at) || "—";
  return `${t.strategy} · ${under} · exp ${exp} · opened ${day} · #${t.id}`;
}

export function tradeUnitQty(trade: Trade): number {
  return unitQty(trade);
}

export function tradeExpiryYmd(trade: Trade): string | null {
  return tradeExpiry(trade);
}

export function shortStructureLabel(t: Trade): string {
  const under =
    t.legs?.find((l) => l.underlier)?.underlier ||
    t.legs?.find((l) => l.symbol)?.symbol ||
    "—";
  const strikes = (t.legs || [])
    .map((l) => l.strike)
    .filter((s): s is number => s != null)
    .sort((a, b) => a - b);
  const mid =
    strikes.length > 0
      ? strikes[Math.floor(strikes.length / 2)]
      : null;
  const exp = tradeExpiry(t)?.slice(5) || "—";
  const midS = mid != null ? String(mid) : "—";
  return `${t.strategy} · ${under} ${midS} · ${exp}`;
}

/** Find open that a close draft would pair with (FIFO structure match). */
export function findOpenForCloseDraft(
  trades: Trade[],
  closeDraft: Pick<Trade, "account_id" | "strategy" | "legs" | "exec_at">,
): Trade | null {
  const key = structureKey(closeDraft as Trade);
  const day = ymdFromExec(closeDraft.exec_at) || new Date().toISOString().slice(0, 10);
  const matched = matchOpenClose(trades);
  for (const m of matched) {
    if (m.close != null) continue;
    if (structureKey(m.open) !== key) continue;
    if (!holdWithinLimit(m.open_day, day)) continue;
    return m.open;
  }
  return null;
}

export function structureDriftWarnings(
  open: Trade,
  closeLegs: Leg[],
): string[] {
  const warnings: string[] = [];
  const openKey = structureKey(open);
  const draft: Trade = {
    ...open,
    id: -1,
    legs: closeLegs,
  };
  // Rebuild key ignoring side by using structureKey (ignores side/pos_effect)
  if (structureKey(draft) !== openKey) {
    warnings.push(
      "Structure no longer matches the open (strikes, expiry, underlier, or quantities changed).",
    );
  }
  return warnings;
}

export type TradeRowIssue =
  | "unmatched_open"
  | "orphan_close"
  | "missing_net"
  | "missing_legs"
  | "missing_exec";

export function tradeRowIssues(
  trade: Trade,
  all: Trade[],
): TradeRowIssue[] {
  const issues: TradeRowIssue[] = [];
  if (!(trade.legs || []).length && trade.strategy !== "NOTE") {
    issues.push("missing_legs");
  }
  if (trade.net_price == null && trade.strategy !== "NOTE") {
    issues.push("missing_net");
  }
  if (!trade.exec_at) issues.push("missing_exec");
  const isClose = tradeIsCloseFill(trade);
  if (!isClose && (trade.legs || []).length > 0) {
    const m = matchOpenClose(all).find((x) => x.open.id === trade.id);
    if (m && !m.close) issues.push("unmatched_open");
  }
  if (isClose) {
    const paired = matchOpenClose(all).some(
      (m) => m.close && m.close.id === trade.id,
    );
    if (!paired) issues.push("orphan_close");
  }
  return issues;
}

export function issueLabel(issue: TradeRowIssue): string {
  switch (issue) {
    case "unmatched_open":
      return "Open";
    case "orphan_close":
      return "Orphan close";
    case "missing_net":
      return "No net";
    case "missing_legs":
      return "No legs";
    case "missing_exec":
      return "No time";
  }
}

export type PositionBadge = "open" | "complete" | "orphan_close" | "neutral";

export function positionBadge(
  trade: Trade,
  all: Trade[],
): PositionBadge {
  if (tradeIsCloseFill(trade)) {
    const paired = matchOpenClose(all).some(
      (m) => m.close && m.close.id === trade.id,
    );
    return paired ? "complete" : "orphan_close";
  }
  if ((trade.legs || []).length === 0) return "neutral";
  const m = matchOpenClose(all).find((x) => x.open.id === trade.id);
  if (m?.close) return "complete";
  if (m) return "open";
  return "neutral";
}

/** Equity options: points × 100 ≈ $ per unit (display hint only). */
export function netDollarHint(
  netPrice: number | null | undefined,
  assetClass: string,
  units = 1,
): string | null {
  if (netPrice == null || Number.isNaN(Number(netPrice))) return null;
  if (assetClass && assetClass !== "equity_option") return null;
  const dollars = Math.abs(Number(netPrice)) * 100 * Math.max(1, units);
  return `≈ $${dollars.toFixed(0)} / unit (×100)`;
}

export const TRASH_REASONS = [
  { id: "wrong_entry", label: "Wrong entry" },
  { id: "wrong_account", label: "Wrong account" },
  { id: "test", label: "Test / practice" },
  { id: "duplicate", label: "Duplicate" },
  { id: "other", label: "Other" },
] as const;

