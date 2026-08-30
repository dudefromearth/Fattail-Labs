/**
 * StudioOne → TM hold. Coarse whole session, then infill to full.
 * One path for every date including today (TMI-82 · TMI-90).
 */

import {
  coverageFlagsFromDoc,
  coverageUrl,
  coveredDatesFromDoc,
  defaultArchiveGet,
  fetchUrl,
  type ArchiveCoverageDoc,
  type ArchiveFetchDoc,
  type ArchiveGet,
  type ArchiveSnap,
} from "./archiveApi";
import type { ReplaySample } from "./algoDayReplay";
import type { TmTodayGen } from "./tmSlots";

export const TM_HOLE_NO_PATH = "NO PATH" as const;
export const TM_HOLE_WAITING = "WAITING" as const;

export function snapToGen(
  snap: ArchiveSnap,
  symbol: string,
): TmTodayGen | null {
  const gen = snap.generation ?? {};
  const asOf = String(gen.as_of || snap.captured_at || "").trim();
  const t = Date.parse(asOf);
  if (!Number.isFinite(t)) return null;
  const spot = typeof gen.spot === "number" ? gen.spot : null;
  if (spot == null || !(spot > 0)) return null;
  const file = String(snap._file || "").trim();
  const hash =
    String(gen.content_hash || file || "").trim() || `t:${t}`;
  const expiration = String(snap.expiration || "").slice(0, 10);
  return {
    t_ms: t,
    asOf,
    contentHash: hash,
    spot,
    symbol,
    expiration,
    file: file || undefined,
  };
}

export function mergeGens(
  a: readonly TmTodayGen[],
  b: readonly TmTodayGen[],
): TmTodayGen[] {
  const map = new Map<string, TmTodayGen>();
  const key = (g: TmTodayGen) =>
    g.file ? `f:${g.file}` : `t:${g.t_ms}:${g.contentHash}`;
  for (const g of a) map.set(key(g), g);
  for (const g of b) map.set(key(g), g);
  return [...map.values()].sort((x, y) => x.t_ms - y.t_ms);
}

export function gensAsSamples(
  gens: readonly TmTodayGen[],
): ReplaySample[] {
  return gens
    .filter((g) => g.spot != null && g.spot > 0)
    .map((g) => ({ t_ms: g.t_ms, spot: g.spot as number }));
}

/** Visual downsample of the same generations. Not a second spot source. */
export function downsampleLine(
  samples: readonly ReplaySample[],
  maxPts = 160,
): ReplaySample[] {
  if (samples.length <= maxPts) return samples.slice();
  const stride = Math.max(1, Math.ceil((samples.length - 1) / (maxPts - 1)));
  const out: ReplaySample[] = [];
  for (let i = 0; i < samples.length; i += stride) out.push(samples[i]);
  const last = samples[samples.length - 1];
  if (out[out.length - 1] !== last) out.push(last);
  return out;
}

export function fidelityPct(held: number, countOnDisk: number): number {
  if (!(countOnDisk > 0)) return held > 0 ? 1 : 0;
  return Math.min(1, Math.max(0, held / countOnDisk));
}

function asFetchDoc(body: unknown): ArchiveFetchDoc {
  return body && typeof body === "object" ? (body as ArchiveFetchDoc) : {};
}

function asCoverageDoc(body: unknown): ArchiveCoverageDoc {
  return body && typeof body === "object" ? (body as ArchiveCoverageDoc) : {};
}

export type FillArchiveOpts = {
  symbol: string;
  day: string;
  signal?: AbortSignal;
  get?: ArchiveGet;
  onFidelity?: (pct: number) => void;
  onHole?: (hole: string) => void;
  onCoarse?: (gens: TmTodayGen[]) => void;
  onInfill?: (gens: TmTodayGen[]) => void;
};

export type FillArchiveResult = {
  hole: string | null;
  gens: TmTodayGen[];
  fidelity: number;
  countOnDisk: number;
  /** Explicit archive miss — calendar may grey this day. Errors are not this. */
  uncovered?: boolean;
};

function isAbort(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err != null &&
    "name" in err &&
    (err as { name: string }).name === "AbortError"
  );
}

async function fetchLevelSnaps(
  opts: {
    day: string;
    symbol: string;
    level: number;
    dayHash?: string;
    signal?: AbortSignal;
    get: ArchiveGet;
  },
): Promise<{ snaps: ArchiveSnap[]; countOnDisk: number; k: number; hash: string }> {
  const snaps: ArchiveSnap[] = [];
  let fromIndex: number | undefined;
  let countOnDisk = 0;
  let k = 0;
  let hash = opts.dayHash ?? "";
  for (;;) {
    if (opts.signal?.aborted) break;
    const url = fetchUrl({
      day: opts.day,
      symbol: opts.symbol,
      level: opts.level,
      dayHash: hash || undefined,
      fromIndex,
    });
    const res = await opts.get(url, opts.signal);
    const doc = asFetchDoc(res.body);
    if (doc.hole && !doc.snaps?.length) {
      return { snaps: [], countOnDisk: 0, k: 0, hash };
    }
    if (typeof doc.count_on_disk === "number") countOnDisk = doc.count_on_disk;
    if (typeof doc.k === "number") k = doc.k;
    if (doc.hash) hash = String(doc.hash);
    snaps.push(...(doc.snaps ?? []));
    if (doc.next_index == null) break;
    fromIndex = doc.next_index;
  }
  return { snaps, countOnDisk, k, hash };
}

export async function fillArchiveSlot(
  opts: FillArchiveOpts,
): Promise<FillArchiveResult> {
  const get = opts.get ?? defaultArchiveGet;
  const symbol = opts.symbol.trim().toUpperCase();
  const day = opts.day;
  const empty = (
    hole: string | null,
    extra?: Partial<FillArchiveResult>,
  ): FillArchiveResult => ({
    hole,
    gens: [],
    fidelity: 0,
    countOnDisk: 0,
    ...extra,
  });

  try {
    const covRes = await get(coverageUrl(symbol, day, day), opts.signal);
    if (opts.signal?.aborted) return empty(null);

    const cov = asCoverageDoc(covRes.body);
    const flags = coverageFlagsFromDoc(cov);
    if (flags.get(day) === false) {
      opts.onHole?.(TM_HOLE_NO_PATH);
      return empty(TM_HOLE_NO_PATH, { uncovered: true });
    }

    opts.onFidelity?.(0);

    const level0 = await fetchLevelSnaps({
      day,
      symbol,
      level: 0,
      signal: opts.signal,
      get,
    });
    if (opts.signal?.aborted) {
      return empty(null, { countOnDisk: level0.countOnDisk });
    }
    let gens = mergeGens(
      [],
      level0.snaps
        .map((s) => snapToGen(s, symbol))
        .filter((g): g is TmTodayGen => g != null),
    );
    opts.onCoarse?.(gens);
    let fidelity = fidelityPct(gens.length, level0.countOnDisk);
    opts.onFidelity?.(fidelity);

    const k = level0.k;
    for (let level = 1; level <= k; level += 1) {
      if (opts.signal?.aborted) break;
      const packed = await fetchLevelSnaps({
        day,
        symbol,
        level,
        dayHash: level0.hash,
        signal: opts.signal,
        get,
      });
      if (opts.signal?.aborted) break;
      const more = packed.snaps
        .map((s) => snapToGen(s, symbol))
        .filter((g): g is TmTodayGen => g != null);
      gens = mergeGens(gens, more);
      opts.onInfill?.(gens);
      fidelity = fidelityPct(
        gens.length,
        packed.countOnDisk || level0.countOnDisk,
      );
      opts.onFidelity?.(fidelity);
    }

    if (opts.signal?.aborted) {
      return { hole: null, gens, fidelity, countOnDisk: level0.countOnDisk };
    }
    return {
      hole: gens.length ? null : TM_HOLE_NO_PATH,
      gens,
      fidelity,
      countOnDisk: level0.countOnDisk,
      uncovered: gens.length ? false : true,
    };
  } catch (err) {
    if (opts.signal?.aborted || isAbort(err)) return empty(null);
    throw err;
  }
}

export async function fetchCoveredDates(
  symbol: string,
  from?: string,
  to?: string,
  get: ArchiveGet = defaultArchiveGet,
): Promise<Set<string>> {
  const res = await get(coverageUrl(symbol, from, to));
  return coveredDatesFromDoc(asCoverageDoc(res.body));
}

export function mergeCoverageFlags(
  prev: Map<string, boolean> | null | undefined,
  next: Map<string, boolean>,
): Map<string, boolean> {
  const m = new Map(prev ?? []);
  for (const [k, v] of next) m.set(k, v);
  return m;
}

export async function fetchCoverageFlags(
  symbol: string,
  from?: string,
  to?: string,
  get: ArchiveGet = defaultArchiveGet,
): Promise<Map<string, boolean>> {
  const res = await get(coverageUrl(symbol, from, to));
  return coverageFlagsFromDoc(asCoverageDoc(res.body));
}
