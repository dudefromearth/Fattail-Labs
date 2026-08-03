# Seed AC2-2 — Alpha: Admin policy CRUD + bulk + audit + revalidate

**Project:** p-access-control  
**Agent:** Alpha  
**Depends on:** AC2-1  
**Spec:** §§8.2, 9, 7 (revalidate)  

---

## Intent

Administrator-only policy write path: store **intent** (`selected_plans`), audit every write, trigger revalidation tags.

---

## Read first

1. Spec §8.2  
2. Existing admin auth patterns in `server/`  
3. Existing `/api/revalidate` / tag helpers in web or server  

---

## Files in scope

- Admin routes under `server/` for:
  - `PUT/GET/DELETE /api/admin/access/policies/{target_key}`
  - `POST /api/admin/access/policies/bulk`
  - `GET /api/admin/access/audit`
- Audit insert on every mutating write  
- `revalidate_for_targets` hook (may stub map then fill AC6)  
- CTA/redirect host allowlist validation  

## Out of scope

Decision preview endpoints (AC2-3); member UI; public decision route (**never**).

---

## Invariants

- **Do not expand on write**  
- Same validation for single PUT and bulk  
- Role: administrator only  
- Fail loud on invalid slugs / modes  

---

## Completion

- [ ] curl: PUT policy, GET back `selected_plans` unchanged by expand  
- [ ] audit row exists  
- [ ] ungateable PUT → 422  

## Feeds

→ AC2-3 · AC2-4
