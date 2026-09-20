# StudioOne Data Plane & Remote UI — Juliet board

**Spec:** `Specs/FatTail-Labs-StudioOne-Data-Plane-Spec-v0_1.md` **DRAFT**  
**Arch:** `Architecture/36-studioone-data-plane.md`  
**Design:** `Architecture/36-studioone-data-plane-design.md`  
**Plan:** `docs/StudioOne-Data-Plane-Full-Agent-Bench-Plan-v1.0.md`  
**Token:** `agents/go/SODP0-W0.md`  
**DL:** **DL-777** (intake)

**Status:** Review — **not BUILD.** No history rewrite until Coach stamp + SODP2-W0.

**Open REQs:** REQ-001 OPEN · REQ-002 OPEN · REQ-003 OPEN.

| Gate | Packet | Seat | Machine | Status |
|------|--------|------|---------|--------|
| SODP0-G | Advisor + design + infra + auth | India → Echo+Tango → Foxtrot → Mike | StudioTwo read-only | **SEEDED** |
| SODP1-G | Inventory | Kilo | both, read-only | after SODP0 |
| SODP2-G | History provider TS-1 | Alpha + Foxtrot + Kilo | StudioOne **CP-1** | HOLD stamp |
| SODP3-G | Labs hop OHLC | Alpha + Charlie | StudioTwo | HOLD |
| SODP4-G | MiniTwo hop | Foxtrot + Mike | MiniTwo **named** | HOLD |
| SODP5-G | Retire StudioTwo leftovers | Foxtrot | StudioTwo | HOLD |
| SODP6-G | MacBook UI host | Foxtrot + Charlie | MacBook **named** | HOLD |
| AP-1 | Pan June ES+MES | Coach | StudioTwo browser | not "done" |
| SODP-H-G | Hardening: tests, no dangle, purpose-built | Kilo + Alpha + Charlie + India + Echo + Foxtrot + Delta | after AP-1 | **HOLD** · SODP-10 |

Juliet executes packets. Grok Build does not implement. Auto-GO on clean gates. Stop + GO/NO-GO on a problem.
