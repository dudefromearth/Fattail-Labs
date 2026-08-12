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
  const tick = tickPairHonest(newer, older);
  assert(tick != null && tick.dtMs === 300, "tick 0.3s honest");
  const vel = velocityPairHonest(newer, older);
  assert(vel == null, "velocity 0.3s invalid (floor 0.5s)");
}

// Velocity 0.6s ok
{
  const t0 = 1_000_000;
  const older = snap({ receivedAt: t0 });
  const newer = snap({ receivedAt: t0 + 600 });
  assert(velocityPairHonest(newer, older) != null, "velocity 0.6s ok");
  assert(VELOCITY_MIN_DT_MS === 500, "OD-AF3 floor");
  assert(TICK_MAX_DT_MS === 15_000, "OD-AF10");
}

// Max gap tick invalid
{
  const t0 = 1_000_000;
  const older = snap({ receivedAt: t0 });
  const newer = snap({ receivedAt: t0 + 20_000 });
  assert(tickPairHonest(newer, older) == null, "20s > T_max tick invalid");
}

// Non-monotonic asOf reject
{
  const h = new FlySurfaceHistory(8);
  assert(
    h.push(
      snap({
        receivedAt: 1000,
        asOf: "2026-08-12T14:00:00.000Z",
        cells: new Map([[cellKey("call", 100, 20), 1.5]]),
      }),
    ),
    "first push",
  );
  assert(
    !h.push(
      snap({
        receivedAt: 2000,
        asOf: "2026-08-12T13:59:00.000Z",
        cells: new Map([[cellKey("call", 100, 20), 1.6]]),
      }),
    ),
    "non-monotonic reject",
  );
  assert(h.size === 1, "size still 1");
}

// Mixed clock basis invalid
{
  const older = snap({
    receivedAt: 1000,
    asOf: "2026-08-12T14:00:00.000Z",
  });
  const newer = snap({ receivedAt: 2000, asOf: null });
  assert(pairDeltaMs(newer, older) == null, "mixed basis null");
}

// tickDelta d_debit
{
  const h = new FlySurfaceHistory(8);
  h.push(
    snap({
      receivedAt: 1000,
      cells: new Map([[cellKey("call", 100, 20), 2.0]]),
    }),
  );
  const live = snap({
    receivedAt: 1000 + 1000,
    cells: new Map([[cellKey("call", 100, 20), 2.5]]),
  });
  const t = h.tickDelta(live, "call", 100, 20);
  assert(t != null && Math.abs(t.dD - 0.5) < 1e-9, "dD 0.5");
}

// pct floor constant
assert(PCT_CHANGE_D_MIN === 0.05, "D_min");

// Seam clears
{
  const h = new FlySurfaceHistory(4);
  h.push(snap({ receivedAt: 1, cells: new Map() }));
  h.seam();
  assert(h.size === 0, "seam clears");
}

console.log("ok  flySurfaceHistory AT-AF17 / P-B2 / AF10 helpers");
