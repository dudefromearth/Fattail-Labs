# StudioOne Data Plane & Remote UI — Juliet board

**Spec:** `Specs/FatTail-Labs-StudioOne-Data-Plane-Spec-v0_1.md` **v0.1.5 DRAFT** · SODP0-G **PASS (GO)** — awaiting Coach stamp  
**Arch:** `Architecture/36-studioone-data-plane.md`  
**Design:** `Architecture/36-studioone-data-plane-design.md`  
**Plan:** `docs/StudioOne-Data-Plane-Full-Agent-Bench-Plan-v1.0.md` **v1.1** (v1.0 “move then F3” void)  
**Token:** `agents/go/SODP0-W0.md`  
**DL:** **DL-777** intake · **DL-778** SODP-H · **DL-779** send-back

**Status:** Review — **not BUILD.** F3 **is** the migration. No fill on StudioOne.

**Open REQs:** REQ-001 OPEN · REQ-002 OPEN · REQ-003 OPEN · REQ-004 HOLD · REQ-005 HOLD  
**WG-1 last cycle:** never (not armed — TOPO-1 backlog)

| Gate | Packet | Seat | Machine | Status |
|------|--------|------|---------|--------|
| SODP0-G | Advisor + design + infra + auth | India → Echo+Tango → Foxtrot → Mike | StudioTwo read-only | **PASS (GO)** · stamp request |
| SODP1-G | Census: consumers, Massive writers, CP-1 budget | Kilo + Foxtrot | both, read-only | **filed** (read-only; not SODP2) |
| SODP2-G | **F3 = migration** — provider born on StudioOne | Alpha + Foxtrot + Kilo | StudioOne **CP-1 arithmetic** | HOLD stamp |
| SODP3-G | Re-point every census row + attest | Alpha + Charlie + Kilo | StudioTwo | HOLD |
| SODP5-G | Delete old OHLC server whole (process, plist, grep) | Foxtrot + Alpha + Delta | StudioTwo | HOLD |
| SODP4-G | MiniTwo consumer (topology already spec §14) | Foxtrot + Mike | MiniTwo **named** | HOLD |
| SODP6-G | MacBook consumer | Foxtrot + Charlie | MacBook **named** | HOLD |
| AP-1 | Pan June ES+MES | Coach | StudioTwo browser | not "done" |
| After AP-1 | REQ-004 REFACTOR → REQ-005 HARDEN | own boards | after TOPO-1 AP-1 | **HOLD** · SODP-10 · SODP-MB (SODP-11) |

Juliet executes packets. Grok Build does not implement. Auto-GO on clean gates. Stop + GO/NO-GO on a problem.
