/**
 * TR-P1 characterization
 *   npx --yes tsx lib/runner/__tests__/shell.test.ts
 */
import {
  _resetRegistryForTests,
  emitToSink,
  get,
  register,
  RunnerError,
  runnerShellEnabled,
  tilesHash,
  type HeatmapTiles,
  type RunnerTemplate,
} from "../registry";
import { run } from "../run";
import {
  chainMessageContentHash,
  subscribe,
  type RunnerSnapshot,
} from "../subscribe";
import { deliverRender } from "../sinks/render";
import {
  HEATMAP_TEMPLATE_ID,
  HEATMAP_TEMPLATE_VERSION,
  paintCurrentHeatmap,
} from "../templates/heatmap";
import { RECORDED_GENERATIONS } from "./fixtures";
import type { ChainSub, MarketInbound } from "@/lib/market/types";
import type { RunnerSocket } from "../subscribe";

function fakeSocket(): RunnerSocket & {
  emit: (m: MarketInbound) => void;
  interestCount: () => number;
} {
  const listeners = new Set<(m: MarketInbound) => void>();
  const chainIds = new Set<string>();
  return {
    interestCount: () => chainIds.size,
    setChainInterest(id: string, sub: ChainSub | null) {
      if (sub) chainIds.add(id);
      else chainIds.delete(id);
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    emit(m) {
      for (const fn of listeners) fn(m);
    },
  };
}

function assert(c: unknown, m: string): asserts c {
  if (!c) throw new Error(`FAIL: ${m}`);
}

let passed = 0;
function ok(m: string) {
  passed += 1;
  console.log(`ok  ${m}`);
}

// --- 10. tilesHash(shell) === tilesHash(current) on 3 generations -----------

{
  for (const { label, ctx } of RECORDED_GENERATIONS) {
    const current = paintCurrentHeatmap(ctx);
    const tpl = get(HEATMAP_TEMPLATE_ID, HEATMAP_TEMPLATE_VERSION);
    const shell = run(tpl, { chain: ctx, content_hash: ctx.contentHash }, {});
    const hc = tilesHash(current);
    const hs = tilesHash(shell);
    assert(hc === hs, `${label} tilesHash mismatch current=${hc} shell=${hs}`);
    assert(current.cells.length > 0, `${label} empty grid`);
    ok(`tilesHash ${label} ${hc}`);
  }
}

// --- 11. content_hash: Runner snapshot === useOptionChainBus field ----------

{
  const sock = fakeSocket();
  const snaps: RunnerSnapshot[] = [];
  const unsub = subscribe(
    {
      interestId: "tr-p1-hash",
      topics: ["chain"],
      chain: {
        symbol: "SPX",
        expiration: "2026-08-21",
        side: "call",
        wings: 50,
      },
    },
    (s) => snaps.push(s),
    { socket: sock },
  );
  const msg: MarketInbound = {
    t: "chain",
    mode: "full",
    key: "SPX:2026-08-21",
    content_hash: "gen-spx-trp1",
  };
  sock.emit(msg);
  assert(snaps.length === 1, "one snapshot");
  const runnerHash = snaps[0].content_hash;
  const busHash = chainMessageContentHash(msg);
  assert(runnerHash === "gen-spx-trp1", "runner hash");
  assert(busHash === runnerHash, "Runner content_hash !== useOptionChainBus field");
  unsub();
  ok(`content_hash ${runnerHash}`);
}

// --- 12. negatives: unknown template, undeclared sink, fetch → named error --

{
  try {
    get("no-such-template", "9.9");
    assert(false, "expected UNKNOWN_TEMPLATE");
  } catch (e) {
    assert(e instanceof RunnerError && e.code === "UNKNOWN_TEMPLATE", String(e));
    ok("UNKNOWN_TEMPLATE");
  }

  const tpl = get(HEATMAP_TEMPLATE_ID, HEATMAP_TEMPLATE_VERSION);
  try {
    emitToSink(tpl, "notification");
    assert(false, "expected UNDECLARED_SINK");
  } catch (e) {
    assert(e instanceof RunnerError && e.code === "UNDECLARED_SINK", String(e));
    ok("UNDECLARED_SINK");
  }

  const emptyTiles = {
    rows: [] as HeatmapTiles["rows"],
    cols: [] as HeatmapTiles["cols"],
    cells: [] as HeatmapTiles["cells"],
    contentHash: null,
  };
  const ioCases: { id: string; touch: () => void }[] = [
    { id: "io-fetch", touch: () => void fetch("https://example.invalid") },
    { id: "io-xhr", touch: () => void new XMLHttpRequest() },
    { id: "io-ws", touch: () => void new WebSocket("wss://example.invalid") },
    { id: "io-localStorage", touch: () => localStorage.setItem("k", "v") },
    { id: "io-sessionStorage", touch: () => void sessionStorage.getItem("k") },
    { id: "io-document", touch: () => void document.body },
  ];
  for (const c of ioCases) {
    const dirty: RunnerTemplate = {
      ...tpl,
      id: c.id,
      version: "0.0",
      compute: () => {
        c.touch();
        return emptyTiles;
      },
    };
    register(dirty);
    try {
      run(get(c.id, "0.0"), {}, {});
      assert(false, `expected TEMPLATE_IO for ${c.id}`);
    } catch (e) {
      assert(
        e instanceof RunnerError && e.code === "TEMPLATE_IO",
        `${c.id}: ${String(e)}`,
      );
      ok(`TEMPLATE_IO ${c.id}`);
    }
  }
  try {
    subscribe(
      { interestId: "x", topics: ["chain"] },
      () => undefined,
      { socket: null },
    );
    assert(false, "expected MISSING_SOCKET");
  } catch (e) {
    assert(e instanceof RunnerError && e.code === "MISSING_SOCKET", String(e));
    ok("MISSING_SOCKET");
  }
}

// --- 13. socket: two runner subscribes share one injected MarketSocket ------

{
  const sock = fakeSocket();
  const chain = {
    symbol: "SPX",
    expiration: "2026-08-21",
    side: "call" as const,
    wings: 50,
  };
  const a = subscribe(
    { interestId: "a", topics: ["chain"], chain },
    () => undefined,
    { socket: sock },
  );
  const b = subscribe(
    { interestId: "b", topics: ["chain"], chain },
    () => undefined,
    { socket: sock },
  );
  assert(sock.interestCount() === 2, "two interests on one socket");
  a();
  b();
  assert(sock.interestCount() === 0, "unsubscribe clears interest");
  ok("one socket instance for two runner interests");
}

// --- flag: missing / 0 → off; 1 → on ----------------------------------------

{
  assert(runnerShellEnabled({}) === false, "missing env not on");
  assert(runnerShellEnabled({ NEXT_PUBLIC_LABS_RUNNER_SHELL: "0" }) === false, "0");
  assert(runnerShellEnabled({ NEXT_PUBLIC_LABS_RUNNER_SHELL: "1" }) === true, "1");
  ok("flag missing/0 off · 1 on");
}

// --- render sink delivers when declared --------------------------------------

{
  const tpl = get(HEATMAP_TEMPLATE_ID, HEATMAP_TEMPLATE_VERSION);
  const tiles = run(tpl, { chain: RECORDED_GENERATIONS[0].ctx }, {});
  const out = deliverRender(tpl, tiles);
  assert(tilesHash(out) === tilesHash(tiles), "render sink passthrough");
  ok("render sink");
}

void _resetRegistryForTests;

console.log(`TR-P1 ${passed} passed`);
