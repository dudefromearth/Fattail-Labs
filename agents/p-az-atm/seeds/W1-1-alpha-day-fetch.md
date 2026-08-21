# Seed W1-1 — Alpha 1-minute day fetch

**Project:** p-az-atm  
**Agent:** Alpha  
**Phase:** W1  
**Depends:** W0-BA  
**Files:** `server/routes/algo_replay.py` · `server/market_data/algo_replay_path.py` · `server/tests/test_algo_replay_path.py`  
**Out:** `HostPnLChart.tsx` · Autofit strip · client Massive  
**Gate it feeds:** W1-G

## Ask

Server download of **1-minute** bars (or SSR marks) for a NY calendar day. Full cash session **390** closes when they exist; short days not padded. Named **NO PATH** / **WAITING**. Proxy labeled. Replace any **5m** fallback.

## Done when

Pytest green. No Massive from Next.js.
