import assert from "node:assert/strict";
import { localSessionNote } from "./timeOrthoNote";

{
  const text = localSessionNote(
    {
      symbol: "SPY",
      phase: "rth",
      positions: [
        { label: "SPY short put vertical", notation: "-1 500P / +1 490P" },
      ],
      lastMid: 640.12,
      bookPnl: -12.5,
      bookState: null,
    },
    Date.UTC(2026, 7, 18, 15, 0),
  );
  assert.match(text, /position/i);
  assert.doesNotMatch(text, /\bstrateg(?:y|ies)\b/i);
  assert.match(text, /Hide, show, or add a position/i);
  assert.match(text, /lasts only while a position is on the list/i);
  assert.match(text, /short put vertical/);
  assert.match(text, /mark, not a forecast/);
}

{
  const empty = localSessionNote(
    {
      symbol: "QQQ",
      phase: "pre",
      positions: [],
      lastMid: null,
      bookPnl: null,
      bookState: null,
    },
    Date.UTC(2026, 7, 18, 12, 0),
  );
  assert.match(empty, /No visible position/i);
  assert.doesNotMatch(empty, /\bstrateg(?:y|ies)\b/i);
}
