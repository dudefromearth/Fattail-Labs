"use client";

/**
 * Vertical chain ladder — data updates in place.
 * Symbol list = Admin market universe (same SoR as /admin symbols).
 * Only strike rows whose mid/bid/ask/vol/oi/greeks/iv actually changed re-render.
 */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  DEFAULT_STRIKE_WINGS,
  STRIKE_WING_CHOICES,
  applyLadderDiff,
  fetchLadderExpirations,
  pollChainLadder,
  type LadderExpirationContract,
  type LadderRow,
  type StrikeWings,
} from "@/lib/chainLadderApi";
import {
  fetchMarketUniverse,
  type MarketUniverseSymbol,
} from "@/lib/capitalApi";

const POLL_MS = 2000;
/** Next N distinct listed expirations (not calendar days). */
const EXPIRY_PICK_COUNT = 3;

function fmt(n: number | null | undefined, digits = 2): string {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return Number(n).toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
}

/**
 * Show the **listed** strike exactly (OCC dollars + cents).
 * Never format with maxFractionDigits:0 — that rounded 302.50 → "303".
 * Work in integer cents so half-strikes stay 302.50, not 302.5 or 303.
 */
function fmtStrike(n: number | null | undefined): string {
  if (n == null) return "—";
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  // Round only to the nearest cent (listed strikes are cent-quantized).
  const cents = Math.round(v * 100);
  const neg = cents < 0;
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const frac = abs % 100;
  const wholeStr = String(whole); // no locale rounding of the strike itself
  const body =
    frac === 0 ? wholeStr : `${wholeStr}.${String(frac).padStart(2, "0")}`;
  return neg ? `-${body}` : body;
}

const StrikeRow = memo(function StrikeRow({
  row,
  flash,
}: {
  row: LadderRow;
  flash: boolean;
}) {
  return (
    <tr
      className={
        row.is_spot
          ? "bg-[var(--color-tint)]/20 font-semibold"
          : flash
            ? "bg-amber-500/15 transition-colors duration-500"
            : undefined
      }
      data-strike={row.strike}
      data-spot={row.is_spot ? "1" : "0"}
    >
      <td
        className="sticky left-0 z-[1] border-b border-[var(--color-separator)] bg-inherit px-2 py-1 text-right tabular-nums"
        title={String(row.strike)}
      >
        {fmtStrike(row.strike)}
        {row.is_spot ? (
          <span className="ml-1 text-[10px] font-bold text-[var(--color-tint)]">
            SPOT
          </span>
        ) : null}
      </td>
      <td className="border-b border-[var(--color-separator)] px-2 py-1 text-right tabular-nums">
        {fmt(row.mid)}
      </td>
      <td className="border-b border-[var(--color-separator)] px-2 py-1 text-right tabular-nums">
        {fmt(row.bid)}
      </td>
      <td className="border-b border-[var(--color-separator)] px-2 py-1 text-right tabular-nums">
        {fmt(row.ask)}
      </td>
      <td className="border-b border-[var(--color-separator)] px-2 py-1 text-right tabular-nums">
        {fmt(row.volume, 0)}
      </td>
      <td className="border-b border-[var(--color-separator)] px-2 py-1 text-right tabular-nums">
        {fmt(row.open_interest, 0)}
      </td>
      <td className="border-b border-[var(--color-separator)] px-2 py-1 text-right tabular-nums">
        {fmt(row.delta, 3)}
      </td>
      <td className="border-b border-[var(--color-separator)] px-2 py-1 text-right tabular-nums">
        {row.iv != null ? `${(Number(row.iv) * 100).toFixed(1)}%` : "—"}
      </td>
    </tr>
  );
});

export default function ChainLadderPage() {
  const [universe, setUniverse] = useState<MarketUniverseSymbol[]>([]);
  const [symbol, setSymbol] = useState("SPX");
  const [expiryContracts, setExpiryContracts] = useState<
    LadderExpirationContract[]
  >([]);
  const [expiration, setExpiration] = useState("");
  const [side, setSide] = useState<"call" | "put">("call");
  const [wings, setWings] = useState<StrikeWings>(DEFAULT_STRIKE_WINGS);
  const [error, setError] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [spot, setSpot] = useState<number | null>(null);
  const [band, setBand] = useState<number | null>(null);
  const [ladderDte, setLadderDte] = useState<number | null>(null);
  const [asOf, setAsOf] = useState<string | null>(null);
  const [rowsByStrike, setRowsByStrike] = useState<Map<number, LadderRow>>(
    () => new Map(),
  );
  const [flashStrikes, setFlashStrikes] = useState<Set<number>>(() => new Set());
  const [lastPatch, setLastPatch] = useState<string>("—");
  const hashRef = useRef<string | null>(null);
  const mounted = useRef(true);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  /** After a new ladder is presented, center once — then only on demand. */
  const presentKeyRef = useRef<string>("");
  const centerOnPresentRef = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Admin market universe — same list as Admin → Symbols
  useEffect(() => {
    void (async () => {
      try {
        const u = await fetchMarketUniverse({ enabledOnly: true });
        if (!mounted.current) return;
        const syms = u.symbols || [];
        setUniverse(syms);
        if (syms.length) {
          const has = syms.some((s) => s.symbol === symbol);
          if (!has) setSymbol(syms[0].symbol);
        }
      } catch (e) {
        if (mounted.current)
          setError(
            e instanceof Error ? e.message : "Could not load market universe",
          );
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Next 3 distinct listed expirations for this symbol (SPX daily, others M/W/F or Fri…)
  useEffect(() => {
    if (!symbol) return;
    setExpiration("");
    setExpiryContracts([]);
    setLadderDte(null);
    void (async () => {
      try {
        const pack = await fetchLadderExpirations(symbol, EXPIRY_PICK_COUNT);
        if (!mounted.current) return;
        setExpiryContracts(pack.contracts);
        const def = pack.default_expiration || pack.contracts[0]?.expiration || "";
        setExpiration(def);
        const dte0 = pack.contracts.find((c) => c.expiration === def)?.dte;
        setLadderDte(dte0 != null ? dte0 : null);
        setError(null);
      } catch (e) {
        if (mounted.current)
          setError(
            e instanceof Error ? e.message : "Could not load expirations",
          );
      }
    })();
  }, [symbol]);

  const tick = useCallback(async () => {
    if (!expiration || !symbol) return;
    try {
      const result = await pollChainLadder({
        expiration,
        symbol,
        side,
        wings,
        since_hash: hashRef.current,
      });
      if (!mounted.current) return;
      setError(null);

      setRowsByStrike((prev) => {
        const { next, touched, meta, hash: h } = applyLadderDiff(prev, result);
        hashRef.current = h;
        queueMicrotask(() => {
          if (!mounted.current) return;
          setHash(h);
          if (meta?.spot != null) setSpot(Number(meta.spot));
          if (meta?.band != null) setBand(Number(meta.band));
          if (meta?.as_of) setAsOf(String(meta.as_of));
          if (result.mode === "full" && result.ladder.dte != null) {
            setLadderDte(Number(result.ladder.dte));
          }
          if (result.mode === "diff") {
            setLastPatch(
              `${result.changed_strike_count ?? result.upserts.length} strike(s) · ${result.removes.length} removed`,
            );
          } else if (result.mode === "full") {
            setLastPatch(`full ${result.ladder.row_count} rows`);
          } else {
            setLastPatch("no change");
          }
          if (touched.size) {
            const reduceMotion =
              typeof window !== "undefined" &&
              window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            if (!reduceMotion) {
              setFlashStrikes(new Set(touched));
              window.setTimeout(() => {
                if (mounted.current) setFlashStrikes(new Set());
              }, 600);
            }
          }
        });
        return next;
      });
    } catch (e) {
      if (mounted.current)
        setError(e instanceof Error ? e.message : "Poll failed");
    }
  }, [expiration, symbol, side, wings]);

  // Reset hash when controls change so first response is full; center once after present
  useEffect(() => {
    hashRef.current = null;
    setHash(null);
    setRowsByStrike(new Map());
    setSpot(null);
    setBand(null);
    const key = `${symbol}|${expiration}|${side}|${wings}`;
    if (presentKeyRef.current !== key) {
      presentKeyRef.current = key;
      centerOnPresentRef.current = true;
    }
  }, [expiration, symbol, side, wings]);

  useEffect(() => {
    if (!expiration) return;
    void tick();
    const id = window.setInterval(() => void tick(), POLL_MS);
    return () => window.clearInterval(id);
  }, [expiration, tick]);

  const ordered = useMemo(() => {
    // High strikes first so OTM calls scroll up / ITM down like most brokers
    return [...rowsByStrike.values()].sort((a, b) => b.strike - a.strike);
  }, [rowsByStrike]);

  /** Scroll so the SPOT row sits mid-viewport (used after present + on demand). */
  const centerSpot = useCallback(() => {
    const root = scrollRef.current;
    if (!root) return false;
    const spotEl =
      (root.querySelector('tr[data-spot="1"]') as HTMLElement | null) ||
      null;
    if (!spotEl) return false;
    const rootRect = root.getBoundingClientRect();
    const elRect = spotEl.getBoundingClientRect();
    const elMid = elRect.top + elRect.height / 2;
    const rootMid = rootRect.top + rootRect.height / 2;
    root.scrollTop += elMid - rootMid;
    return true;
  }, []);

  // Center once after the ladder is first painted for this geometry
  useEffect(() => {
    if (!centerOnPresentRef.current || !ordered.length) return;
    if (!ordered.some((r) => r.is_spot)) return;
    const id = window.requestAnimationFrame(() => {
      if (centerSpot()) centerOnPresentRef.current = false;
    });
    return () => window.cancelAnimationFrame(id);
  }, [ordered, centerSpot]);

  const selectedMeta = universe.find((u) => u.symbol === symbol);
  const selectedExpiry = expiryContracts.find((c) => c.expiration === expiration);
  const displayDte =
    ladderDte != null
      ? ladderDte
      : selectedExpiry != null
        ? selectedExpiry.dte
        : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-3 px-3 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/app"
          className="text-sm text-[var(--color-label-secondary)] hover:underline"
        >
          ← Apps
        </Link>
        <h1 className="text-lg font-semibold text-[var(--color-label)]">
          Options Lab
        </h1>
        <span className="text-xs text-[var(--color-label-tertiary)]">
          {symbol}
          {displayDte != null ? ` · ${displayDte} DTE` : ""}
          {" · "}±{wings} strikes · row diffs only
        </span>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-[var(--color-separator)] p-3">
        <label className="text-xs text-[var(--color-label-secondary)]">
          Symbol
          <select
            className="mt-0.5 block min-h-11 min-w-[8rem] rounded border border-[var(--color-separator)] bg-[var(--color-canvas)] px-2 py-2 text-sm font-medium text-[var(--color-label)]"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            data-testid="chain-ladder-symbol"
          >
            {universe.map((u) => (
              <option key={u.symbol} value={u.symbol}>
                {u.symbol}
                {u.kind ? ` · ${u.kind}` : ""}
                {u.feed_symbol ? ` (${u.feed_symbol})` : ""}
              </option>
            ))}
          </select>
          {selectedMeta?.feed_symbol && (
            <span className="mt-0.5 block text-[10px] text-[var(--color-label-tertiary)]">
              chain feed {selectedMeta.feed_symbol}
            </span>
          )}
        </label>
        <label className="text-xs text-[var(--color-label-secondary)]">
          Contract (next {EXPIRY_PICK_COUNT} expiries)
          <select
            className="mt-0.5 block min-h-11 min-w-[12rem] rounded border border-[var(--color-separator)] bg-[var(--color-canvas)] px-2 py-2 text-sm"
            value={expiration}
            onChange={(e) => {
              const v = e.target.value;
              setExpiration(v);
              const c = expiryContracts.find((x) => x.expiration === v);
              setLadderDte(c != null ? c.dte : null);
            }}
            data-testid="chain-ladder-expiration"
          >
            {!expiration && <option value="">—</option>}
            {expiryContracts.map((c) => (
              <option key={c.expiration} value={c.expiration}>
                {c.label}
              </option>
            ))}
          </select>
          <span className="mt-0.5 block text-[10px] text-[var(--color-label-tertiary)]">
            Distinct listed dates for {symbol}
            {displayDte != null ? ` · selected ${displayDte} DTE` : ""}
          </span>
        </label>
        <label className="text-xs text-[var(--color-label-secondary)]">
          Side
          <select
            className="mt-0.5 block min-h-11 rounded border border-[var(--color-separator)] bg-[var(--color-canvas)] px-2 py-2 text-sm"
            value={side}
            onChange={(e) => setSide(e.target.value as "call" | "put")}
          >
            <option value="call">Calls</option>
            <option value="put">Puts</option>
          </select>
        </label>
        <label className="text-xs text-[var(--color-label-secondary)]">
          Wings
          <select
            className="mt-0.5 block min-h-11 min-w-[7rem] rounded border border-[var(--color-separator)] bg-[var(--color-canvas)] px-2 py-2 text-sm"
            value={wings}
            onChange={(e) =>
              setWings(Number(e.target.value) as StrikeWings)
            }
            data-testid="chain-ladder-wings"
          >
            {STRIKE_WING_CHOICES.map((n) => (
              <option key={n} value={n}>
                ±{n} strikes
              </option>
            ))}
          </select>
          <span className="mt-0.5 block text-[10px] text-[var(--color-label-tertiary)]">
            Above &amp; below ATM
          </span>
        </label>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-[var(--color-label-secondary)]">
            Viewport
          </span>
          <button
            type="button"
            className="min-h-11 rounded border border-[var(--color-separator)] bg-[var(--color-canvas)] px-3 py-2 text-sm font-medium text-[var(--color-label)] hover:bg-[var(--color-fill-secondary)] active:opacity-80"
            onClick={() => centerSpot()}
            disabled={!ordered.some((r) => r.is_spot)}
            data-testid="chain-ladder-center-spot"
            title="Scroll so the SPOT strike is mid-viewport"
          >
            Center spot
          </button>
        </div>
        <div className="ml-auto text-right text-xs text-[var(--color-label-tertiary)]">
          <div>
            Spot{" "}
            <span className="tabular-nums text-[var(--color-label)]">
              {spot != null ? fmt(spot, 2) : "—"}
            </span>
            {band != null && (
              <span className="ml-2">window ±{fmt(band, 0)}</span>
            )}
          </div>
          <div>hash {hash?.slice(0, 8) || "—"} · {lastPatch}</div>
          <div>{asOf ? `as of ${asOf}` : ""}</div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div
        ref={scrollRef}
        className="max-h-[70vh] overflow-auto rounded-lg border border-[var(--color-separator)]"
      >
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-[2] bg-[var(--color-canvas)] text-left text-[10px] uppercase tracking-wide text-[var(--color-label-tertiary)]">
            <tr>
              <th className="sticky left-0 bg-[var(--color-canvas)] px-2 py-2">
                Strike
              </th>
              <th className="px-2 py-2 text-right">Mid</th>
              <th className="px-2 py-2 text-right">Bid</th>
              <th className="px-2 py-2 text-right">Ask</th>
              <th className="px-2 py-2 text-right">Vol</th>
              <th className="px-2 py-2 text-right">OI</th>
              <th className="px-2 py-2 text-right">Δ</th>
              <th className="px-2 py-2 text-right">IV</th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((row) => (
              <StrikeRow
                key={row.strike}
                row={row}
                flash={flashStrikes.has(row.strike)}
              />
            ))}
            {!ordered.length && (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-8 text-center text-[var(--color-label-tertiary)]"
                >
                  {expiration ? "Waiting for chain…" : "Pick an expiration"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-[var(--color-label-tertiary)]">
        Poll every {POLL_MS / 1000}s. Ladder centers on SPOT once when first
        presented; use <strong className="font-medium">Center spot</strong> to
        re-center on demand. Diffs only patch moved strikes.
      </p>
    </main>
  );
}
