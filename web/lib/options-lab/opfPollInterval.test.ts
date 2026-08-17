/**
 * npx --yes tsx lib/options-lab/opfPollInterval.test.ts
 */
import {
  OPF_AWAY_POLL_MS,
  OPF_IDLE_POLL_MS,
  OPF_POLL_MS,
  opfPollIntervalMs,
} from "./useOpfRiskGraph";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(msg);
}

assert(OPF_POLL_MS === 2500, "working / focused is 2.5s");
assert(OPF_AWAY_POLL_MS === 5000, "away + shown is 5s");
assert(OPF_IDLE_POLL_MS === 30_000, "no shown cards is 30s");
assert(OPF_IDLE_POLL_MS > OPF_AWAY_POLL_MS, "idle is cheaper than away");
assert(OPF_AWAY_POLL_MS > OPF_POLL_MS, "away is cheaper than focused");

assert(
  opfPollIntervalMs({
    pollLive: true,
    mounted: true,
    hidden: false,
    hasVisible: true,
  }) === OPF_POLL_MS,
  "in seat + shown → live",
);
assert(
  opfPollIntervalMs({
    pollLive: true,
    mounted: true,
    hidden: true,
    hasVisible: true,
  }) === OPF_AWAY_POLL_MS,
  "tab hidden + shown → away (still polling)",
);
assert(
  opfPollIntervalMs({
    pollLive: true,
    mounted: false,
    hidden: false,
    hasVisible: true,
  }) === OPF_AWAY_POLL_MS,
  "left Analyzer + shown → away keep-warm",
);
assert(
  opfPollIntervalMs({
    pollLive: true,
    mounted: true,
    hidden: false,
    hasVisible: false,
  }) === OPF_IDLE_POLL_MS,
  "nothing shown → idle (poll on, minimize resolve)",
);
assert(
  opfPollIntervalMs({
    pollLive: false,
    mounted: true,
    hidden: false,
    hasVisible: true,
  }) === null,
  "off-market → no live poll",
);

console.log("opfPollInterval ok");
