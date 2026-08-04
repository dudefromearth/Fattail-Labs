/**
 * tosGenerator.ts — Generate ThinkOrSwim order scripts from position legs.
 *
 * Output format: BUY +1 VERTICAL SPX 100 (Weeklys) 18 APR 25 5600/5700 PUT @1.25 LMT
 */

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** Format YYYY-MM-DD → DD MMM YY */
function formatTosExpiration(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]} ${MONTHS[parseInt(parts[1]) - 1]} ${parts[0].slice(2)}`;
}

export function generateTosScript(params: {
  symbol: string;
  legs: Array<{ strike: number; expiration: string; right: 'call' | 'put'; quantity: number }>;
  costBasis?: number | null;
}): string {
  const { symbol, legs, costBasis } = params;
  if (legs.length === 0) return '';

  const sym = symbol || 'SPX';
  const price = costBasis != null ? ` @${costBasis.toFixed(2)} LMT` : '';

  const expFormatted = formatTosExpiration(legs[0].expiration);
  const sideUpper = legs[0].right.toUpperCase();

  const netQty = legs.reduce((sum, l) => sum + l.quantity, 0);
  const action = netQty >= 0 ? 'BUY' : 'SELL';
  const sign = netQty >= 0 ? '+' : '-';

  const sorted = [...legs].sort((a, b) => a.strike - b.strike);

  // Single leg
  if (legs.length === 1) {
    const leg = legs[0];
    const a = leg.quantity > 0 ? 'BUY' : 'SELL';
    const s = leg.quantity > 0 ? '+' : '-';
    const q = Math.abs(leg.quantity);
    return `${a} ${s}${q} ${sym} 100 (Weeklys) ${expFormatted} ${leg.strike} ${leg.right.toUpperCase()}${price}`;
  }

  // Two legs, same right, same expiration → vertical
  if (
    legs.length === 2 &&
    legs[0].right === legs[1].right &&
    legs[0].expiration === legs[1].expiration
  ) {
    const strikes = sorted.map(l => l.strike).join('/');
    const qty = Math.abs(sorted[0].quantity);
    return `${action} ${sign}${qty} VERTICAL ${sym} 100 (Weeklys) ${expFormatted} ${strikes} ${sideUpper}${price}`;
  }

  // Three legs, same right, same expiration, middle is 2× outer → butterfly
  if (
    legs.length === 3 &&
    sorted.every(l => l.right === sorted[0].right) &&
    sorted.every(l => l.expiration === sorted[0].expiration) &&
    Math.abs(sorted[1].quantity) === 2 * Math.abs(sorted[0].quantity)
  ) {
    const strikes = sorted.map(l => l.strike).join('/');
    const qty = Math.abs(sorted[0].quantity);
    return `${action} ${sign}${qty} BUTTERFLY ${sym} 100 (Weeklys) ${expFormatted} ${strikes} ${sorted[0].right.toUpperCase()}${price}`;
  }

  // Fallback: one line per leg
  return legs
    .map(leg => {
      const a = leg.quantity > 0 ? 'BUY' : 'SELL';
      const s = leg.quantity > 0 ? '+' : '-';
      const q = Math.abs(leg.quantity);
      const exp = formatTosExpiration(leg.expiration);
      return `${a} ${s}${q} ${sym} 100 (Weeklys) ${exp} ${leg.strike} ${leg.right.toUpperCase()}`;
    })
    .join('\n') + (price ? `\n${price.trim()}` : '');
}
