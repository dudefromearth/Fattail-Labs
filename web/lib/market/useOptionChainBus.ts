"use client";

/**
 * Chain ladder — push + dual-side model (HM15) + hydrate-if-empty.
 *
 * Live after client nav: MarketSocket is a tab singleton that used to stay
 * `closed` after the last subscriber left — Heatmap then sat idle until a
 * full refresh. We revive the socket on subscribe and do a *one-shot*
 * HTTP refresh on tab visible / bfcache restore (8s throttle). No interval.
 */

import { useEffect, useRef, useState } from "react";
import { touchSessionActivity } from "@/lib/sessionActivity";
import { captureToday } from "@/lib/options-lab/tmSlots";
import { rememberChain } from "@/lib/options-lab/tmChainAtT";
import { getMarketSocket } from "./MarketSocket";
import type { ChainMessage } from "./types";
import {
  applyLadderDiff,
  contractKey,
  pollChainLadder,
  type LadderFull,
  type LadderPollResult,
  type LadderRow,
} from "@/lib/chainLadderApi";

export function useOptionChainBus(opts: {
  symbol: string;
  expiration: string;
  side: "call" | "put";
  wings: number;
  enabled?: boolean;
}): {
  /** Dual-side contract map keyed "call:K" / "put:K" */
  contracts: Map<string, LadderRow>;
  /** View-side rows only (high→low) for ladder table */
  rows: Map<number, LadderRow>;
  hash: string | null;
  spot: number | null;
  band: number | null;
  asOf: string | null;
  dte: number | null;
  strikeStep: number | null;
  excludedAdjusted: number;
  error: string | null;
  transport: "stream" | "held" | "idle" | "error";
  lastPatch: string;
  flashStrikes: Set<number>;
  sessionOpen: boolean | null;
} {
  const { symbol, expiration, side, wings, enabled = true } = opts;
  const [contracts, setContracts] = useState<Map<string, LadderRow>>(
    () => new Map(),
  );
  const [hash, setHash] = useState<string | null>(null);
  const [spot, setSpot] = useState<number | null>(null);
  const [band, setBand] = useState<number | null>(null);
  const [asOf, setAsOf] = useState<string | null>(null);
  const [dte, setDte] = useState<number | null>(null);
  const [strikeStep, setStrikeStep] = useState<number | null>(null);
  const [excludedAdjusted, setExcludedAdjusted] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [transport, setTransport] = useState<
    "stream" | "held" | "idle" | "error"
  >("idle");
  const [lastPatch, setLastPatch] = useState("—");
  const [flashStrikes, setFlashStrikes] = useState<Set<number>>(
    () => new Set(),
  );
  const [sessionOpen, setSessionOpen] = useState<boolean | null>(null);

  const hashRef = useRef<string | null>(null);
  const rowCountRef = useRef(0);
  const asOfRef = useRef<string | null>(null);
  const hydratingRef = useRef(false);
  const refreshingRef = useRef(false);
  const hydrateKeyRef = useRef<string>("");
  const lastPokeAtRef = useRef(0);
  // Generation key without side (HM16)
  const interestId = `chain:${symbol}:${expiration}:w${wings}`;

  useEffect(() => {
    hashRef.current = null;
    rowCountRef.current = 0;
    asOfRef.current = null;
    hydratingRef.current = false;
    refreshingRef.current = false;
    hydrateKeyRef.current = "";
    lastPokeAtRef.current = 0;
    setHash(null);
    setContracts(new Map());
    setSpot(null);
    setBand(null);
    setAsOf(null);
    setLastPatch("—");
    setError(null);
    setTransport("idle");
  }, [symbol, expiration, wings]);

  const flash = (touchedKeys: Set<string>) => {
    if (!touchedKeys.size) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const strikes = new Set<number>();
    for (const k of touchedKeys) {
      const parts = k.split(":");
      const s = Number(parts[parts.length - 1]);
      if (Number.isFinite(s)) strikes.add(s);
    }
    setFlashStrikes(strikes);
    window.setTimeout(() => setFlashStrikes(new Set()), 600);
  };

  const applyFull = (ladder: LadderFull | Record<string, unknown>) => {
    const L = ladder as LadderFull & {
      strike_step?: number;
      excluded_adjusted_count?: number;
    };
    const next = new Map<string, LadderRow>();
    for (const r of L.rows || []) {
      next.set(contractKey(r.side, Number(r.strike)), r);
    }
    rowCountRef.current = next.size;
    setContracts(next);
    const h = (L.content_hash as string) || null;
    hashRef.current = h;
    setHash(h);
    if (L.spot != null) setSpot(Number(L.spot));
    if (L.band != null) setBand(Number(L.band));
    if (L.as_of) {
      asOfRef.current = String(L.as_of);
      setAsOf(String(L.as_of));
    }
    if (L.dte != null) setDte(Number(L.dte));
    if (L.strike_step != null) setStrikeStep(Number(L.strike_step));
    if (L.excluded_adjusted_count != null)
      setExcludedAdjusted(Number(L.excluded_adjusted_count));
    setLastPatch(`full ${L.row_count ?? next.size} contracts`);
    setError(null);
  };

  const applyPushed = (result: LadderPollResult) => {
    setContracts((prev) => {
      const { next, touched, meta, hash: h } = applyLadderDiff(prev, result);
      rowCountRef.current = next.size;
      hashRef.current = h;
      queueMicrotask(() => {
        setHash(h);
        if (meta?.spot != null) setSpot(Number(meta.spot));
        if (meta?.band != null) setBand(Number(meta.band));
        if (meta?.as_of) {
          asOfRef.current = String(meta.as_of);
          setAsOf(String(meta.as_of));
        }
        if (result.mode === "full" && result.ladder.dte != null) {
          setDte(Number(result.ladder.dte));
        }
        if (result.mode === "full" && result.ladder.strike_step != null) {
          setStrikeStep(Number(result.ladder.strike_step));
        }
        if (result.mode === "diff") {
          setLastPatch(
            `+${result.changed_strike_count ?? result.upserts.length}`,
          );
          flash(touched);
        } else if (result.mode === "full") {
          setLastPatch(`full ${result.ladder.row_count} contracts`);
        } else {
          setLastPatch("no change");
        }
        setError(null);
      });
      return next;
    });
  };

  const hydrateIfEmpty = async (reason: string) => {
    if (!enabled || !expiration || !symbol) return;
    if (rowCountRef.current > 0) return;
    if (hydratingRef.current) return;
    const key = interestId;
    if (hydrateKeyRef.current === key && reason !== "retry-empty") return;
    hydratingRef.current = true;
    hydrateKeyRef.current = key;
    try {
      const result = await pollChainLadder({
        expiration,
        symbol,
        side,
        wings,
        since_hash: null,
      });
      if (rowCountRef.current > 0) return;
      if (result.mode === "full" && result.ladder?.rows?.length) {
        applyFull(result.ladder);
        setLastPatch(`hydrated · ${reason}`);
        setTransport((t) => (t === "stream" ? "stream" : "held"));
        setError(null);
      } else if (result.mode === "diff" && result.upserts?.length) {
        applyPushed(result);
        setLastPatch(`hydrated · ${reason}`);
      } else if (rowCountRef.current < 1) {
        hydrateKeyRef.current = "";
      }
    } catch (e) {
      if (rowCountRef.current < 1) {
        hydrateKeyRef.current = "";
        setError(e instanceof Error ? e.message : "Could not load chain");
      }
    } finally {
      hydratingRef.current = false;
    }
  };

  /** One HTTP pull — even if we already have rows (stale after nav / focus). Not a loop. */
  const refreshOnce = async (reason: string) => {
    if (!enabled || !expiration || !symbol) return;
    if (hydratingRef.current || refreshingRef.current) return;
    refreshingRef.current = true;
    try {
      const result = await pollChainLadder({
        expiration,
        symbol,
        side,
        wings,
        since_hash: hashRef.current,
      });
      if (result.mode === "full" && result.ladder?.rows?.length) {
        applyFull(result.ladder);
        setLastPatch(`refresh · ${reason}`);
        setTransport((t) => (t === "stream" ? "stream" : "held"));
      } else if (result.mode === "diff") {
        applyPushed(result);
        setLastPatch(`refresh · ${reason}`);
      } else if (result.mode === "unchanged") {
        if (result.as_of) {
          asOfRef.current = String(result.as_of);
          setAsOf(String(result.as_of));
        }
        setLastPatch(`refresh · ${reason} · no change`);
      }
    } catch {
      /* keep last good generation; stream may still recover */
    } finally {
      refreshingRef.current = false;
    }
  };

  const pokeLive = (reason: string) => {
    const now = Date.now();
    if (now - lastPokeAtRef.current < 8_000) return;
    lastPokeAtRef.current = now;
    getMarketSocket().poke();
    if (rowCountRef.current < 1) {
      hydrateKeyRef.current = "";
      void hydrateIfEmpty(reason);
    } else {
      void refreshOnce(reason);
    }
  };

  useEffect(() => {
    if (!enabled || !expiration || !symbol) {
      setTransport("idle");
      return;
    }

    const sock = getMarketSocket();
    // Still send side for server compat; generation is dual (server ignores for pull)
    sock.setChainInterest(interestId, { symbol, expiration, side, wings });

    const unsub = sock.subscribe((msg) => {
      if (msg.t === "err") {
        const code = String((msg as { code?: string }).code || "");
        if (
          code === "auth" ||
          code === "forbidden" ||
          code === "universe" ||
          code === "chain"
        ) {
          setError(
            String((msg as { message?: string }).message || "stream error"),
          );
          setTransport("error");
          void hydrateIfEmpty("stream-error");
        }
        return;
      }

      if (msg.t === "hello" || msg.t === "sub_ok" || msg.t === "pong") {
        const open = (msg as { session_open?: boolean }).session_open;
        if (typeof open === "boolean") {
          setSessionOpen(open);
          if (!open) {
            setTransport("held");
            void hydrateIfEmpty("market-closed");
          } else {
            setTransport("stream");
            if (rowCountRef.current < 1) void hydrateIfEmpty("socket-open");
          }
        } else if (msg.t === "hello" || msg.t === "sub_ok") {
          setTransport((t) => (t === "held" ? "held" : "stream"));
          if (rowCountRef.current < 1) void hydrateIfEmpty("socket-ready");
        }
        return;
      }

      if (msg.t === "session") {
        const open = (msg as { open?: boolean; mode?: string }).open;
        const mode = String((msg as { mode?: string }).mode || "");
        if (mode === "held" || open === false) {
          setSessionOpen(false);
          setTransport("held");
          if (rowCountRef.current < 1) void hydrateIfEmpty("market-closed");
          else setLastPatch("market closed · holding");
        } else if (open === true) {
          setSessionOpen(true);
          setTransport("stream");
        }
        return;
      }

      if (msg.t !== "chain") return;

      const m = msg as ChainMessage & {
        key?: string;
        mode?: string;
        content_hash?: string;
        ladder?: LadderFull;
        upserts?: LadderRow[];
        removes?: Array<number | string>;
        spot?: number;
        band?: number;
        as_of?: string;
        changed_strike_count?: number;
        session_open?: boolean;
      };

      // Accept keys with or without side segment (dual generation)
      if (m.key && !m.key.includes(`${symbol}:${expiration}`)) return;

      if (typeof m.session_open === "boolean") {
        setSessionOpen(m.session_open);
        setTransport(m.session_open ? "stream" : "held");
      } else {
        setTransport((t) => (t === "held" ? "held" : "stream"));
      }

      if (m.mode === "full" && m.ladder) {
        applyFull(m.ladder);
        touchSessionActivity("chain");
        if (m.session_open === false) {
          setLastPatch("market closed · holding last");
          setTransport("held");
        }
        return;
      }
      if (m.mode === "unchanged") {
        if (m.content_hash) {
          hashRef.current = m.content_hash;
          setHash(m.content_hash);
        }
        if (m.as_of) setAsOf(String(m.as_of));
        setLastPatch("no change");
        setError(null);
        return;
      }
      if (m.mode === "diff") {
        applyPushed({
          mode: "diff",
          content_hash: m.content_hash || hashRef.current || "",
          as_of: m.as_of,
          spot: Number(m.spot),
          band: m.band,
          upserts: m.upserts || [],
          removes: m.removes || [],
          changed_strike_count: m.changed_strike_count,
        });
        touchSessionActivity("chain");
      }
    });

    void hydrateIfEmpty("bootstrap");
    const t1 = window.setTimeout(() => {
      if (rowCountRef.current < 1) {
        hydrateKeyRef.current = "";
        void hydrateIfEmpty("retry-empty");
      }
    }, 2000);

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      pokeLive("visible");
    };
    const onPageShow = (ev: PageTransitionEvent) => {
      // bfcache restore — one poke, not a timer
      if (ev.persisted) pokeLive("pageshow");
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      window.clearTimeout(t1);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onPageShow);
      sock.setChainInterest(interestId, null);
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, symbol, expiration, wings, interestId]);

  useEffect(() => {
    if (!enabled || !hash || !asOf) return;
    const t = Date.parse(asOf);
    captureToday({
      t_ms: Number.isFinite(t) ? t : 0,
      asOf,
      contentHash: hash,
      spot,
      symbol,
      expiration,
    });
    rememberChain({
      symbol,
      viewSide: side,
      spot,
      strikeStep,
      wings,
      contracts,
      asOf,
      contentHash: hash,
    });
  }, [enabled, hash, asOf, spot, symbol, expiration, side, wings, strikeStep, contracts]);

  // View-side map for ladder table (filter only)
  const rows = new Map<number, LadderRow>();
  for (const row of contracts.values()) {
    if ((row.side || "call").toLowerCase() === side) {
      rows.set(Number(row.strike), row);
    }
  }

  return {
    contracts,
    rows,
    hash,
    spot,
    band,
    asOf,
    dte,
    strikeStep,
    excludedAdjusted,
    error,
    transport,
    lastPatch,
    flashStrikes,
    sessionOpen,
  };
}
