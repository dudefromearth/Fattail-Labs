# Seed H5-1 — Foxtrot deploy

**Project:** p-auth-hardening  
**Agent:** Foxtrot  
**Depends on:** W0-G PASS  
**Plan:** `plans/H5-deploy.md`  

---

## Intent

Deploy current `main` (auth logout/SSO + pending migrations) to staging and/or production per Coach W0.

---

## Read first

`infra/deploy.md`, plan H5, git log for f07a8ae / fca01d7 / 7415c01  

---

## Files in scope

- Deploy ops only; touch `infra/deploy.md` only if checklist wrong  

## Out of scope

New features.

---

## Completion

- [ ] Pull + migrate + web build + restart (documented host)  
- [ ] `curl /api/health`  
- [ ] Note applied migrations (075?)  
- [ ] Evidence in `gate-reports/H5-1-deploy-evidence.md`  

## Feeds

H5-2 · H5-G  
