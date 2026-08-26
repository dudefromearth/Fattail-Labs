# TLAF2-G — Delta

**Program:** Trade Log Autofilter — **first deploy**  
**Plan:** `docs/Trade-Log-Autofilter-Full-Agent-Bench-Plan-v1_0.md`  
**Spec:** GO SPEC **DL-584** · O1 omit-on-Trade-Log-only · O2 remove Open:N · O3 select-time · O4 clean visit  
**Date:** 2026-08-25  
**Verdict:** **PASS**

TLAF2 is the **first deploy**. Title-bar Autofilter and the controls it replaces ship in **one cut**. TLAF3 Help and TLAF4 Lima **not fired**.

---

## Criteria (plan TLAF2-G)

| Criterion | Result | Evidence |
|-----------|--------|----------|
| A11 on this diff | **PASS** | Autofilter mounted; `blotter-campaign-filter` gone; Open:N/`filterOpenOnly` gone; Practice date/campaign not applied to Trade Log fetch |
| No `blotter-campaign-filter` | **PASS** | `rg blotter-campaign-filter web --glob '*.tsx'` → only the TLAF2 characterization test |
| Autofilter on title bar | **PASS** | `data-testid="trade-log-autofilter"` in Trade history row · screenshot `evidence/tlf2-title-bar.png` |
| Journal / Reports / Retro / Playbook still show date+campaign chrome | **PASS** | Playwright suite-chrome test 4/4 pages visible `practice-granularity` + `practice-campaign-select` |
| Playbook select / account chrome / Select opens stay | **PASS** | e2e + source |

## Live commands (this gate)

```
cd web && npx --yes tsx lib/autofilter/apply.test.ts
→ autofilter apply.test.ts ok

cd web && npx --yes tsx lib/tradeLogAutofilter.test.ts
→ tradeLogAutofilter.test.ts ok

cd web && npx --yes tsx lib/tradeLogAutofilter.tlf2.test.ts
→ tradeLogAutofilter.tlf2.test.ts ok

npx playwright test e2e/trade-log-autofilter.spec.ts
→ 2 passed (A1 A2 A3 A11 + Journal/Reports/Retro/Playbook chrome)

npx playwright test e2e/trade-log-find.spec.ts
→ 3 passed

npx playwright test e2e/trade-log-window.spec.ts
→ 1 passed
```

## One stream (L14 / O1)

Trade Log passes `omitDateCampaignFilters`. Fetch date is Journey locate only (`blotterFromDay = filterFromDay \|\| null`). Campaign is Autofilter column (`campaignColumnFilter`), not `practiceContext.campaignId`. Badge tap and `?campaign=` share that identity.

## Isolation

Product paths in this packet: Trade Log page/table, Practice chrome omit prop, shared Autofilter extract (TLAF1, ships now because TLAF2 is the first deploy), tests, board files. Journal/Reports/Retro/Playbook **pages not edited**. Playbook blotter `<select>` not removed.

## Stop

**TLAF2-G PASS.** Return to Coach. **Do not fire TLAF3 or TLAF4 from this gate.**
