/**
 * Volume-by-price bins from OHLC bars (AZ-VP-9).
 * OHLC store remains the data plane; presentation is bins only — no candles.
 */

export type OhlcLike = {
  h: number | null;
  l: number | null;
  c: number;
  v?: number | null;
};

export type VolumeBin = {
  /** Bin low (price) */
  low: number;
  /** Bin high (price) */
  high: number;
  /** Mid of bin */
  mid: number;
  volume: number;
};

export type VolumeProfileStats = {
  bins: VolumeBin[];
  poc: number | null;
  vah: number | null;
  val: number | null;
  totalVolume: number;
  priceMin: number;
  priceMax: number;
};

/**
 * Distribute each bar's volume evenly across price bins spanning [low, high].
 * Falls back to close when H/L missing.
 */
export function buildVolumeProfileBins(
  bars: readonly OhlcLike[],
  binCount = 48,
): VolumeProfileStats {
  const empty: VolumeProfileStats = {
    bins: [],
    poc: null,
    vah: null,
    val: null,
    totalVolume: 0,
    priceMin: 0,
    priceMax: 0,
  };
  if (!bars.length || binCount < 2) return empty;

  let pMin = Infinity;
  let pMax = -Infinity;
  for (const b of bars) {
    const lo = b.l != null && b.l > 0 ? b.l : b.c;
    const hi = b.h != null && b.h > 0 ? b.h : b.c;
    if (!(lo > 0) || !(hi > 0)) continue;
    pMin = Math.min(pMin, lo);
    pMax = Math.max(pMax, hi);
  }
  if (!(pMin < Infinity) || !(pMax > pMin)) {
    // all equal closes
    const c = bars[bars.length - 1]?.c;
    if (!(c > 0)) return empty;
    pMin = c * 0.995;
    pMax = c * 1.005;
  }

  const width = (pMax - pMin) / binCount;
  const vols = new Array(binCount).fill(0) as number[];

  for (const b of bars) {
    const vol = b.v != null && b.v > 0 ? b.v : 1;
    const lo = b.l != null && b.l > 0 ? b.l : b.c;
    const hi = b.h != null && b.h > 0 ? b.h : b.c;
    if (!(lo > 0) || !(hi > 0)) continue;
    const i0 = Math.max(0, Math.min(binCount - 1, Math.floor((lo - pMin) / width)));
    const i1 = Math.max(0, Math.min(binCount - 1, Math.floor((hi - pMin) / width)));
    const n = Math.max(1, i1 - i0 + 1);
    const share = vol / n;
    for (let i = i0; i <= i1; i++) vols[i] += share;
  }

  const bins: VolumeBin[] = vols.map((volume, i) => {
    const low = pMin + i * width;
    const high = low + width;
    return { low, high, mid: (low + high) / 2, volume };
  });

  const totalVolume = vols.reduce((a, b) => a + b, 0);
  let pocIdx = 0;
  for (let i = 1; i < vols.length; i++) {
    if (vols[i] > vols[pocIdx]) pocIdx = i;
  }
  const poc = bins[pocIdx]?.mid ?? null;

  // Value area ~70% of volume expanding from POC
  let vaVol = vols[pocIdx] ?? 0;
  let lo = pocIdx;
  let hi = pocIdx;
  const target = totalVolume * 0.7;
  while (vaVol < target && (lo > 0 || hi < binCount - 1)) {
    const nextLo = lo > 0 ? vols[lo - 1] : -1;
    const nextHi = hi < binCount - 1 ? vols[hi + 1] : -1;
    if (nextHi >= nextLo) {
      hi += 1;
      vaVol += vols[hi] ?? 0;
    } else {
      lo -= 1;
      vaVol += vols[lo] ?? 0;
    }
  }

  return {
    bins,
    poc,
    vah: bins[hi]?.high ?? null,
    val: bins[lo]?.low ?? null,
    totalVolume,
    priceMin: pMin,
    priceMax: pMax,
  };
}
