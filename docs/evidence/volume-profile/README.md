# Volume Profile / dual-store evidence (Spec v0.4)

| Probe | File | Status |
|-------|------|--------|
| P2-1 Trades depth SPY | `p2-asbuilt-spy-trades.md` | **RETIRED-AS-BUILT** |
| P2-2 Flat files | same | **RETIRED-AS-BUILT** — REST paginated, not flat-file |
| **P2-3 Conditions / volume** | `p2-conditions.md` | **OPEN — bin gate** (+9.3% all-prints vs daily, SPY 2024-06-03) |
| P2-4 Mount smoke | sabrant2tb write + copy verified | **PASS on sabrant2tb**; Pod 1 TCC from agent shell |
| P2-5 SPY raw size | as-built | **RETIRED-AS-BUILT** (~6.2 GB trades and growing) |
| P2-6 Index 403 | `p2-index-entitlement.md` | **PASS** — I:SPX/XSP/VIX/VIX1D all 403 (2026-08-11) |
| **P2-7 Rate × kinds** | `p2-rate-isolation.md` | **OPEN** (3 jobs concurrent; 429 retry path live) |
| **P2-8 Quotes/1s depth SPY** | `p2-quotes-1s-depth.md` | **OPEN** — quotes at 2004 depth yes; 1s not started |

**Production bin writes:** blocked until P2-3 frozen list + tolerance + C-0.  
**Campaign:** `/Volumes/sabrant2tb/fattail-market-data` (local staging kept).  
**VIX/VIX1D:** not a VP path.
