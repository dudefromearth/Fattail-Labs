# H1-G — Heal / harden

**Status:** PASS  
**Date:** 2026-08-10  

## Evidence

| Seed | Result |
|------|--------|
| H1-0 | OC2: `extract_chain_underlying_price`; proxy filter; `spot_source`; 503 path |
| H1-1 | OC5a: VIX1D/VIX order; proxy ban; max(1,dte); tests |
| H1-2 | OC15: gen_key `(feed, expiry)` cache; response cache by product/side/σ |

## Tests

`pytest tests/test_chain_ladder.py` — proxy detection · underlying extract · band · diffs.
