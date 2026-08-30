# Seed A2-W2-1 — Alpha reader

**Project:** p-studioone-archive-read (A2 strip)  
**Agent:** Alpha  
**Phase:** W2  
**Depends:** W1-G PASS  
**Law:** A2_1 · plan v1.0 FP-A2-1…13 · AT-SOAR-50…59  
**Gate it feeds:** W2-G

## Ask

Implement on `server/market_data/ssr_archive_read.py` + tests. **This packet owns that module until W2-G.** TMOS W1 does not start until this gate. **Not** the dash process (W5). **Not** TM. **Not** `TODAY_LIVE` lift.

1. Marks retrieve for every `marks/*.jsonl` including `session.jsonl`. Nearest-in-time to `t`. `MARK GAP` when farther than **max(2.5 × observed marks cadence, 15 s)**. Never LOCF.  
2. Coverage reports marks **distinctly** from chain books. Never `count=0 / expiration=UNKNOWN / status=none` for a present tape.  
3. Null `generation.vix` is not a gap. Do not read or wait on that key.  
4. 2026-08-14 SPY: flat `chain/snap-*.json`. COUNTS missing + snaps on disk → 200, not 404 UNKNOWN. Carve-out is **that flat layout only**.  
5. Symbol-completeness test enumerates disk.  
6. **`VIX NOT NATIVE`.** Coverage flags any day whose VIX tape `source` is not native. VIX1D same treatment. Source field, not the number. A proxied mid cannot be read as a native print.

## Out of scope

`ssr_snapshot_dash.py` (W5). `ssr_archive.py` proxy (W3). Tap. TM. Disk rewrite. Bounce.

## Invariants

Collection outranks reads. Named holes. No store writes. AT-SOAR-45 pool.

## Done when

Tests for AT-SOAR-50…59 (50/55 may be store or fixture at W2; **live 50 is W5/W6 — a fixture does not close 50**). `VIX NOT NATIVE` on 2026-08-27 coverage. Reader functions exist.
