# Trader Development Phase 0 — Agent Bench Plan

**Program:** [`agents/p-trader-development/`](../agents/p-trader-development/)  
**Full plan:** [`Trader-Development-Full-Agent-Bench-Plan-v1.0.md`](./Trader-Development-Full-Agent-Bench-Plan-v1.0.md)  
**Spec:** [`Specs/FatTail-Labs-Trader-Development-Phase-0-Foundation-Glue-v1.0.md`](../Specs/FatTail-Labs-Trader-Development-Phase-0-Foundation-Glue-v1.0.md)  
**Type:** Product enhancement (no new SoR)  
**Gate prefix:** `TD0-*`

---

## Mission

Make **existing** Practice surfaces tell one **trader development** story and make **Tags** daily-usable process language.

**Mode:** Own (framing + Tags productization) · Match none · Refuse new analytics theater.

---

## Sequencing

```text
TD0-0 Coach GO → TD0-1…4 reviews → TD0-5…7 implement glue → TD0-G
```

**Blocks:** TD1+ Own spine until TD0-G PASS (may allow TD1-1 India domain in parallel after GO if Coach says so — default: after TD0-G).

---

## Seeds

| Seed | Agent | Files (indicative) | Completion criteria |
|------|-------|--------------------|---------------------|
| **TD0-0** | Coach | Spec headers | Phase 0 BUILD AUTHORITY; doctrine locks |
| **TD0-1** | India | Phase 0 Spec | No new tables; scope tight; usability/reliability sections complete |
| **TD0-2** | Tango | Spec + UI string list | Process language; no profit claims |
| **TD0-3** | Echo | Notes / Figma-lite | Framing strip placement; empty states |
| **TD0-4** | Mike | Spec privacy notes | Tag Family B unchanged; no new leak surface |
| **TD0-5** | Charlie | `web/…/practice*`, trade-log, journal | Story chrome live; tag control obvious on trade + journal |
| **TD0-6** | Alpha | `server/…` analytics or list filters | Process/behavior tag filter API or query path |
| **TD0-7** | Kilo | `server/tests/` | Filter + isolation + export regression green |
| **TD0-G** | Delta | `gate-reports/TD0-G.md` | Evidence: UI path + tests; unlock TD1 |

---

## Invariants

- No playbook/campaign schema in TD0.  
- Tag Manager assign-only law.  
- No win-rate-by-tag.  
- Evidence at gate.

---

## Exit (TD0-G)

1. Framing visible on Practice suite.  
2. Member can assign tags on trade + journal without hunting.  
3. Process tag filter works on Reports or blotter.  
4. Export tests still green.  
