/**
 * Thinkorswim order script generator — Labs port of MSC UI/src/lib/tosGenerator.ts.
 * No MSC imports (standalone).
 *
 * Example:
 *   BUY +1 BUTTERFLY SPX 100 (Weeklys) 11 AUG 26 7720/7750/7780 CALL @1.25 LMT
 */

const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const;

/** Format YYYY-MM-DD → DD MMM YY */
export function formatTosExpiration(dateStr: string): string {
  const parts = String(dateStr).slice(0, 10).split("-");
  if (parts.length !== 3) return dateStr;
  const mon = MONTHS[parseInt(parts[1], 10) - 1];
  if (!mon) return dateStr;
  return `${parts[2]} ${mon} ${parts[0].slice(2)}`;
}

export type TosLeg = {
  strike: number;
  expiration: string;
  right: "call" | "put";
  /** Signed quantity: + long, − short */
  quantity: number;
};

export function generateTosScript(params: {
  symbol: string;
  legs: TosLeg[];
  costBasis?: number | null;
}): string {
  const { symbol, legs, costBasis } = params;
  if (!legs.length) return "";

  const sym = (symbol || "SPX").replace(/^I:/i, "").toUpperCase();
  const price =
    costBasis != null && Number.isFinite(costBasis)
      ? ` @${Math.abs(Number(costBasis)).toFixed(2)} LMT`
      : "";

  const expFormatted = formatTosExpiration(legs[0].expiration);
  const sideUpper = legs[0].right.toUpperCase();

  const netQty = legs.reduce((sum, l) => sum + l.quantity, 0);
  const action = netQty >= 0 ? "BUY" : "SELL";
  const sign = netQty >= 0 ? "+" : "-";

  const sorted = [...legs].sort((a, b) => a.strike - b.strike);

  if (legs.length === 1) {
    const leg = legs[0];
    const a = leg.quantity > 0 ? "BUY" : "SELL";
    const s = leg.quantity > 0 ? "+" : "-";
    const q = Math.abs(leg.quantity);
    return `${a} ${s}${q} ${sym} 100 (Weeklys) ${expFormatted} ${leg.strike} ${leg.right.toUpperCase()}${price}`;
  }

  if (
    legs.length === 2 &&
    legs[0].right === legs[1].right &&
    legs[0].expiration === legs[1].expiration
  ) {
    const strikes = sorted.map((l) => l.strike).join("/");
    const qty = Math.abs(sorted[0].quantity);
    return `${action} ${sign}${qty} VERTICAL ${sym} 100 (Weeklys) ${expFormatted} ${strikes} ${sideUpper}${price}`;
  }

  // Long fly: +1 / −2 / +1  (net 0 → BUY); short fly: −1 / +2 / −1 → SELL
  if (
    legs.length === 3 &&
    sorted.every((l) => l.right === sorted[0].right) &&
    sorted.every((l) => l.expiration === sorted[0].expiration) &&
    Math.abs(sorted[1].quantity) === 2 * Math.abs(sorted[0].quantity)
  ) {
    const strikes = sorted.map((l) => l.strike).join("/");
    const qty = Math.abs(sorted[0].quantity);
    // netQty is 0 for a unit fly — infer BUY from body short (long fly) vs long body (short fly)
    const bodyShort = sorted[1].quantity < 0;
    const flyAction = bodyShort ? "BUY" : "SELL";
    const flySign = bodyShort ? "+" : "-";
    return `${flyAction} ${flySign}${qty} BUTTERFLY ${sym} 100 (Weeklys) ${expFormatted} ${strikes} ${sorted[0].right.toUpperCase()}${price}`;
  }

  return (
    legs
      .map((leg) => {
        const a = leg.quantity > 0 ? "BUY" : "SELL";
        const s = leg.quantity > 0 ? "+" : "-";
        const q = Math.abs(leg.quantity);
        const exp = formatTosExpiration(leg.expiration);
        return `${a} ${s}${q} ${sym} 100 (Weeklys) ${exp} ${leg.strike} ${leg.right.toUpperCase()}`;
      })
      .join("\n") + (price ? `\n${price.trim()}` : "")
  );
}

/** Symmetric long fly legs at body ± width. */
export function symFlyTosLegs(params: {
  body: number;
  widthPts: number;
  expiration: string;
  side: "call" | "put";
  /** long fly (default) or short fly */
  short?: boolean;
}): TosLeg[] {
  const { body, widthPts, expiration, side, short = false } = params;
  const lo = body - widthPts;
  const hi = body + widthPts;
  const s = short ? -1 : 1;
  return [
    { strike: lo, expiration, right: side, quantity: 1 * s },
    { strike: body, expiration, right: side, quantity: -2 * s },
    { strike: hi, expiration, right: side, quantity: 1 * s },
  ];
}

/** Debit vertical: +1 body, −1 far (call +w / put −w). short flips. */
export function verticalTosLegs(params: {
  body: number;
  widthPts: number;
  expiration: string;
  side: "call" | "put";
  short?: boolean;
}): TosLeg[] {
  const { body, widthPts, expiration, side, short = false } = params;
  const far = side === "call" ? body + widthPts : body - widthPts;
  const s = short ? -1 : 1;
  return [
    { strike: body, expiration, right: side, quantity: 1 * s },
    { strike: far, expiration, right: side, quantity: -1 * s },
  ];
}

/** Broken-wing (or any 1-2-1) fly legs at explicit lo / body / hi. */
export function bwFlyTosLegs(params: {
  lo: number;
  body: number;
  hi: number;
  expiration: string;
  side: "call" | "put";
  /** long fly (default) or short fly */
  short?: boolean;
}): TosLeg[] {
  const { lo, body, hi, expiration, side, short = false } = params;
  const s = short ? -1 : 1;
  return [
    { strike: lo, expiration, right: side, quantity: 1 * s },
    { strike: body, expiration, right: side, quantity: -2 * s },
    { strike: hi, expiration, right: side, quantity: 1 * s },
  ];
}
