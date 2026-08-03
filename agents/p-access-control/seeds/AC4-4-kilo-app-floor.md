# Seed AC4-4 — Kilo: App floor tests

**Project:** p-access-control  
**Agent:** Kilo  
**Depends on:** AC4-1  
**Spec:** §15.5–6  

---

## Required cases

| Case | Expect |
|------|--------|
| deny_plans member GET trade-log | 200 |
| same POST create | 403 |
| PUT admin hard trade-log | 422 (admin API) |
| export endpoint | 200 for owner under floor |

---

## Completion

- [ ] pytest green + evidence  

## Feeds

→ AC4-G
