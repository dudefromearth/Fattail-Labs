# GO token — Market Bus MB-P2 · Chain document provenance

**ID:** `MB-P2`  
**Callsign:** Alpha  
**Board:** `agents/p-market-bus/`  
**Gate:** **MB-P2-G**  
**Finding:** `agents/p-template-runner/gate-reports/FINDING-chain-doc-staleness.md`  
**Spec:** Market Bus **v1.0.2** (amend v1.0.1)

---

## Coach stamp

- [x] **GO** — this brief is the stamp  
- [ ] **Amend**  
- [ ] **Stop**

**Signed:** Coach  
**Date:** 2026-08-21  

---

## W0 — cited rules

### `stale` (underlier marks — reuse, do not rewrite)

| | |
|--|--|
| Threshold | `live_marks.stale_seconds()` ← `LABS_MARK_STALE_SECONDS` (existing; default 60, min 5) |
| Now | `time.time()` (unix) vs mark `ts` / `asof_ts` |
| Rule | `age_s is not None and age_s > stale_seconds()` — `underlier_marks._from_bus_doc` · `live_marks` row mapper |
| Import | `from market_data.live_marks import stale_seconds` |

### `epoch_quality` (PackageQuote / OPF — reuse)

| | |
|--|--|
| Function | `opf.generation.build_epoch(generations)["epoch_quality"]` |
| Epoch | the set of `ChainGeneration` `as_of` clocks; `max_skew_ms`; empty/missing rows → `incomplete`; else `ok` / `skewed` |
| Now | generation `as_of` (not emit clock) |
| Import | `ContractStore.from_ladder_payload` + `build_epoch` |

**OPF into assembler:** `chain_feed` already imports `opf.keys`; `open_book_marks` already imports `opf.generation`. Provenance helper lives in `market_data/chain_provenance.py` (assembler, not Redis `store.py`). Not a new bus/OPF package split.

### Ladder clocks (no new timestamp)

`build_ladder` already sets `as_of` (ISO UTC now) and `fetched_at_unix` (`time.time()`) at **the same assemble instant**. They are two encodings of **write time**, not Massive print vs Redis write. Sufficient to derive `stale` (age of `fetched_at_unix`/`as_of` vs `time.time()`, `stale_seconds()`). Sufficient for single-exp `epoch_quality` via `build_epoch` on this generation. **No new timestamp.**

### `content_hash` (India W0)

Existing hasher hashes underlier/expiration/spot/vix/rows only — not `as_of`, not `fetched_at_unix`. Attach `stale` and `epoch_quality` **after** hash. **`stale` is never in the hash** (flips on the clock). `epoch_quality` is stable for a single-exp generation (rows completeness); **also left out of the hash** so existing hashes do not churn.

---

## W0 — files

**Create:** `server/market_data/chain_provenance.py`, `server/tests/test_market_bus_chain_provenance.py`  
**Touch:** `server/routes/chain_ladder.py`, `server/routes/market_stream.py` (feed already uses `_fetch_ladder_uncached`)  
**Read only:** `underlier_marks.py`, `live_marks.py`, `server/opf/*`, `web/`
