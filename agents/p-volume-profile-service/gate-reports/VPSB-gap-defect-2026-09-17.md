# VPSB gap defect — print_absence mixed units

**Clock:** 2026-09-17 ~09:30 ET StudioTwo · writer bootout → regen → bootstrap  
**Law:** one `print_absence` after ≥ 300 s silence in SCHEDULED-OPEN; close at next print.

## Cause

`maybe_absence` compared `time.time_ns()` to vendor `t` stored as **ms**, scaling only from `now_t`. Every print looked like a multi-year hole.

## Before (false)

| Product | Prints | print_absence lines |
|---------|-------:|--------------------:|
| ES | 27417 | 25033 |
| MES | 23166 | 30511 |

All `kind=print_absence`. Zero `feed_liveness`.

## After regen from raw prints (SoR)

| Product | Prints | print_absence | other |
|---------|-------:|--------------:|------:|
| ES | 27419 | **0** | 0 |
| MES | 23166 | **0** | 0 |

Tape had no ≥300 s hole. Writer restarted PID from `launchctl bootstrap`. `:3000`/`:4000` left up.

## Tests

`tests/test_vp_futures_collector.py`: mixed-units live tape → no gap; 301 s silence → exactly one; regen keeps `feed_liveness`. 32 VP tests passed.
