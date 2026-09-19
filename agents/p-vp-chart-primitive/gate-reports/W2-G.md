# W2-G — Lifecycle hygiene

**Verdict:** PASS (GO)  
**Date:** 2026-09-19  
**Law:** AZ-VP-9-A23 · DL-764

Evidence: `clearHistogram()` before new OHLC/`/range`; epoch on source/TF/span; inflight pending re-check; `detachPrimitive` on chart teardown. Overlay still in DOM (W3). Tests `saVpBand` + `saVpSeries` ok.
