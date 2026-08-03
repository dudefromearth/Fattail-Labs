# W0-1 — Mike security posture

**Project:** p-auth-hardening  
**Agent:** Mike  
**Date:** 2026-08-02  
**Seed:** `seeds/W0-1-mike-posture.md`

---

## Verdict: **APPROVED**

Program order and H scopes match threat priority from the audit and recent Alpha MSC incidents.

---

## 1. Order

| Step | Rationale |
|------|-----------|
| **H5 first** | Code fixes are worthless until prod/staging run them; ops truth first |
| **H3 second** | Stops WP→Labs admin escalation before we harden live role checks |
| **H1 third** | Durable authz model (frozen JWT role) |
| **H2 fourth** | Token-in-URL residual after account integrity |
| **H4 fifth** | Ops runbook/e2e; partially mitigated by reauth already on main |

**No swap proposed.** Optional later: insert **M1** (rate limits) after H1 if abuse appears—reevaluation will decide.

---

## 2. H1 scope recommendation

| Scope | Mike |
|-------|------|
| **Minimum (required)** | `require_admin` / `require_role` use **live** `derive_role` (or feature_role policy for admin) from `identity_id`; demoted admin → 403 |
| **Stretch (optional in H1)** | Enumerate critical member gates still on raw `claims["role"]` only if cheap |
| **Out of H1** | Full session store / jti revoke (L1); shorten TTL alone without live check |

---

## 3. H2 phase A

**Sufficient for now:** log redaction + short SSO JWT TTL + no Labs token logging.  
**Phase B** (POST/code exchange) only if Coach GO after H2-G residual risk still High.

---

## 4. Blocking gaps?

None missing from H list for P0. Note:

- **M3** (identity_id=0) is adjacent to H1 guards—Alpha may fold a prod hard-fail into H1-2 if low cost.  
- **Existing role_override=administrator** rows (including zztest) need Coach hygiene at H3—not auto-strip without GO.

---

## Sign-off

**Mike: APPROVED** — unlock W0-G / H5.
