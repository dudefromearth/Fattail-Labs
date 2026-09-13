# XS1-G — Create / recipe scale

**Delta** · 2026-09-13 · plan v1.3 · OD-XS9 (a) · OD-XS7 XSP only

**PASS** — landed `6a98531` (`fix(options-lab): XSP/SPY butterfly recipes seed 1-wide`).

| Assert | Result |
|--------|--------|
| `butterflyWingWidth` XSP/SPY → 1, else 20 | PASS unit AT-XS1 / AT-XS2 |
| `labCreateOpenDefault` / butterfly Lab branch use it only | PASS |
| `productWingHint("XSP")` still 20 | PASS AT-XS3 (`SPX \|\| XSP` grep kept) |
| XSP vertical / straddle / iron_condor unchanged | PASS AT-XS2b |
| SPY vertical 5 | PASS |
| NDX/RUT/QQQ/IWM/AAPL butterfly 20 | PASS |
| `defaultWidth` NDX/NQ* → 50 untouched | PASS AT-XS5b |
| OD-XS7 `defaultDiagonalWidth(XSP)` 15 → 1; `axisSpot` XSP only | PASS. SPX arm deferred (A3) |
| Diff excludes Tos padlock, dialog chrome, `defaultWidth` | PASS |

Evidence: `gate-reports/xs4/helper-unit-tests.txt` · `grep-leftovers.txt`.
