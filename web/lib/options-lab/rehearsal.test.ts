/**
 *   npx --yes tsx lib/options-lab/rehearsal.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createPriceAlert,
  durableAlerts,
  durablePositions,
  positionFromInput,
} from "./analyzerBook";

const pos = positionFromInput({
  underlying: "SPX",
  expiration: "2026-08-28",
  contracts: 1,
  direction: "buy",
  legs: [
    {
      strike: 6400,
      type: "call",
      quantity: 1,
      side: "long",
      entry_price: 1,
    },
  ],
});
pos.rehearsal = true;
const live = positionFromInput({
  underlying: "SPX",
  expiration: "2026-08-28",
  contracts: 1,
  direction: "buy",
  legs: [
    {
      strike: 6410,
      type: "put",
      quantity: 1,
      side: "short",
      entry_price: 1,
    },
  ],
});
assert.equal(durablePositions([pos, live]).length, 1);
assert.equal(durablePositions([pos, live])[0].id, live.id);

const reh = createPriceAlert({
  type: "price_above",
  symbol: "SPX",
  targetPrice: 6400,
  rehearsal: true,
});
const liveA = createPriceAlert({
  type: "price_below",
  symbol: "SPX",
  targetPrice: 6300,
});
assert.equal(reh.rehearsal, true);
assert.equal(durableAlerts([reh, liveA]).length, 1);

const here = dirname(fileURLToPath(import.meta.url));
const analyzer = readFileSync(
  join(here, "../../components/options-lab/OpfRiskAnalyzer.tsx"),
  "utf8",
);
assert.match(analyzer, /analyzer-rehearsal-ended/);
assert.match(analyzer, /Rehearsal ended/);
assert.match(analyzer, /pos\.rehearsal = true/);
assert.match(analyzer, /rehearsal: tm\.tmActive/);
// KEEP (Coach): durable live algos do not tick while a playhead is up.
assert.match(
  analyzer,
  /else if \(tmActive\) \{\s*return a;/,
  "live algos must skip the replayed clock",
);
// KEEP (Coach): To Trade Log is refused, not only hidden.
assert.match(
  analyzer,
  /if \(pos\.rehearsal\) \{[\s\S]*?return;/,
  "send-to-log must refuse rehearsal cards",
);
const list = readFileSync(
  join(here, "../../components/options-lab/AnalyzerPositionsList.tsx"),
  "utf8",
);
assert.match(list, /ReplayBadge/);
assert.match(list, /onSendToTradeLog && !pos\.rehearsal/);
const alerts = readFileSync(
  join(here, "../../components/options-lab/AnalyzerAlertsSection.tsx"),
  "utf8",
);
assert.match(alerts, /ReplayBadge/);
assert.match(alerts, /formatReplayClock/);
assert.doesNotMatch(alerts, /working order/i);

const help = readFileSync(
  join(here, "../../../server/help_reference/options-lab-time-machine.md"),
  "utf8",
);
assert.doesNotMatch(help, /Instant Replay/i);
assert.match(help, /One surface, one scrubber/);
assert.match(help, /date\*\* picks the day/);
assert.match(help, /fidelity/i);
assert.match(
  help,
  /Live algos already on the book do not tick\s+while a playhead is up/,
);
assert.match(help, /hidden, and sending is refused/);

console.log("rehearsal.test.ts ok");
