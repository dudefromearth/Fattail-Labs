# P1b — India

**Agent:** India  
**Date:** 2026-09-01  
**Law:** GP21 erratum · E1 · E3 · Coach disposition (own process, not `main.py`)  
**Evidence:** `evidence/p1b-at-gp23-2026-09-01.md`

**Verdict:** **APPROVED** for P1b-G.

**AT-GP23 EXECUTION NOTE (signed):** Topic isolation (I:SPX 2026-09-01 **w10** vs member **w25**) substitutes for a global quiet window. The observed key is unmodified under `list_interest_topics("mb:ladder:")`, carries sidecar `plane`, and `chain_feed` wrote it with `mb:pub`. The member w25 key was not given a sidecar (it was already expired; the plane did not recreate it). This is an execution interpretation of “no member watching **this topic**,” not a spec edit.

| Check | Result |
|-------|--------|
| Own process, not `main.py` | **Yes.** |
| DL-539 not consumed | **Yes.** 1/3. Five modules frozen. |
| Wings-only; no listed pairs read | **Yes.** Source has no `LABS_OPF_LISTED_PAIRS`. |
| `bus_ladder_key()` only | **Yes.** |
| Same `mb:interest:{topic}` + sidecar | **Yes.** |
| SSR unloaded | **Yes.** |
| MiniTwo / hydrator / keys.py | **Untouched.** |
