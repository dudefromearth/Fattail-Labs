# W8-G — acceptance set

**Agent:** Delta  
**Date:** 2026-08-28  
**Verdict:** **PASS**

**Law:** spec §10 · plan §5. HOLD C6 is not a fail. Nothing gated on Basic, TPO, or 1×. No row waived.

## GO set

| ID | Verdict |
|----|---------|
| C1 C2 C3 C4 C5 C7 C8 C9 C10 | **PASS** (W1–W7 walks + units) |
| **C6** | **HOLD** — Basic. Not a fail. |
| **C11** | **PASS (recorded)** — native 390-tick session: occupancy digest **3,905 B**, today gens JSON **52,853 B**, heap **157 MB**; same session + archive 2026-08-26 coarse (82 gens): digest **3,917 B**, archive gens JSON **12,253 B**, heap **157 MB**. Infill **not waited**; not claimed full-fidelity. Decay **not shipped this GO**; ladder **not frozen**. No ceiling named. `evidence/w8-c11-resident-bytes.json`. |

C8: after a second past day, one `archiveDay` (`2026-08-17`); today count still 390.

KEEP extras (Coach, after W7-G): live algos skip while playhead is up; To Trade Log hidden **and** refused. Characterized, not waived.

Kilo table: `reviews/W8-1-kilo.md`. ATM-7/8, ATM-15, ATM-17, Instant Replay film rows: **HOLD**, not FAIL.

This-session e2e re-run: W1, W3 watermark, W4, W5, W6, W7, W8-C11 **PASS**. C6 **HOLD**. Nothing waived.

## Unblocks

W9 help.
