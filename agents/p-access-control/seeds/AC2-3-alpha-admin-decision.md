# Seed AC2-3 — Alpha: Admin decision APIs only

**Project:** p-access-control  
**Agent:** Alpha  
**Reviewer:** Mike  
**Depends on:** AC2-2  
**Spec:** §8.2 decision routes; §12 no oracle  

---

## Intent

Admin-only evaluate probes for cockpit/preview tooling. **Zero** public member decision endpoint.

---

## Files in scope

- `GET /api/admin/access/decision?target=`  
- `POST /api/admin/access/decision/batch`  
- Optional: expand-preview display helper (admin)  

## Out of scope

Member-facing `/api/access/*` (**forbidden**).

---

## Completion

- [ ] Admin auth required (401/403 without)  
- [ ] grep/route table: no public decision  
- [ ] Mike APPROVED  

## Feeds

→ AC2-4 · AC2-G
