# SOAR-A2-W0 — StudioOne Archive Read Amendment A2

**ID:** `SOAR-A2-W0`  
**Plan:** [`docs/StudioOne-Archive-Read-API-Amendment-A2-Full-Agent-Bench-Plan-v1.0.md`](../../docs/StudioOne-Archive-Read-API-Amendment-A2-Full-Agent-Bench-Plan-v1.0.md) **v1.0**  
**Law:** Spec **v0.8** + Amendment **A1** + Amendment **A2_1**  
`Specs/FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_8-Amendment-A2_1.md`  
sha1 `4cb4ffce5c9d0928b6beb5dd7c3b1e867df61f10`  
**Board:** `agents/p-studioone-archive-read/` — A2 strip. v2.1 GO is not this program.

**Status:** **W-G PASS 2026-08-29.** A2 closed. One carry: **AT-SOAR-45** Monday-open. Stats first backfill 14 days. **TMOS W1–W3 next.**

Cite **A2_1**, not `…-Amendment-A2.md`.

---

## Required ticks

| # | Kind | Question | Juliet rec | Coach |
|---|------|----------|------------|-------|
| **A2_1** | Accept the document | Amendment A2_1 (after the A2→A2_1 diff and the A2-2 COUNTS carve-out) | Stamp this file | **Accept** (2026-08-29). Byte-identical to A2 plus the COUNTS carve-out. Diff confirmed. |
| **§9.2** | **Accepted** | `marks/` unserved (v0.8) | Reverse. Serve. Written without knowing what the tape held. | **Accept** — reverse. Serve the tape. That position was written without knowing what was on it. |
| **near** | **Decision** | How far is “near” | A2 set no threshold. Reusing chain GAP (2.5× cadence, 15 s floor) is defensible **only after the tape rate**. 2026-08-27 VIX: RTH p50 **5.78 s**, not 1 s. 15 s ≈ **2.6 marks**, not 15. Nearest-in-time during RTH is half an interval (~3 s); 15 s is the stall/GAP detector. Rec: keep 15 s as GAP floor, or overrule. | **15 seconds is the GAP floor.** VIX marks land every 5.7 s, so 15 is 2.5× the marks cadence — the same multiplier the chain uses, landing on a different number because the tape is slower. Typical nearest during RTH is about 3 s, half an interval. Fifteen is the stall detector, not the match distance. On 08-27 it would have fired exactly twice, on the two real stalls at 20.9 s, and never during the session. That is the right shape. |
| **COUNTS** | **Decision** | 08-14 COUNTS-missing | Carve-out **in A2-2**, scoped to the **flat layout only** (129 snaps, one book, unambiguous SPY). Not a general “identify it anyway” path. | **Accept as written in A2-2.** Scoped to 08-14 only, flat layout, 129 snaps, one book. Nested `chain/<SYM>/` still 404s when COUNTS cannot identify it. Do not let this become a general identify-it-anyway path. |
| **bounce** | **Yours, not W0-0** | Dash bounce | Not authorised by A2_1. **W5-GO.** | stays Coach. **W5-GO.** Time Machine does not move. |

**Fold when the route is built (Coach, 2026-08-29):** a daily stats flag on any day whose VIX source is not native. The feed fix leaves VIXY as a labelled fail-over, which is correct — but a future entitlement lapse would silently return us to ETP prices, and that is exactly how this went unnoticed for thirteen days.

**W1:** AT-SOAR-50 and 55 both fail today and their failing is the evidence. **A fixture does not close 50.**

---

## Stamp block

```
W0-0 STAMP
Date: 2026-08-29
A2_1 + §9.2 + near + COUNTS + bounce:
  A2_1 Accept (byte-identical to A2 plus COUNTS carve-out; diff confirmed)
  §9.2 reverse accepted — serve the tape
  near = 15 s GAP floor (stall detector; 2.5× marks cadence)
  COUNTS carve-out accepted as written in A2-2 (flat 08-14 only)
  bounce stays Coach at W5-GO; Time Machine does not move
W0-BA: GO 2026-08-29 (Coach, same word as W0-0)
Plan stamped: v1.0
Law: SO-AR v0.8 + A1 + Amendment A2_1
W5: not without Coach word
W1: characterize — AT-SOAR-50 and 55 fail today; a fixture does not close 50
```

W0-2…W0-G still file (India · Mike · Hotel · Echo · Tango). They do **not** re-block W1: Coach granted W0-BA in this word.

No product code in W0. W1+ is characterization then ship. Dash bounce is **still** W5-GO.
