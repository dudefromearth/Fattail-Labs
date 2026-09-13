# XS0-2 — Listed vs arithmetic

**Project:** Options Lab XSP / SPY Scale  
**Agent:** Hotel  
**Depends:** —  
**Feeds:** XS0-G · XS3

## Intent

| Item | Pin |
|------|-----|
| Listed vs arithmetic | Prefer profile min (1); place only a listed symmetric wing. Never invent 1-wide |
| Probe 20+ bid-null | `docs/evidence/quant-spread-probe-XSP-2026-09-04.txt` — XSP 20+ OTM puts 95.8% / calls 100% bid-null. Do not default an unfillable 20-wide XSP fly |
| OD-XS2 rec (a) | Listed-only. Honest 20 when 1 is unlisted. Named state, not a lying 1-wide |
| HM8 | Sparse SPY heatmap 1-wide columns: unlisted \(K \pm w\) → **invalid cell**, never snap |
| **OD-XS9** | Butterfly-only this packet vs all-template 1-wide (A1). A 1-wide XSP strangle is nearly a straddle. Silent: (a) leave `productWingHint("XSP")` at 20 |
| No second pricer | Debit / listed grid from OPF-held chain only |

## Out of scope

Code. Denser fetch / `fetch_step_floor` (NX2). Arithmetic 1-wide unless Coach Override OD-XS2 (b) with a DL.

## XS0-2 done

Listed-vs-arithmetic golden named. OD-XS2 (a) and OD-XS9 (a) labeled Hotel’s rec.
