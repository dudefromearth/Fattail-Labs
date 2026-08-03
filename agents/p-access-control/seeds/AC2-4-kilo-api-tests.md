# Seed AC2-4 — Kilo: Admin API characterization

**Project:** p-access-control  
**Agent:** Kilo  
**Depends on:** AC2-2, AC2-3  
**Spec:** §15 items 5–8, 10  

---

## Intent

HTTP-level tests for admin write validation, audit, no public oracle.

---

## Files in scope

- `server/tests/test_access_control_admin_api.py` (or equiv)  

---

## Required cases

| Case | Expect |
|------|--------|
| PUT surface:login | 422 |
| PUT app:trade-log mode hard | 422 floor message |
| PUT selected_plans observer-trial | stored as intent; GET not pre-expanded list |
| bulk same validation | 422 on illegal row |
| audit after write | row present |
| non-admin decision | 401/403 |
| GET /api/access/decision (if any) | 404 |
| admin batch decision | 200 for admin |

---

## Completion

- [ ] pytest green  
- [ ] Evidence pasted  

## Feeds

→ AC2-G
