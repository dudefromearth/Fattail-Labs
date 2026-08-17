# W6-1 — Charlie Edit dialog / last print ≠ outage (STUB)

**Agent:** Charlie  
**Depends on:** W4-G (may parallel W5)  
**Plan phase:** W6  
**Status:** Expand after W4-G. Do **not** fire now.

## Intent (locked)

Edit Position with held last print does **not** flash OPF unavailable. `printing=false` → one hydrate, no retry-loop. Named incomplete only when `print_quality=none`.

## Forbidden

Patching with more client clock SoR. That is the bug.
