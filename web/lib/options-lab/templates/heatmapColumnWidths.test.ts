/**
 * XS2 heatmap column resolver.
 *   npx --yes tsx lib/options-lab/templates/heatmapColumnWidths.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { contractKey, type LadderRow } from "@/lib/chainLadderApi";
import { coerceSymbolProfile } from "@/lib/market/symbolProfile";
import { paintCurrentHeatmap } from "@/lib/runner/templates/heatmap";
import { FLY_MAX_WIDTHS } from "./flySurfacePipeline";
import {
  heatmapColumnWidths,
  heatmapProfileLine,
  heatmapWidthList,
  HEATMAP_FLY_WIDTHS,
  heatmapFlyWidths,
  XSP_SPY_FLY_WIDTHS,
} from "./heatmapColumnWidths";
import type { ChainContext } from "./types";

const here = dirname(fileURLToPath(import.meta.url));
const helperSrc = readFileSync(join(here, "heatmapColumnWidths.ts"), "utf8");
const panelSrc = readFileSync(
  join(here, "../../../components/options-lab/HeatmapChainPanel.tsx"),
  "utf8",
);

let n = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    n += 1;
    console.log(`  ok  ${name}`);
  } catch (e) {
    console.error(`  FAIL ${name}`);
    throw e;
  }
}

const SPX_CLASS = [10, 15, 20, 25, 30, 35, 40, 45, 50];
const XSP_FALLBACK = [1, 2, 3, 4, 5, 6, 7];
const UNIVERSE_1_7 = {
  source: "market_symbol_universe" as const,
  fly_width_mode: "fixed_points" as const,
  fly_widths: [1, 2, 3, 4, 5, 6, 7],
};

test("AT-XS7 universe overlay 1–7", () => {
  assert.deepEqual(
    heatmapColumnWidths({ symbol: "XSP", profile: UNIVERSE_1_7 }),
    XSP_FALLBACK,
  );
});

test("AT-XS7b coerced kind-default XSP/SPY → [1..7], not kind ladder", () => {
  const xsp = coerceSymbolProfile(null, "XSP", "index");
  assert.equal(xsp.source, "client_kind_default");
  assert.deepEqual(xsp.fly_widths, [20, 25, 30, 35, 40, 45, 50]);
  assert.deepEqual(
    heatmapColumnWidths({ symbol: "XSP", profile: xsp }),
    XSP_FALLBACK,
  );
  const spy = coerceSymbolProfile(null, "SPY", "etf");
  assert.equal(spy.source, "client_kind_default");
  assert.deepEqual(spy.fly_widths, [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(
    heatmapColumnWidths({ symbol: "SPY", profile: spy }),
    XSP_FALLBACK,
  );
});

test("AT-XS7c interior overlay [1,2,3] — profile is SoR, not the constant", () => {
  assert.deepEqual(
    heatmapColumnWidths({
      symbol: "XSP",
      profile: {
        source: "market_symbol_universe",
        fly_width_mode: "fixed_points",
        fly_widths: [1, 2, 3],
      },
    }),
    [1, 2, 3],
  );
});

test("AT-XS7d overlay [1..8] is not clamped to 7", () => {
  assert.deepEqual(
    heatmapColumnWidths({
      symbol: "XSP",
      profile: {
        source: "market_symbol_universe",
        fly_width_mode: "fixed_points",
        fly_widths: [1, 2, 3, 4, 5, 6, 7, 8],
      },
    }),
    [1, 2, 3, 4, 5, 6, 7, 8],
  );
});

test("AT-XS7e coerce of universe-shaped XSP payload keeps source", () => {
  const coerced = coerceSymbolProfile(
    {
      symbol: "XSP",
      kind: "index",
      source: "market_symbol_universe",
      fly_width_mode: "fixed_points",
      fly_widths: [1, 2, 3, 4, 5, 6, 7],
    },
    "XSP",
    "index",
  );
  assert.equal(coerced.source, "market_symbol_universe");
  assert.deepEqual(
    heatmapColumnWidths({ symbol: "XSP", profile: coerced }),
    XSP_FALLBACK,
  );
});

function stubCtx(
  symbol: string,
  columnWidths?: number[],
): ChainContext {
  const contracts = new Map<string, LadderRow>();
  for (const side of ["call", "put"] as const) {
    for (let k = 100; k <= 110; k += 1) {
      contracts.set(contractKey(side, k), {
        strike: k,
        side,
        mid: 1,
        bid: 0.9,
        ask: 1.1,
      } as LadderRow);
    }
  }
  return {
    symbol,
    viewSide: "call",
    spot: 105,
    strikeStep: 1,
    wings: 25,
    contracts,
    asOf: "2026-09-13T15:00:00.000Z",
    contentHash: "xs2-7f",
    columnWidths,
  };
}

test("AT-XS7f runner cols[].widthPts equals panel flyWidths (OD-XS10)", () => {
  const flyWidths = heatmapColumnWidths({
    symbol: "XSP",
    profile: UNIVERSE_1_7,
  });
  const tiles = paintCurrentHeatmap(stubCtx("XSP", flyWidths));
  assert.deepEqual(
    tiles.cols.map((c) => c.widthPts),
    flyWidths,
  );
  assert.notDeepEqual(
    tiles.cols.map((c) => c.widthPts),
    [...HEATMAP_FLY_WIDTHS],
  );
  const missing = paintCurrentHeatmap(stubCtx("XSP"));
  assert.deepEqual(missing.cols, []);
  const empty = paintCurrentHeatmap(stubCtx("XSP", []));
  assert.deepEqual(empty.cols, []);
});

test("AT-XS8 SPX and heatmapFlyWidths stay 10…50", () => {
  assert.deepEqual(heatmapColumnWidths({ symbol: "SPX" }), SPX_CLASS);
  assert.deepEqual(heatmapFlyWidths(), SPX_CLASS);
  assert.deepEqual([...HEATMAP_FLY_WIDTHS], SPX_CLASS);
});

test("AT-XS8b NDX/RUT/VIX known-good; QQQ/IWM/AAPL deferred-defect freeze", () => {
  for (const symbol of ["NDX", "RUT", "VIX", "QQQ", "IWM", "AAPL"]) {
    assert.deepEqual(
      heatmapColumnWidths({ symbol }),
      SPX_CLASS,
      symbol,
    );
  }
});

test("AT-XS13 FLY_MAX_WIDTHS cap ≥ 9", () => {
  assert.ok(FLY_MAX_WIDTHS >= 9);
  assert.equal(
    FLY_MAX_WIDTHS,
    Math.max(HEATMAP_FLY_WIDTHS.length, XSP_SPY_FLY_WIDTHS.length),
  );
});

test("AT-XS17 profileLine universe vs kind default", () => {
  const overlay = heatmapProfileLine({
    strikeStep: 1,
    flyWidths: XSP_FALLBACK,
    source: "market_symbol_universe",
    kind: "index",
  });
  const kindDefault = heatmapProfileLine({
    strikeStep: 1,
    flyWidths: XSP_FALLBACK,
    source: "client_kind_default",
    kind: "index",
  });
  assert.match(overlay, /· universe/);
  assert.match(kindDefault, /· kind default/);
  assert.notEqual(overlay, kindDefault);
  assert.match(overlay, /widths 1–7/);
  assert.match(kindDefault, /widths 1–7/);
  assert.equal(
    overlay,
    "Profile · step 1 · widths 1–7 · universe · index",
  );
  assert.equal(
    kindDefault,
    "Profile · step 1 · widths 1–7 · kind default · index",
  );
});

test("AT-XS18 empty flyWidths never interpolates undefined", () => {
  const line = heatmapProfileLine({
    strikeStep: 1,
    flyWidths: [],
    source: "market_symbol_universe",
    kind: "index",
  });
  assert.equal(
    line,
    "Profile · step 1 · widths — (no column list) · universe · index",
  );
  assert.doesNotMatch(line, /undefined/);
});

test("AT-XS19 SPX chrome appends source token", () => {
  const line = heatmapProfileLine({
    strikeStep: 5,
    flyWidths: SPX_CLASS,
    source: "market_symbol_universe",
    kind: "index",
  });
  assert.equal(
    line,
    "Profile · step 5 · widths 10–50 · universe · index",
  );
});

test("AT-XS20 TESTSYM universe overlay — no XSP||SPY branch", () => {
  assert.deepEqual(
    heatmapColumnWidths({
      symbol: "TESTSYM",
      profile: {
        source: "market_symbol_universe",
        fly_width_mode: "fixed_points",
        fly_widths: [2, 4, 6],
      },
    }),
    [2, 4, 6],
  );
  const overlayFn = helperSrc.slice(
    helperSrc.indexOf("function universeFixedPoints"),
    helperSrc.indexOf("export function heatmapColumnWidths"),
  );
  assert.doesNotMatch(overlayFn, /XSP/);
  assert.doesNotMatch(overlayFn, /SPY/);
});

test("AT-XS21 TESTSYM kind-default equity → 10…50", () => {
  const profile = coerceSymbolProfile(null, "TESTSYM", "equity");
  assert.deepEqual(
    heatmapColumnWidths({ symbol: "TESTSYM", profile }),
    SPX_CLASS,
  );
});

test("empty universe overlay fails loud (no substitute)", () => {
  assert.deepEqual(
    heatmapColumnWidths({
      symbol: "XSP",
      profile: {
        source: "market_symbol_universe",
        fly_width_mode: "fixed_points",
        fly_widths: [],
      },
    }),
    [],
  );
});

test("heatmapFlyWidths identity unchanged", () => {
  const a = heatmapFlyWidths();
  const b = heatmapFlyWidths(5, 8);
  assert.deepEqual(a, [...HEATMAP_FLY_WIDTHS]);
  assert.deepEqual(b, [...HEATMAP_FLY_WIDTHS]);
  assert.notEqual(a, HEATMAP_FLY_WIDTHS);
});

test("widthList honors fixedPoints then columnWidths then helper", () => {
  const ctx = stubCtx("XSP", [9, 11]);
  assert.deepEqual(
    heatmapWidthList(ctx, {
      widthMode: "fixed_points",
      fixedPoints: [1, 2, 3],
    }),
    [1, 2, 3],
  );
  assert.deepEqual(
    heatmapWidthList(ctx, { widthMode: "msc_default" }),
    [9, 11],
  );
  assert.deepEqual(
    heatmapWidthList(stubCtx("XSP"), { widthMode: "msc_default" }),
    XSP_FALLBACK,
  );
  assert.deepEqual(
    heatmapWidthList(stubCtx("XSP", []), { widthMode: "msc_default" }),
    [],
  );
});

test("AT-XS15 panel ingestKey includes symbol; lastIngestRef skip", () => {
  assert.match(
    panelSrc,
    /\$\{bus\.hash\}\|\$\{symbol\}\|\$\{side\}\|\$\{ingestMode\}\|\$\{flyWidths\.join/,
  );
  assert.match(
    panelSrc,
    /lastIngestRef = useRef<\{ hash: string; symbol: string \}/,
  );
  assert.match(panelSrc, /symbol !== last\.symbol &&/);
  assert.match(panelSrc, /bus\.hash === last\.hash/);
  assert.match(panelSrc, /heatmapProfileLine\(/);
  assert.match(panelSrc, /lastIngestRef\.current\?\.symbol === symbol/);
});

console.log(`ok  heatmapColumnWidths ${n} tests`);
