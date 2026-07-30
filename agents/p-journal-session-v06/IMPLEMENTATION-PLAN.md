# Implementation Plan — p-journal-session-v06

**Canonical full agent bench plan:**  
[`docs/Journal-Session-v0.6-Full-Agent-Bench-Plan.md`](../../docs/Journal-Session-v0.6-Full-Agent-Bench-Plan.md)

**Spec:** [`Specs/FatTail-Labs-Journal-Session-Spec-v0.6.md`](../../Specs/FatTail-Labs-Journal-Session-Spec-v0.6.md)  
**Board:** [`ORCHESTRATOR.md`](./ORCHESTRATOR.md)

---

## Sequencing

```
Tag Manager COMPLETE
  → J0 full-bench review + Coach GO
  → J1 UNIQUE merge + calendar
  → J1b ‖ J1c ‖ J6 ‖ T1 ‖ J4 ‖ W1
  → J2 agent → J3 ‖ J5
  → J7 retro → J8 closure → J9 close
```

**Critical path:** J0 → J1 → J2 → J8 → J9

---

## Phases

| Phase | Deliverable | Primary | Spike? |
|-------|-------------|---------|--------|
| J0 | GO + §17 locks + DL | Coach · full bench | — |
| J1 | UNIQUE + merge + bands | Alpha · India · Kilo | partial API |
| J1b | Calendar nav | Charlie · Echo | yes |
| J1c | Fixed day surface | Charlie · Echo · Tango | yes |
| W1 | Week map | Alpha · Charlie | yes |
| J2 | Agent integrity | Alpha · Hotel · Mike | partial |
| J3 | Prompt versions | Alpha · Charlie | no |
| J4 | Tags | Charlie · Echo | yes |
| J5 | Interview bar | Charlie · Echo | yes |
| J6 | Header media | Mike · Charlie | yes |
| T1 | Trades strip | Alpha · Charlie · Hotel | yes |
| J7–J9 | Retro · closure · export | Alpha · Delta · Lima | partial |

Every seed, gate, and verification command: **canonical full plan**.
