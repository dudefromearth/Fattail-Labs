/**
 * TR-P3 shell session — one subscribe → run → render for every template.
 * HeatmapChainPanel is not on this path.
 */

import {
  applyLadderDiff,
  contractKey,
  type LadderFull,
  type LadderPollResult,
  type LadderRow,
} from "@/lib/chainLadderApi";
import type { ChainSub } from "@/lib/market/types";
import type { ChainContext } from "@/lib/options-lab/templates/types";
import {
  get,
  type ControlValues,
  type HeatmapTiles,
} from "./registry";
import { run } from "./run";
import {
  subscribe,
  type RunnerSnapshot,
  type RunnerSocket,
} from "./subscribe";
import {
  contractsFromMap,
  getStreamBook,
  interestKey,
} from "./streamBook";

export function pushTileSet(
  lastHash: { current: string | null },
  tiles: HeatmapTiles,
  onRender: (tiles: HeatmapTiles) => void,
): boolean {
  const h = tiles.contentHash ?? "";
  if (h === (lastHash.current ?? "")) return false;
  lastHash.current = h;
  onRender(tiles);
  return true;
}

const INTEREST_ID = "runner-heatmap";

export type ShellMeta = {
  content_hash: string | null;
  stale: boolean;
  epoch_quality: string;
};

export type HeldChain = {
  contracts: Map<string, LadderRow>;
  spot: number | null;
  strikeStep: number | null;
  asOf: string | null;
  hash: string | null;
  wings: number;
};

export function emptyHeld(): HeldChain {
  return {
    contracts: new Map(),
    spot: null,
    strikeStep: null,
    asOf: null,
    hash: null,
    wings: 25,
  };
}

export function applySnapToHeld(held: HeldChain, snap: RunnerSnapshot): HeldChain {
  const raw = snap.raw as {
    ladder?: LadderFull;
    upserts?: LadderRow[];
    removes?: Array<number | string>;
    spot?: number;
    as_of?: string;
    content_hash?: string;
  };
  if (snap.mode === "full" && raw.ladder) {
    const next = new Map<string, LadderRow>();
    for (const row of raw.ladder.rows || []) {
      next.set(contractKey(row.side, Number(row.strike)), row);
    }
    return {
      contracts: next,
      spot: raw.ladder.spot ?? held.spot,
      strikeStep: raw.ladder.strike_step ?? held.strikeStep,
      asOf: raw.ladder.as_of ?? snap.as_of ?? held.asOf,
      hash: snap.content_hash,
      wings: raw.ladder.wings ?? held.wings,
    };
  }
  if (snap.mode === "diff") {
    const result = {
      mode: "diff" as const,
      content_hash: snap.content_hash || held.hash || "",
      as_of: snap.as_of ?? undefined,
      spot: Number(raw.spot ?? held.spot ?? 0),
      upserts: raw.upserts || [],
      removes: raw.removes || [],
    } satisfies LadderPollResult;
    const { next } = applyLadderDiff(held.contracts, result);
    return {
      ...held,
      contracts: next,
      spot: raw.spot ?? held.spot,
      asOf: snap.as_of ?? held.asOf,
      hash: snap.content_hash,
    };
  }
  return {
    ...held,
    hash: snap.content_hash ?? held.hash,
    asOf: snap.as_of ?? held.asOf,
  };
}

export function heldToContext(
  held: HeldChain,
  symbol: string,
  viewSide: "call" | "put",
): ChainContext {
  return {
    symbol,
    viewSide,
    spot: held.spot,
    strikeStep: held.strikeStep,
    wings: held.wings,
    contracts: held.contracts,
    asOf: held.asOf,
    contentHash: held.hash,
  };
}

export function runActive(
  templateId: string,
  templateVersion: string,
  held: HeldChain,
  symbol: string,
  viewSide: "call" | "put",
  snap: RunnerSnapshot,
  controls: ControlValues,
): HeatmapTiles {
  const tpl = get(templateId, templateVersion);
  const ctx = heldToContext(held, symbol, viewSide);
  return run(
    tpl,
    {
      chain: ctx,
      content_hash: snap.content_hash,
      stale: snap.stale,
      epoch_quality: snap.epoch_quality,
    },
    controls,
  );
}

export type ShellSession = {
  runCount: number;
  lastTiles: HeatmapTiles | null;
  lastHash: string | null;
  chain: ChainSub;
  setTemplate: (id: string, version: string) => void;
  setControls: (c: ControlValues) => void;
  dispose: () => void;
};

export function createShellSession(opts: {
  socket: RunnerSocket;
  chain: ChainSub;
  templateId: string;
  templateVersion: string;
  controls?: ControlValues;
  onTiles?: (tiles: HeatmapTiles, meta: ShellMeta) => void;
  onError?: (err: unknown) => void;
}): ShellSession {
  const sock = opts.socket;
  let templateId = opts.templateId;
  let templateVersion = opts.templateVersion;
  let controls = opts.controls ?? {};
  let held = emptyHeld();
  let lastSnap: RunnerSnapshot | null = null;
  const lastHashBox = { current: null as string | null };
  const session: ShellSession = {
    runCount: 0,
    lastTiles: null,
    lastHash: null,
    chain: opts.chain,
    setTemplate(id, version) {
      templateId = id;
      templateVersion = version;
      lastHashBox.current = null;
      sock.setChainInterest(INTEREST_ID, opts.chain);
      if (lastSnap) fire(lastSnap);
    },
    setControls(c) {
      controls = c;
      lastHashBox.current = null;
      if (lastSnap) fire(lastSnap);
    },
    dispose() {
      unsub();
    },
  };

  function fire(snap: RunnerSnapshot) {
    lastSnap = snap;
    held = applySnapToHeld(held, snap);
    if (held.hash) {
      getStreamBook().push(
        interestKey(opts.chain.symbol, opts.chain.expiration),
        {
          contentHash: held.hash,
          asOf: held.asOf,
          receivedAt: Date.now(),
          epochQuality: snap.epoch_quality,
          stale: snap.stale,
          contracts: contractsFromMap(held.contracts),
          spot: held.spot,
          strikeStep: held.strikeStep,
          wings: held.wings,
          memo: null,
        },
      );
    }
    const tiles = runActive(
      templateId,
      templateVersion,
      held,
      opts.chain.symbol,
      opts.chain.side,
      snap,
      controls,
    );
    const painted = pushTileSet(lastHashBox, tiles, (t) => {
      session.runCount += 1;
      session.lastTiles = t;
      session.lastHash = t.contentHash;
      opts.onTiles?.(t, {
        content_hash: snap.content_hash,
        stale: snap.stale,
        epoch_quality: snap.epoch_quality,
      });
    });
    void painted;
    void lastSnap;
  }

  const unsub = subscribe(
    {
      interestId: INTEREST_ID,
      topics: ["chain"],
      chain: opts.chain,
      onError: opts.onError,
    },
    fire,
    { socket: opts.socket },
  );

  return session;
}
