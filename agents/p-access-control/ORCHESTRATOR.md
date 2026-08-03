# p-access-control — Orchestrator Playbook

**Charter:** [`CHARTER.md`](./CHARTER.md)  
**Full plan:** [`docs/Access-Control-v0.4-Full-Agent-Bench-Plan.md`](../../docs/Access-Control-v0.4-Full-Agent-Bench-Plan.md)  
**Spec:** [`Specs/FatTail-Labs-Access-Control-Spec-v0.4.md`](../../Specs/FatTail-Labs-Access-Control-Spec-v0.4.md)  
**Seeds:** [`seeds/`](./seeds/)  
**Gates:** [`gate-reports/`](./gate-reports/)  

**Your role (Coach):** Open sessions, load seeds, receive PASS/FAIL/BLOCKED. Do not implement packets personally.  
**Juliet:** Owns board updates and seed quality; does not execute implementation seeds.

---

## Current junction

### NOW: **W0 — Spec lock / plan review**

Spec v0.4 is DRAFT. Run review seeds **AC0-1 … AC0-5**, then **AC0-G**.  
**No AC1+ code until Coach stamps BUILD AUTHORITY** on Spec v0.4 (or a successor).

| Step | Status | Who | Seed |
|------|--------|-----|------|
| AC0-0 Coach intent / GO framing | **NEXT** | Coach | `seeds/AC0-0-coach-go.md` |
| AC0-1 India architecture | pending | India | `seeds/AC0-1-india-spec.md` |
| AC0-2 Mike security | pending | Mike | `seeds/AC0-2-mike-security.md` |
| AC0-3 Tango member trust | pending | Tango | `seeds/AC0-3-tango-copy.md` |
| AC0-4 Echo UI notes | pending | Echo | `seeds/AC0-4-echo-ui.md` |
| AC0-5 Sierra SEO | pending | Sierra | `seeds/AC0-5-sierra-seo.md` |
| AC0-G Delta spec lock | pending | Delta | `seeds/AC0-G-delta-spec-lock.md` |
| Coach BUILD AUTHORITY | blocked on W0-G | Coach | — |
| AC1 Engine core | blocked | Alpha·India·Kilo | plan §6 AC1 |
| AC2 Admin API | blocked | Alpha·Mike·Kilo | … |
| AC3 Lessons | blocked | Alpha·Charlie·Tango·Kilo | … |
| AC4 Apps floor | blocked | Mike·Alpha·Charlie·Kilo | … |
| AC5 Admin UI | blocked | Charlie·Echo·Mike·Kilo | … |
| AC6 Catalog/SEO | blocked | after AC5 | … |
| AC7 Campaigns/gates | blocked | after AC6 | … |
| AC8 Close | blocked | Lima·Delta | … |

---

## How to run a junction

1. Read **Current junction**.  
2. New agent session in Fattail-Labs.  
3. Load seed: `Load and execute agents/p-access-control/seeds/<file>.md`.  
4. Agent returns PASS/FAIL/BLOCKED + evidence.  
5. Coach: **advance · re-seed · stop**.  
6. Phase end → Delta seed only; no waived gates.

---

## Critical path

```text
W0-G + BUILD AUTHORITY
  → AC1-G → AC2-G → AC3-G → AC5-G   (MVP)
  AC4-G parallel after AC2-G
  → AC6-G → AC7-G → AC8-G
```

---

## Out of scope drift watch

- Re-auth redesign, new billing  
- Making all course pages fully dynamic for personalization (forbidden; skeleton hydrate)  
- Public `/api/access/decision`  
- Write-time frozen expanded plan lists (v0.4 forbids)

---

## Board update rule

After each gate report lands in `gate-reports/`, Juliet or Coach updates this table’s **Status** column the same day.
