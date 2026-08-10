# C1-2 — First scale smoke (1 client → N clients)

**Agent:** Alpha · Kilo  
**Phase:** C (after chain ladder on shared client)  
**Spec:** First post-build smoke · AT-MB1 spirit  

## Intent

Prove headcount does not multiply Massive for one hot chain topic.

## Procedure

1. **Single client:** connect MarketClient (or WS harness); `sub` one chain (e.g. SPX, nearest exp, call, wings=25).  
   - Expect: snapshot, then updates; exact strikes if equity test.  
2. **N clients:** open N concurrent connections (10 → 50 as env allows) on **same** chain key.  
3. Record **Massive call counter** (feed) over a fixed window (e.g. 60s).  
4. Pass if Massive rate ≈ O(1/TTL × hot keys), **not** linear in N.  
5. Fail if each client induces upstream fetches.

## Evidence

Table: N | WS count | Massive calls/min | generation age p99  

File under `gate-reports/C1-G.md` or attach to K1-1.
