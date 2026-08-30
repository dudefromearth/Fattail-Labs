/**
 * Primitive Algo day replay — price and time only (DL-486).
 * Full-chain snaps (vol) are a later plane.
 */

export type ReplaySample = {
  t_ms: number;
  spot: number;
  o?: number;
  h?: number;
  l?: number;
  c?: number;
};
export type ReplaySpeed = 10 | 20 | 50;
export const REPLAY_SPEEDS: ReplaySpeed[] = [10, 20, 50];

export type ReplayCursor = {
  t_ms: number;
  spot: number;
  idx: number;
  done: boolean;
};

export function replayCursor(opts: {
  samples: readonly ReplaySample[];
  /** Wall clock when Start was pressed (or resume). */
  originWallMs: number;
  /** Session time of the sample under the playhead at originWallMs. */
  originSampleMs: number;
  nowWallMs: number;
  speed: ReplaySpeed;
}): ReplayCursor | null {
  const samples = opts.samples;
  if (!samples.length) return null;
  const last = samples[samples.length - 1];
  const elapsed =
    Math.max(0, opts.nowWallMs - opts.originWallMs) * opts.speed;
  const target = opts.originSampleMs + elapsed;
  if (target >= last.t_ms) {
    return { t_ms: last.t_ms, spot: last.spot, idx: samples.length - 1, done: true };
  }
  let lo = 0;
  let hi = samples.length - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (samples[mid].t_ms <= target) lo = mid;
    else hi = mid - 1;
  }
  const s = samples[lo];
  return { t_ms: s.t_ms, spot: s.spot, idx: lo, done: false };
}

export function spotPctFromReplay(
  replaySpot: number,
  liveSpot: number,
): number {
  if (!(liveSpot > 0) || !(replaySpot > 0)) return 0;
  return ((replaySpot / liveSpot) * 100 - 100);
}

function etMinutes(tMs: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date(tMs));
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

function sessionOpenIndex(samples: readonly ReplaySample[]): number {
  const i = samples.findIndex((s) => etMinutes(s.t_ms) >= 9 * 60 + 30);
  return i >= 0 ? i : 0;
}

/** Session open: first RTH print (ATM-O1), else the first sample. */
export function sessionOpenSpot(
  samples: readonly ReplaySample[],
): number | null {
  if (!samples.length) return null;
  const row = samples[sessionOpenIndex(samples)];
  const o = typeof row.o === "number" && row.o > 0 ? row.o : row.spot;
  return o > 0 ? o : null;
}

/** Playhead at the first RTH print, priced at session open (ATM-O1). */
export function sessionOpenCursor(
  samples: readonly ReplaySample[],
): ReplayCursor | null {
  if (!samples.length) return null;
  const idx = sessionOpenIndex(samples);
  const spot = sessionOpenSpot(samples) ?? samples[idx].spot;
  return { t_ms: samples[idx].t_ms, spot, idx, done: false };
}

/** ATM / eligibility / builder while Time Machine is on: playhead, else open. */
export function sessionSpotNow(
  cursor: ReplayCursor | null,
  open: number | null,
): number | null {
  if (cursor != null && cursor.spot > 0) return cursor.spot;
  if (open != null && open > 0) return open;
  return null;
}

export function formatReplayClock(tMs: number): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(new Date(tMs));
}

export function nyYmd(ms: number = Date.now()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms));
}

export function replayFrac(
  samples: readonly ReplaySample[],
  tMs: number,
): number {
  if (samples.length < 2) return 0;
  const t0 = samples[0].t_ms;
  const t1 = samples[samples.length - 1].t_ms;
  if (!(t1 > t0)) return 0;
  return Math.min(1, Math.max(0, (tMs - t0) / (t1 - t0)));
}

export function sampleAtFrac(
  samples: readonly ReplaySample[],
  frac: number,
): ReplaySample | null {
  if (!samples.length) return null;
  const f = Math.min(1, Math.max(0, frac));
  const t0 = samples[0].t_ms;
  const t1 = samples[samples.length - 1].t_ms;
  const target = t0 + f * Math.max(0, t1 - t0);
  const c = replayCursor({
    samples,
    originWallMs: 0,
    originSampleMs: target,
    nowWallMs: 0,
    speed: 10,
  });
  if (!c) return null;
  return samples[c.idx] ?? { t_ms: c.t_ms, spot: c.spot };
}
