# Symbology & Registry Service — Juliet board

**Spec:** `Specs/FatTail-Labs-Symbology-Registry-Service-Spec-v0_2_1.md` sha1 `c87580829301d9a44e678641023e32c07bca58d6`  
**Plan:** `docs/Symbology-Registry-Service-Full-Agent-Bench-Plan-v1.0.md`  
**Token:** `agents/go/SYM0-W0.md`  
**DL:** **DL-771**

**Open REQs:** REQ-001 OPEN · REQ-002 OPEN · REQ-003 OPEN (PNG **on main** blob `f09d78735399a7d4fe78d13ee5fe21e3c4707ab6` — SYM3 unblocked).

| Gate | Packet | Seat | Machine | Status |
|------|--------|------|---------|--------|
| SYM0-G | Advisor pass v0.2.1 | India | StudioTwo | **PASS** · **DL-772** |
| SYM1-G | Registry API + SYM laws + PP-1 initial rows | Alpha + Kilo | StudioOne **CP-1** | **PASS (GO)** |
| SYM2-G | Tagged fixture §5 | Alpha + Kilo | StudioTwo (file) | **PASS (GO)** |
| SYM3-G | REQ-003 tile + dialog | Echo + Charlie | StudioTwo | **IN FLIGHT** |
| SYM-SWAP-G | Delete fixture; live API | Alpha + Charlie + Delta | StudioOne CP-1 + StudioTwo | after SYM1+SYM3 |
| SYM-AT | SYM-AT-1…14 artifacts | Kilo + Delta | both | after SWAP |
| AP-1 | Joint: tile → dialog → selection → chart LIVE | Coach | StudioTwo browser | last |

Juliet executes packets. Grok Build does not implement. Auto-GO on clean gates. Stop + GO/NO-GO on a problem.
