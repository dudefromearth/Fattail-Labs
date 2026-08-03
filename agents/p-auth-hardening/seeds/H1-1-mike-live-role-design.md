# Seed H1-1 — Mike live role design

**Project:** p-auth-hardening  
**Agent:** Mike  
**Depends on:** H3-G PASS  
**Plan:** `plans/H1-live-role.md`  

---

## Intent

Design live authorization for admin (minimum) without breaking Observer elevation.

---

## Deliverable

`gate-reports/H1-1-mike-design.md`:

1. `require_admin` algorithm (identity_id → derive_role / feature_role)  
2. Missing identity → 401/403  
3. identity_id 0 handling  
4. Scope: admin only vs critical list of routes  

## Feeds

H1-2  
