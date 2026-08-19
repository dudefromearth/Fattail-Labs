/**
 * Local Analyzer sheet — generation IVs only, no /resolve.
 *
 *   npx --yes tsx lib/options-lab/localBookCurves.test.ts
 */

import {
  LOCAL_CURVE_STEPS,
  LOCAL_ENGINE_ID,
  listedIvFromRow,
  resolveLocalBookCurves,
} from "./localBookCurves";
import type { OpfGenerationIn } from "./opfPricingApi";
import type { ParsedTosTrade } from "./tosParser";
import { nyDateTimeToUtcMs } from "../risk-graph/surfaceTimeAxis";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

let n = 0;
function test(name: string, fn: () => void) {
  fn();
  n += 1;
  console.log(`  ok  ${name}`);
}

function trade(over: Partial<ParsedTosTrade> = {}): ParsedTosTrade {
  return {
    action: "BUY",
    structure: "single",
    symbol: "SPX",
    expiration: "2026-09-18",
    right: "call",
    limit: 2,
    debit: 2,
    isCredit: false,
    strikes: [100],
    width: null,
    body: 100,
    legs: [
      {
        strike: 100,
        quantity: 1,
        right: "call",
        expiration: "2026-09-18",
      },
    ],
    raw: "BUY +1 SPX 100 18 SEP 26 100 CALL @2.00 LMT",
    ...over,
  };
}

function gen(rows: Array<Record<string, unknown>>): OpfGenerationIn {
  return {
    product: "SPX",
    expiration: "2026-09-18",
    wings: 50,
    spot: 100,
    content_hash: "h1",
    rows,
  };
}

console.log("localBookCurves");

test("listed IV: decimal stays, percent 18 → 0.18", () => {
  assert(listedIvFromRow(0.18) === 0.18, "decimal");
  assert(listedIvFromRow(18) === 0.18, "percent");
  assert(listedIvFromRow(null) == null, "null");
  assert(listedIvFromRow(0) == null, "zero is not a listed IV");
});

test("long call: 161 pts, expiry at K is −premium, engine is local", () => {
  const out = resolveLocalBookCurves({
    trade: trade(),
    generations: [
      gen([{ strike: 100, side: "call", iv: 0.2, mid: 2 }]),
    ],
    spot: 100,
  });
  assert(out.ok, "sheet ok");
  if (!out.ok) return;
  const exp = out.result.curves?.expiration?.points ?? [];
  const theo = out.result.curves?.model_t0?.points ?? [];
  assert(exp.length === LOCAL_CURVE_STEPS, "161 expiry");
  assert(theo.length === LOCAL_CURVE_STEPS, "161 t0");
  assert(out.result.meta?.engine_id === LOCAL_ENGINE_ID, "local engine");
  assert(out.result.marks?.leg_marks?.[0]?.iv_source === "generation", "source");
  const atK = exp.reduce((b, p) =>
    Math.abs(p.x - 100) < Math.abs(b.x - 100) ? p : b,
  );
  assert(Math.abs(atK.y - -200) < 1, `expiry at K is −premium*100, got ${atK.y}`);
  const last = exp[exp.length - 1];
  const expected = (Math.max(0, last.x - 100) - 2) * 100;
  assert(
    Math.abs(last.y - expected) < 1,
    `expiry at ${last.x} is (intrinsic−prem)*100, got ${last.y}`,
  );
});

test("missing listed IV is IV NO — no invented smile", () => {
  const out = resolveLocalBookCurves({
    trade: trade(),
    generations: [gen([{ strike: 100, side: "call", mid: 2 }])],
    spot: 100,
  });
  assert(!out.ok, "hole");
  if (!out.ok) assert(out.hole === "IV NO", out.hole);
});

test("strike not on generation is NOT TRADED", () => {
  const out = resolveLocalBookCurves({
    trade: trade(),
    generations: [
      gen([{ strike: 105, side: "call", iv: 0.2, mid: 1 }]),
    ],
    spot: 100,
  });
  assert(!out.ok, "hole");
  if (!out.ok) assert(out.hole === "NOT TRADED", out.hole);
});

test("vol offset moves T+0, not expiration intrinsic", () => {
  const base = resolveLocalBookCurves({
    trade: trade(),
    generations: [
      gen([{ strike: 100, side: "call", iv: 0.2, mid: 2 }]),
    ],
    spot: 100,
  });
  const bumped = resolveLocalBookCurves({
    trade: trade(),
    generations: [
      gen([{ strike: 100, side: "call", iv: 0.2, mid: 2 }]),
    ],
    spot: 100,
    volOffsetPts: 10,
  });
  assert(base.ok && bumped.ok, "both ok");
  if (!base.ok || !bumped.ok) return;
  const mid = Math.floor(LOCAL_CURVE_STEPS / 2);
  const exp0 = base.result.curves!.expiration!.points![mid].y;
  const exp1 = bumped.result.curves!.expiration!.points![mid].y;
  const t0 = base.result.curves!.model_t0!.points![mid].y;
  const t1 = bumped.result.curves!.model_t0!.points![mid].y;
  assert(Math.abs(exp0 - exp1) < 1e-9, "expiry is intrinsic");
  assert(t1 !== t0, "T+0 moves with vol");
});

test("same-strike calendar expiry is front-exp residual, not flat −debit", () => {
  const cal = trade({
    structure: "custom",
    expiration: "2027-06-18",
    strikes: [100],
    legs: [
      { strike: 100, quantity: -1, right: "call", expiration: "2027-06-18" },
      { strike: 100, quantity: 1, right: "call", expiration: "2027-06-19" },
    ],
    raw: "BUY +1 SPX 100 19 JUN 27 100 CALL SELL -1 SPX 100 18 JUN 27 100 CALL",
  });
  const out = resolveLocalBookCurves({
    trade: cal,
    generations: [
      {
        ...gen([{ strike: 100, side: "call", iv: 0.2, mid: 2.0 }]),
        expiration: "2027-06-18",
      },
      {
        product: "SPX",
        expiration: "2027-06-19",
        wings: 50,
        spot: 100,
        content_hash: "h2",
        rows: [{ strike: 100, side: "call", iv: 0.2, mid: 2.4 }],
      },
    ],
    spot: 100,
  });
  assert(out.ok, "calendar sheet ok");
  if (!out.ok) return;
  const exp = out.result.curves?.expiration?.points ?? [];
  const theo = out.result.curves?.model_t0?.points ?? [];
  assert(exp.length === LOCAL_CURVE_STEPS, "161 expiry");
  const ys = exp.map((p) => p.y);
  const span = Math.max(...ys) - Math.min(...ys);
  assert(span > 20, `expiry is not a flat −debit line (span ${span})`);
  const atK = exp.reduce((b, p) =>
    Math.abs(p.x - 100) < Math.abs(b.x - 100) ? p : b,
  );
  const debitFlat = -40;
  assert(
    Math.abs(atK.y - debitFlat) > 5,
    `front-exp at K is residual, not both-dead ${debitFlat}; got ${atK.y}`,
  );
  const t0AtK = theo.reduce((b, p) =>
    Math.abs(p.x - 100) < Math.abs(b.x - 100) ? p : b,
  );
  assert(Math.abs(t0AtK.y - atK.y) > 1, "T+0 is not the expiration face");
});

test("What-if τ uses 1-minute floor, not fractionalT 1-hour min", () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const src = readFileSync(join(here, "localBookCurves.ts"), "utf8");
  assert(!src.includes('from "@/lib/risk-graph/blackScholes"'), "no fractionalT import");
  assert(src.includes("tauYearsWhatIfAfterElapsed"), "W1 helper");
});

test("AT-TM-13 15:30 0DTE elapsed still moves T+0 vs 15:00", () => {
  const ymd = "2026-08-19";
  const trade0 = trade({
    expiration: ymd,
    legs: [{ strike: 100, quantity: 1, right: "call", expiration: ymd }],
  });
  const gens = [
    {
      product: "SPX",
      expiration: ymd,
      wings: 50,
      spot: 100,
      content_hash: "h1",
      rows: [{ strike: 100, side: "call", iv: 0.2, mid: 2 }],
    },
  ];
  const a = resolveLocalBookCurves({
    trade: trade0,
    generations: gens,
    spot: 100,
    nowMs: nyDateTimeToUtcMs(ymd, 15, 0),
  });
  const b = resolveLocalBookCurves({
    trade: trade0,
    generations: gens,
    spot: 100,
    nowMs: nyDateTimeToUtcMs(ymd, 15, 30),
  });
  assert(a.ok && b.ok, "both ok");
  if (!a.ok || !b.ok) return;
  const tauA = Number(a.result.meta?.tau_by_leg?.call_100_2026_08_19 ?? Object.values(a.result.meta?.tau_by_leg ?? {})[0]);
  const tauB = Number(b.result.meta?.tau_by_leg?.call_100_2026_08_19 ?? Object.values(b.result.meta?.tau_by_leg ?? {})[0]);
  assert(tauA > tauB, `15:00 τ ${tauA} vs 15:30 ${tauB}`);
  const hourFloor = 1 / (365 * 24);
  assert(tauB < hourFloor, `15:30 τ must be below 1-hour floor, got ${tauB}`);
  const mid = Math.floor(LOCAL_CURVE_STEPS / 2);
  const t0a = a.result.curves!.model_t0!.points![mid].y;
  const t0b = b.result.curves!.model_t0!.points![mid].y;
  assert(t0a !== t0b, "T+0 moves in the last hour");
});

test("keep-warm hook does not POST /resolve", () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const src = readFileSync(join(here, "useOpfRiskGraph.ts"), "utf8");
  assert(!src.includes("resolveOpfPricing"), "no resolveOpfPricing import");
  assert(!src.includes("/api/me/pricing/resolve"), "no resolve URL");
  assert(src.includes("resolveLocalBookCurves"), "local sheet is the path");
});

console.log(`${n} tests passed`);
