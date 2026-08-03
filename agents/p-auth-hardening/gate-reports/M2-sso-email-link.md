# M2 — SSO email / identity_link reconciliation

**Date:** 2026-08-03  
**Verdict:** **PASS**

## Delivered

- `identity.resolve_sso_identity()` — link-first, email update if free, 409 on collision  
- SSO callback + membership webhook use the same resolver  
- Tests: `test_sso_m2_email_link.py` (+ full SSO suite green)

## Rules

1. Prefer `(provider, external_id)`  
2. Email change on same WP user → update Labs email if free  
3. Email owned by another identity → 409  
4. Same email, two WP user ids → 409  

## Reevaluation

Next code optional: **M6 CSRF**. Host ops residuals unchanged.
