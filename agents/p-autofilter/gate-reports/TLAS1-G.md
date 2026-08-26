# TLAS1-G — Delta

**Program:** Trade Log Autofilter Strategy column  
**Spec:** addendum v0.1 **GO SPEC DL-587** · **O1/O2 DL-588** · **GO TLAS1**  
**Date:** 2026-08-25  
**Verdict:** **PASS**

TLAS2 Help **not fired**.

---

| # | Result | Evidence |
|---|--------|----------|
| S1 | **PASS** | e2e panel lists Strategy; order Exec time · Campaign · Strategy · Symbol · Status |
| S2 | **PASS** | unit: `strategy: ["BUTTERFLY"]` → one whole block |
| S3 | **PASS** | unit: Strategy OR + Symbol AND |
| S4 | **PASS** | `web/lib/autofilter` has no `trade.strategy` / Trade Log readers |
| S5 | **PASS** | `trade-log-find.spec.ts` 3 passed |
| S6 | **not this packet** | Help still says four columns until TLAS2 |
| S7 | **PASS** | host has no account/expiry/right/entry_source/adherence keys |

O1: after Campaign. O2: tokens = stored code; `strategyLabelsFromCatalog` only maps non-empty labels.

One Autofilter control. No blotter Strategy `<select>`. Engine unchanged.

## Stop

**TLAS1-G PASS.** Return to Coach. **Do not fire TLAS2 from this gate.**
