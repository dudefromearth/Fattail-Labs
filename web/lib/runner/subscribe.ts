/**
 * Runner subscribe — TR2 / TR3 / MB7 / TR10.
 * Snapshot first, then updates. Provenance derived, not invented.
 */

import { getMarketSocket } from "@/lib/market/MarketSocket";
import type { ChainSub, MarketInbound } from "@/lib/market/types";
import { RunnerError } from "./registry";

export type RunnerSocket = {
  setChainInterest: (id: string, sub: ChainSub | null) => void;
  subscribe: (fn: (msg: MarketInbound) => void) => () => void;
};

export type RunnerSubscribeInputs = {
  interestId: string;
  topics: string[];
  chain?: ChainSub | null;
  onError?: (err: unknown) => void;
};

export type RunnerSnapshot = {
  topic: string;
  content_hash: string | null;
  mode: "full" | "diff" | "unchanged" | string;
  as_of?: string | null;
  epoch_quality: string;
  stale: boolean;
  raw: MarketInbound;
};

export type SubscribeDeps = {
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

function pick(obj: Record<string, unknown>, key: string): unknown {
  return obj[key];
}

/**
 * TR10: stale and epoch_quality must be on the document (message or ladder).
 * Derived, not invented. Missing field → STALENESS_MISSING.
 */
export function provenanceFromChainDoc(msg: MarketInbound): {
  stale: boolean;
  epoch_quality: string;
} {
  const m = msg as unknown as Record<string, unknown>;
  const ladder =
    m.ladder && typeof m.ladder === "object"
      ? (m.ladder as Record<string, unknown>)
      : null;
  const staleRaw =
    pick(m, "stale") !== undefined
      ? pick(m, "stale")
      : ladder
        ? pick(ladder, "stale")
        : undefined;
  const eqRaw =
    pick(m, "epoch_quality") !== undefined
      ? pick(m, "epoch_quality")
      : ladder
        ? pick(ladder, "epoch_quality")
        : undefined;
  if (typeof staleRaw !== "boolean") {
    throw new RunnerError(
      "STALENESS_MISSING",
      "chain document lacks boolean stale",
    );
  }
  if (eqRaw == null || eqRaw === "") {
    throw new RunnerError(
      "STALENESS_MISSING",
      "chain document lacks epoch_quality",
    );
  }
  return { stale: staleRaw, epoch_quality: String(eqRaw) };
}

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
    try {
      const prov = provenanceFromChainDoc(msg);
      onSnapshot({
        topic: String(m.key || "chain"),
        content_hash: m.content_hash ?? null,
        mode: m.mode || "full",
        as_of: m.as_of ?? null,
        epoch_quality: prov.epoch_quality,
        stale: prov.stale,
        raw: msg,
      });
    } catch (err) {
      if (inputs.onError) inputs.onError(err);
      else throw err;
    }
  });
  return () => {
    sock.setChainInterest(inputs.interestId, null);
    unsub();
  };
}

export function chainMessageContentHash(msg: MarketInbound): string | null {
  if (msg.t !== "chain") return null;
  const h = (msg as { content_hash?: string }).content_hash;
  return h ?? null;
}
