/**
 * Shared Time Machine host view — one playhead (tmSlots), one strip state
 * across Analyzer / Heatmap / Surface. No per-host cursor (AT-TM-C3).
 */

import {
  nyYmd,
  replayCursor,
  sessionOpenCursor,
  sessionOpenSpot,
  type ReplayCursor,
  type ReplaySample,
  type ReplaySpeed,
} from "./algoDayReplay";
import {
  TM_HOLE_WAITING,
  fetchCoverageFlags,
  fillArchiveSlot,
  gensAsSamples,
  mergeCoverageFlags,
} from "./archiveLoad";
import {
  exitReplay,
  setArchive,
  setPlayhead,
  setTmLoadDayHandler,
} from "./tmSlots";

export type TmHostView = {
  day: string;
  samples: ReplaySample[];
  cursor: ReplayCursor | null;
  hole: string | null;
  loading: boolean;
  playing: boolean;
  speed: ReplaySpeed;
  fidelity: number | null;
  coverage: Map<string, boolean> | null;
  openSpot: number | null;
  symbol: string;
};

type TmHostBag = {
  __tmHostListeners?: Set<() => void>;
  __tmHostView?: TmHostView;
  __tmHostInited?: boolean;
};

function hostBag(): TmHostBag | undefined {
  if (typeof window === "undefined") return undefined;
  return window as unknown as TmHostBag;
}

const listeners: Set<() => void> = hostBag()?.__tmHostListeners ?? new Set();
{
  const w = hostBag();
  if (w) w.__tmHostListeners = listeners;
}

const emptyView = (): TmHostView => ({
  day: "",
  samples: [],
  cursor: null,
  hole: null,
  loading: false,
  playing: false,
  speed: 10,
  fidelity: null,
  coverage: null,
  openSpot: null,
  symbol: "",
});

const view: TmHostView = hostBag()?.__tmHostView ?? emptyView();
{
  const w = hostBag();
  if (w) w.__tmHostView = view;
}

let allSamples: ReplaySample[] = view.samples.slice();
let origin = { wall: 0, sample: 0 };
let abort: AbortController | null = null;
let raf = 0;
let inited = Boolean(hostBag()?.__tmHostInited);

function emit(): void {
  for (const fn of listeners) fn();
}

export function subscribeTmHost(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getTmHost(): Readonly<TmHostView> {
  if (!view.day) view.day = nyYmd();
  return view;
}

function setView(patch: Partial<TmHostView>): void {
  Object.assign(view, patch);
  emit();
}

function residentHeapBytes(): number | null {
  const mem = (
    performance as unknown as { memory?: { usedJSHeapSize?: number } }
  ).memory;
  const n = mem?.usedJSHeapSize;
  return typeof n === "number" && Number.isFinite(n) && n >= 0
    ? Math.round(n)
    : null;
}

/** C11 watch. Best-effort; never blocks the hold. */
function reportHoldResident(payload: {
  day: string;
  symbol: string;
  gen_count: number;
  fidelity: number | null;
}): void {
  if (!payload.day || payload.gen_count <= 0) return;
  const body = JSON.stringify({
    day: payload.day,
    symbol: payload.symbol,
    gen_count: payload.gen_count,
    fidelity: payload.fidelity,
    heap_bytes: residentHeapBytes(),
  });
  void fetch("/api/me/options-lab/archive/hold-resident", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body,
  }).catch(() => {});
}

export async function loadTmDay(day: string, symbol: string): Promise<void> {
  view.symbol = symbol;
  const today = nyYmd();
  abort?.abort();
  abort = null;
  if (!day) {
    exitReplay();
    allSamples = [];
    setView({
      day: today,
      playing: false,
      hole: null,
      cursor: null,
      samples: [],
      openSpot: null,
      fidelity: null,
      loading: false,
    });
    return;
  }
  view.day = day;
  view.playing = false;
  view.cursor = null;
  view.samples = [];
  allSamples = [];
  view.openSpot = null;
  view.hole = null;
  view.fidelity = 0;
  view.loading = true;
  setArchive({ day, gens: [] });
  emit();
  const ac = new AbortController();
  abort = ac;
  const parkNewest = day === today;
  try {
    const result = await fillArchiveSlot({
      symbol,
      day,
      signal: ac.signal,
      onFidelity: (pct) => {
        if (!ac.signal.aborted) setView({ fidelity: pct });
      },
      onHole: (hole) => {
        if (!ac.signal.aborted) setView({ hole });
      },
      onCoarse: (gens) => {
        if (ac.signal.aborted) return;
        setArchive({ day, gens });
        const rows = gensAsSamples(gens);
        allSamples = rows;
        const open = sessionOpenCursor(rows);
        const last = rows.length
          ? {
              t_ms: rows[rows.length - 1].t_ms,
              spot: rows[rows.length - 1].spot,
              idx: rows.length - 1,
              done: false,
            }
          : null;
        const cursor = parkNewest ? last ?? open : open;
        const cov = mergeCoverageFlags(
          view.coverage,
          new Map([[day, rows.length > 0]]),
        );
        setView({
          samples: rows,
          openSpot: sessionOpenSpot(rows),
          cursor,
          loading: false,
          coverage: cov,
        });
        if (cursor) setPlayhead(cursor.t_ms, "archive");
      },
      onInfill: (gens) => {
        if (ac.signal.aborted) return;
        setArchive({ day, gens });
        const rows = gensAsSamples(gens);
        allSamples = rows;
        setView({ samples: rows });
      },
    });
    if (ac.signal.aborted) return;
    if (result.hole) {
      const cov = mergeCoverageFlags(view.coverage, new Map());
      if (result.uncovered) cov.set(day, false);
      setView({
        hole: result.hole,
        fidelity: null,
        loading: false,
        coverage: cov,
      });
      if (!result.gens.length) setPlayhead(null, "archive");
      return;
    }
    const cov = mergeCoverageFlags(view.coverage, new Map([[day, true]]));
    setView({ fidelity: result.fidelity, loading: false, coverage: cov });
    reportHoldResident({
      day,
      symbol,
      gen_count: result.gens.length,
      fidelity: result.fidelity,
    });
  } catch (err) {
    if (ac.signal.aborted) return;
    if (
      typeof err === "object" &&
      err != null &&
      "name" in err &&
      (err as { name: string }).name === "AbortError"
    ) {
      return;
    }
    setView({ hole: TM_HOLE_WAITING, loading: false, fidelity: null });
  }
}

function stopRaf(): void {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
}

function tickPlay(now: number): void {
  const samples = allSamples.length ? allSamples : view.samples;
  const c = replayCursor({
    samples,
    originWallMs: origin.wall,
    originSampleMs: origin.sample,
    nowWallMs: now,
    speed: view.speed,
  });
  view.cursor = c;
  if (c) {
    setPlayhead(c.t_ms, "archive");
  }
  emit();
  if (c?.done) {
    view.playing = false;
    stopRaf();
    emit();
    return;
  }
  raf = requestAnimationFrame(tickPlay);
}

export function tmPlay(): void {
  const today = nyYmd();
  const rows = allSamples.length ? allSamples : view.samples;
  if (!rows.length) return;
  const originSample =
    view.cursor && !view.cursor.done
      ? view.cursor.t_ms
      : view.day === today
        ? rows[rows.length - 1].t_ms
        : rows[0].t_ms;
  origin = { wall: performance.now(), sample: originSample };
  setPlayhead(originSample, "archive");
  view.playing = true;
  emit();
  stopRaf();
  raf = requestAnimationFrame(tickPlay);
}

export function tmPause(): void {
  view.playing = false;
  stopRaf();
  if (view.cursor) origin = { wall: performance.now(), sample: view.cursor.t_ms };
  emit();
}

export function tmStop(): void {
  view.playing = false;
  stopRaf();
  const originCur = sessionOpenCursor(allSamples);
  if (!originCur) {
    emit();
    return;
  }
  view.cursor = originCur;
  origin = { wall: 0, sample: originCur.t_ms };
  emit();
}

export function tmSeek(sample: ReplaySample): void {
  const rows = allSamples;
  const idx = rows.findIndex((r) => r.t_ms === sample.t_ms);
  view.cursor = {
    t_ms: sample.t_ms,
    spot: sample.spot,
    idx: idx >= 0 ? idx : 0,
    done: false,
  };
  origin = { wall: performance.now(), sample: sample.t_ms };
  setPlayhead(sample.t_ms, "archive");
  emit();
}

export function tmSetSpeed(speed: ReplaySpeed): void {
  if (view.playing && view.cursor) {
    origin = { wall: performance.now(), sample: view.cursor.t_ms };
  }
  view.speed = speed;
  emit();
}

export function tmNeedMonth(symbol: string, from: string, to: string): void {
  fetchCoverageFlags(symbol, from, to)
    .then((next) => {
      setView({ coverage: mergeCoverageFlags(view.coverage, next) });
    })
    .catch(() => {});
}

function prefetchVisibleMonth(symbol: string): void {
  const today = nyYmd();
  const [ys, ms] = today.split("-");
  const y = Number(ys);
  const m = Number(ms);
  if (!y || !m) return;
  const last = new Date(y, m, 0).getDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  tmNeedMonth(symbol, `${y}-${pad(m)}-01`, `${y}-${pad(m)}-${pad(last)}`);
}

export function ensureTmHost(symbol: string): void {
  if (view.symbol && view.symbol !== symbol) {
    abort?.abort();
    allSamples = [];
    setView({
      day: nyYmd(),
      samples: [],
      cursor: null,
      playing: false,
      hole: null,
      openSpot: null,
      fidelity: null,
      loading: false,
      coverage: null,
      symbol,
    });
    exitReplay();
    prefetchVisibleMonth(symbol);
    return;
  }
  view.symbol = symbol;
  if (!view.day) view.day = nyYmd();
  if (!inited) {
    inited = true;
    const w = hostBag();
    if (w) w.__tmHostInited = true;
    setTmLoadDayHandler((d) => {
      void loadTmDay(d, view.symbol);
    });
    prefetchVisibleMonth(symbol);
  }
}
