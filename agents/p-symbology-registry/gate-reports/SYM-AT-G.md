# SYM-AT-G — SYM-AT-1…14 artifacts

**Verdict:** PASS (GO)  
**Date:** 2026-09-19  
**Live:** `http://192.168.1.111:4011`  
**Index:** `artifacts/symbology/sym-at/INDEX.json` (`all_pass: true`)

| AT | Artifact | Pass |
|----|----------|------|
| 1 | `AT-01-esz6-matches-no-bind.json` | ESZ6 matches, no bind |
| 2 | `AT-02-alias-ingest-refused.json` | ES1! / `/ES` / `@ES` ingest refused |
| 3 | `AT-03-fixture-deleted.json` + hygiene tests | fixture gone; prod FIXTURE-clean |
| 4 | `AT-04-pair-badge-dark-coming.json` | pair dark / COMING |
| 5 | `AT-05-rth-generation-unchanged.json` | RTH write refused |
| 6 | `AT-06-unsupported-miss.json` + `sym3/d-gray-nq.png` | NQ miss + copy |
| 7 | `AT-07-stale-not-active.json` | max-age → STALE |
| 8 | `AT-08-alias-bound-dated.json` + `sym3/c-slash-es.png` | `bound_symbol=ESZ2026` |
| 9 | `AT-09-post-close-advance.json` | post-close `ESH2027` |
| 10 | `AT-10-adjustment-refused.json` | B-ADJ / constant / ratio refused |
| 11 | `AT-11-preset-overlay.json` | overlay preset, house gen unchanged |
| 12 | `AT-12-pair-badge-front-contract.json` | front contract + SPX, never root ES |
| 13 | `AT-13-tv1vo-named-not-built.json` | `tv-1VO` named-not-built |
| 14 | `AT-14-dated-ignores-preset.json` | `ESZ2026` stays `ESZ2026` |

Chip layout (SYM3): `artifacts/symbology/sym3/e-chips.png` — All / Futures / Stocks / Indices only.

Not AP-1. REQ-003 OPEN.
