# /range full-span timings — 2026-09-18 (current depth)

**Coverage:** floor `2026-09-17` · ceiling `2026-09-18` · 2 sessions binned ES/MES (SPY also 2 on production).  
**Call:** computing-class `GET /v1/profile/{target}/range?from={floor}&to={ceiling}`  
**N=7** after one health probe.

| Path | Target | HTTP | bytes | bins | p50 ms | min | max |
|------|--------|-----:|------:|-----:|-------:|----:|----:|
| DEV `127.0.0.1:4010` | SPX | 200 | 17879 | 501 | **3.6** | 3.1 | 10.4 |
| DEV `127.0.0.1:4010` | XSP | 200 | 18371 | 500 | **3.1** | 2.9 | 3.5 |
| StudioOne **localhost** `:4010` | SPX | 200 | 18387 | 501 | **3.9** | 3.7 | 4.6 |
| StudioOne **localhost** `:4010` | XSP | 200 | 18380 | 500 | **3.8** | 3.6 | 6.1 |
| StudioTwo → `studioone.local:4010` | SPX | 200 | 18387 | 501 | **1370** | 1157 | 1561 |
| StudioTwo → `studioone.local:4010` | XSP | 200 | 18380 | 500 | **1142** | 1103 | 1415 |

`vp_row=0.25`. Status **GAPPED**. `row=1` query: **same bin count** (501/500) — the param is echoed, not a rebin.

**Verdict:** at current depth, **do not** make server-side `row=` display rebinning the default path. On-box `/range` is ~4 ms / ~18 KB. The 1.1–1.5 s StudioTwo→LAN figure is the same order as health (1.76 s) — path, not payload. Consumers on StudioOne/MiniTwo should hit `studioone.local` from a host that is not paying that hop, or we diagnose the hop separately.

**Scale note:** `/range` today sums one session histogram JSON per day in `[from, to]`. ES vendor floor 2017-04 is ~2k sessions; that linear file walk is why VPS2b (incremental running totals) is the backing store, not a coarser `row=`.
