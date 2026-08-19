/**
 * Characterization — apply path + Review. Not part of the Next app.
 * Excluded from production `next build` (tsconfig). Run:
 *   node --experimental-strip-types web/lib/applyFields.selftest.ts
 */
import assert from "node:assert/strict";
import {
  computePath,
  displayDatetime,
  isDatetimeValid,
  nextApplyStep,
  pruneAsked,
  recomputePath,
  reviewRows,
  unansweredOnPath,
} from "./applyFields.ts";

const filled = {
  HELL: "bleed",
  HEAVEN: "keep",
  MONEY_TIMING: "now",
  COACHING_SKU: "navigator",
  ELEVEN_AM_ET: "2026-08-25T11:00",
  TRIED: "solo",
  PARTNER_SUPPORT: "spouse",
};

assert.equal(isDatetimeValid("2026-08-25T11:00"), true);
assert.equal(isDatetimeValid("yes"), false);
assert.ok(displayDatetime("2026-08-25T11:00").includes("ET"));

assert.deepEqual(nextApplyStep("PARTNER_SUPPORT", { email: "a@b.co", ...filled }), "review");
assert.equal(nextApplyStep("TRIED", { email: "a@b.co", ...filled }), "PARTNER_SUPPORT");

const path = computePath(filled);
assert.ok(path.includes("PARTNER_SUPPORT"));
assert.ok(path.includes("ELEVEN_AM_ET"));

const oldNo = computePath({ ...filled, ELEVEN_AM_ET: "no" });
assert.equal(oldNo.includes("PARTNER_SUPPORT"), true);

const kept = recomputePath("a@b.co", { ...filled, ELEVEN_AM_ET: "2026-08-26T14:30" });
assert.equal(kept.answers.PARTNER_SUPPORT, "spouse");
assert.equal(kept.path.includes("PARTNER_SUPPORT"), true);

const opened = recomputePath("a@b.co", {
  ...filled,
  PARTNER_SUPPORT: "",
});
assert.deepEqual(unansweredOnPath(opened.email, opened.answers), ["PARTNER_SUPPORT"]);

const asked = [
  "email",
  "HEAVEN",
  "HELL",
  "MONEY_TIMING",
  "COACHING_SKU",
  "ELEVEN_AM_ET",
  "TRIED",
  "PARTNER_SUPPORT",
] as const;
const pruned = pruneAsked([...asked], path);
assert.equal(pruned.includes("PARTNER_SUPPORT"), true);
const rows = reviewRows(pruned, { email: "a@b.co", ...filled });
assert.equal(rows.some((r) => r.id === "PARTNER_SUPPORT"), true);
assert.equal(rows.some((r) => r.id === "intro"), false);
assert.equal(rows[0]?.id, "email");

console.log("applyFields.selftest ok");
