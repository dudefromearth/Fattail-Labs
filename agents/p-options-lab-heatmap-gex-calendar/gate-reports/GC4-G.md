# GC4-G — flagged switcher

**Delta** · 2026-09-18 · **PASS**

Registry **append** `gexCalTemplate` after `lim`. `memberHeatmapTemplates()` hides `gex-cal` unless `NEXT_PUBLIC_LABS_HEATMAP_TERM_MASS=1`. Label **Term Mass**. HM21 restore uses member list.

| AT | Evidence |
|----|----------|
| AT-GC6 | flag off → Term Mass not in `memberHeatmapTemplates()` |
| AT-GC12 | attach is existing socket + chain-ladder; template switch does not add a Massive client |
| AT-GC14 | ids: gex < lim < gex-cal; frozen snapshot empty diff |

Production switcher remains **flag-gated**. Default env is off.
