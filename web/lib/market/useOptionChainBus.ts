"use client";

/**
 * Chain ladder via shared MarketSocket (one WS/tab) with HTTP poll fallback.
 * MB-P5: happy path is WebSocket; poll degrades fail-loud when stream is dead.
 */

import { useEffect, useRef, useState } from "react";
import { getMarketSocket } from "./MarketSocket";
import type { ChainMessage } from "./types";
import {
  applyLadderDiff,
  pollChainLadder,
  type LadderFull,
  type LadderRow,
} from "@/lib/chainLadderApi";

const POLL_MS = 2000;
const WS_STALE_MS = 8000;

export function useOptionChainBus(opts: {
  symbol: string;
  expiration: string;
  side: "call" | "put";
  wings: number;
  enabled?: boolean;
}): {
  rows: Map<number, LadderRow>;
  hash: string | null;
  spot: number | null;
  band: number | null;
  asOf: string | null;
  dte: number | null;
  error: string | null;
  transport: "ws" | "poll" | "idle";
  lastPatch: string;
  flashStrikes: Set<number>;
} {
  const { symbol, expiration, side, wings, enabled = true } = opts;
  const [rows, setRows] = useState<Map<number, LadderRow>>(() => new Map());
  const [hash, setHash] = useState<string | null>(null);
  const [spot, setSpot] = useState<number | null>(null);
  const [band, setBand] = useState<number | null>(null);
  const [asOf, setAsOf] = useState<string | null>(null);
  const [dte, setDte] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transport, setTransport] = useState<"ws" | "poll" | "idle">("idle");
  const [lastPatch, setLastPatch] = useState("—");
  const [flashStrikes, setFlashStrikes] = useState<Set<number>>(() => new Set());
  const hashRef = useRef<string | null>(null);
  const lastWsAt = useRef(0);
  const interestId = `chain:${symbol}:${expiration}:${side}:w${wings}`;

  // Reset on geometry change
  useEffect(() => {
    hashRef.current = null;
    setHash(null);
    setRows(new Map());
    setSpot(null);
    setBand(null);
    setAsOf(null);
    setLastPatch("—");
    setError(null);
  }, [symbol, expiration, side, wings]);

  const applyFull = (ladder: LadderFull | Record<string, unknown>) => {
    const L = ladder as LadderFull;
    const next = new Map<number, LadderRow>();
    for (const r of L.rows || []) next.set(Number(r.strike), r);
    setRows(next);
    const h = L.content_hash || null;
    hashRef.current = h;
    setHash(h);
    if (L.spot != null) setSpot(Number(L.spot));
    if (L.band != null) setBand(Number(L.band));
    if (L.as_of) setAsOf(String(L.as_of));
    if (L.dte != null) setDte(Number(L.dte));
    setLastPatch(`full ${L.row_count ?? next.size} rows`);
    setError(null);
  };

  const flash = (touched: Set<number>) => {
    if (!touched.size) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    setFlashStrikes(new Set(touched));
    window.setTimeout(() => setFlashStrikes(new Set()), 600);
  };

  // WebSocket primary
  useEffect(() => {
    if (!enabled || !expiration || !symbol) return;
    const sock = getMarketSocket();
    sock.setChainInterest(interestId, { symbol, expiration, side, wings });
    const unsub = sock.subscribe((msg) => {
      if (msg.t === "err") {
        const code = String((msg as { code?: string }).code || "");
        // Universe/auth errors: surface; transient: leave to poll
        if (code === "auth" || code === "forbidden" || code === "universe") {
          setError(String((msg as { message?: string }).message || "stream error"));
        }
        return;
      }
      if (msg.t === "hello" || msg.t === "sub_ok" || msg.t === "pong") {
        lastWsAt.current = Date.now();
        setTransport("ws");
        return;
      }
      if (msg.t !== "chain") return;
      lastWsAt.current = Date.now();
      setTransport("ws");
      const m = msg as ChainMessage;
      if (m.mode === "full" && m.ladder) {
        applyFull(m.ladder);
      }
    });
    return () => {
      sock.setChainInterest(interestId, null);
      unsub();
    };
  }, [enabled, symbol, expiration, side, wings, interestId]);

  // Poll: primary until first WS snapshot, then fallback if WS goes stale
  useEffect(() => {
    if (!enabled || !expiration) return;
    let cancelled = false;
    const tick = async () => {
      const wsFresh =
        lastWsAt.current > 0 && Date.now() - lastWsAt.current < WS_STALE_MS;
      // Still poll when ws fresh? Only for hash-diff if we never got WS full.
      // When wsFresh and we have rows, skip poll (happy path).
      if (wsFresh && rows.size > 0 && hashRef.current) {
        return;
      }
      try {
        const result = await pollChainLadder({
          expiration,
          symbol,
          side,
          wings,
          since_hash: hashRef.current,
        });
        if (cancelled) return;
        if (!wsFresh) setTransport("poll");
        setRows((prev) => {
          const { next, touched, meta, hash: h } = applyLadderDiff(prev, result);
          hashRef.current = h;
          queueMicrotask(() => {
            if (cancelled) return;
            setHash(h);
            if (meta?.spot != null) setSpot(Number(meta.spot));
            if (meta?.band != null) setBand(Number(meta.band));
            if (meta?.as_of) setAsOf(String(meta.as_of));
            if (result.mode === "full" && result.ladder.dte != null) {
              setDte(Number(result.ladder.dte));
            }
            if (result.mode === "diff") {
              setLastPatch(
                `${result.changed_strike_count ?? result.upserts.length} strike(s)`,
              );
            } else if (result.mode === "full") {
              setLastPatch(`full ${result.ladder.row_count} rows`);
            } else {
              setLastPatch("no change");
            }
            setError(null);
            flash(touched);
          });
          return next;
        });
      } catch (e) {
        if (!cancelled && !wsFresh) {
          setError(e instanceof Error ? e.message : "Poll failed");
        }
      }
    };
    void tick();
    const id = window.setInterval(() => void tick(), POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rows.size only gates skip
  }, [enabled, symbol, expiration, side, wings]);

  return {
    rows,
    hash,
    spot,
    band,
    asOf,
    dte,
    error,
    transport,
    lastPatch,
    flashStrikes,
  };
}
