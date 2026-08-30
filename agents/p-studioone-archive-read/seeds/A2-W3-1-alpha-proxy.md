# Seed A2-W3-1 — Alpha Labs proxy

**Project:** p-studioone-archive-read (A2 strip)  
**Agent:** Alpha  
**Phase:** W3  
**Depends:** W2-G PASS  
**Law:** A2_1 · plan v1.0 FP-A2-1, FP-A2-9 · spec §6–7  
**Gate it feeds:** W3-G

## Ask

`server/routes/ssr_archive.py`: member `GET /api/me/options-lab/archive/marks`. Same session gate as fetch. Same unreachable / 501 shapes. Browser never gets StudioOne URL.

No Time Machine caller. Coverage/index/fetch callers stay as they are.

## Out of scope

Dash. TM. Admin chrome.

## Done when

Proxy route + tests. No TM import.
