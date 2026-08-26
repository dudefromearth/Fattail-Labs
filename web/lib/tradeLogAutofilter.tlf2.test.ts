/**
 *   npx --yes tsx lib/tradeLogAutofilter.tlf2.test.ts
 * TLAF2 source characterization: A1–A3, A5, A6, A10-removed, A11, A12, suite chrome.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const web = resolve(here, "..");

function read(rel: string): string {
  return readFileSync(resolve(web, rel), "utf8");
}

const page = read("app/app/trade-log/page.tsx");
const table = read("components/trade-log/TradeLogTable.tsx");
const bar = read("components/trade-log/TradeLogAutofilterBar.tsx");
const host = read("lib/tradeLogAutofilter.ts");
const apply = read("lib/autofilter/apply.ts");
const ctxBar = read("components/practice/PracticeContextBar.tsx");
const chrome = read("components/practice/PracticeSuiteChrome.tsx");
const journal = read("app/app/journal/page.tsx");
const reports = read("app/app/reports/page.tsx");
const retro = read("app/app/retrospective/page.tsx");
const playbook = read("app/app/playbook/page.tsx");

// A1 — title-bar Autofilter
assert.match(table, /Trade history/);
assert.match(table, /TradeLogAutofilterBar/);
assert.match(bar, /data-testid="trade-log-autofilter"/);
assert.match(bar, /min-h-\[var\(--hit-min\)\]/);

// A2 / A11 — blotter campaign select gone; not beside Autofilter
assert.doesNotMatch(table, /blotter-campaign-filter/);
assert.doesNotMatch(page, /blotter-campaign-filter/);
assert.doesNotMatch(table, /onCampaignFilter/);
assert.doesNotMatch(page, /setCampaignFilter/);

// A3 / O1 — omit date+campaign on Trade Log only
assert.match(page, /omitDateCampaignFilters/);
assert.match(chrome, /omitDateCampaignFilters/);
assert.match(ctxBar, /omitDateCampaign/);
assert.match(ctxBar, /practice-granularity/);
assert.match(ctxBar, /practice-campaign-select/);

for (const [name, src] of [
  ["journal", journal],
  ["reports", reports],
  ["retrospective", retro],
  ["playbook", playbook],
] as const) {
  assert.doesNotMatch(
    src,
    /omitDateCampaignFilters/,
    `${name} must still show Practice date+campaign chrome`,
  );
  assert.match(src, /PracticeSuiteChrome/);
}

// A5 — badge + ?campaign= share campaignColumnFilter
assert.match(host, /export function campaignColumnFilter/);
assert.match(page, /campaignColumnFilter/);
assert.match(page, /deepLinkCampaign/);
assert.match(table, /onCampaignColumn/);
assert.doesNotMatch(page, /setCampaignId\(deepLinkCampaign\)/);

// A6 — Adhere locate survives
assert.match(page, /journey-adhere-locate-banner/);
assert.match(page, /adherence_mode/);
assert.match(page, /filterFromDay/);

// O2 / A10 — Open:N removed (not identity-kept)
assert.doesNotMatch(table, /Open:/);
assert.doesNotMatch(table, /filterOpenOnly/);
assert.doesNotMatch(page, /filterOpenOnly/);
assert.doesNotMatch(page, /setFilterOpenOnly/);

// L12 — Select opens stays (selection, not a filter)
assert.match(table, /Select opens/);
assert.match(page, /onSelectAllOpens/);
assert.doesNotMatch(page, /setFilterOpenOnly\(true\)/);

// Playbook select stays; account chrome stays
assert.match(table, /blotter-playbook-filter/);
assert.match(ctxBar, /practice-account-select/);

// One stream — Practice date/campaign not applied to fetch.
// TLAB1 B: FilterMap drives GET params; do not client-apply as membership.
assert.doesNotMatch(page, /dateFilterActive \? rangeFromYmd/);
assert.doesNotMatch(page, /practice_campaign_id:\s*\n\s*campaignFilter/);
assert.doesNotMatch(page, /applyAutofilter\(/);
assert.match(page, /autofilterToListQuery/);
assert.match(page, /fetchBlotterDistincts/);
assert.match(page, /years: afq\.years/);
assert.match(page, /statuses: afq\.statuses/);
assert.match(page, /blotterFromDay = filterFromDay \|\| null/);

// A12 — shared engine; host columns outside autofilter/
assert.match(apply, /export function applyAutofilter/);
assert.doesNotMatch(apply, /practice_campaign_id/);
assert.doesNotMatch(apply, /Trade history/);
assert.match(host, /tradeLogColumns/);
assert.match(host, /key: "strategy"/);
assert.match(bar, /key === "strategy"/);
assert.doesNotMatch(host, /key: "expiry"/);
assert.doesNotMatch(host, /key: "account"/);
assert.doesNotMatch(host, /key: "adherence"/);
assert.doesNotMatch(host, /key: "entry_source"/);
assert.doesNotMatch(host, /key: "right"/);

// O4 — no persist into lastUsed
assert.doesNotMatch(apply, /lastUsed/);
assert.doesNotMatch(bar, /lastUsed/);
assert.doesNotMatch(host, /lastUsed/);
assert.doesNotMatch(page, /tradeLog\.lastUsed/);

// A9
assert.match(bar, /FilterOnMark/);

console.log("tradeLogAutofilter.tlf2.test.ts ok");
