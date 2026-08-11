/**
 * Parse Thinkorswim order lines produced by Labs tosGenerator
 * (MSC-compatible shape).
 *
 * Examples:
 *   BUY +1 BUTTERFLY SPX 100 (Weeklys) 11 AUG 26 7720/7750/7780 CALL @1.25 LMT
 *   SELL -1 VERTICAL SPX 100 (Weeklys) 11 AUG 26 5600/5700 PUT @0.80 LMT
 *   BUY +1 SPX 100 (Weeklys) 11 AUG 26 5750 CALL @12.50 LMT
 */

export type TosRight = "call" | "put";

export type ParsedTosLeg = {
  strike: number;
  quantity: number; // signed: + long, − short
  right: TosRight;
  expiration: string; // YYYY-MM-DD
};

export type ParsedTosTrade = {
  action: "BUY" | "SELL";
  structure: "butterfly" | "vertical" | "single" | "custom";
  symbol: string;
  expiration: string;
  right: TosRight;
  /** Absolute limit price from @x.xx LMT when present */
  limit: number | null;
  /** Debit paid (positive) or credit received (positive credit) */
  debit: number | null;
  isCredit: boolean;
  strikes: number[];
  /** Center-to-wing width for flies; long-short for verticals */
  width: number | null;
  body: number | null;
  legs: ParsedTosLeg[];
  raw: string;
};

const MONTHS: Record<string, number> = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12,
};

/** DD MMM YY → YYYY-MM-DD */
export function parseTosExpiration(tok: string, mon: string, yy: string): string | null {
  const d = parseInt(tok, 10);
  const m = MONTHS[mon.toUpperCase()];
  const y = parseInt(yy, 10);
  if (!Number.isFinite(d) || !m || !Number.isFinite(y)) return null;
  const year = y < 100 ? 2000 + y : y;
  return `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function parseTosScript(raw: string): ParsedTosTrade | null {
  const line = String(raw || "")
    .trim()
    .replace(/\s+/g, " ");
  if (!line) return null;

  // Limit: @1.25 LMT
  let limit: number | null = null;
  const limM = line.match(/@([\d.]+)\s*LMT/i);
  if (limM) limit = parseFloat(limM[1]);

  const action: "BUY" | "SELL" = /^\s*SELL\b/i.test(line) ? "SELL" : "BUY";
  const isCredit = action === "SELL";
  const debit =
    limit != null ? (isCredit ? -Math.abs(limit) : Math.abs(limit)) : null;

  // Right
  const rightM = line.match(/\b(CALL|PUT)\b/i);
  if (!rightM) return null;
  const right: TosRight = rightM[1].toUpperCase() === "PUT" ? "put" : "call";

  // Expiration: 11 AUG 26
  const expM = line.match(/\b(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2})\b/);
  if (!expM) return null;
  const expiration = parseTosExpiration(expM[1], expM[2], expM[3]);
  if (!expiration) return null;

  // Symbol: after qty token(s), before 100
  // BUY +1 BUTTERFLY SPX 100 ...
  // BUY +1 SPX 100 ...
  let symbol = "SPX";
  const symM = line.match(
    /\b(?:BUTTERFLY|VERTICAL)\s+([A-Z0-9.]+)\s+100\b/i,
  );
  if (symM) {
    symbol = symM[1].toUpperCase();
  } else {
    const singleSym = line.match(/\b[+\-]?\d+\s+([A-Z0-9.]+)\s+100\b/i);
    if (singleSym) symbol = singleSym[1].toUpperCase();
  }

  // Strikes: 7720/7750/7780 or single 5750 before CALL|PUT
  const strikesBlock = line.match(
    /(\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)*)\s+(?:CALL|PUT)\b/i,
  );
  if (!strikesBlock) return null;
  const strikes = strikesBlock[1]
    .split("/")
    .map((s) => parseFloat(s))
    .filter((n) => Number.isFinite(n));
  if (!strikes.length) return null;

  let structure: ParsedTosTrade["structure"] = "custom";
  if (/\bBUTTERFLY\b/i.test(line) && strikes.length === 3) {
    structure = "butterfly";
  } else if (/\bVERTICAL\b/i.test(line) && strikes.length === 2) {
    structure = "vertical";
  } else if (strikes.length === 1) {
    structure = "single";
  } else if (strikes.length === 3) {
    structure = "butterfly";
  } else if (strikes.length === 2) {
    structure = "vertical";
  }

  // Qty from +1 / -1 after BUY/SELL
  const qtyM = line.match(/\b(?:BUY|SELL)\s+([+\-]?\d+)\b/i);
  const unit = qtyM ? Math.abs(parseInt(qtyM[1], 10)) || 1 : 1;
  const signUnit = action === "BUY" ? 1 : -1;

  let legs: ParsedTosLeg[] = [];
  let width: number | null = null;
  let body: number | null = null;

  if (structure === "butterfly" && strikes.length === 3) {
    const [lo, mid, hi] = [...strikes].sort((a, b) => a - b);
    body = mid;
    width = mid - lo;
    // Long fly BUY: +1/-2/+1 ; short fly SELL: -1/+2/-1
    legs = [
      { strike: lo, quantity: 1 * signUnit * unit, right, expiration },
      { strike: mid, quantity: -2 * signUnit * unit, right, expiration },
      { strike: hi, quantity: 1 * signUnit * unit, right, expiration },
    ];
  } else if (structure === "vertical" && strikes.length === 2) {
    const [a, b] = [...strikes].sort((a, b) => a - b);
    width = b - a;
    body = right === "call" ? a : b; // long strike for debit vertical convention
    if (action === "BUY") {
      // Long call vertical: long low / short high; long put vertical: long high / short low
      if (right === "call") {
        legs = [
          { strike: a, quantity: unit, right, expiration },
          { strike: b, quantity: -unit, right, expiration },
        ];
      } else {
        legs = [
          { strike: b, quantity: unit, right, expiration },
          { strike: a, quantity: -unit, right, expiration },
        ];
      }
    } else {
      if (right === "call") {
        legs = [
          { strike: a, quantity: -unit, right, expiration },
          { strike: b, quantity: unit, right, expiration },
        ];
      } else {
        legs = [
          { strike: b, quantity: -unit, right, expiration },
          { strike: a, quantity: unit, right, expiration },
        ];
      }
    }
  } else {
    legs = strikes.map((k) => ({
      strike: k,
      quantity: unit * signUnit,
      right,
      expiration,
    }));
    body = strikes[0] ?? null;
  }

  return {
    action,
    structure,
    symbol,
    expiration,
    right,
    limit,
    debit,
    isCredit,
    strikes: [...strikes].sort((a, b) => a - b),
    width,
    body,
    legs,
    raw: line,
  };
}
