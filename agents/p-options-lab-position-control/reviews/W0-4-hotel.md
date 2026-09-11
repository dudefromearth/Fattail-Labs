# W0-4 Hotel — classifier table confirm (Spec v1.2 §4.4)

**Date:** 2026-09-11  
**OD-PC-P2:** (a) same day as GO. Not a gate on starting. PC2 must not write classifier code before this confirm.

## Confirm

The signed pattern is the test. A structure matches a row only if its signed pattern, **read in strike order on the normalized ratio**, is one of the two listed for that row. Anything else is **CUSTOM**.

| Legs | Dates | Rights | Long form · short form | Additional | → |
|---|---|---|---|---|---|
| 1 | 1 | one | `+1` · `−1` | — | Single |
| 2 | 1 | one | `+1/−1` · `−1/+1` | different strikes | Vertical |
| 2 | 1 | both | `+1/+1` · `−1/−1` | same strike | Straddle |
| 2 | 1 | both | `+1/+1` · `−1/−1` | different strikes | Strangle |
| 2 | 2 | one | `+1/−1` · `−1/+1` | same strike | Calendar |
| 2 | 2 | one | `+1/−1` · `−1/+1` | different strikes | Diagonal |
| 3 | 1 | one | `+1/−2/+1` · `−1/+2/−1` | wings equal | Butterfly |
| 3 | 1 | one | `+1/−2/+1` · `−1/+2/−1` | wings unequal | BWB |
| 4 | 1 | one | `+1/−1/−1/+1` · `−1/+1/+1/−1` | — | Condor |
| 4 | 1 | both | `+1/−1/−1/+1` · `−1/+1/+1/−1` | body strikes shared | Iron Fly |
| 4 | 1 | both | `+1/−1/−1/+1` · `−1/+1/+1/−1` | body strikes separated | Iron Condor |
| anything else | | | | | CUSTOM |

**Wing equality:** strike distance in points — equivalently listed-grid steps. Not percent, not premium.

**All-long 1-2-1** (`+1/+2/+1`) matches neither butterfly form → **CUSTOM**.

**BWB shares the butterfly signed pattern.** Unequal wings is the only separating axis.

**3-lot** `+3/−6/+3` normalizes to `+1/−2/+1` → Butterfly when wings equal.

No aliases. No thirteenth name. CUSTOM is arrived at, never selected.

**Hotel: confirmed.** Classifier code at PC2 must match this table exactly.
