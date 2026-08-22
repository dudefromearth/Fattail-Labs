# MB-P2-G — Chain document provenance (evidence for Delta)

**Date:** 2026-08-21  
**Token:** [`agents/go/MB-P2.md`](../../go/MB-P2.md) · **DL-535**  
**Delta verdict:** **PASS** (consumer proof deferred to TR-P3 — Runner host, not bus)

## W0

See GO token. `stale` = `live_marks.stale_seconds()` vs write age. `epoch_quality` = `build_epoch`. Ladder already had `as_of` + `fetched_at_unix` (same assemble instant). No new timestamp. OPF import in `market_data/chain_provenance.py` (assembler; `chain_feed` already used `opf.keys`).

## Tests

`pytest tests/test_market_bus_chain_provenance.py` — **7 passed**.

`pytest tests/test_chain_ladder.py` — all green except pre-existing  
[`FINDING-test-chain-ladder-0dte.md`](../../p-template-runner/gate-reports/FINDING-test-chain-ladder-0dte.md) (`len(z)==200` got 0). Do not re-report.

`python scripts/mb_at_evidence.py` — **ALL PASS**.

## Live

HTTP `GET /api/me/market/chain-ladder?...` → `stale: false`, `epoch_quality: "ok"` on envelope and ladder.  
[`evidence/mb-p2/http-chain-ladder.json`](../evidence/mb-p2/http-chain-ladder.json)

WS `chain` frame → same fields.  
[`evidence/mb-p2/ws-chain-frame.json`](../evidence/mb-p2/ws-chain-frame.json)

## Consumer proof — deferred to TR-P3

The bus gap is closed. HTTP and WS carry `stale` + `epoch_quality`. Runner subscribe accepted them (`stale=false`, `epoch_quality=ok` on the host).

Spread-tax **tiles** did not paint because of a **Runner host defect** (TR-P2): selector change unmounts `HeatmapChainPanel` → `setChainInterest` released → no `run()`. That is **not a bus gap**. Consumer proof (spread-tax paints on the real bus) is **deferred to TR-P3**, which puts every template on one `subscribe() → run() → render` path.

Screenshot of provenance-on-host, empty grid: [`evidence/mb-p2/spread-tax-live.png`](../evidence/mb-p2/spread-tax-live.png)

---

## Delta record

**Recorded:** **PASS**  
**Residual:** TR-P3 Runner host (TR8). Not a Market Bus follow-up.  
**Does not:** MiniTwo.

## Finding

[`FINDING-chain-doc-staleness.md`](../../p-template-runner/gate-reports/FINDING-chain-doc-staleness.md) **CLOSED** → DL-535.
