/**
 * One HTTP poll of market universe marks for the whole tab.
 * Multiple useLiveUnderlierMarks mounts share one interval + one in-flight fetch
 * so Curate strip + picker + Volume Profile do not multiply ensure_fresh work.
 */

import {
  fetchMarketUniverse,
  type MarketUniverseSymbol,
} from "@/lib/capitalApi";
import { LIVE_UNDERLIER_POLL_MS } from "@/lib/market/liveUnderlierPattern";

export type UniverseSnapshot = {
  symbols: MarketUniverseSymbol[];
  enabledOnly: boolean;
  fetchedAt: number;
  error: string | null;
};

type Listener = (snap: UniverseSnapshot) => void;

const listeners = new Set<Listener>();
const lastByMode = new Map<boolean, UniverseSnapshot>();
const inflightByMode = new Map<boolean, Promise<UniverseSnapshot>>();
let intervalId: number | null = null;
let pollMs = LIVE_UNDERLIER_POLL_MS;

function fingerprint(list: MarketUniverseSymbol[]): string {
  return list
    .map(
      (r) =>
        `${r.symbol}|${r.mid ?? ""}|${r.proxy_mid ?? ""}|${r.mark_asof ?? ""}|${
          r.mark_age_seconds ?? ""
        }|${r.mark_source ?? ""}`,
    )
    .join(";");
}

async function load(enabledOnly: boolean): Promise<UniverseSnapshot> {
  const existing = inflightByMode.get(enabledOnly);
  if (existing) return existing;

  const p = (async (): Promise<UniverseSnapshot> => {
    try {
      const d = await fetchMarketUniverse({ enabledOnly });
      const list = d.symbols || [];
      const prev = lastByMode.get(enabledOnly);
      // Reuse previous array reference when content is identical → fewer React renders
      const same =
        prev &&
        fingerprint(prev.symbols) === fingerprint(list) &&
        prev.error == null;
      const snap: UniverseSnapshot = {
        symbols: same ? prev!.symbols : list,
        enabledOnly,
        fetchedAt: Date.now(),
        error: null,
      };
      lastByMode.set(enabledOnly, snap);
      return snap;
    } catch (e) {
      const snap: UniverseSnapshot = {
        symbols: lastByMode.get(enabledOnly)?.symbols || [],
        enabledOnly,
        fetchedAt: Date.now(),
        error: e instanceof Error ? e.message : String(e),
      };
      lastByMode.set(enabledOnly, snap);
      return snap;
    } finally {
      inflightByMode.delete(enabledOnly);
    }
  })();

  inflightByMode.set(enabledOnly, p);
  return p;
}

// Track which enabledOnly modes have active subscribers
const modeRefCounts = new Map<boolean, number>();

function ensureInterval(): void {
  if (typeof window === "undefined") return;
  if (intervalId != null) return;
  const tick = () => {
    if (document.visibilityState !== "visible") return;
    for (const [mode, n] of modeRefCounts) {
      if (n > 0) void load(mode).then(broadcast);
    }
  };
  intervalId = window.setInterval(tick, pollMs);
  document.addEventListener("visibilitychange", onVis);
}

function onVis(): void {
  if (document.visibilityState !== "visible") return;
  for (const [mode, n] of modeRefCounts) {
    if (n > 0) void load(mode).then(broadcast);
  }
}

function stopIntervalIfIdle(): void {
  let any = false;
  for (const n of modeRefCounts.values()) {
    if (n > 0) {
      any = true;
      break;
    }
  }
  if (any) return;
  if (intervalId != null) {
    window.clearInterval(intervalId);
    intervalId = null;
  }
  document.removeEventListener("visibilitychange", onVis);
}

function broadcast(snap: UniverseSnapshot): void {
  for (const fn of listeners) {
    try {
      fn(snap);
    } catch {
      /* ignore */
    }
  }
}

/**
 * Subscribe to shared universe polls. Returns unsubscribe.
 * Immediately emits last snapshot if warm, then loads.
 */
export function subscribeSharedUniverse(
  enabledOnly: boolean,
  fn: Listener,
  opts?: { pollMs?: number },
): () => void {
  if (opts?.pollMs && opts.pollMs > 0) {
    // Use the tightest poll among subscribers
    pollMs = Math.min(pollMs, opts.pollMs);
  }
  listeners.add(fn);
  modeRefCounts.set(enabledOnly, (modeRefCounts.get(enabledOnly) || 0) + 1);
  ensureInterval();

  const warm = lastByMode.get(enabledOnly);
  if (warm) fn(warm);

  void load(enabledOnly).then(broadcast);

  return () => {
    listeners.delete(fn);
    const n = (modeRefCounts.get(enabledOnly) || 1) - 1;
    if (n <= 0) modeRefCounts.delete(enabledOnly);
    else modeRefCounts.set(enabledOnly, n);
    stopIntervalIfIdle();
  };
}
