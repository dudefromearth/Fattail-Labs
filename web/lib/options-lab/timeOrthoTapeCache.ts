/**
 * T Ortho day-tape cache.
 * Once a position is on the book, keep the 5m session bars warm so
 * returning to T Ortho does not wait on a redraw fetch.
 */

import { useEffect } from "react";
import { fetchMarketOhlc, type OhlcBar } from "@/lib/marketOhlcApi";
import {
  chartWindow,
  completeSessionBars,
  filterSessionBars,
} from "./timeOrthoSession";

export const TAPE_CACHE_KEY = "ft_options_lab_t_ortho_tape_v1";
export const TAPE_CACHE_FRESH_MS = 15_000;
const MAX_SYMBOLS = 6;

export type TapeCacheEntry = {
  symbol: string;
  fromMs: number;
  toMs: number;
  prefillsPriorDay: boolean;
  bars: OhlcBar[];
  fetchedAt: number;
};

const mem = new Map<string, TapeCacheEntry>();
const inflight = new Map<string, Promise<TapeCacheEntry | null>>();

function sessionKey(symbol: string, fromMs: number): string {
  return `${symbol.toUpperCase()}:${fromMs}`;
}

function loadPersisted(): void {
  if (typeof sessionStorage === "undefined") return;
  if (mem.size > 0) return;
  try {
    const raw = sessionStorage.getItem(TAPE_CACHE_KEY);
    if (!raw) return;
    const doc = JSON.parse(raw) as { entries?: TapeCacheEntry[] };
    for (const e of doc.entries || []) {
      if (!e?.symbol || !Number.isFinite(e.fromMs)) continue;
      mem.set(sessionKey(e.symbol, e.fromMs), e);
    }
  } catch {
    /* ignore */
  }
}

function persist(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    const entries = [...mem.values()]
      .sort((a, b) => b.fetchedAt - a.fetchedAt)
      .slice(0, MAX_SYMBOLS);
    sessionStorage.setItem(TAPE_CACHE_KEY, JSON.stringify({ entries }));
  } catch {
    /* quota / private */
  }
}

export function tapeCacheKey(symbol: string, nowMs = Date.now()): string {
  const win = chartWindow(nowMs);
  return sessionKey(symbol, win.fromMs);
}

export function isFreshTapeCache(
  entry: TapeCacheEntry | null,
  nowMs = Date.now(),
  ttlMs = TAPE_CACHE_FRESH_MS,
): boolean {
  if (!entry) return false;
  return nowMs - entry.fetchedAt < ttlMs;
}

export function readTapeCache(
  symbol: string,
  nowMs = Date.now(),
): TapeCacheEntry | null {
  loadPersisted();
  const win = chartWindow(nowMs);
  const hit = mem.get(sessionKey(symbol, win.fromMs));
  if (!hit) return null;
  if (hit.fromMs !== win.fromMs) return null;
  return hit;
}

export function writeTapeCache(entry: TapeCacheEntry): TapeCacheEntry {
  const next: TapeCacheEntry = {
    ...entry,
    symbol: entry.symbol.toUpperCase(),
    bars: Array.isArray(entry.bars) ? entry.bars : [],
  };
  mem.set(sessionKey(next.symbol, next.fromMs), next);
  persist();
  return next;
}

export function clearTapeCache(symbol?: string): void {
  if (!symbol) {
    mem.clear();
    if (typeof sessionStorage !== "undefined") {
      try {
        sessionStorage.removeItem(TAPE_CACHE_KEY);
      } catch {
        /* ignore */
      }
    }
    return;
  }
  const want = symbol.toUpperCase();
  for (const k of [...mem.keys()]) {
    if (k.startsWith(`${want}:`)) mem.delete(k);
  }
  persist();
}

export async function prefetchTimeOrthoTape(
  symbol: string,
  opts?: { signal?: AbortSignal; force?: boolean; nowMs?: number },
): Promise<TapeCacheEntry | null> {
  const sym = (symbol || "").trim().toUpperCase();
  if (!sym) return null;
  const nowMs = opts?.nowMs ?? Date.now();
  const hit = readTapeCache(sym, nowMs);
  if (hit && !opts?.force && isFreshTapeCache(hit, nowMs)) return hit;

  const existing = inflight.get(sym);
  if (existing && !opts?.force) {
    if (hit) return hit;
    return existing;
  }

  const run = (async () => {
    const payload = await fetchMarketOhlc(sym, "5m", {
      lookbackDays: 10,
      signal: opts?.signal,
    });
    const at = Date.now();
    const win = chartWindow(at);
    const framed = filterSessionBars(payload.bars || [], at);
    return writeTapeCache({
      symbol: sym,
      fromMs: win.fromMs,
      toMs: win.toMs,
      prefillsPriorDay: win.prefillsPriorDay,
      bars: completeSessionBars(framed, win.fromMs, win.toMs),
      fetchedAt: at,
    });
  })().finally(() => {
    inflight.delete(sym);
  });
  inflight.set(sym, run);
  if (hit) return hit;
  return run;
}

/** Drop module state — tests only. */
export function resetTapeCacheForTests(): void {
  mem.clear();
  inflight.clear();
}

/** Keep session bars warm while a position is on the book. */
export function useWarmTimeOrthoTape(
  symbols: string[],
  enabled: boolean,
): void {
  const key = symbols
    .map((s) => (s || "").trim().toUpperCase())
    .filter(Boolean)
    .sort()
    .join("|");
  useEffect(() => {
    if (!enabled || !key) return;
    const ac = new AbortController();
    const list = key.split("|");
    const run = () => {
      for (const s of list) {
        void prefetchTimeOrthoTape(s, { signal: ac.signal }).catch(
          () => undefined,
        );
      }
    };
    run();
    const id = window.setInterval(run, 30_000);
    return () => {
      ac.abort();
      window.clearInterval(id);
    };
  }, [enabled, key]);
}
