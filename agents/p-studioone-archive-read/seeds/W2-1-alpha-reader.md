# Seed W2-1 — Alpha archive reader

**Project:** p-studioone-archive-read  
**Agent:** Alpha  
**Depends:** W1-G PASS  
**Law:** spec v0.8 + Amendment A1 · plan v2.1 · AT-SOAR reader set  
**Files:** `server/market_data/ssr_archive_read.py` · `server/tests/test_ssr_archive_read.py` · `server/tests/test_ssr_archive_ladder.py`  
**Out:** StudioOne bounce, Labs proxy HTTP, admin UI, tap writes

## Ask

Implement the reader against tmp_path fixtures. Must:

1. Reconstruct `t` in `[D 00:00 NY, D+1 00:00 NY)`. **No local-date candidate test.**  
2. Order and hash by reconstructed `t`. **No name-sorted ladder ships.**  
3. Derived `S`/`k`; disjoint ladder; `next_index`.  
4. Index: `t,file,bytes,hole` only. Envelope open is a **named branch for two-in-window files only**, never a quiet `json.loads` on the hot path.  
5. DST cascade FP20; hole `AMBIGUOUS INSTANT`.  
6. Today 409; expiration optional assertion; 0DTE.  
7. Cadence + health without walking envelopes.  
8. Friday-flat SPY.

## Done when

Named tests pass. No dash bounce.
