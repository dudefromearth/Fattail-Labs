/**
 *   npx --yes tsx lib/options-lab/templates/flySurfaceHistory.test.ts
 */
import {
  FlySurfaceHistory,
  PCT_CHANGE_D_MIN,
  TICK_MAX_DT_MS,
  VELOCITY_MIN_DT_MS,
  cellKey,
  pairDeltaMs,
  sameGeneration,
  tickPairHonest,
  velocityPairHonest,
  type DebitGridSnap,
} from "./flySurfaceHistory";

function assert(c: unknown, m: string) {
  if (!c) throw new Error(`FAIL: ${m}`);
}

function snap(
  partial: Partial<DebitGridSnap> & { receivedAt: number },
): DebitGridSnap {
  return {
    asOf: partial.asOf ?? null,
    contentHash: partial.contentHash ?? null,
    receivedAt: partial.receivedAt,
    cells: partial.cells ?? new Map(),
  };
}

// AT-AF17 / P-B2: 0.3s tick valid, velocity invalid
{
  const t0 = 1_000_000;
  const older = snap({ receivedAt: t0, asOf: null });
  const newer = snap({ receivedAt: t0 + 300, asOf: null });
  assert(tickPairHonest(newer, older) != null, "tick 0.3s honest");
  assert(velocityPairHonest(newer, older) == null, "velocity 0.3s invalid");
}

// Velocity 0.6s ok
{
  const t0 = 1_000_000;
  assert(
    velocityPairHonest(
      snap({ receivedAt: t0 + 600 }),
      snap({ receivedAt: t0 }),
    ) != null,
    "velocity 0.6s ok",
  );
  assert(VELOCITY_MIN_DT_MS === 500, "OD-AF3 floor");
  assert(TICK_MAX_DT_MS === 15_000, "OD-AF10");
}

// Equal asOf → receivedAt fallback
{
  const asOf = "2026-08-12T15:00:00.000Z";
  const older = snap({ asOf, receivedAt: 1000, contentHash: "a" });
  const newer = snap({ asOf, receivedAt: 3000, contentHash: "b" });
  const p = pairDeltaMs(newer, older);
  assert(p != null && p.basis === "receivedAt" && p.dtMs === 2000, "asOf equal uses receivedAt");
}

// previousFor skips same generation (post-push re-paint)
{
  const h = new FlySurfaceHistory(8);
  const k = cellKey("call", 100, 20);
  h.push(
    snap({
      receivedAt: 1000,
      contentHash: "genA",
      cells: new Map([[k, 2.0]]),
    }),
  );
  h.push(
    snap({
      receivedAt: 4000,
      contentHash: "genB",
      cells: new Map([[k, 2.5]]),
    }),
  );
  const live = snap({
    receivedAt: 4000,
    contentHash: "genB",
    cells: new Map([[k, 2.5]]),
  });
  assert(sameGeneration(live, h.peek(0)!), "live matches newest");
  const prev = h.previousFor(live);
  assert(prev != null && prev.contentHash === "genA", "lag is genA not genB");
  const t = h.tickDelta(live, "call", 100, 20);
  assert(t != null && Math.abs(t.dD - 0.5) < 1e-9, `dD after push same gen ${t?.dD}`);
  const vel = h.velocityDelta(live, "call", 100, 20);
  assert(vel != null && vel.dtMs === 3000, "velocity uses lag genA (3s)");
}

// Non-monotonic reverse asOf reject
{
  const h = new FlySurfaceHistory(8);
  assert(
    h.push(
      snap({
        receivedAt: 1000,
        asOf: "2026-08-12T14:00:00.000Z",
        contentHash: "a",
      }),
    ),
    "first push",
  );
  assert(
    !h.push(
      snap({
        receivedAt: 2000,
        asOf: "2026-08-12T13:59:00.000Z",
        contentHash: "b",
      }),
    ),
    "reverse asOf reject",
  );
}

// Idempotent same-hash push
{
  const h = new FlySurfaceHistory(4);
  const k = cellKey("call", 1, 5);
  h.push(
    snap({
      receivedAt: 1,
      contentHash: "x",
      cells: new Map([[k, 1]]),
    }),
  );
  assert(
    h.push(
      snap({
        receivedAt: 2,
        contentHash: "x",
        cells: new Map([[k, 1.2]]),
      }),
    ),
    "same hash ok",
  );
  assert(h.size === 1, "no double slot");
  assert(h.debitAt("call", 1, 5, 0) === 1.2, "cells refreshed");
}

assert(PCT_CHANGE_D_MIN === 0.05, "D_min");

console.log("ok  flySurfaceHistory lag-skip + pair clocks");
