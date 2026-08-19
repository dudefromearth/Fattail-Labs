/**
 * Characterization — apply path + Review. Run:
 *   node --experimental-strip-types web/lib/applyFields.selftest.ts
 */
import assert from "node:assert/strict";
import {
  computePath,
  nextApplyStep,
  pruneAsked,
  recomputePath,
  reviewRows,
  unansweredOnPath,
} from "./applyFields";

const filled = {
  HELL: "bleed",
  HEAVEN: "keep",
  MONEY_TIMING: "now",
  COACHING_SKU: "navigator",
  ELEVEN_AM_ET: "yes",
  TRIED: "solo",
  PARTNER_SUPPORT: "spouse",
};

assert.deepEqual(nextApplyStep("PARTNER_SUPPORT", { email: "a@b.co", ...filled }), "review");
assert.deepEqual(nextApplyStep("TRIED", { email: "a@b.co", ...filled, ELEVEN_AM_ET: "no" }), "review");
assert.equal(nextApplyStep("TRIED", { email: "a@b.co", ...filled }), "PARTNER_SUPPORT");

const yesPath = computePath(filled);
assert.ok(yesPath.includes("PARTNER_SUPPORT"));

const noPath = computePath({ ...filled, ELEVEN_AM_ET: "no" });
assert.equal(noPath.includes("PARTNER_SUPPORT"), false);

const dropped = recomputePath("a@b.co", { ...filled, ELEVEN_AM_ET: "no" });
assert.equal(dropped.answers.PARTNER_SUPPORT, "");
assert.equal(dropped.path.includes("PARTNER_SUPPORT"), false);

const opened = recomputePath("a@b.co", {
  ...filled,
  ELEVEN_AM_ET: "yes",
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
const pruned = pruneAsked([...asked], noPath);
assert.equal(pruned.includes("PARTNER_SUPPORT"), false);
const rows = reviewRows(pruned, { email: "a@b.co", ...dropped.answers });
assert.equal(rows.some((r) => r.id === "PARTNER_SUPPORT"), false);
assert.equal(rows.some((r) => r.id === "intro"), false);
assert.equal(rows[0]?.id, "email");

const skuChange = recomputePath("a@b.co", { ...filled, COACHING_SKU: "observer" });
assert.equal(skuChange.answers.COACHING_SKU, "observer");
assert.deepEqual(skuChange.path, yesPath);

console.log("applyFields.selftest ok");
