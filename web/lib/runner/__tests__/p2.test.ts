/**
 * TR-P2 characterization
 *   npx --yes tsx lib/runner/__tests__/p2.test.ts
 */
import { contractKey, type LadderRow } from "@/lib/chainLadderApi";
import type { ChainContext } from "@/lib/options-lab/templates/types";
import type { ChainSub, MarketInbound } from "@/lib/market/types";
import {
  get,
  register,
  RunnerError,
  tilesHash,
  type RunnerTemplate,
} from "../registry";
import { run, validateControls } from "../run";
import {
  provenanceFromChainDoc,
  subscribe,
  type RunnerSnapshot,
  type RunnerSocket,
} from "../subscribe";
import { pushTileSet } from "../sinks/render";
import {
  HEATMAP_TEMPLATE_ID,
  HEATMAP_TEMPLATE_VERSION,
  paintCurrentHeatmap,
} from "../templates/heatmap";
import { SPREAD_TAX_ID, SPREAD_TAX_VERSION } from "../templates/spread-tax";
import { RECORDED_GENERATIONS } from "./fixtures";

function assert(c: unknown, m: string): asserts c {
  if (!c) throw new Error(`FAIL: ${m}`);
}

let passed = 0;
function ok(m: string) {
  passed += 1;
  console.log(`ok  ${m}`);
}

function fakeSocket(): RunnerSocket & {
  emit: (m: MarketInbound) => void;
} {
  const listeners = new Set<(m: MarketInbound) => void>();
  return {
    setChainInterest(_id: string, _sub: ChainSub | null) {},
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    emit(m) {
      for (const fn of listeners) fn(m);
    },
  };
}

function chainMsg(
  extra: Record<string, unknown>,
): MarketInbound {
  return {
    t: "chain",
    mode: "full",
    key: "SPX:2026-08-21",
    content_hash: "h1",
    stale: false,
    epoch_quality: "ok",
    ...extra,
  } as MarketInbound;
}

// --- TR-P1 regression: three hash ATs ---------------------------------------

{
  for (const { label, ctx } of RECORDED_GENERATIONS) {
    const current = paintCurrentHeatmap(ctx);
    const tpl = get(HEATMAP_TEMPLATE_ID, HEATMAP_TEMPLATE_VERSION);
    assert(tpl.live === true, "sym-fly live");
    assert(tpl.controls.length === 0, "sym-fly no controls");
    const shell = run(tpl, { chain: ctx, content_hash: ctx.contentHash }, {});
    assert(
      tilesHash(current) === tilesHash(shell),
      `${label} tilesHash mismatch`,
    );
    ok(`regression tilesHash ${label} ${tilesHash(shell)}`);
  }
}

// --- CONTROL_DEFAULT / CONTROL_INVALID --------------------------------------

{
  const base = get(SPREAD_TAX_ID, SPREAD_TAX_VERSION);
  try {
    register({
      ...base,
      id: "no-default",
      version: "0.0",
      controls: [{ id: "x", kind: "number", default: undefined as unknown as number }],
    });
    assert(false, "expected CONTROL_DEFAULT");
  } catch (e) {
    assert(e instanceof RunnerError && e.code === "CONTROL_DEFAULT", String(e));
    ok("CONTROL_DEFAULT");
  }

  try {
    validateControls(base, { nope: 1 });
    assert(false, "expected CONTROL_INVALID unknown");
  } catch (e) {
    assert(e instanceof RunnerError && e.code === "CONTROL_INVALID", String(e));
    ok("CONTROL_INVALID unknown id");
  }

  try {
    validateControls(base, { min_oi: -1 });
    assert(false, "expected CONTROL_INVALID bounds");
  } catch (e) {
    assert(e instanceof RunnerError && e.code === "CONTROL_INVALID", String(e));
    ok("CONTROL_INVALID out of bounds");
  }
}

// --- STALENESS_MISSING ------------------------------------------------------

{
  try {
    provenanceFromChainDoc({
      t: "chain",
      mode: "full",
      key: "k",
      content_hash: "h",
    } as MarketInbound);
    assert(false, "expected STALENESS_MISSING");
  } catch (e) {
    assert(e instanceof RunnerError && e.code === "STALENESS_MISSING", String(e));
    ok("STALENESS_MISSING");
  }
}

// --- Live: snapshot + 3 deltas, render == distinct hashes; stale flips ------

{
  const sock = fakeSocket();
  const snaps: RunnerSnapshot[] = [];
  const renders: string[] = [];
  const stales: boolean[] = [];
  const last = { current: null as string | null };
  const unsub = subscribe(
    { interestId: "live", topics: ["chain"] },
    (s) => {
      snaps.push(s);
      stales.push(s.stale);
      const tiles = {
        rows: [],
        cols: [],
        cells: [],
        contentHash: s.content_hash,
      };
      pushTileSet(last, tiles, (t) => renders.push(t.contentHash ?? ""));
    },
    { socket: sock },
  );
  sock.emit(chainMsg({ content_hash: "A", stale: false }));
  sock.emit(chainMsg({ mode: "diff", content_hash: "B", stale: false }));
  sock.emit(chainMsg({ mode: "unchanged", content_hash: "B", stale: true }));
  sock.emit(chainMsg({ mode: "diff", content_hash: "C", stale: true }));
  unsub();
  assert(snaps.length === 4, `snaps ${snaps.length}`);
  assert(renders.join(",") === "A,B,C", `renders ${renders.join(",")}`);
  assert(stales[0] === false && stales[2] === true && stales[3] === true, "stale flip");
  ok("live render once per distinct hash");
  ok("stale flips with bus field");
}

// --- spread-tax: two missing bid → those cells null; filters; deterministic --

{
  const rows: LadderRow[] = [];
  function add(
    side: "call" | "put",
    strike: number,
    bid: number | null,
    ask: number | null,
    mid: number | null,
    oi: number,
  ) {
    rows.push({
      strike,
      side,
      bid,
      ask,
      mid,
      open_interest: oi,
    });
  }
  add("call", 100, 1.0, 1.2, 1.1, 50);
  add("call", 105, null, 1.4, 1.3, 50); // missing bid
  add("put", 100, 0.9, 1.1, 1.0, 50);
  add("put", 105, null, 1.0, 0.9, 10); // missing bid
  add("call", 110, 0.4, 0.6, 0.5, 5);
  const chain = { rows, contentHash: "st1" };
  const tpl = get(SPREAD_TAX_ID, SPREAD_TAX_VERSION);
  const both = run(tpl, { chain, content_hash: "st1" }, {});
  const call100 = both.cells[both.rows.findIndex((r) => r.strike === 100)][0];
  const call105 = both.cells[both.rows.findIndex((r) => r.strike === 105)][0];
  const put105 = both.cells[both.rows.findIndex((r) => r.strike === 105)][1];
  assert(call100.valid && call100.value != null, "100 call tax");
  assert(call105.value == null && call105.display == null, "105 call null");
  assert(put105.value == null && put105.display == null, "105 put null");
  assert(call105.display !== "0" && call105.display !== "0.0000", "not zero");
  ok("spread-tax two missing-bid cells null");

  const calls = run(tpl, { chain, content_hash: "st1" }, { side: "call" });
  assert(calls.cols.length === 1 && calls.cols[0].id === "call", "side call");
  ok("spread-tax side filters");

  const oi = run(tpl, { chain, content_hash: "st1" }, { min_oi: 20 });
  const r110 = oi.rows.findIndex((r) => r.strike === 110);
  const c110 = oi.cells[r110][0];
  assert(!c110.valid && c110.value == null, "min_oi filters 110");
  ok("spread-tax min_oi filters");

  const a = tilesHash(run(tpl, { chain, content_hash: "st1" }, {}));
  const b = tilesHash(run(tpl, { chain, content_hash: "st1" }, {}));
  assert(a === b, "deterministic hash");
  ok(`spread-tax hash deterministic ${a}`);
}

console.log(`TR-P2 ${passed} passed`);
void contractKey;
void (0 as unknown as ChainContext);
void (0 as unknown as RunnerTemplate);
