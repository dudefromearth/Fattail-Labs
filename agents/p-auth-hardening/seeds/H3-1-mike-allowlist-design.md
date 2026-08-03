# Seed H3-1 — Mike admin allowlist design

**Project:** p-auth-hardening  
**Agent:** Mike  
**Depends on:** H5-G PASS (or Coach GO on H3 in dev)  
**Plan:** `plans/H3-admin-allowlist.md`  

---

## Intent

Design only: how Labs decides who may become administrator via SSO.

---

## Deliverable

`gate-reports/H3-1-mike-design.md`:

1. Env allowlist vs DB — pick one for P0  
2. Match keys: email, WP external_id, provider  
3. Behavior when WP is_admin but not listed  
4. Behavior for existing role_override rows  
5. Coach must name initial allowlist  

## Out of scope

Code.

## Feeds

H3-2 · H3-3  
