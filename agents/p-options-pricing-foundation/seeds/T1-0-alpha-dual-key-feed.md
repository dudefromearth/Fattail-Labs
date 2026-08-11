# T1-0 — Alpha dual-key feed

**Agent:** Alpha  
**Depends on:** W0-0 GO  

## Intent

Align `chain_feed` topic parse with `mb:ladder:{ul}:{exp}:w{N}:dual` (OPF4).  
Underlier may contain `:` (e.g. `I:SPX`). Use end-based parse (`opf.keys.parse_ladder_topic`).

## Deliverable

- `server/opf/keys.py`  
- `server/market_data/chain_feed.py` dual-aware  
- AT-L0 dual key tests green  

## Status

**DONE**
