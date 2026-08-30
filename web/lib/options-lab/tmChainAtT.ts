/**
 * Chain at the Time Machine playhead. One source of instruments:
 * remembered live generations, or a windowed StudioOne fetch for an archive day.
 * Not a second Massive socket. Not a 1-minute walk.
 */

import { useEffect, useState } from "react";
import { contractKey, type LadderRow } from "@/lib/chainLadderApi";
import {
  defaultArchiveGet,
  fetchUrl,
  type ArchiveGet,
  type ArchiveSnap,
} from "./archiveApi";
import type { ChainContext } from "./templates/types";
import { genAtPlayhead, getTmSlots, subscribeTmSlots, type TmTodayGen } from "./tmSlots";
import { useTmReplayActive } from "./useTmReplayActive";
import type { OpfLegMarkForSheet } from "@/lib/risk-graph/surfaceModel";

const MAX_REMEMBERED = 64;
const remembered = new Map<string, ChainContext>();

export function rememberChain(ctx: ChainContext): void {
  const hash = ctx.contentHash;
  if (!hash) return;
  if (remembered.has(hash)) remembered.delete(hash);
  remembered.set(hash, {
    ...ctx,
    contracts: new Map(ctx.contracts),
  });
  while (remembered.size > MAX_REMEMBERED) {
    const first = remembered.keys().next().value;
    if (first == null) break;
    remembered.delete(first);
  }
}

export function chainAtHash(hash: string | null | undefined): ChainContext | null {
  if (!hash) return null;
  return remembered.get(hash) ?? null;
}

function asNum(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function sideRow(
  strike: number,
  side: "call" | "put",
  src: Record<string, unknown> | null | undefined,
): LadderRow | null {
  if (!src) return null;
  return {
    strike,
    side,
    mid: asNum(src.mid ?? src.mark),
    bid: asNum(src.bid),
    ask: asNum(src.ask),
    delta: asNum(src.delta),
    gamma: asNum(src.gamma),
    theta: asNum(src.theta),
    vega: asNum(src.vega),
    iv: asNum(src.iv),
  };
}

export function snapToChainContext(
  snap: ArchiveSnap,
  opts: { symbol: string; viewSide: "call" | "put"; wings: number },
): ChainContext | null {
  const gen = snap.generation ?? {};
  const rows = (gen as { rows?: unknown[] }).rows;
  if (!Array.isArray(rows) || !rows.length) return null;
  const contracts = new Map<string, LadderRow>();
  for (const raw of rows) {
    if (!raw || typeof raw !== "object") continue;
    const rec = raw as Record<string, unknown>;
    const strike = asNum(rec.strike);
    if (strike == null) continue;
    const call = sideRow(
      strike,
      "call",
      rec.call && typeof rec.call === "object"
        ? (rec.call as Record<string, unknown>)
        : null,
    );
    const put = sideRow(
      strike,
      "put",
      rec.put && typeof rec.put === "object"
        ? (rec.put as Record<string, unknown>)
        : null,
    );
    if (call) contracts.set(contractKey("call", strike), call);
    if (put) contracts.set(contractKey("put", strike), put);
  }
  if (!contracts.size) return null;
  const asOf = String(gen.as_of || snap.captured_at || "").trim() || null;
  const hash = String(gen.content_hash || snap._file || asOf || "").trim() || null;
  const spot = typeof gen.spot === "number" ? gen.spot : null;
  return {
    symbol: opts.symbol,
    viewSide: opts.viewSide,
    spot,
    strikeStep: null,
    wings: opts.wings,
    contracts,
    asOf,
    contentHash: hash,
  };
}

export function marksFromChain(
  ctx: ChainContext,
  expiration: string,
): OpfLegMarkForSheet[] {
  const out: OpfLegMarkForSheet[] = [];
  for (const row of ctx.contracts.values()) {
    const iv = row.iv;
    if (iv == null || !(iv > 0)) continue;
    out.push({
      strike: row.strike,
      side: row.side || "call",
      right: row.side || "call",
      iv,
      iv_source: "generation",
      mid: row.mid,
      expiration,
    });
  }
  return out;
}

export async function fetchChainAtT(opts: {
  day: string;
  symbol: string;
  tMs: number;
  viewSide: "call" | "put";
  wings: number;
  get?: ArchiveGet;
}): Promise<ChainContext | null> {
  const get = opts.get ?? defaultArchiveGet;
  const from = new Date(opts.tMs - 1500).toISOString();
  const to = new Date(opts.tMs + 1500).toISOString();
  for (let level = 0; level <= 8; level += 1) {
    const url = fetchUrl({
      day: opts.day,
      symbol: opts.symbol,
      level,
      from,
      to,
    });
    const res = await get(url);
    const body = res.body as { snaps?: ArchiveSnap[]; hole?: string } | null;
    const snaps = body?.snaps ?? [];
    if (!snaps.length) continue;
    let best: ArchiveSnap | null = null;
    let bestDt = Infinity;
    for (const snap of snaps) {
      const asOf = String(snap.generation?.as_of || snap.captured_at || "");
      const t = Date.parse(asOf);
      if (!Number.isFinite(t)) continue;
      const dt = Math.abs(t - opts.tMs);
      if (dt < bestDt) {
        best = snap;
        bestDt = dt;
      }
    }
    if (!best) continue;
    const ctx = snapToChainContext(best, {
      symbol: opts.symbol,
      viewSide: opts.viewSide,
      wings: opts.wings,
    });
    if (ctx?.contentHash) rememberChain(ctx);
    return ctx;
  }
  return null;
}

export function playheadGen(): TmTodayGen | null {
  return genAtPlayhead();
}

export function useChainAtPlayhead(opts: {
  symbol: string;
  viewSide: "call" | "put";
  wings: number;
  live: ChainContext;
}): ChainContext {
  const replay = useTmReplayActive();
  const [tick, setTick] = useState(0);
  const [archiveCtx, setArchiveCtx] = useState<ChainContext | null>(null);
  useEffect(() => subscribeTmSlots(() => setTick((n) => n + 1)), []);
  const meta = playheadMeta();
  useEffect(() => {
    if (!replay) {
      setArchiveCtx(null);
      return;
    }
    const gen = meta.gen;
    if (!gen) return;
    const hit = chainAtHash(gen.contentHash);
    if (hit) {
      setArchiveCtx(hit);
      return;
    }
    if (meta.projector !== "archive" || !meta.day) return;
    let live = true;
    void fetchChainAtT({
      day: meta.day,
      symbol: opts.symbol,
      tMs: gen.t_ms,
      viewSide: opts.viewSide,
      wings: opts.wings,
    }).then((ctx) => {
      if (live && ctx) setArchiveCtx(ctx);
    });
    return () => {
      live = false;
    };
  }, [replay, tick, opts.symbol, opts.viewSide, opts.wings, meta.day, meta.gen?.contentHash, meta.projector, meta.tMs]);
  if (!replay) return opts.live;
  if (archiveCtx) return archiveCtx;
  const gen = meta.gen;
  const hit = gen ? chainAtHash(gen.contentHash) : null;
  if (hit) return hit;
  // TMI-93: never a live read under a playhead.
  return {
    ...opts.live,
    contracts: new Map(),
    contentHash: null,
    asOf: null,
    spot: gen?.spot ?? null,
  };
}

export function playheadMeta(): {
  projector: string;
  tMs: number | null;
  day: string | null;
  gen: TmTodayGen | null;
} {
  const slots = getTmSlots();
  return {
    projector: slots.playhead.projector,
    tMs: slots.playhead.t_ms,
    day:
      slots.playhead.projector === "archive"
        ? slots.archive?.day ?? null
        : slots.today?.tradingDate ?? null,
    gen: genAtPlayhead(),
  };
}
