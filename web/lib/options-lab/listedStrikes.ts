/**
 * Listed-strike helpers for Position Builder (PB6 / OC6a).
 *
 * Strikes come only from dual-side chain ladder generations on the client
 * data plane — never invent unlisted arithmetic strikes for UI selects.
 */

/** OC6a: keep listed precision (half-strikes, cents) without float junk. */
export function normalizeStrike(n: number): number {
  if (!Number.isFinite(n)) return n;
  // 4 dp covers 0.5 / 0.25 / 0.01 listed grids; strip IEEE noise
  return Math.round(Number(n) * 10_000) / 10_000;
}

export function formatStrike(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(Number(n))) return "—";
  const v = normalizeStrike(Number(n));
  // Prefer compact display; keep fraction when listed
  if (Number.isInteger(v)) return String(v);
  const s = v.toFixed(4).replace(/\.?0+$/, "");
  return s;
}

/** Unique sorted listed strikes from a ladder. */
export function uniqueListedStrikes(
  strikes: Iterable<number | null | undefined>,
): number[] {
  const set = new Set<number>();
  for (const s of strikes) {
    if (s == null || !Number.isFinite(Number(s))) continue;
    set.add(normalizeStrike(Number(s)));
  }
  return [...set].sort((a, b) => a - b);
}

/**
 * Snap target to nearest listed strike.
 * Returns null when the ladder is empty (caller must not invent).
 */
export function snapToListed(
  target: number,
  listed: readonly number[],
): number | null {
  if (!listed.length) return null;
  const t = normalizeStrike(target);
  let best = listed[0];
  let bestD = Math.abs(best - t);
  for (const s of listed) {
    const d = Math.abs(s - t);
    if (d < bestD) {
      best = s;
      bestD = d;
    }
  }
  return best;
}

export function isListedStrike(
  strike: number,
  listed: readonly number[],
): boolean {
  const t = normalizeStrike(strike);
  return listed.some((s) => normalizeStrike(s) === t);
}

/**
 * Window of listed strikes around a center (spot / body).
 * Always includes `center` if it is listed; otherwise includes the snap of center.
 * @param radiusN how many listed strikes on each side of center index
 */
export function windowAroundStrike(
  listed: readonly number[],
  center: number,
  radiusN = 40,
): number[] {
  if (!listed.length) return [];
  const snapped = snapToListed(center, listed) ?? listed[Math.floor(listed.length / 2)];
  let idx = listed.findIndex((s) => normalizeStrike(s) === normalizeStrike(snapped));
  if (idx < 0) idx = Math.floor(listed.length / 2);
  const lo = Math.max(0, idx - radiusN);
  const hi = Math.min(listed.length, idx + radiusN + 1);
  return listed.slice(lo, hi);
}

/** Infer modal step between consecutive listed strikes near center. */
export function listedStepNear(
  listed: readonly number[],
  center: number,
): number | null {
  if (listed.length < 2) return null;
  const snapped = snapToListed(center, listed) ?? listed[0];
  let idx = listed.findIndex((s) => normalizeStrike(s) === normalizeStrike(snapped));
  if (idx < 0) idx = Math.floor(listed.length / 2);
  const neighbors: number[] = [];
  if (idx > 0) neighbors.push(listed[idx] - listed[idx - 1]);
  if (idx < listed.length - 1) neighbors.push(listed[idx + 1] - listed[idx]);
  if (!neighbors.length) return null;
  // Mode of neighbor gaps (handle half-steps mixed)
  const counts = new Map<number, number>();
  for (const g of neighbors) {
    const k = normalizeStrike(g);
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  let best = neighbors[0];
  let bestN = 0;
  for (const [g, n] of counts) {
    if (n > bestN) {
      best = g;
      bestN = n;
    }
  }
  return best > 0 ? best : null;
}

/**
 * Resolve width in *points* onto a listed grid: prefer exact listed wing
 * at center±width, else nearest listed distance matching the intent.
 */
export function listedWidthPoints(
  center: number,
  width: number,
  listed: readonly number[],
): number {
  if (!listed.length || !(width > 0)) return width;
  const c = snapToListed(center, listed) ?? center;
  const target = c + width;
  const wing = snapToListed(target, listed);
  if (wing == null) return width;
  return Math.abs(normalizeStrike(wing - c));
}

/** Common wing widths (points) that land on listed strikes both sides of center. */
export function listedWingChoices(
  center: number,
  listed: readonly number[],
  maxChoices = 12,
): number[] {
  if (listed.length < 3) return [];
  const c = snapToListed(center, listed);
  if (c == null) return [];
  const idx = listed.findIndex((s) => normalizeStrike(s) === normalizeStrike(c));
  if (idx < 0) return [];
  const out: number[] = [];
  for (let i = 1; i <= maxChoices; i++) {
    const hi = idx + i;
    const lo = idx - i;
    if (hi >= listed.length || lo < 0) break;
    const wHi = normalizeStrike(listed[hi] - c);
    const wLo = normalizeStrike(c - listed[lo]);
    // Symmetric wing preferred
    if (wHi === wLo && wHi > 0) out.push(wHi);
    else if (wHi > 0) out.push(wHi);
  }
  return [...new Set(out)].sort((a, b) => a - b);
}
