# P1-G — Preform calendar (mandatory)

**Status:** PASS  
**Date:** 2026-08-10  

## Evidence

| Item | Result |
|------|--------|
| Migration 118 | `next_expirations_json` · `expirations_as_of` · `strike_step` |
| Write path | `universe_admin.write_chain_calendar` |
| Freshness | same UTC session day (`calendar_is_fresh`) |
| Expirations API | **store-first**; live scan + write-through if stale/missing |
| Response | `source`: preform \| live_scan \| live_scan_write_through |

## Law

OC11 **required** — not optional. Delta PASS.
