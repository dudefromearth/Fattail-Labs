/**
 * Runner subscribe — TR2 / TR3 / MB7.
 * Registers interest on the existing tab singleton. Opens no socket of its own.
 * No HTTP. No poll.
 */

import { getMarketSocket } from "@/lib/market/MarketSocket";
import type { ChainSub, MarketInbound } from "@/lib/market/types";
import { RunnerError } from "./registry";

/** Duck type — do not extend MarketSocket. Production uses getMarketSocket(). */
export type RunnerSocket = {
  setChainInterest: (id: string, sub: ChainSub | null) => void;
  subscribe: (fn: (msg: MarketInbound) => void) => () => void;
};

export type RunnerSubscribeInputs = {
  interestId: string;
  topics: string[];
  chain?: ChainSub | null;
};

export type RunnerSnapshot = {
  topic: string;
  content_hash: string | null;
  mode: "full" | "diff" | "unchanged" | string;
  as_of?: string | null;
  raw: MarketInbound;
};

export type SubscribeDeps = {
  /** Injected in tests. Production uses getMarketSocket(). */
  socket?: RunnerSocket | null;
};

function requireSocket(deps?: SubscribeDeps): RunnerSocket {
  if (deps && "socket" in deps) {
    if (!deps.socket) {
      throw new RunnerError("MISSING_SOCKET", "Market socket missing");
    }
    return deps.socket;
  }
  if (typeof window === "undefined") {
    throw new RunnerError(
      "MISSING_SOCKET",
      "Market socket missing (no window)",
    );
  }
  return getMarketSocket();
}

/**
 * Register chain interest on the tab singleton and yield chain snapshots
 * (MB7: server sends snapshot first, then updates). Caller must unsubscribe.
 */
export function subscribe(
  inputs: RunnerSubscribeInputs,
  onSnapshot: (snap: RunnerSnapshot) => void,
  deps?: SubscribeDeps,
): () => void {
  const sock = requireSocket(deps);
  if (inputs.chain) {
    sock.setChainInterest(inputs.interestId, inputs.chain);
  }
  const unsub = sock.subscribe((msg: MarketInbound) => {
    if (msg.t !== "chain") return;
    const m = msg as {
      t: "chain";
      mode?: string;
      content_hash?: string;
      as_of?: string;
      key?: string;
    };
    onSnapshot({
      topic: String(m.key || "chain"),
      content_hash: m.content_hash ?? null,
      mode: m.mode || "full",
      as_of: m.as_of ?? null,
      raw: msg,
    });
  });
  return () => {
    sock.setChainInterest(inputs.interestId, null);
    unsub();
  };
}

/**
 * Same field `useOptionChainBus` stores as `hash` (chain content_hash).
 * Kept here so the AT can compare without editing the hook.
 */
export function chainMessageContentHash(msg: MarketInbound): string | null {
  if (msg.t !== "chain") return null;
  const h = (msg as { content_hash?: string }).content_hash;
  return h ?? null;
}
