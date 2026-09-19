# SYM-SWAP-G — fixture deleted; live StudioOne API

**Verdict:** PASS (GO)  
**Date:** 2026-09-19  
**Machines:** StudioOne CP-1 (already SYM1-DEPLOY-G PASS) + StudioTwo

## Did

- Deleted `artifacts/symbology/req-003-picker.json`.  
- Labs `:4000` hops member `/symbology/v1/*` to `http://192.168.1.111:4011` with computing headers (member cookie not forwarded).  
- CI: `tests/test_symbology_fixture_hygiene.py` now requires the fixture **absent** and production web trees FIXTURE-clean.

## Evidence

Member `GET http://127.0.0.1:4000/symbology/v1/resolve?q=ES1!` → `bound_symbol=ESZ2026` `sg-20260919-001`, **equal** to computing GET on StudioOne `:4011`. Universe roots `SPX, XSP, ES, MES`. `q=NQ` miss + copy.

`pytest tests/test_symbology_registry.py tests/test_symbology_fixture_hygiene.py tests/test_symbology_studioone_live.py` **76 passed** (live tests included via `.env` pin).

## Not AP-1

REQ-003 stays OPEN. Coach's browser, his clicks, StudioTwo, tile → dialog → selection → chart.
