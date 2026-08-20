# Seed M4-1 — Kilo AT-ALM

**Project:** p-alerts  
**Agent:** Kilo  
**Phase:** M  
**Depends:** M1 + M2  
**Law:** ALM §9  
**Gate it feeds:** M-G

## Intent

Characterization for AT-ALM-1…11. Evidence, not “should work.”

## Files in scope

`server/tests/` · web tests as needed · **not** `HostPnLChart`.

## ATs

| AT | Evidence |
|----|----------|
| AT-ALM-1 | User menu Alerts → `/app/alerts` |
| AT-ALM-2 | Settings has no second Analyzer builder |
| AT-ALM-3 | POST without registered `source_system` → 4xx |
| AT-ALM-4 | Analyzer-shaped upsert appears with `suite=options_lab` (fixture adapter OK) |
| AT-ALM-5 | Deep link shape `/app/options-lab/analyzer?alert=` |
| AT-ALM-6 | Stats: suite/class counts, no P&L field |
| AT-ALM-7 | Disabled class → no delivery (or honest not-live) |
| AT-ALM-8 | Heatmap empty types cannot POST Analyzer `surface_type` |
| AT-ALM-9 | POST without `suite` or `severity` → 4xx |
| AT-ALM-10 | Dangling `local_ref` → `unbound`, `active` false |
| AT-ALM-11 | Alerts stream is not `MarketSocket` / `market/stream` |
| **AT-ALM-12** | `/app/alerts` Member dialect; kit List/Banner/Button; not `/admin` density |
| **AT-ALM-13** | Chrome lint PASS (plan §8.5 command) on Manager app + Settings Alerts pane |

**HIG lint (FP14):** lint pass over `/app/alerts` + Settings Alerts pane for raw hex / magic px / `zinc-*`. HI Spec §11 token check still applies.

## Out of scope

AT-ALB canvas. MiniTwo. Inventing a live fire engine.

## Done when

Tests in tree; `gate-reports/M4-kilo.md` lists each AT PASS/FAIL with command + output **and** the raw-value lint.
