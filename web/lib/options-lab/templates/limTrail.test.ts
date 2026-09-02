/**
 * LIM AT-LIM13 · 14 · 15 · 25 — trail. Injected clock only (G2).
 *   npx --yes tsx lib/options-lab/templates/limTrail.test.ts
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  LIM_TRAIL_GHOST_SIZE,
  computeLimTransition,
  createLimTrail,
  tradingDateFromAsOf,
  type LimTrailIdentity,
  type LimTrailSample,
} from "./limTrail";

function assert(c: unknown, m: string): void {
  if (!c) throw new Error(`FAIL: ${m}`);
}

const INTERVAL_S = 30;
const WINDOW_MIN = 45;
const STEP = INTERVAL_S * 1000;

function clock() {
  let t = 0;
  return {
    now: () => t,
    set: (n: number) => {
      t = n;
    },
    add: (ms: number) => {
      t += ms;
    },
  };
}

function id(
  over: Partial<LimTrailIdentity> = {},
): LimTrailIdentity {
  return {
    symbol: "I:SPX",
    expiration: "2026-09-04",
    asOf: "2026-09-02T14:30:00.000Z",
    ...over,
  };
}

function dist(
  a: { xUnclamped: number; y: number },
  b: { xUnclamped: number; y: number },
): number {
  return Math.hypot(a.xUnclamped - b.xUnclamped, a.y - b.y);
}

function spacing(ghosts: Array<{ xUnclamped: number; y: number }>): number {
  if (ghosts.length < 2) return 0;
  let s = 0;
  for (let i = 1; i < ghosts.length; i++) s += dist(ghosts[i - 1], ghosts[i]);
  return s / (ghosts.length - 1);
}

function fill(
  trail: ReturnType<typeof createLimTrail>,
  clk: ReturnType<typeof clock>,
  n: number,
  sample: (i: number) => LimTrailSample,
  identity: LimTrailIdentity = id(),
): void {
  trail.observe(sample(0), identity);
  for (let i = 1; i <= n; i++) {
    clk.add(STEP);
    trail.observe(sample(i), identity);
  }
}

// --- G1: asOf prefix, no TZ ---
assert(tradingDateFromAsOf("2026-09-02T14:30:00.000Z") === "2026-09-02", "G1 ISO Z");
assert(tradingDateFromAsOf("2026-09-02T19:00:00-04:00") === "2026-09-02", "G1 offset as written");
assert(tradingDateFromAsOf("2026-09-03") === "2026-09-03", "G1 date only");
assert(tradingDateFromAsOf(null) === null, "G1 null");
assert(tradingDateFromAsOf("1693650000") === null, "G1 non-ISO → no date, no TZ parse");

{
  const src = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "limTrail.ts"),
    "utf8",
  );
  assert(!src.includes("Date" + ".parse"), "G1 no Date.parse");
  assert(!src.includes("America/" + "New_York"), "G1 no TZ constant");
  assert(!/\byUnclamped\b/.test(src), "E8 no y twin in trail");
  assert(!src.includes("setTimeout") && !src.includes("setInterval"), "G2 no timers");
}

// --- arm: first observe emits nothing (live dot is not a ghost) ---
{
  const clk = clock();
  const trail = createLimTrail({
    intervalS: INTERVAL_S,
    windowMin: WINDOW_MIN,
    now: clk.now,
  });
  const g = trail.observe({ xUnclamped: 10, y: 50 }, id());
  assert(g.length === 0, "first observe arms, no ghost");
}

// --- no distance emission ---
{
  const clk = clock();
  const trail = createLimTrail({
    intervalS: INTERVAL_S,
    windowMin: WINDOW_MIN,
    now: clk.now,
  });
  trail.observe({ xUnclamped: 0, y: 50 }, id());
  clk.add(1000);
  const g = trail.observe({ xUnclamped: 80, y: 10 }, id());
  assert(g.length === 0, "LIM20: 1s + huge move does not emit");
}

// --- AT-LIM13: xUnclamped past the plane edge ---
{
  const clk = clock();
  const trail = createLimTrail({
    intervalS: INTERVAL_S,
    windowMin: WINDOW_MIN,
    now: clk.now,
  });
  fill(trail, clk, 3, () => ({ xUnclamped: 300, y: 40 }));
  const g = trail.ghosts();
  assert(g.length === 3, "AT-LIM13 three ghosts");
  assert(
    g.every((p) => p.xUnclamped === 300 && p.y === 40),
    "AT-LIM13 records xUnclamped 300 not clamped 100",
  );
  assert(
    g.every((p) => p.size === LIM_TRAIL_GHOST_SIZE),
    "uniform size",
  );
  assert(!("yUnclamped" in g[0]), "AT-LIM13 no y twin");
}

// --- AT-LIM14: held still → clustered ---
{
  const clk = clock();
  const trail = createLimTrail({
    intervalS: INTERVAL_S,
    windowMin: WINDOW_MIN,
    now: clk.now,
  });
  fill(trail, clk, 6, () => ({ xUnclamped: 10, y: 50 }));
  const g = trail.ghosts();
  assert(g.length === 6, "AT-LIM14 six ghosts");
  assert(spacing(g) === 0, "AT-LIM14 cluster spacing 0");
}

// --- AT-LIM15: moved fast → spread ---
{
  const clk = clock();
  const trail = createLimTrail({
    intervalS: INTERVAL_S,
    windowMin: WINDOW_MIN,
    now: clk.now,
  });
  fill(trail, clk, 6, (i) => ({ xUnclamped: i * 20, y: 50 }));
  const g = trail.ghosts();
  assert(g.length === 6, "AT-LIM15 six ghosts");
  assert(spacing(g) === 20, "AT-LIM15 spread spacing 20");
}

// AT-LIM14 vs 15 on the same clock grammar
{
  const held = spacing(
    (() => {
      const clk = clock();
      const trail = createLimTrail({
        intervalS: INTERVAL_S,
        windowMin: WINDOW_MIN,
        now: clk.now,
      });
      fill(trail, clk, 5, () => ({ xUnclamped: -40, y: 60 }));
      return trail.ghosts();
    })(),
  );
  const moved = spacing(
    (() => {
      const clk = clock();
      const trail = createLimTrail({
        intervalS: INTERVAL_S,
        windowMin: WINDOW_MIN,
        now: clk.now,
      });
      fill(trail, clk, 5, (i) => ({ xUnclamped: -40 + i * 25, y: 60 + i * 5 }));
      return trail.ghosts();
    })(),
  );
  assert(held === 0 && moved > held, "AT-LIM14 cluster < AT-LIM15 spread");
}

// --- AT-LIM25 expiration — first frame empty, own case ---
{
  const clk = clock();
  const trail = createLimTrail({
    intervalS: INTERVAL_S,
    windowMin: WINDOW_MIN,
    now: clk.now,
  });
  fill(trail, clk, 4, () => ({ xUnclamped: 12, y: 55 }), id());
  assert(trail.ghosts().length === 4, "AT-LIM25 exp: buffer occupied");
  clk.add(STEP);
  const g = trail.observe(
    { xUnclamped: 12, y: 55 },
    id({ expiration: "2026-09-11" }),
  );
  assert(g.length === 0, "AT-LIM25 expiration: first frame empty");
  assert(trail.ghosts().length === 0, "AT-LIM25 expiration: buffer empty");
}

// --- AT-LIM25 symbol — first frame empty, own case ---
{
  const clk = clock();
  const trail = createLimTrail({
    intervalS: INTERVAL_S,
    windowMin: WINDOW_MIN,
    now: clk.now,
  });
  fill(trail, clk, 4, () => ({ xUnclamped: 12, y: 55 }), id());
  clk.add(STEP);
  const g = trail.observe(
    { xUnclamped: 12, y: 55 },
    id({ symbol: "I:NDX" }),
  );
  assert(g.length === 0, "AT-LIM25 symbol: first frame empty");
  assert(trail.ghosts().length === 0, "AT-LIM25 symbol: buffer empty");
}

// --- AT-LIM25 session (asOf date) — first frame empty, own case ---
{
  const clk = clock();
  const trail = createLimTrail({
    intervalS: INTERVAL_S,
    windowMin: WINDOW_MIN,
    now: clk.now,
  });
  fill(trail, clk, 4, () => ({ xUnclamped: 12, y: 55 }), id());
  clk.add(1000);
  const sameDay = trail.observe(
    { xUnclamped: 99, y: 10 },
    id({ asOf: "2026-09-02T20:00:00.000Z" }),
  );
  assert(sameDay.length === 4, "same UTC date is not a session change");
  clk.add(STEP);
  const g = trail.observe(
    { xUnclamped: 12, y: 55 },
    id({ asOf: "2026-09-03T00:05:00.000Z" }),
  );
  assert(g.length === 0, "AT-LIM25 session: first frame empty");
  assert(trail.ghosts().length === 0, "AT-LIM25 session: buffer empty");
}

// after reset, next interval may emit for the new identity
{
  const clk = clock();
  const trail = createLimTrail({
    intervalS: INTERVAL_S,
    windowMin: WINDOW_MIN,
    now: clk.now,
  });
  fill(trail, clk, 3, () => ({ xUnclamped: 1, y: 50 }), id());
  clk.add(STEP);
  trail.observe({ xUnclamped: 1, y: 50 }, id({ symbol: "I:NDX" }));
  clk.add(STEP);
  const g = trail.observe({ xUnclamped: 8, y: 70 }, id({ symbol: "I:NDX" }));
  assert(g.length === 1, "new identity emits after one interval");
  assert(g[0].xUnclamped === 8 && g[0].y === 70, "new identity sample");
}

// window prune (45 min) against injected clock, not wall time
{
  const clk = clock();
  const trail = createLimTrail({
    intervalS: INTERVAL_S,
    windowMin: WINDOW_MIN,
    now: clk.now,
  });
  fill(trail, clk, 2, () => ({ xUnclamped: 0, y: 50 }));
  assert(trail.ghosts().length === 2, "window: two ghosts in range");
  clk.add(WINDOW_MIN * 60 * 1000 + 1);
  assert(trail.ghosts().length === 0, "window: aged out on read, no sleep");
}

// opacity by age, uniform size
{
  const clk = clock();
  const trail = createLimTrail({
    intervalS: INTERVAL_S,
    windowMin: WINDOW_MIN,
    now: clk.now,
  });
  fill(trail, clk, 2, () => ({ xUnclamped: 0, y: 50 }));
  const g = trail.ghosts();
  assert(g[0].opacity < g[1].opacity, "older ghost more transparent");
  assert(g[0].size === g[1].size, "size is not the age channel");
}

// LIM22: flag off → null (no chrome)
{
  const hint = computeLimTransition({
    show: false,
    ghosts: [
      { xUnclamped: 20, y: 50, t: 0, size: 1, opacity: 1 },
      { xUnclamped: 10, y: 50, t: 30_000, size: 1, opacity: 1 },
    ],
    driftMinRate: 1,
  });
  assert(hint === null, "LIM22 off → null");
}

{
  const hint = computeLimTransition({
    show: true,
    ghosts: [
      { xUnclamped: 20, y: 50, t: 0, size: 1, opacity: 1 },
      { xUnclamped: 10, y: 50, t: 30_000, size: 1, opacity: 1 },
    ],
    driftMinRate: 1,
  });
  assert(hint != null && hint.boundary === "x0", "LIM22 compute exists when on");
}

console.log("limTrail.test.ts ok");
