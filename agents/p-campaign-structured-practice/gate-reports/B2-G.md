# B2-G — Process witness at fill (partial)

**Status:** PASS (core)  
**Date:** 2026-08-08  

## Landed

- `witness_process_bounds_at_fill` — boundary only; goals ignored  
- Trading window variance when fill day outside `starts_at`/`ends_at` — **logs 200**, quiet `charter_variance` on create response  
- Asset/strategy scope set checks when basis/unit lists present  
- Kilo: `test_fill_after_ends_at_logs_with_window_variance`  

## Not yet

- Risk/size numeric witness (needs size fields on trade DTO)  
- Strategy-type derivation (disposition #8 trail)  
- Durable per-fill variance stamp table (India (b) full)
