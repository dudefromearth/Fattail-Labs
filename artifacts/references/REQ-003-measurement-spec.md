# REQ-003 measurement spec — extracted from the reference PNG

**Reference:** `artifacts/references/REQ-003-symbol-search-reference.png`  
**Git blob:** `f09d78735399a7d4fe78d13ee5fe21e3c4707ab6`  
**Pixels:** 1676 × 1368 (RGBA PNG)  
**Source filename (Coach):** `symbol-dialog.png`

## Frame
| Measure | Notes (from 1676×1368) |
|---------|------------------------|
| Dialog | rounded white card, full frame |
| Title | “Symbol search” top-left; close × top-right |
| Search row | full-width field, magnifying glass left, query, clear ×, grid icon right |
| Class chips | pill row under search; selected = filled black; others gray outline |
| Filter row | “All countries” / “All categories” dropdowns (Labs: omit extras not in our inventory) |
| List | full-width rows; parent row with logo + root + description + exchange + chevron |
| Child rows | indent, no logo; ticker left (blue); description; exchange + globe |
| Focus | 1px black rounded rect around the active child |
| Footer | small gray “Search using ISIN and CUSIP codes” — **not our inventory**; do not clone |

## Class chips in the reference vs Labs law
Reference shows All, Stocks, Funds, Futures, Forex, Crypto, Indices, Bonds, Economy, Options.  
**Labs scoped chips (REQ-003 FINAL):** All / Futures / Stocks / Indices only. Extra TV chips are not our inventory.

## Futures family (TV idiom)
- Parent: ES + “E-mini S&P 500 Futures” + CME + expand chevron  
- Children: ES1!, ES2!, then dated long form `ESZ2026` with month in description  
- Continuity rows first, then strip contracts

PNG wins if any number here is disputed.
