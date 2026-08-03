# Seed AC4-1 — Mike + Alpha: Data-bearing floor on app APIs

**Project:** p-access-control  
**Agents:** Mike · Alpha  
**Depends on:** AC2-G  
**Spec:** §§4.2.2, 11.2, 15.5–6  

---

## Intent

Trade-log / journal / playbook: signed-in owner always **read + export**; writes respect policy. deny_plans does not strip floor.

---

## Files in scope

- App bootstrap / list / export routes for DATA_BEARING_APPS  
- `require_access(..., capability=...)` wiring  

## Out of scope

Admin UI; campaign bulk.

---

## Completion

- [ ] Activator denied write, allowed GET/export under restrictive policy  
- [ ] Mike APPROVED isolation + floor  

## Feeds

→ AC4-2 · AC4-4
