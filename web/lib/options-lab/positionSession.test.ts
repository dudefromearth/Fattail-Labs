import assert from "node:assert/strict";
import { closePosition, positionFromInput } from "./analyzerBook";
import {
  defaultSessionEntryAt,
  isPositionClosed,
  isTmPositionDark,
  resolveEntryAt,
} from "./positionSession";
import { nyWallToUtcMs } from "./timeOrthoSession";

{
  const ten = nyWallToUtcMs(2026, 8, 18, 10, 0);
  const open = defaultSessionEntryAt(ten);
  assert.equal(open, nyWallToUtcMs(2026, 8, 18, 9, 30));
}

{
  const pos = positionFromInput({
    underlying: "SPX",
    expiration: "2026-08-18",
    contracts: 1,
    direction: "sell",
    legs: [
      { strike: 5600, type: "put", quantity: 1, side: "short", entry_price: 2 },
      { strike: 5550, type: "put", quantity: 1, side: "long", entry_price: 0.8 },
    ],
  });
  assert.equal(pos.closedAt, null);
  assert.ok(pos.entryAt);
  assert.equal(isPositionClosed(pos), false);
  assert.equal(resolveEntryAt(pos, pos.createdAt), pos.entryAt);

  const ten = nyWallToUtcMs(2026, 8, 18, 10, 0);
  const closed = closePosition(pos, ten);
  assert.equal(closed.closedAt, ten);
  assert.equal(isPositionClosed(closed), true);
  const again = closePosition(closed, ten + 60_000);
  assert.equal(again.closedAt, ten, "close is a transaction — no second stamp");
}

{
  const created = nyWallToUtcMs(2026, 8, 18, 11, 0);
  assert.equal(
    resolveEntryAt({ createdAt: created }, created),
    nyWallToUtcMs(2026, 8, 18, 9, 30),
  );
}

{
  const entry = nyWallToUtcMs(2026, 8, 18, 9, 30);
  const pos = { entryAt: entry, createdAt: entry };
  assert.equal(isTmPositionDark(pos, null), false, "live is never dark");
  assert.equal(isTmPositionDark(pos, entry - 1), true, "before entry is dark");
  assert.equal(isTmPositionDark(pos, entry), false, "at entry it lights");
}
