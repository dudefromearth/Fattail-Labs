/**
 * Live chain accessors for Position Builder (dual-side ladder hydrate).
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchLadderExpirations,
  pollChainLadder,
  type LadderFull,
  type LadderRow,
} from "@/lib/chainLadderApi";
import type {
  ChainAccessors,
  ChainContract,
  OptionRight,
} from "@/lib/options-lab/positionTypes";
import { snapToNearestStrike } from "@/lib/options-lab/positionTemplates";

const WINGS = 50;
const POLL_MS = 3000;

function rowKey(side: string, strike: number): string {
  return `${side.toLowerCase()}:${strike}`;
}

export function useBuilderChain(
  symbol: string,
  /** Expirations to keep warm (front + back for time spreads) */
  warmExpirations: string[],
  enabled = true,
): ChainAccessors {
  const [expirations, setExpirations] = useState<string[]>([]);
  const [spot, setSpot] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const laddersRef = useRef<Map<string, LadderFull>>(new Map());
  const [, bump] = useState(0);

  const refreshExpirations = useCallback(async () => {
    if (!enabled || !symbol) return;
    try {
      const r = await fetchLadderExpirations(symbol, 12);
      setExpirations(r.contracts.map((c) => c.expiration));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [symbol, enabled]);

  const hydrateExp = useCallback(
    async (exp: string) => {
      if (!exp || !symbol) return;
      const prev = laddersRef.current.get(exp);
      try {
        const polled = await pollChainLadder({
          expiration: exp,
          symbol,
          wings: WINGS,
          since_hash: prev?.content_hash ?? null,
        });
        let ladder: LadderFull | null = prev ?? null;
        if (polled.mode === "full") {
          ladder = polled.ladder;
        } else if (polled.mode === "diff" && prev) {
          const byKey = new Map(
            prev.rows.map((r) => [
              rowKey(r.side || "call", r.strike),
              r,
            ]),
          );
          for (const u of polled.upserts || []) {
            byKey.set(rowKey(u.side || "call", u.strike), u);
          }
          for (const rem of polled.removes || []) {
            byKey.delete(String(rem));
          }
          ladder = {
            ...prev,
            content_hash: polled.content_hash,
            as_of: polled.as_of,
            spot: polled.spot ?? prev.spot,
            rows: [...byKey.values()],
          };
        } else if (polled.mode === "unchanged" && prev) {
          ladder = prev;
        } else if (!ladder) {
          const full = await pollChainLadder({
            expiration: exp,
            symbol,
            wings: WINGS,
          });
          if (full.mode === "full") ladder = full.ladder;
        }
        if (ladder) {
          laddersRef.current.set(exp, ladder);
          if (ladder.spot > 0) setSpot(ladder.spot);
          setError(null);
          bump((n) => n + 1);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    },
    [symbol],
  );

  const refresh = useCallback(() => {
    void refreshExpirations();
    const exps = new Set([
      ...warmExpirations.filter(Boolean),
      ...laddersRef.current.keys(),
    ]);
    for (const e of exps) void hydrateExp(e);
  }, [refreshExpirations, hydrateExp, warmExpirations]);

  useEffect(() => {
    if (!enabled) return;
    void refreshExpirations();
  }, [enabled, refreshExpirations]);

  useEffect(() => {
    if (!enabled) return;
    setLoading(true);
    const run = async () => {
      const targets = warmExpirations.filter(Boolean);
      // Always warm first listed exp if none
      const list =
        targets.length > 0
          ? targets
          : expirations.slice(0, 2);
      await Promise.all(list.map((e) => hydrateExp(e)));
      setLoading(false);
    };
    void run();
    const id = window.setInterval(() => {
      const targets = warmExpirations.filter(Boolean);
      const list = targets.length ? targets : expirations.slice(0, 2);
      for (const e of list) void hydrateExp(e);
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [enabled, warmExpirations, expirations, hydrateExp]);

  const getStrikes = useCallback((expiration: string): number[] => {
    const lad = laddersRef.current.get(expiration);
    if (!lad) return [];
    const set = new Set<number>();
    for (const r of lad.rows) {
      if (r.strike != null) set.add(Number(r.strike));
    }
    return [...set].sort((a, b) => a - b);
  }, []);

  const getContract = useCallback(
    (
      expiration: string,
      strike: number,
      type: OptionRight,
    ): ChainContract | undefined => {
      const lad = laddersRef.current.get(expiration);
      if (!lad) return undefined;
      const row = lad.rows.find(
        (r: LadderRow) =>
          Number(r.strike) === Number(strike) &&
          (r.side || "call").toLowerCase() === type,
      );
      if (!row) return undefined;
      let iv = row.iv ?? null;
      if (iv != null && iv > 3) iv = iv / 100; // percent → decimal
      return {
        strike: Number(row.strike),
        type,
        mid: row.mid ?? null,
        bid: row.bid ?? null,
        ask: row.ask ?? null,
        iv,
        expiration,
      };
    },
    [],
  );

  const nearestStrike = useCallback(
    (expiration: string, target: number): number => {
      const strikes = getStrikes(expiration);
      return snapToNearestStrike(target, strikes);
    },
    [getStrikes],
  );

  return useMemo(
    () => ({
      expirations,
      spot,
      loading,
      error,
      getStrikes,
      getContract,
      nearestStrike,
      refresh,
    }),
    [
      expirations,
      spot,
      loading,
      error,
      getStrikes,
      getContract,
      nearestStrike,
      refresh,
    ],
  );
}
