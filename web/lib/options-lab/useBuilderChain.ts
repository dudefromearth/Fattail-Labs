/**
 * Live chain accessors for Position Builder (dual-side ladder hydrate).
 *
 * SoR: Market Bus chain-ladder generations on the client plane.
 * Strikes are listed-only (OC6a / PB6). Wider wings so multi-leg structures
 * stay on the grid without inventing arithmetic strikes.
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchLadderExpirations,
  pollChainLadder,
  type LadderFull,
  type LadderRow,
} from "@/lib/chainLadderApi";
import {
  normalizeStrike,
  snapToListed,
  uniqueListedStrikes,
} from "@/lib/options-lab/listedStrikes";
import type {
  ChainAccessors,
  ChainContract,
  OptionRight,
} from "@/lib/options-lab/positionTypes";

/** Builder needs room for condors / BWB — max lawful wing choice. */
const WINGS = 100;
const POLL_MS = 3000;

function rowKey(side: string, strike: number): string {
  return `${side.toLowerCase()}:${normalizeStrike(strike)}`;
}

export function useBuilderChain(
  symbol: string,
  /** Expirations to keep warm (front + back for time spreads) */
  warmExpirations: string[],
  enabled = true,
): ChainAccessors {
  const [expirations, setExpirations] = useState<string[]>([]);
  const [spot, setSpot] = useState<number | null>(null);
  const [spotStrike, setSpotStrike] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const laddersRef = useRef<Map<string, LadderFull>>(new Map());
  const [rev, bump] = useState(0);

  const refreshExpirations = useCallback(async () => {
    if (!enabled || !symbol) return;
    try {
      const r = await fetchLadderExpirations(symbol, 16);
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
            spot_strike: polled.spot_strike ?? prev.spot_strike,
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
          // Normalize strike fields once
          ladder = {
            ...ladder,
            rows: ladder.rows.map((r) => ({
              ...r,
              strike: normalizeStrike(Number(r.strike)),
            })),
          };
          laddersRef.current.set(exp, ladder);
          if (ladder.spot > 0) setSpot(ladder.spot);
          if (ladder.spot_strike != null) {
            setSpotStrike(normalizeStrike(Number(ladder.spot_strike)));
          } else if (ladder.spot > 0) {
            const strikes = uniqueListedStrikes(
              ladder.rows.map((r) => r.strike),
            );
            const atm = snapToListed(ladder.spot, strikes);
            if (atm != null) setSpotStrike(atm);
          }
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

  // Clear ladders when product changes
  useEffect(() => {
    laddersRef.current.clear();
    setSpot(null);
    setSpotStrike(null);
    bump((n) => n + 1);
  }, [symbol]);

  useEffect(() => {
    if (!enabled) return;
    setLoading(true);
    const run = async () => {
      const targets = warmExpirations.filter(Boolean);
      const list =
        targets.length > 0 ? targets : expirations.slice(0, 2);
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

  const getStrikes = useCallback(
    (expiration: string): number[] => {
      void rev; // re-bind when ladders bump
      const lad = laddersRef.current.get(expiration);
      if (!lad) return [];
      return uniqueListedStrikes(lad.rows.map((r) => r.strike));
    },
    [rev],
  );

  const getContract = useCallback(
    (
      expiration: string,
      strike: number,
      type: OptionRight,
    ): ChainContract | undefined => {
      void rev;
      const lad = laddersRef.current.get(expiration);
      if (!lad) return undefined;
      const k = normalizeStrike(strike);
      const row = lad.rows.find(
        (r: LadderRow) =>
          normalizeStrike(Number(r.strike)) === k &&
          (r.side || "call").toLowerCase() === type,
      );
      if (!row) return undefined;
      let iv = row.iv ?? null;
      if (iv != null && iv > 3) iv = iv / 100;
      return {
        strike: normalizeStrike(Number(row.strike)),
        type,
        mid: row.mid ?? null,
        bid: row.bid ?? null,
        ask: row.ask ?? null,
        iv,
        expiration,
      };
    },
    [rev],
  );

  const nearestStrike = useCallback(
    (expiration: string, target: number): number => {
      const strikes = getStrikes(expiration);
      const snapped = snapToListed(target, strikes);
      // Never invent: if empty, return target but UI must not treat as listed
      return snapped ?? target;
    },
    [getStrikes],
  );

  return useMemo(
    () => ({
      expirations,
      spot,
      spotStrike,
      loading,
      error,
      getStrikes,
      getContract,
      nearestStrike,
      refresh,
      /** Ladder revision — consumers can depend for re-snap */
      rev,
    }),
    [
      expirations,
      spot,
      spotStrike,
      loading,
      error,
      getStrikes,
      getContract,
      nearestStrike,
      refresh,
      rev,
    ],
  );
}
