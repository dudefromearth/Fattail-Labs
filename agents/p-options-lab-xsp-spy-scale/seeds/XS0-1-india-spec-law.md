# XS0-1 — Spec / law integrity

**Project:** Options Lab XSP / SPY Scale  
**Agent:** India  
**Depends:** —  
**Feeds:** XS0-G

## Intent

| Item | Law |
|------|-----|
| AZ-DEF-4 | Listed min wing from profile — never invent unlisted arithmetic width |
| DL-435 scoped reverse | Needs a **new DL in PR 3** (same PR as the helper). Silent overwrite of DL-435 is a FAIL |
| L5 / OD-XS5 | Changelog row in existing AF Spec, **no version bump**, unless Coach names a bump |
| DL-539 | Third tree only via reassignment DL (this PR) or three OKs. LIM and QFRIC stay active |
| L3 | Width picker **LOCKED**. Not an OD. AT-DLG-22 stands |
| `AnalyzerPositionsList.tsx` | Frozen. Diff presence is FAIL |
| **B1** | Provenance gate (`source === "market_symbol_universe"` ∧ `fixed_points`), not a value clamp |
| **B3** | QQQ / IWM heatmap 10…50 is a deferred defect (XS-ETF), not non-regression |
| **B4** | No second width SoR without a Coach DL. Silent: one list on `ChainContext.columnWidths` |
| **NX18** | This packet is not IKI Labs / `observer-light` / Factory catalog. A passing XS gate is not that progress |

## Out of scope

Code. Spec version bump. Reopening WF / AF. MiniTwo.

## XS0-1 done

Law table ready for Coach stamp. L* not labeled as stamped before `XS0-W0.md`. No post-GO law invent.
