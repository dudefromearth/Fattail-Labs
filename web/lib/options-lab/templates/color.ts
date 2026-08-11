/** Diverging light-blue → dark-blue → dark-red → light-red (Spec §5.2) */

export function colorFromT(t: number): string {
  const x = Math.max(-1, Math.min(1, t));
  // Piecewise lerp in HSL-ish RGB
  if (x <= 0) {
    // light blue (0.6,0.8,1) → dark blue (0.05,0.1,0.35)
    const u = x + 1; // 0..1
    const r = Math.round(153 + (13 - 153) * u);
    const g = Math.round(204 + (26 - 204) * u);
    const b = Math.round(255 + (89 - 255) * u);
    return `rgb(${r},${g},${b})`;
  }
  // dark red (0.35,0.05,0.08) → light red (1,0.55,0.55)
  const u = x; // 0..1
  const r = Math.round(89 + (255 - 89) * u);
  const g = Math.round(13 + (140 - 13) * u);
  const b = Math.round(20 + (140 - 20) * u);
  return `rgb(${r},${g},${b})`;
}

/** p95 of absolute values */
export function p95Abs(vals: number[]): number {
  if (!vals.length) return 1;
  const a = vals.map(Math.abs).sort((x, y) => x - y);
  const i = Math.min(a.length - 1, Math.floor(a.length * 0.95));
  return a[i] || 1;
}

/** Session sticky scale update (25% hysteresis) */
export function updateStickyScale(
  sticky: number | undefined,
  rawP95: number,
  threshold = 0.25,
): number {
  const s = rawP95 > 0 ? rawP95 : 1;
  if (sticky == null || sticky <= 0) return s;
  if (Math.abs(s - sticky) / sticky > threshold) return s;
  return sticky;
}
