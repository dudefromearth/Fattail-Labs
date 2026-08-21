import assert from "node:assert/strict";
import {
  BAR_MS,
  chartWindow,
  filterSessionBars,
  completeSessionBars,
  isSessionWhitespace,
  nyWall,
  nyWallToUtcMs,
  padSessionPoints,
  priorWeekday,
  rthCloseMs,
  rthOpenMs,
  sessionSlotTimes,
} from "./timeOrthoSession";

{
  const tueOpen = nyWallToUtcMs(2026, 8, 18, 9, 30);
  const w = nyWall(tueOpen);
  assert.equal(w.year, 2026);
  assert.equal(w.month, 8);
  assert.equal(w.day, 18);
  assert.equal(w.hour, 9);
  assert.equal(w.minute, 30);
  assert.equal(w.weekday, 2);
}

{
  const mon = { year: 2026, month: 8, day: 17, hour: 10, minute: 0, weekday: 1 };
  const prior = priorWeekday(mon);
  assert.equal(prior.day, 14);
  assert.equal(prior.weekday, 5);
}

{
  // Tuesday 10:00 AM ET — full extended day (pre + cash + post)
  const now = nyWallToUtcMs(2026, 8, 18, 10, 0);
  const win = chartWindow(now);
  assert.equal(win.prefillsPriorDay, false);
  assert.equal(win.fromMs, nyWallToUtcMs(2026, 8, 18, 4, 0));
  assert.equal(win.toMs, nyWallToUtcMs(2026, 8, 18, 20, 0));
}

{
  // Tuesday 8:00 AM ET — still today's tape (pre-market is on the board)
  const now = nyWallToUtcMs(2026, 8, 18, 8, 0);
  const win = chartWindow(now);
  assert.equal(win.prefillsPriorDay, false);
  assert.equal(win.fromMs, nyWallToUtcMs(2026, 8, 18, 4, 0));
  assert.equal(win.toMs, nyWallToUtcMs(2026, 8, 18, 20, 0));
}

{
  // Tuesday 3:00 AM ET — overnight: prior weekday extended day
  const now = nyWallToUtcMs(2026, 8, 18, 3, 0);
  const win = chartWindow(now);
  assert.equal(win.prefillsPriorDay, true);
  assert.equal(win.fromMs, nyWallToUtcMs(2026, 8, 17, 4, 0));
  assert.equal(win.toMs, nyWallToUtcMs(2026, 8, 17, 20, 0));
}

{
  const now = nyWallToUtcMs(2026, 8, 18, 8, 0);
  const tuePre = nyWallToUtcMs(2026, 8, 18, 5, 0);
  const tueMid = nyWallToUtcMs(2026, 8, 18, 12, 0);
  const tooOld = nyWallToUtcMs(2026, 8, 14, 10, 0);
  const bars = filterSessionBars(
    [
      { t: tooOld, o: 1, h: 1, l: 1, c: 1 },
      { t: tuePre, o: 2, h: 2, l: 2, c: 2 },
      { t: tueMid, o: 3, h: 3, l: 3, c: 3 },
    ],
    now,
  );
  assert.equal(bars.length, 2);
  assert.equal(bars[0].c, 2);
}

{
  const from = nyWallToUtcMs(2026, 8, 18, 9, 30);
  const to = nyWallToUtcMs(2026, 8, 18, 16, 0);
  const now = from + 4 * BAR_MS + 30_000;
  const filled = completeSessionBars(
    [
      { t: from, o: 10, h: 11, l: 9, c: 10.5 },
      { t: from + 2 * BAR_MS, o: 10.5, h: 12, l: 10, c: 11 },
    ],
    from,
    to,
    now,
  );
  const slots = Math.floor((to - from) / BAR_MS) + 1;
  assert.equal(filled.length, slots, "full day from first print through session close");
  assert.equal(filled[1].c, 10.5, "gap carries last close");
  assert.equal(filled[1].t, from + BAR_MS);
  assert.equal(filled[filled.length - 1].t, to, "last slot is session close");
  assert.equal(filled[filled.length - 1].c, 11, "EOD remainder carries last close");
  const before = completeSessionBars(
    [{ t: from + BAR_MS, o: 1, h: 1, l: 1, c: 1 }],
    from,
    to,
    now,
  );
  assert.equal(before[0].t, from + BAR_MS, "no invented bars before first print");
}

{
  const open = nyWallToUtcMs(2026, 8, 18, 9, 30);
  const close = nyWallToUtcMs(2026, 8, 18, 16, 0);
  const slots = sessionSlotTimes(open, close);
  assert.equal(slots.length, 79);
  assert.equal(slots[0], open);
  assert.equal(slots[slots.length - 1], close);
  assert.equal(slots[1] - slots[0], BAR_MS);
}

{
  const open = nyWallToUtcMs(2026, 8, 18, 9, 30);
  const close = nyWallToUtcMs(2026, 8, 18, 16, 0);
  const printed = padSessionPoints(
    [
      {
        time: Math.floor(open / 1000),
        open: 10,
        high: 11,
        low: 9,
        close: 10.5,
      },
      {
        time: Math.floor((open + BAR_MS) / 1000),
        open: 10.5,
        high: 11,
        low: 10,
        close: 10.2,
      },
    ],
    open,
    close,
  );
  assert.equal(printed.length, 79);
  assert.equal(isSessionWhitespace(printed[0]), false);
  assert.equal(isSessionWhitespace(printed[1]), false);
  assert.equal(isSessionWhitespace(printed[2]), true);
  assert.equal(isSessionWhitespace(printed[78]), true);
  const candles = printed.filter((p) => !isSessionWhitespace(p));
  assert.equal(candles.length, 2);
}
