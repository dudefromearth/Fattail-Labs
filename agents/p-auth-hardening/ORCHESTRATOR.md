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

### Ops still required (human)

1. MiniTwo/DudeTwo: pull main, set `LABS_ADMIN_EMAILS`, migrate, restart  
2. MiniThree nginx: redact SSO query strings  
3. WP: confirm fotw-sso JWT TTL ≤ 120s  

### Backlog (reevaluated)

| ID | Rank |
|----|------|
| M1 Auth rate limits | Next optional project |
| M3 iid=0 | Partially in H1 |
| M7 Webhook replay | Later |
| H2 phase B | Deferred |

---

## Critical path (completed in code)

```text
W0 ✓ → H5 ✓(ops) → H3 ✓ → H1 ✓ → H2 ✓ → H4 ✓ → CLOSE ✓
```
