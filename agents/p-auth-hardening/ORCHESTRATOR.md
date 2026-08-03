# p-auth-hardening — Orchestrator Playbook

**Charter:** [`CHARTER.md`](./CHARTER.md)  
**Full plan:** [`docs/Auth-Hardening-Full-Agent-Bench-Plan.md`](../../docs/Auth-Hardening-Full-Agent-Bench-Plan.md)  
**Audit:** [`docs/Auth-Hardening-Audit-2026-08-02.md`](../../docs/Auth-Hardening-Audit-2026-08-02.md)  

---

## Current junction

### **PROGRAM CODE PASS** (2026-08-02) — ops residual on H5/H2

| Step | Status | Report |
|------|--------|--------|
| W0 | **PASS** | W0-G-program-lock.md |
| H5 Deploy | **PASS + residual** | H5-G — MiniTwo SSH denied; checklist in deploy.md |
| H3 Admin allowlist | **PASS** | H3-G — `LABS_ADMIN_EMAILS` |
| H1 Live role | **PASS** | H1-G — `require_admin` → derive_role |
| H2 SSO hygiene | **PASS phase A** | H2-G — logs + deploy notes |
| H4 Account switch | **PASS** | H4-G — runbook |
| CLOSE | **PASS** | CLOSE-G-program.md |

### Ops still required (human) — 2026-08-03 residual pack ready

| Residual | Unblock | Artifact |
|----------|---------|----------|
| **H5** MiniTwo deploy | Authorize StudioTwo key on MiniTwo, then run script | `infra/scripts/deploy-minitwo-auth-hardening.sh` · `docs/ops/MiniTwo-Auth-Deploy-Runbook.md` |
| **H2** nginx log redaction | Apply on MiniThree | `infra/nginx/labs-sso-access-log.conf` |
| **H2** WP JWT TTL ≤120s | fotw-sso on fattail.ai / 0-dte.com | `docs/ops/WP-SSO-JWT-TTL.md` |

**SSH note:** `id_minitwo` (`ernie@StudioTwo-minitwo-agent`) is **rejected** by MiniTwo until added to `authorized_keys`. DudeTwo has no Labs repo.

Gate: `gate-reports/H5-H2-residuals-2026-08-03.md`

### Backlog (reevaluated)

| ID | Rank |
|----|------|
| **M1 Auth rate limits** | **DONE** 2026-08-03 (`rate_limit.py`, DL-205) |
| **M7 Webhook anti-replay** | **DONE** 2026-08-03 (`webhook_security.py`, DL-206) |
| M3 iid=0 | Partially in H1 |
| M2 SSO email/link | Next optional code |
| M6 CSRF | Later |
| H2 phase B | Deferred |
| H5/H2 host ops | MiniTwo key + nginx + WP TTL (runbooks ready) |

---

## Critical path (completed in code)

```text
W0 ✓ → H5 ✓(ops) → H3 ✓ → H1 ✓ → H2 ✓ → H4 ✓ → CLOSE ✓
```
