# p-auth-hardening — Orchestrator Playbook

**Charter:** [`CHARTER.md`](./CHARTER.md)  
**Full plan:** [`docs/Auth-Hardening-Full-Agent-Bench-Plan.md`](../../docs/Auth-Hardening-Full-Agent-Bench-Plan.md)  
**Audit:** [`docs/Auth-Hardening-Audit-2026-08-02.md`](../../docs/Auth-Hardening-Audit-2026-08-02.md)  

---

## Current junction

### **PROGRAM PASS** — H5 fully closed 2026-08-03 (host + Coach smoke)

| Step | Status | Report |
|------|--------|--------|
| W0 | **PASS** | W0-G-program-lock.md |
| H5 Deploy | **PASS** | H5-minitwo-deploy-2026-08-03.md + H5-2-coach-smoke.md |
| H3 Admin allowlist | **PASS** | H3-G — `LABS_ADMIN_EMAILS` |
| H1 Live role | **PASS** | H1-G — `require_admin` → derive_role |
| H2 SSO hygiene | **PASS phase A** | H2-G — logs + deploy notes |
| H4 Account switch | **PASS** | H4-G — runbook |
| CLOSE | **PASS** | CLOSE-G-program.md |

### Ops still required (human) — H2 edge only

| Residual | Unblock | Artifact |
|----------|---------|----------|
| **H2** nginx log redaction | Apply on MiniThree | `infra/nginx/labs-sso-access-log.conf` |
| **H2** WP JWT TTL ≤120s | fotw-sso on fattail.ai / 0-dte.com | `docs/ops/WP-SSO-JWT-TTL.md` |

**SSH:** Option A done — StudioTwo agent key on MiniTwo.  
**H5-2:** Coach confirmed Alpha → logout → FatTail SSO as Ernie works on prod.

Gate residual pack: `gate-reports/H5-H2-residuals-2026-08-03.md` (H5 closed; H2 edge still open).

### Backlog (reevaluated)

| ID | Rank |
|----|------|
| **M1 Auth rate limits** | **DONE** 2026-08-03 (`rate_limit.py`, DL-205) |
| **M7 Webhook anti-replay** | **DONE** 2026-08-03 (`webhook_security.py`, DL-206) |
| **M2 SSO email/link** | **DONE** 2026-08-03 (`resolve_sso_identity`, DL-207) |
| **M6 CSRF Origin/Referer** | **DONE** 2026-08-03 (`csrf.py`, DL-208) |
| M3 iid=0 | Partially in H1 |
| H2 host ops | MiniThree nginx + WP TTL |
| H2 phase B | Deferred |

---

## Critical path (completed in code)

```text
W0 ✓ → H5 ✓(ops) → H3 ✓ → H1 ✓ → H2 ✓ → H4 ✓ → CLOSE ✓
```
