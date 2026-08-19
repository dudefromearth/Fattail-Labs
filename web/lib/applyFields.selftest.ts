/**
 * Characterization — apply path, types, content checks. Not part of Next.
 * Excluded from production `next build` (tsconfig). Run:
 *   node --experimental-strip-types web/lib/applyFields.selftest.ts
 */
import assert from "node:assert/strict";
import {
  SEED_QUESTIONS,
  contentCheck,
  displayDatetime,
  isDatetimeValid,
  isListedSlot,
  liveSteps,
  nextApplyStep,
  prevApplyStep,
  reviewRows,
  unansweredOnPath,
} from "./applyFields.ts";

const slots = [{ starts_et: "2026-08-25T11:00" }];
const filled: Record<string, string> = {
  email: "a@b.co",
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
assert.equal(isListedSlot("2026-08-25T11:00", slots), true);
assert.equal(isListedSlot("2026-08-25T15:00", slots), false);

assert.deepEqual(nextApplyStep(SEED_QUESTIONS, "PARTNER_SUPPORT"), "review");
assert.equal(nextApplyStep(SEED_QUESTIONS, "TRIED"), "PARTNER_SUPPORT");
assert.equal(prevApplyStep(SEED_QUESTIONS, "email"), "intro");

assert.ok(liveSteps(SEED_QUESTIONS).includes("PARTNER_SUPPORT"));
assert.ok(liveSteps(SEED_QUESTIONS).includes("ELEVEN_AM_ET"));
assert.equal(liveSteps(SEED_QUESTIONS).includes("intro"), false);

const heaven = SEED_QUESTIONS.find((q) => q.slug === "HEAVEN")!;
assert.equal(contentCheck(heaven, "").ok, false);
assert.equal(contentCheck(heaven, "keep").ok, true);

const email = SEED_QUESTIONS.find((q) => q.slug === "email")!;
assert.equal(contentCheck(email, "nope").ok, false);
assert.equal(contentCheck(email, "a@b.co").ok, true);

const cal = SEED_QUESTIONS.find((q) => q.slug === "ELEVEN_AM_ET")!;
assert.equal(contentCheck(cal, "2026-08-25T11:00", []).ok, false);
assert.equal(contentCheck(cal, "2026-08-25T11:00", slots).ok, true);

assert.equal(contentCheck(
  { ...heaven, qtype: "binary", options: ["In", "Out"] },
  "In",
).ok, true);
assert.equal(contentCheck(
  { ...heaven, qtype: "binary", options: ["In", "Out"] },
  "Maybe",
).ok, false);
assert.equal(contentCheck(
  { ...heaven, qtype: "radio", options: ["A", "B", "C"] },
  "B",
).ok, true);

assert.deepEqual(
  unansweredOnPath(SEED_QUESTIONS, { ...filled, PARTNER_SUPPORT: "" }, slots),
  ["PARTNER_SUPPORT"],
);

const rows = reviewRows(SEED_QUESTIONS, [
  "email",
  "HEAVEN",
  "HELL",
  "MONEY_TIMING",
  "COACHING_SKU",
  "ELEVEN_AM_ET",
  "TRIED",
  "PARTNER_SUPPORT",
]);
assert.equal(rows.some((r) => r.slug === "PARTNER_SUPPORT"), true);
assert.equal(rows.some((r) => r.slug === "intro"), false);
assert.equal(rows[0]?.slug, "email");

console.log("applyFields.selftest ok");
