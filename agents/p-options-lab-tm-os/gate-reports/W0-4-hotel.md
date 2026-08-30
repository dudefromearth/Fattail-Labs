# W0-4 Hotel — trading-domain (One Source v0.4 · plan v1.3)

**Agent:** Hotel  
**Date:** 2026-08-29  
**Depends:** W0-0 STAMP  
**Verdict:** **APPROVED**

## Findings

1. A StudioOne today-download is **print history**, not a live working market. Rehearsal KEEP extras still apply (live algos skip while playhead up; To Trade Log hidden and refused).
2. Left edge = first print StudioOne holds. Do not invent an open print the tap never wrote.
3. A late tap start is **not** the member’s late arrival (TMI-83 / TMI-89).
4. Replay VIX is the **marks tape**. Never live. Never VIXY-as-σ (OC5a). **`source` travels with the mid.** 08-27 is labelled `massive_proxy_v1` (VIXY dollars). 08-29 from 00:38:08 is `massive_index_v1` (native I:VIX). Relabelling a proxy day as native, or assuming proxy on a native day, is a false instrument — **severity high**.
5. A tape gap is **VIX NO**. `generation.vix` null is not a hole (TMI-95).
6. Named hole, never a live number that moves plausibly on a replayed panel (TMI-93 / OT-EF).

**BLOCKING later:** live VIX on a playhead-up panel; presenting 08-27 as I:VIX; reading VIXY dollars as vol percent.
