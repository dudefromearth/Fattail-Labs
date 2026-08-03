# H2-G — SSO JWT hygiene assessment

**Date:** 2026-08-02  
**Verdict:** **PASS (phase A)**

## Evidence

| Item | Result |
|------|--------|
| Labs SSO log | email **domain only** (no full email/JWT) |
| Deploy/nginx notes | `infra/deploy.md` Auth hardening H2 |
| SSO JWT TTL guidance | ≤120s stated for WP ops |
| Phase B POST exchange | **Deferred** |

## Residual

Nginx config on MiniThree must be applied by Foxtrot (not done from this host).  
WP TTL confirmation is operational.

## Reevaluation

| ID | Action |
|----|--------|
| H4 | **NEXT** |
| H2 phase B | Backlog unless Coach GO |
