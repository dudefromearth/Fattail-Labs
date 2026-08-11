/**
 * Black-Scholes pricing — Labs reimplementation of MSC risk-graph formulas
 * (same constants/edge cases as MSC UI blackScholes.ts / pricing.py).
 * No MSC imports.
 */

export const RISK_FREE_RATE = 0.05;

export function normCdf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * absX);
  const poly = t * (a1 + t * (a2 + t * (a3 + t * (a4 + t * a5))));
  const erf = 1.0 - poly * Math.exp(-absX * absX);
  return 0.5 * (1.0 + sign * erf);
}

export function normPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2.0 * Math.PI);
}

export function bsPrice(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  isCall: boolean,
  q = 0,
): number {
  if (S <= 0 || K <= 0 || T <= 0 || sigma <= 0) {
    return isCall ? Math.max(0, S - K) : Math.max(0, K - S);
  }
  const sqrtT = Math.sqrt(T);
  const d1 =
    (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  if (isCall) {
    return S * Math.exp(-q * T) * normCdf(d1) - K * Math.exp(-r * T) * normCdf(d2);
  }
  return K * Math.exp(-r * T) * normCdf(-d2) - S * Math.exp(-q * T) * normCdf(-d1);
}

export type Greeks = { delta: number; gamma: number; theta: number; vega: number };

/** Per-unit greeks (not ×100). Theta = daily. */
export function bsGreeks(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  isCall: boolean,
  q = 0,
): Greeks {
  if (S <= 0 || K <= 0 || T <= 0 || sigma <= 0) {
    const intrinsic = isCall ? (S > K ? 1 : 0) : S < K ? -1 : 0;
    return { delta: isCall ? (S > K ? 1 : 0) : S < K ? -1 : 0, gamma: 0, theta: 0, vega: 0 };
  }
  const sqrtT = Math.sqrt(T);
  const d1 =
    (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  const pdf = normPdf(d1);
  const delta = isCall
    ? Math.exp(-q * T) * normCdf(d1)
    : Math.exp(-q * T) * (normCdf(d1) - 1);
  const gamma = (Math.exp(-q * T) * pdf) / (S * sigma * sqrtT);
  const vega = (S * Math.exp(-q * T) * pdf * sqrtT) / 100; // per 1 vol point
  // theta per day
  const term1 = (-S * Math.exp(-q * T) * pdf * sigma) / (2 * sqrtT);
  const term2 = isCall
    ? -r * K * Math.exp(-r * T) * normCdf(d2) + q * S * Math.exp(-q * T) * normCdf(d1)
    : r * K * Math.exp(-r * T) * normCdf(-d2) - q * S * Math.exp(-q * T) * normCdf(-d1);
  const theta = (term1 + term2) / 365;
  return { delta, gamma, theta, vega };
}

/** Years to 4pm ET on expiration date (MSC fractionalT). */
export function fractionalT(expiration: string, nowMs = Date.now()): number {
  const [y, m, d] = expiration.split("-").map(Number);
  const month = m;
  const isDst = month >= 3 && month <= 11;
  const closeMs = isDst
    ? Date.UTC(y, m - 1, d, 20, 0, 0)
    : Date.UTC(y, m - 1, d, 21, 0, 0);
  const T = (closeMs - nowMs) / (365.25 * 24 * 3600 * 1000);
  const minT = 1 / (365 * 24);
  return Math.max(T, minT);
}
