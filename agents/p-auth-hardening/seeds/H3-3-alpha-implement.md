# Seed H3-3 — Alpha implement allowlist

**Project:** p-auth-hardening  
**Agent:** Alpha  
**Depends on:** H3-1 APPROVED, H3-2 APPROVED, Coach allowlist values  

---

## Intent

Implement allowlist; remove auto-promote from WP admin role alone.

---

## Files likely

`server/config.py` or `admin_allowlist.py`, `routes/auth_routes.py` SSO branch, tests, DL.

## Completion

- [ ] Non-listed WP admin → no new administrator override  
- [ ] Listed path works  
- [ ] Fail loud if config invalid outside intentional empty list (Coach: empty = no SSO admins)  

## Feeds

H3-4  
