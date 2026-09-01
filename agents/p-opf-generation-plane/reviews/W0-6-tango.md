# W0-6 — Tango visibility copy

**Agent:** Tango  
**HEAD:** `374ed86`  
**Date:** 2026-09-01  
**Substitution used:** OPF Reference absent — GXA0 + spec §2 / §7 / §10.  
**Out honored:** no chrome · no profit claims

**Verdict:** **APPROVED.** State names are honest if the route keeps them distinct. Heatmap’s existing “Chain GEX (estimate)” string is **not** this envelope and must not leak onto a `book: "wings"` visibility payload.

---

## Envelope states (spec §7)

| State | Member meaning | Must not read as |
|-------|----------------|------------------|
| **present** | Owned generation, not past max-stale | “live dealer GEX” / a forecast |
| **stale** | We still have the book; it is old; we say so. Last known is not a lie | An outage, or a silently refreshed mark |
| **cold** | No owned generation. Empty is not broken | “the app is down” / “the market is quiet” |
| **broken** | Bus down / misconfigured. A named failure | A quiet tape |

Feed clock and store clock may disagree without either being wrong (GP8). Refcount is not warmth (GP9).

**Empty ≠ outage.** `cold` is the honest empty grid. `broken` is the honest Redis/config failure. Collapsing them is a Tango block at P3.

**No chain GEX on a window.** `book: "wings"` is a window. Copy, tooltip, export, print: never “chain GEX”. GP7 / Hotel W0-4.

Capacity-over-dependency: the member is told what the server actually holds, not that a Surface is “ready to trade.”
