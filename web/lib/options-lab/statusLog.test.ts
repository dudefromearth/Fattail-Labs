/**
 *   npx --yes tsx lib/options-lab/statusLog.test.ts
 */

import {
  appendStatusLog,
  formatStatusLogLine,
  planeExceptionMessage,
} from "./statusLog";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

let n = 0;
function test(name: string, fn: () => void) {
  fn();
  n += 1;
  console.log(`  ok  ${name}`);
}

console.log("statusLog");

test("live session with no override is not an exception", () => {
  assert(
    planeExceptionMessage({
      inputOverrideActive: false,
      sessionHeld: false,
      posture: "Live",
    }) == null,
    "no live spam",
  );
});

test("off market and pre/post are named", () => {
  assert(
    planeExceptionMessage({
      inputOverrideActive: false,
      sessionHeld: true,
      posture: "Closed",
    })?.startsWith("Off market") === true,
    "off market",
  );
  assert(
    planeExceptionMessage({
      inputOverrideActive: false,
      sessionHeld: true,
      posture: "Extended",
    })?.startsWith("Pre/post") === true,
    "extended",
  );
});

test("append skips blanks and duplicate last line", () => {
  const a = appendStatusLog([], "Off market — last print.", 1);
  assert(a.length === 1, "first");
  const b = appendStatusLog(a, "Off market — last print.", 2);
  assert(b === a, "same last text is a no-op");
  const c = appendStatusLog(b, "Override active — RECON is override.", 3);
  assert(c.length === 2, "new text prepends");
  assert(c[0].text.startsWith("Override"), "newest first");
  assert(appendStatusLog(c, "  ", 4) === c, "blank ignored");
});

test("timestamped line uses ET clock", () => {
  const line = formatStatusLogLine({
    at: Date.parse("2026-08-20T14:42:00-04:00"),
    text: "Off market — last print.",
  });
  assert(line.includes("ET"), "ET");
  assert(line.includes("Off market"), "text");
  assert(/^\d{1,2}:\d{2} (AM|PM) ET /.test(line), `clock prefix: ${line}`);
});

console.log(`\n${n} tests passed`);
