# Trader Development Phase 1 — Agent Bench Plan

**Program:** [`agents/p-trader-development/`](../agents/p-trader-development/)  
**Full plan:** [`Trader-Development-Full-Agent-Bench-Plan-v1.0.md`](./Trader-Development-Full-Agent-Bench-Plan-v1.0.md)  
**Spec:** [`Specs/FatTail-Labs-Trader-Development-Phase-1-Own-Spine-v1.0.md`](../Specs/FatTail-Labs-Trader-Development-Phase-1-Own-Spine-v1.0.md)  
**Type:** Product + architecture (Own spine)  
**Gate prefix:** `TD1-*`  
**Prerequisite:** TD0-G PASS

---

## Mission

Ship **Playbook** (character under risk) + **Campaign** (practice season) + **trade links** + **adherence vs book**.

**Mode:** Own. Match deferred. Refuse backtester / edge theater.

---

## Critical path

```text
TD1-1 India model → TD1-2 Mike → TD1-3/4 Alpha schema+API
  → TD1-5/6 Charlie UI → TD1-7 Echo → TD1-8 Tango
  → TD1-9 Kilo → TD1-10 export → TD1-G
```

---

## Seeds

| Seed | Agent | Work | Completion criteria |
|------|-------|------|---------------------|
| **TD1-0** | Coach | Phase 1 GO if not covered in TD0-0 | BUILD AUTHORITY Phase 1 |
| **TD1-1** | India | Domain: playbook, campaign, FKs, SL bridge, Practice Context | Written model + Spec amend if needed; no dual-campaign confusion |
| **TD1-2** | Mike | Isolation + purge/export inventory | Checklist signed; Family B |
| **TD1-3** | Alpha | Migrations + domain CRUD | Tables live; fail loud identity |
| **TD1-4** | Alpha | Trade links, filters, adherence prompt data | APIs curl-proven |
| **TD1-5** | Charlie | `/app/playbook` replace stub | Create/edit/archive + tags |
| **TD1-6** | Charlie | Campaign UI + Practice Context active campaign + blotter | Season create/activate; filters |
| **TD1-7** | Echo | Visual density pass | HIG; empty states |
| **TD1-8** | Tango | Copy pass | Covenant language; no shame |
| **TD1-9** | Kilo | Tests isolation CRUD filters | pytest green |
| **TD1-10** | Alpha | Export/import portable keys | Round-trip or residual filed with Coach |
| **TD1-G** | Delta | E2E evidence | Member path: book → season → trade → filter → adherence |

---

## Invariants

- Playbook ≠ strategy lab pack compile.  
- Campaign = practice season (not marketing `/campaign`).  
- Max one clear “active campaign” in chrome.  
- Adherence remains human-set in v1.  
- Family B absolute.

---

## Exit (TD1-G)

1. Playbook CRUD live.  
2. Campaign season live with Practice context.  
3. Trades link to playbook + campaign; blotter filters work.  
4. Adherence prompt references playbook when in scope.  
