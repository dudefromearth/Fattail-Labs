/**
 * TR-P3 — one runner path
 *   npx --yes tsx lib/runner/__tests__/p3.test.ts
 */
import type { ChainSub, MarketInbound } from "@/lib/market/types";
import { tilesHash } from "../registry";
import { createShellSession } from "../host";
import type { RunnerSocket } from "../subscribe";
import {
  HEATMAP_TEMPLATE_ID,
  HEATMAP_TEMPLATE_VERSION,
  paintCurrentHeatmap,
} from "../templates/heatmap";
import { SPREAD_TAX_ID, SPREAD_TAX_VERSION } from "../templates/spread-tax";
import { RECORDED_GENERATIONS } from "./fixtures";
import type { ChainContext } from "@/lib/options-lab/templates/types";

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
  interests: Map<string, ChainSub | null>;
} {
  const listeners = new Set<(m: MarketInbound) => void>();
  const interests = new Map<string, ChainSub | null>();
  return {
    interests,
    setChainInterest(id, sub) {
      interests.set(id, sub);
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

function fullMsg(ctx: ChainContext, hash?: string): MarketInbound {
  return {
    t: "chain",
    mode: "full",
    key: `chain:${ctx.symbol}:exp:w25`,
    content_hash: hash ?? ctx.contentHash,
    stale: false,
    epoch_quality: "ok",
    ladder: {
      rows: [...ctx.contracts.values()],
      spot: ctx.spot ?? 0,
      strike_step: ctx.strikeStep ?? 5,
      as_of: ctx.asOf,
      wings: ctx.wings,
      underlier: ctx.symbol,
      expiration: "2026-08-24",
      side: "call",
      fields: [],
      row_count: ctx.contracts.size,
      content_hash: hash ?? ctx.contentHash ?? "",
    },
  } as MarketInbound;
}

{
  const { ctx } = RECORDED_GENERATIONS[0];
  const sock = fakeSocket();
  const runs: string[] = [];
  const session = createShellSession({
    socket: sock,
    chain: {
      symbol: ctx.symbol,
      expiration: "2026-08-24",
      side: "call",
      wings: 25,
    },
    templateId: HEATMAP_TEMPLATE_ID,
    templateVersion: HEATMAP_TEMPLATE_VERSION,
    onTiles(t) {
      runs.push(t.contentHash ?? "");
    },
  });
  sock.emit(fullMsg(ctx, "H1"));
  sock.emit(fullMsg(ctx, "H1"));
  sock.emit(fullMsg(ctx, "H2"));
  assert(session.runCount === 2, `runCount ${session.runCount}`);
  assert(runs.join(",") === "H1,H2", `runs ${runs}`);
  ok("one run() per distinct content_hash");

  const before = sock.interests.size;
  session.setTemplate(SPREAD_TAX_ID, SPREAD_TAX_VERSION);
  assert(sock.interests.get("runner-heatmap") != null, "interest re-declared");
  assert(sock.interests.size === before, "socket interest map size unchanged");
  const afterSwitch = session.runCount;
  sock.emit(fullMsg(ctx, "H3"));
  assert(session.runCount === afterSwitch + 1, "run() on next document after switch");
  assert(session.lastTiles && session.lastTiles.cols.some((c) => c.id === "call"), "spread-tax cols");
  ok("selector switch re-declares interest; run() on next document");

  session.setTemplate(HEATMAP_TEMPLATE_ID, HEATMAP_TEMPLATE_VERSION);
  sock.emit(fullMsg(ctx, "H4"));
  assert(session.lastTiles != null, "switch back has tiles");
  ok("switch back to sym-fly");
  session.dispose();
}

{
  for (const { label, ctx } of RECORDED_GENERATIONS) {
    const current = paintCurrentHeatmap(ctx);
    const sock = fakeSocket();
    const session = createShellSession({
      socket: sock,
      chain: {
        symbol: ctx.symbol,
        expiration: "2026-08-24",
        side: "call",
        wings: ctx.wings,
      },
      templateId: HEATMAP_TEMPLATE_ID,
      templateVersion: HEATMAP_TEMPLATE_VERSION,
    });
    sock.emit(fullMsg(ctx, ctx.contentHash ?? "h"));
    assert(session.lastTiles, `${label} no tiles`);
    assert(
      tilesHash(session.lastTiles) === tilesHash(current),
      `${label} through-run hash mismatch`,
    );
    ok(`through-run tilesHash ${label} ${tilesHash(current)}`);
    session.dispose();
  }
}

console.log(`TR-P3 ${passed} passed`);
