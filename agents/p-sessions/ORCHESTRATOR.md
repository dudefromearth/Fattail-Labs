# Orchestrator — Sessions (Global Session Clock)

**Juliet** runs this board after GO. This file is Coach's control panel.

**Plan:** [`docs/Sessions-Global-Session-Clock-Full-Agent-Bench-Plan-v1.2.md`](../../docs/Sessions-Global-Session-Clock-Full-Agent-Bench-Plan-v1.2.md) **v1.2**  
sha1 `ae068f612b6cb5e2f413f3e497c8e296d6183304`  
**Spec:** [`Specs/FatTail-Labs-Sessions (Global Session Clock).md`](../../Specs/FatTail-Labs-Sessions%20(Global%20Session%20Clock).md)  
sha1 `81984ba9f2394d52aa359cefcdb108451fdec9e3` · **not BUILD AUTHORITY until GSC0-0**  
**W0 token:** [`agents/go/GSC-W0.md`](../go/GSC-W0.md) **DRAFT — every box unticked**  
**DL-328:** chat “go” is not the stamp.

### NEXT

**GSC7-G PASS** (dev). GSC6-0 still blocked on host map — Mini Two is production; do not stage there. No deploy.

| Phase | State |
|-------|--------|
| GSC0-0 | **GO** 2026-09-09 · DL-685 |
| GSC0-G | **PASS** |
| GSC1 | **PASS** GSC1-G |
| GSC2 | **PASS** GSC2-G (axis + sessionView) |
| GSC3 | **PASS** GSC3-G |
| GSC2.5 | **PASS** GSC2.5-G |
| GSC4 | **PASS** GSC4-G · OD-S4 (c) |
| GSC5 | **PASS** GSC5-G |
| GSC6 | **BLOCKED** — Mini Two is still production; no Labs staging vhost |
| GSC7 | **PASS** GSC7-G · Spec v0.3 · DL-687 |
| OD-S4 | **(c)** reconstruct · `evidence/echo-visual-contract.md` |
| OD-S8 | **(a)** keep `Sessions` |

### GSC0 evidence (2026-09-09, Ernies-MacBook-Pro.local)

| Packet | Artifact | State |
|--------|----------|--------|
| GSC0-1 India | [`evidence/india-checklist.md`](./evidence/india-checklist.md) | written |
| GSC0-2 Hotel | [`evidence/hotel-calendar.md`](./evidence/hotel-calendar.md) | written · **zero date diffs** |
| GSC0-3 Echo | [`evidence/echo-ia.md`](./evidence/echo-ia.md) | written |
| GSC0-4 Tango | [`evidence/tango-copy.md`](./evidence/tango-copy.md) | written |
| GSC0-5 Charlie | [`evidence/charlie-feasibility.md`](./evidence/charlie-feasibility.md) | written · HTML **missing** |
| GSC0-6 Mike | [`evidence/mike-boundary.md`](./evidence/mike-boundary.md) | written |
| GSC0-9 Lima | [`evidence/lima-dl-draft.md`](./evidence/lima-dl-draft.md) | written · not filed |
| GSC0-7 Kilo | [`evidence/characterization-list.md`](./evidence/characterization-list.md) | written |

### Critical path (after stamp)

```text
GSC0-0 → GSC0-G → (GSC1 ∥ GSC2-axis) → GSC2-view → GSC2-G → GSC3 → GSC4 → GSC5 → GSC6
```

GSC4 entry: OD-S4 (a) HTML sha1 **or** (c) Echo reconstruct. **Not GSC0-G.**  
`session-clock.html` was **not found** this session → OD-S4 (c) or stop is live.

### Do not

- Stamp this board in chat.  
- Start GSC1+ code before GSC0-0 + GSC0-G.  
- Fail GSC0-G because the HTML is missing.  
- Write `timeAxis.ts` / `exchanges.ts` from GSC2-view.  
- Touch Options Lab / Runner / Market Bus / Quant / LIM.  
- Deploy Mini Two / Dude Two / Dude One from this phase.
