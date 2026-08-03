# Seed AC0-2 — Mike Security & Authz

**Project:** p-access-control  
**Agent:** Mike  
**Depends on:** Spec v0.4  
**Spec:** `Specs/FatTail-Labs-Access-Control-Spec-v0.4.md` §§4.2, 8, 12  

---

## Intent

Security review: no enumeration oracle, ungateable remedies, preview-as, data floor, SSO boundary.

---

## Read first

1. Spec v0.4 §§3, 4.1–4.2, 8, 12  
2. Identity Access Spec (session, roles)  
3. Member Data Privacy Spec  

---

## Deliverable

**APPROVED** or **RETURNED** on:

1. Admin-only decision APIs; no public probe  
2. Ungateable constant + CTA reachability  
3. Preview cookie: HttpOnly, TTL, write suppress, empty enrollments  
4. Data-bearing read/export floor vs deny_plans  
5. Revalidation not a security boundary (OK)  
6. Any open redirect / href allowlist gaps  

---

## Out of scope

UI design, SEO.

## Completion

- [ ] Review filed  
- [ ] APPROVED or RETURNED  

## Gate

Required for AC0-G.
