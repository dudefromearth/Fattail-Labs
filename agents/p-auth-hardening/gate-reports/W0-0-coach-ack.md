# W0-0 — Coach program GO

**Project:** p-auth-hardening  
**Agent:** Coach  
**Date:** 2026-08-02  
**Seed:** `seeds/W0-0-coach-go.md`

---

## Verdict

| Question | Answer |
|----------|--------|
| **Proceed?** | **YES** |
| **Order** | **H5 → H3 → H1 → H2 → H4** (default accepted) |
| **Admin allowlist (H3 seed)** | Initial production intent: **`ernie@dudefromearth.com`**, **`coach@fattail.ai`**, **`conor@fattail.ai`**. Dev-only: `dev-admin@labs.local` may be env-scoped. **Do not** include zztest-* in production allowlist. Final shape (env vs DB) decided at H3-1 Mike design; Coach confirms values at H3-3. |
| **H5 deploy** | **Staging first if DudeTwo labs-stage is in use; else MiniTwo production** with health + smoke before declaring H5 done. Prefer: DudeTwo (if available) → MiniTwo. Localhost is not H5 completion. |

## Intent confirmed

1. One H at a time; assessment + reevaluation after each H*-G.  
2. Medium backlog (M1–M8) stays parked until reevaluation promotes.  
3. No waived Delta gates.  
4. H1 minimum = live role on `require_admin` (+ critical admin paths); stretch later.  
5. H2 phase A (logs + TTL) is in-program; full SSO code exchange is optional later.

## Unblocks

W0-1 Mike · W0-G · then H5.
