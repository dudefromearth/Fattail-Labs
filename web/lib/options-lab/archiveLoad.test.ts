/**
 *   npx --yes tsx lib/options-lab/archiveLoad.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  downsampleLine,
  fidelityPct,
  fillArchiveSlot,
  gensAsSamples,
  mergeCoverageFlags,
  mergeGens,
  snapToGen,
  TM_HOLE_NO_PATH,
} from "./archiveLoad";
import {
  captureToday,
  getTmSlots,
  occupancyDigest,
  resetTmSlotsForTests,
  setArchive,
  subscribeTmSlots,
} from "./tmSlots";
import type { ArchiveGet } from "./archiveApi";
import type { TmTodayGen } from "./tmSlots";

const here = dirname(fileURLToPath(import.meta.url));

function gen(
  t: number,
  hash: string,
  spot: number,
  asOf = "2026-08-28T13:30:00.000Z",
): TmTodayGen {
  return {
    t_ms: t,
    asOf,
    contentHash: hash,
    spot,
    symbol: "SPX",
    expiration: "2026-08-28",
  };
}

resetTmSlotsForTests();

const openMs = Date.parse("2026-08-25T09:30:00-04:00");
const midMs = Date.parse("2026-08-25T12:45:00-04:00");
const closeMs = Date.parse("2026-08-25T16:00:00-04:00");

assert.equal(
  snapToGen(
    {
      captured_at: "2026-08-25T09:30:00-04:00",
      expiration: "2026-08-25",
      generation: { spot: 5801, as_of: "2026-08-25T09:30:00-04:00", content_hash: "a" },
    },
    "SPX",
  )?.t_ms,
  openMs,
);

const merged = mergeGens(
  [gen(openMs, "o", 1, "2026-08-25T09:30:00-04:00"), gen(closeMs, "c", 3, "2026-08-25T16:00:00-04:00")],
  [gen(midMs, "m", 2, "2026-08-25T12:45:00-04:00")],
);
assert.deepEqual(
  merged.map((g) => g.contentHash),
  ["o", "m", "c"],
);
{
  const t = Date.parse("2026-08-27T05:18:31.054662Z");
  const twin = mergeGens(
    [{ ...gen(t, "h", 1), file: "snap-051831054Z.json" }],
    [{ ...gen(t, "h", 1), file: "snap-051831054Z__2.json" }],
  );
  assert.equal(twin.length, 2, "TAP RESTART twins are two holds, not one t_ms");
}
assert.equal(fidelityPct(91, 5800) < 1, true);
assert.equal(fidelityPct(5800, 5800), 1);

const line = downsampleLine(
  [
    { t_ms: 1, spot: 1 },
    { t_ms: 2, spot: 2 },
    { t_ms: 3, spot: 3 },
    { t_ms: 4, spot: 4 },
    { t_ms: 5, spot: 5 },
  ],
  3,
);
assert.ok(line.length <= 3 + 1);
assert.equal(line[0].t_ms, 1);
assert.equal(line[line.length - 1].t_ms, 5);
const srcTs = new Set([1, 2, 3, 4, 5]);
for (const s of line) assert.ok(srcTs.has(s.t_ms), "mini line is a subset of the same gens");

function jsonGet(routes: Record<string, { status?: number; body: unknown; delayMs?: number }>): ArchiveGet {
  return async (url) => {
    const path = url.split("?")[0] ?? url;
    const key =
      Object.keys(routes).find((k) => url.includes(k) || path.endsWith(k)) ?? "";
    const hit = routes[key] ?? routes[url];
    if (!hit) throw new Error(`unmocked ${url}`);
    if (hit.delayMs) await new Promise((r) => setTimeout(r, hit.delayMs));
    return { status: hit.status ?? 200, body: hit.body };
  };
}

async function main() {
{
  const get = jsonGet({
    "/archive/coverage": {
      body: {
        days: [{ date: "2026-08-01", status: "none", books: [{ count: 0 }] }],
      },
    },
  });
  const r = await fillArchiveSlot({ symbol: "SPX", day: "2026-08-01", get });
  assert.equal(r.hole, TM_HOLE_NO_PATH);
  assert.equal(getTmSlots().archive, null, "uncovered date does not occupy archive");
}

resetTmSlotsForTests();
const during: string[] = [];
const archiveTrace: Array<string | null> = [];
const unsub = subscribeTmSlots(() => {
  archiveTrace.push(getTmSlots().archive?.day ?? null);
});

captureToday(gen(10, "pre-a", 6400));
captureToday(gen(20, "pre-b", 6401));
assert.equal(occupancyDigest().todayCount, 2);

const getWhole = jsonGet({
  "/archive/coverage": {
    body: {
      days: [
        {
          date: "2026-08-25",
          status: "rth_complete",
          books: [{ count: 3, status: "rth_complete" }],
        },
      ],
    },
  },
  "/archive/fetch": {
    delayMs: 40,
    body: {
      count_on_disk: 3,
      k: 1,
      hash: "d1",
      snaps: [
        {
          captured_at: "2026-08-25T09:30:00-04:00",
          expiration: "2026-08-25",
          generation: {
            spot: 5801,
            as_of: "2026-08-25T09:30:00-04:00",
            content_hash: "open",
          },
        },
        {
          captured_at: "2026-08-25T16:00:00-04:00",
          expiration: "2026-08-25",
          generation: {
            spot: 5802,
            as_of: "2026-08-25T16:00:00-04:00",
            content_hash: "close",
          },
        },
      ],
    },
  },
});

const fetchImpl: ArchiveGet = async (url, signal) => {
  if (url.includes("/archive/fetch") && url.includes("level=0")) {
    captureToday(gen(30, "during-coarse", 6402));
    during.push("during-coarse");
  }
  if (url.includes("/archive/fetch") && url.includes("level=1")) {
    captureToday(gen(40, "during-infill", 6403));
    during.push("during-infill");
  }
  return getWhole(url, signal);
};

let coarseSpan: number[] = [];
setArchive({ day: "2026-08-25", gens: [] });
const filled = await fillArchiveSlot({
  symbol: "SPX",
  day: "2026-08-25",
  get: fetchImpl,
  onCoarse: (gens) => {
    coarseSpan = gens.map((g) => g.t_ms);
    setArchive({ day: "2026-08-25", gens });
    captureToday(gen(35, "after-coarse", 6402.5));
  },
  onInfill: (gens) => {
    setArchive({ day: "2026-08-25", gens });
  },
});
unsub();

assert.equal(filled.hole, null);
assert.equal(coarseSpan[0], openMs, "coarse lands session open, not a prefix");
assert.equal(coarseSpan[coarseSpan.length - 1], closeMs, "coarse lands session close");
assert.ok(
  gensAsSamples(filled.gens)[0].t_ms === openMs &&
    gensAsSamples(filled.gens).at(-1)?.t_ms === closeMs,
  "walk domain is the whole session from the coarse pass",
);

const occ = occupancyDigest();
assert.equal(occ.archiveDay, "2026-08-25");
assert.ok(occ.todayCount >= 5, `today still filling, got ${occ.todayCount}`);
assert.deepEqual(
  occ.todayHashes,
  ["pre-a", "pre-b", "during-coarse", "after-coarse", "during-infill"],
  "today cache is continuous across the archive load — no hole",
);
assert.ok(archiveTrace.includes("2026-08-25"));
assert.ok(during.includes("during-coarse"));
assert.ok(during.includes("during-infill"));

resetTmSlotsForTests();
captureToday(gen(1, "keep", 1));
setTimeout(() => {}, 0);
const switchTrace: Array<string | null> = [];
const unsub2 = subscribeTmSlots(() => switchTrace.push(getTmSlots().archive?.day ?? null));
const getA = jsonGet({
  "/archive/coverage": {
    body: {
      days: [
        { date: "2026-08-25", status: "rth_complete", books: [{ count: 1 }] },
        { date: "2026-08-24", status: "rth_complete", books: [{ count: 1 }] },
      ],
    },
  },
  "/archive/fetch": {
    body: {
      count_on_disk: 1,
      k: 0,
      snaps: [
        {
          captured_at: "2026-08-25T09:30:00-04:00",
          generation: {
            spot: 1,
            as_of: "2026-08-25T09:30:00-04:00",
            content_hash: "x",
          },
        },
      ],
    },
  },
});
await fillArchiveSlot({
  symbol: "SPX",
  day: "2026-08-25",
  get: getA,
  onCoarse: (gens) => setArchive({ day: "2026-08-25", gens }),
});
const getB: ArchiveGet = async (url, signal) => {
  if (url.includes("2026-08-24") && url.includes("coverage")) {
    return {
      status: 200,
      body: {
        days: [{ date: "2026-08-24", status: "rth_complete", books: [{ count: 1 }] }],
      },
    };
  }
  if (url.includes("2026-08-24") && url.includes("fetch")) {
    return {
      status: 200,
      body: {
        count_on_disk: 1,
        k: 0,
        snaps: [
          {
            captured_at: "2026-08-24T09:30:00-04:00",
            generation: {
              spot: 2,
              as_of: "2026-08-24T09:30:00-04:00",
              content_hash: "y",
            },
          },
        ],
      },
    };
  }
  return getA(url, signal);
};
await fillArchiveSlot({
  symbol: "SPX",
  day: "2026-08-24",
  get: getB,
  onCoarse: (gens) => setArchive({ day: "2026-08-24", gens }),
});
unsub2();
assert.ok(
  switchTrace.includes("2026-08-25") &&
    switchTrace.includes(null) &&
    switchTrace.includes("2026-08-24"),
  `switch discards first: ${JSON.stringify(switchTrace)}`,
);
assert.equal(getTmSlots().archive?.day, "2026-08-24");
assert.equal(getTmSlots().today?.gens[0].contentHash, "keep", "today survives the switch");

const analyzer = readFileSync(
  join(here, "../../components/options-lab/OpfRiskAnalyzer.tsx"),
  "utf8",
);
assert.doesNotMatch(analyzer, /fetchAlgoReplayPath/, "past-day walk is not algo-replay path");
assert.doesNotMatch(analyzer, /ohlc_1m/, "no 1-minute source on the Analyzer walk");
assert.doesNotMatch(analyzer, /algo-replay\/path/, "no 1-minute path URL");
assert.match(analyzer, /useTimeMachineHost/, "Analyzer hosts TM from the shared host");
const host = readFileSync(join(here, "tmHost.ts"), "utf8");
assert.match(host, /fillArchiveSlot/, "shared host consumes SO-AR");

const loadSrc = readFileSync(join(here, "archiveLoad.ts"), "utf8");
assert.doesNotMatch(loadSrc, /ohlc/i);
assert.doesNotMatch(loadSrc, /1-minute|1m_|algo-replay/);
assert.match(loadSrc, /coverageUrl/);
assert.match(loadSrc, /fetchUrl/);
assert.doesNotMatch(
  loadSrc,
  /slice\(0,\s*i\)/,
  "not a left-to-right prefix paint",
);

{
  const mergedFlags = mergeCoverageFlags(null, new Map([["2026-08-26", true]]));
  assert.equal(mergedFlags.get("2026-08-26"), true);
}

{
  const get = jsonGet({
    "/archive/coverage": {
      body: { unreachable: true, days: [] },
    },
    "/archive/fetch": {
      body: {
        count_on_disk: 1,
        k: 0,
        snaps: [
          {
            captured_at: "2026-08-25T09:30:00-04:00",
            expiration: "2026-08-25",
            generation: {
              spot: 5801,
              as_of: "2026-08-25T09:30:00-04:00",
              content_hash: "open",
            },
          },
        ],
      },
    },
  });
  const r = await fillArchiveSlot({ symbol: "SPX", day: "2026-08-25", get });
  assert.equal(r.hole, null, "unreachable coverage is not NO PATH — fetch is the truth");
  assert.equal(r.gens.length, 1);
  assert.notEqual(r.uncovered, true);
}

{
  const ac = new AbortController();
  ac.abort();
  const get: ArchiveGet = async (_url, signal) => {
    if (signal?.aborted) {
      const err = new Error("aborted");
      err.name = "AbortError";
      throw err;
    }
    return { status: 200, body: {} };
  };
  const r = await fillArchiveSlot({
    symbol: "SPX",
    day: "2026-08-25",
    get,
    signal: ac.signal,
  });
  assert.equal(r.hole, null, "abort is not NO PATH");
  assert.equal(r.gens.length, 0);
}

{
  const host = readFileSync(join(here, "tmHost.ts"), "utf8");
  assert.match(host, /mergeCoverageFlags/, "month coverage merges even when prev is null");
  assert.doesNotMatch(
    host,
    /new Map\(view\.coverage\)/,
    "never construct Map from a null coverage",
  );
}

resetTmSlotsForTests();
{
  const host = readFileSync(join(here, "tmHost.ts"), "utf8");
  const load = readFileSync(join(here, "archiveLoad.ts"), "utf8");
  assert.doesNotMatch(load, /seedTodayFromSession/, "seedTodayFromSession disposed");
  assert.doesNotMatch(host, /seedTodayFromSession/, "host does not call seedTodayFromSession");
  assert.doesNotMatch(host, /engageTodayFromCache/, "today walk is loadTmDay + fillArchiveSlot");
  assert.match(host, /fillArchiveSlot/, "one path");
  assert.match(
    host,
    /hold-resident/,
    "C11 watch posts resident bytes after a completed hold",
  );
}

const apiSrc = readFileSync(join(here, "archiveApi.ts"), "utf8");
assert.doesNotMatch(apiSrc, /algo-replay\/path/);
assert.match(apiSrc, /options-lab\/archive/);

console.log("archiveLoad.test.ts ok");
}

void main();
