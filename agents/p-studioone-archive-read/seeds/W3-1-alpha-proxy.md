# Seed W3-1 — Alpha Labs proxy + cache

**Agent:** Alpha  
**Depends:** W2-G  
**Law:** SO-AR v0.8 + Amendment A1 · plan v2.1 · spec §6–7 · FP10–13 · AT-SOAR-19…26, 29  
**Files:** `server/routes/ssr_archive.py` · `server/config.py` (absent OK, malformed abort) · cache root under configured dir  
**Out:** MiniTwo, admin panel, StudioOne bounce

## Ask

Member `/api/me/options-lab/archive/{coverage,index,fetch}` — **session only**.  
Admin `/api/admin/options-lab/archive/{stats,cadence}` — **administrator**.  
Gzip. Coverage ETag + must-revalidate. Disk cache 20 GB whole-day LRU, hash in key. 501 if unconfigured. Unreachable coverage empty+named.

## Done when

Characterization tests pass without a live StudioOne (mock `_studioone_get`).
