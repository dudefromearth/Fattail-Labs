/**
 * AZ-ALGO P4 Trader Feed allowlist.
 *   cd web && npx --yes tsx lib/options-lab/algoReasonFeed.test.ts
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ALGO_FEED_APEX,
  ALGO_FEED_QUIET,
  ALGO_REASON_HOUSE_BASE,
  ALGO_REASON_HOST,
  algoFeedMayInfer,
  algoFeedTape,
  feedPostForbidden,
  localMeasurementPost,
  pickAllowlist,
  quietPost,
} from "./algoReasonFeed";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}
function assertEq(a: unknown, b: unknown, msg: string): void {
  if (a !== b) throw new Error(`FAIL: ${msg}: got ${String(a)} expected ${String(b)}`);
}

let n = 0;
function test(name: string, fn: () => void) {
  fn();
  n += 1;
  console.log(`  ok  ${name}`);
}

console.log("algoP4 feed");

test("allowlist drops model-computed keys", () => {
  const picked = pickAllowlist({
    PaR: 128,
    hold: "yes",
    target: 6100,
    p_profit: 0.4,
    gex_percentile: 85,
    as_of: "10:42",
  });
  assertEq(picked.PaR, 128, "PaR in");
  assertEq(picked.gex_percentile, 85, "gex in");
  assert(picked.hold === undefined, "no hold");
  assert(picked.target === undefined, "no target");
  assert(picked.p_profit === undefined, "no p_profit");
});

test("AT-ALGO-32 no hold/fold/target/probability in posts or house base", () => {
  assertEq(feedPostForbidden(ALGO_REASON_HOUSE_BASE).length, 0, "house base");
  const post = localMeasurementPost({
    asOf: "10:42",
    gexPercentile: 85,
    paR: 128,
    atBody: true,
  });
  assertEq(feedPostForbidden(post.body).length, 0, "local post");
  assert(post.body.includes("85th percentile"), "percentile");
  assert(post.body.includes("as-of 10:42"), "as-of");
  assert(post.body.includes(ALGO_FEED_APEX), "apex phrasing");
  assert(feedPostForbidden("hold this fly").includes("advice"), "hold caught");
  assert(feedPostForbidden("fold now").includes("advice"), "fold caught");
});

test("AT-ALGO-27 house base and templates have no level language", () => {
  const banned = /\b(wall|flip|pin|magnet|support|resistance)\b/i;
  assert(!banned.test(ALGO_REASON_HOUSE_BASE), "house base");
  assert(!banned.test(ALGO_FEED_APEX), "apex");
  const dir = dirname(fileURLToPath(import.meta.url));
  const hud = readFileSync(join(dir, "algoHud.ts"), "utf8");
  assert(!banned.test(hud), "algoHud");
  const panel = readFileSync(
    join(dir, "../../components/options-lab/AlgoReasonFeed.tsx"),
    "utf8",
  );
  assert(!banned.test(panel), "AlgoReasonFeed");
  assert(!panel.includes("TimeOrthoEggPanel"), "NX no egg");
  const az = readFileSync(
    join(dir, "../../components/options-lab/OpfRiskAnalyzer.tsx"),
    "utf8",
  );
  assert(!az.includes("TimeOrthoEggPanel"), "Analyzer does not import egg");
  assert(az.includes("AlgoReasonFeed"), "Feed mounted");
  assert(panel.includes("data-trader-feed="), "host attr");
  assertEq(ALGO_REASON_HOST, "algo-reason", "host id");
});

test("AI only while Managing; fold keeps last tape", () => {
  assertEq(algoFeedMayInfer("armed"), true, "managing");
  assertEq(algoFeedMayInfer("managing"), true, "managing v2");
  assertEq(algoFeedMayInfer("recorded"), false, "fold");
  assertEq(algoFeedMayInfer("waiting"), false, "waiting");
  const last = [localMeasurementPost({ asOf: "10:00", paR: 80 })];
  const fold = algoFeedTape({
    reasonOn: true,
    phase: "recorded",
    asOf: "11:00",
    measurements: { PaR: 144 },
    lastTape: last,
  });
  assertEq(fold, last, "no new inference");
});

test("fail-open: local posts + named AI quiet, never silent empty", () => {
  const tape = algoFeedTape({
    reasonOn: true,
    phase: "armed",
    asOf: "10:42",
    measurements: { PaR: 72, gex_percentile: 40 },
    lastTape: [],
    modelFailed: true,
  });
  assert(tape.length >= 2, "local + quiet");
  assert(tape.some((p) => p.quiet && p.body === ALGO_FEED_QUIET), "named quiet");
  assert(tape.every((p) => p.body.trim().length > 0), "no empty");
  const off = algoFeedTape({
    reasonOn: false,
    phase: "armed",
    asOf: "10:42",
    measurements: {},
    lastTape: [],
  });
  assertEq(off.length, 0, "unmount when Reason off");
});

test("quietPost is named", () => {
  const q = quietPost("10:42");
  assertEq(q.body, "AI quiet", "name");
  assertEq(q.quiet, true, "flag");
});

console.log(`${n} tests passed`);
