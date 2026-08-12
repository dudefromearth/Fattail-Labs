/**
 * Live chain accessors for Position Builder (dual-side ladder hydrate).
 *
 * SoR: Market Bus chain-ladder generations on the client plane.
 * Strikes are listed-only (OC6a / PB6).
 *
 * Wings MUST be one of server STRIKE_WING_CHOICES (10|25|50|100).
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchLadderExpirations,
  OPF_ACTIVE_DTE_HORIZON,
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

/** Max allowed OPF wing band (server-enforced). */
const WINGS = 100;
/** Fallback if 100 fails for any reason */
const WINGS_FALLBACKS = [100, 50, 25, 10] as const;

const EXPIRATION_LIMIT = 30;
const EXPIRATION_DAYS = OPF_ACTIVE_DTE_HORIZON;
const POLL_MS = 3000;

function rowKey(side: string, strike: number): string {
  return `${side.toLowerCase()}:${normalizeStrike(strike)}`;
}

function normalizeExp(expiration: string): string {
  return (expiration || "").slice(0, 10);
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
  const inflightRef = useRef<Set<string>>(new Set());
  const [rev, bump] = useState(0);

  const applyLadder = useCallback((exp: string, ladder: LadderFull) => {
    const key = normalizeExp(exp || ladder.expiration);
    const normalized: LadderFull = {
      ...ladder,
      expiration: key,
      rows: (ladder.rows || []).map((r) => ({
        ...r,
        strike: normalizeStrike(Number(r.strike)),
      })),
    };
    laddersRef.current.set(key, normalized);
    if (normalized.spot > 0) setSpot(normalized.spot);
    const strikes = uniqueListedStrikes(
      normalized.rows.map((r) => r.strike),
    );
    if (normalized.spot_strike != null && Number(normalized.spot_strike) > 0) {
      const ss = normalizeStrike(Number(normalized.spot_strike));
      // Prefer server spot_strike if it is listed; else nearest to spot
      if (strikes.some((s) => s === ss)) setSpotStrike(ss);
      else if (normalized.spot > 0) {
        const atm = snapToListed(normalized.spot, strikes);
        if (atm != null) setSpotStrike(atm);
      } else {
        setSpotStrike(ss);
      }
    } else if (normalized.spot > 0 && strikes.length) {
      const atm = snapToListed(normalized.spot, strikes);
      if (atm != null) setSpotStrike(atm);
    }
    setError(null);
    bump((n) => n + 1);
  }, []);

  const refreshExpirations = useCallback(async () => {
    if (!enabled || !symbol) return;
    try {
      const r = await fetchLadderExpirations(
        symbol,
        EXPIRATION_LIMIT,
        EXPIRATION_DAYS,
      );
      const dates = r.contracts.map((c) => normalizeExp(c.expiration));
      setExpirations(dates);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [symbol, enabled]);

  const pollOnce = useCallback(
    async (
      exp: string,
      wings: number,
      sinceHash: string | null,
    ): Promise<LadderFull | null> => {
      const polled = await pollChainLadder({
        expiration: exp,
        symbol,
        wings,
        since_hash: sinceHash,
      });
      if (polled.mode === "full") return polled.ladder;
      if (polled.mode === "diff") {
        const prev = laddersRef.current.get(exp);
        if (!prev) {
          // Diff without base — force full
          const full = await pollChainLadder({
            expiration: exp,
            symbol,
            wings,
          });
          return full.mode === "full" ? full.ladder : null;
        }
        const byKey = new Map(
          prev.rows.map((r) => [rowKey(r.side || "call", r.strike), r]),
        );
        for (const u of polled.upserts || []) {
          byKey.set(rowKey(u.side || "call", u.strike), u);
        }
        for (const rem of polled.removes || []) {
          byKey.delete(String(rem));
        }
        return {
          ...prev,
          content_hash: polled.content_hash,
          as_of: polled.as_of,
          spot: polled.spot ?? prev.spot,
          spot_strike: polled.spot_strike ?? prev.spot_strike,
          rows: [...byKey.values()],
        };
      }
      // unchanged
      return laddersRef.current.get(exp) ?? null;
    },
    [symbol],
  );

  const hydrateExp = useCallback(
    async (expiration: string, opts?: { force?: boolean }) => {
      const exp = normalizeExp(expiration);
      if (!exp || !symbol || !enabled) return;
      if (inflightRef.current.has(exp) && !opts?.force) return;
      inflightRef.current.add(exp);
      try {
        const prev = opts?.force ? null : laddersRef.current.get(exp) ?? null;
        let ladder: LadderFull | null = null;
        let lastErr: unknown = null;
        for (const wings of WINGS_FALLBACKS) {
          try {
            ladder = await pollOnce(
              exp,
              wings,
              prev?.content_hash ?? null,
            );
            if (ladder && (ladder.rows?.length ?? 0) > 0) break;
            // Empty rows — try full without hash
            ladder = await pollOnce(exp, wings, null);
            if (ladder && (ladder.rows?.length ?? 0) > 0) break;
          } catch (e) {
            lastErr = e;
            ladder = null;
          }
        }
        if (ladder && (ladder.rows?.length ?? 0) > 0) {
          applyLadder(exp, ladder);
        } else if (lastErr) {
          setError(
            lastErr instanceof Error ? lastErr.message : String(lastErr),
          );
          bump((n) => n + 1);
        } else if (!laddersRef.current.has(exp)) {
          setError(`No OPF strikes for ${exp}`);
          bump((n) => n + 1);
        }
      } finally {
        inflightRef.current.delete(exp);
      }
    },
    [symbol, enabled, pollOnce, applyLadder],
  );

  const ensureExpiration = useCallback(
    (expiration: string) => {
      const exp = normalizeExp(expiration);
      if (!exp || !enabled || !symbol) return;
      // Always kick hydrate; skip if we already have rows unless stale poll will refresh
      void hydrateExp(exp, { force: !laddersRef.current.get(exp)?.rows?.length });
    },
    [enabled, symbol, hydrateExp],
  );

  const refresh = useCallback(() => {
    void refreshExpirations();
    const exps = new Set([
      ...warmExpirations.filter(Boolean).map(normalizeExp),
      ...expirations,
      ...laddersRef.current.keys(),
    ]);
    for (const e of exps) {
      if (e) void hydrateExp(e, { force: true });
    }
  }, [refreshExpirations, hydrateExp, warmExpirations, expirations]);

  useEffect(() => {
    if (!enabled) return;
    void refreshExpirations();
  }, [enabled, refreshExpirations]);

  // Clear ladders when product changes
  useEffect(() => {
    laddersRef.current.clear();
    inflightRef.current.clear();
    setSpot(null);
    setSpotStrike(null);
    setError(null);
    bump((n) => n + 1);
  }, [symbol]);

  useEffect(() => {
    if (!enabled) return;
    setLoading(true);
    const list = [
      ...new Set([
        ...expirations.map(normalizeExp),
        ...warmExpirations.filter(Boolean).map(normalizeExp),
      ]),
    ].filter(Boolean);
    let cancelled = false;
    const run = async () => {
      await Promise.all(list.map((e) => hydrateExp(e)));
      if (!cancelled) setLoading(false);
    };
    void run();
    const id = window.setInterval(() => {
      const live = [
        ...new Set([
          ...expirations.map(normalizeExp),
          ...warmExpirations.filter(Boolean).map(normalizeExp),
          ...laddersRef.current.keys(),
        ]),
      ].filter(Boolean);
      for (const e of live) void hydrateExp(e);
    }, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [enabled, warmExpirations, expirations, hydrateExp]);

  const getStrikes = useCallback(
    (expiration: string): number[] => {
      void rev;
      const exp = normalizeExp(expiration);
      const lad = laddersRef.current.get(exp);
      if (!lad?.rows?.length) return [];
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
      const exp = normalizeExp(expiration);
      const lad = laddersRef.current.get(exp);
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
      const src = row.mid_source;
      const midSource =
        src === "nbbo" || src === "last_trade" || src === "day_close"
          ? src
          : null;
      return {
        strike: k,
        type,
        mid: row.mid ?? null,
        bid: row.bid ?? null,
        ask: row.ask ?? null,
        iv,
        expiration: exp,
        mid_source: midSource,
      };
    },
    [rev],
  );

  /**
   * Nearest OPF-listed strike to a price target (spot or intent).
   * Returns 0 only when the ladder is empty (caller must wait/hydrate).
   */
  const nearestStrike = useCallback(
    (expiration: string, target: number): number => {
      const strikes = getStrikes(expiration);
      if (!strikes.length) return 0;
      if (!(target > 0) || !Number.isFinite(target)) {
        return strikes[Math.floor(strikes.length / 2)];
      }
      return snapToListed(target, strikes) ?? strikes[Math.floor(strikes.length / 2)];
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
      ensureExpiration,
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
      ensureExpiration,
      rev,
    ],
  );
}
