/**
 *   npx --yes tsx lib/saLive.test.ts
 */
import assert from "node:assert/strict";
import { liveFromPrintAge } from "./saLive";

assert.equal(liveFromPrintAge(0), "LIVE");
assert.equal(liveFromPrintAge(500), "LIVE");
assert.equal(liveFromPrintAge(3000), "LIVE");
assert.equal(liveFromPrintAge(3001), "STALE");
assert.equal(liveFromPrintAge(null), "OFF");
assert.equal(liveFromPrintAge(undefined), "OFF");
assert.equal(liveFromPrintAge(-1), "OFF");
console.log("saLive.test.ts ok");
