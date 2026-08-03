# Auth Hardening — Full Multi-Agent Bench Plan

**Project:** `p-auth-hardening`  
**Board:** [`agents/p-auth-hardening/ORCHESTRATOR.md`](../agents/p-auth-hardening/ORCHESTRATOR.md)  
**Audit:** [`Auth-Hardening-Audit-2026-08-02.md`](./Auth-Hardening-Audit-2026-08-02.md)  
**Status:** **ACTIVE** — W0-G **PASS** 2026-08-02; execute from **H5**  
**Governance:** doctrine · first-principles · Delta ternary gates  

---

## 1. Purpose

Close the **five high-impact (H)** audit findings as **separate multi-agent projects**,  
each with seeds, agents, completion criteria, and a **post-ship assessment** that  
**re-evaluates remaining work** (order, scope, or deferral).

---

## 2. Program graph

```text
W0  Coach GO + Mike security posture ack
  ↓
H5  Deploy auth fixes (logout/SSO reauth already on main)
  ↓ H5-G assessment + reeval
H3  Labs admin allowlist (stop WP auto-admin)
  ↓ H3-G assessment + reeval
H1  Live authorization role (require_admin + critical gates)
  ↓ H1-G assessment + reeval
H2  SSO JWT hygiene (logs, TTL, optional exchange design)
  ↓ H2-G assessment + reeval
H4  Account-switch ops (runbook + e2e)
  ↓ H4-G assessment + reeval
CLOSE  Program PASS or residual backlog owned
```

**Default order rationale:** H5 unblocks truth on prod → H3 cuts privilege  
escalation → H1 fixes durable authz model → H2 reduces token leak surface →  
H4 hardens operator workflow (partially mitigated by reauth already).

Coach may reorder after any assessment (e.g. pull H4 earlier if ops pain dominates).

---

## 3. Per-finding plan index

| Finding | Plan file | Primary agents | Gate |
|---------|-----------|----------------|------|
| H5 Deploy | [`plans/H5-deploy.md`](../agents/p-auth-hardening/plans/H5-deploy.md) | Foxtrot · Delta · (Coach verify) | H5-G |
| H3 Admin allowlist | [`plans/H3-admin-allowlist.md`](../agents/p-auth-hardening/plans/H3-admin-allowlist.md) | Mike · India · Alpha · Kilo · Delta | H3-G |
| H1 Live role | [`plans/H1-live-role.md`](../agents/p-auth-hardening/plans/H1-live-role.md) | Mike · Alpha · Kilo · India · Delta | H1-G |
| H2 SSO JWT hygiene | [`plans/H2-sso-jwt-hygiene.md`](../agents/p-auth-hardening/plans/H2-sso-jwt-hygiene.md) | Mike · Foxtrot · Alpha · Delta | H2-G |
| H4 Account switch | [`plans/H4-account-switch.md`](../agents/p-auth-hardening/plans/H4-account-switch.md) | Charlie · Tango · Kilo · Lima · Delta | H4-G |

---

## 4. Assessment protocol (mandatory after each H)

After implementation seeds for an H complete, run **assessment seed** then **Delta gate**:

### Assessment checklist (owning agent files report)

1. **Evidence pack** — commands, curl, pytest, deploy notes (paths in `gate-reports/`).  
2. **Invariant check** — did we break logout, SSO, Observer membership elevation?  
3. **Residual risk** — what remains of this H?  
4. **Collateral** — new attack surface introduced?  
5. **Board reevaluation** — recommend: keep order / swap next H / promote M-item / defer.

### Delta H*-G verdicts

| Verdict | Meaning |
|---------|---------|
| **PASS** | H closed enough; advance per reevaluation |
| **FAIL** | Defects; re-seed owning agent |
| **BLOCKED** | External dependency (WP plugin, prod access) |

### Reevaluation artifact

Each H*-G report must end with:

```markdown
## Reevaluation (remaining work)

| ID | Prior order | Proposed order | Action |
|----|-------------|----------------|--------|
| H… | … | … | keep / promote / defer |
| M… | backlog | … | promote? |

**Next junction:** <seed file>
**Coach decision needed?** YES/NO — <question>
```

Juliet/Coach update `ORCHESTRATOR.md` **same day**.

---

## 5. Agent roster

| Agent | Owns |
|-------|------|
| **Coach** | GO, allowlist contents, ship prod, reorder after reeval |
| **Juliet** | Board, seeds, reevaluation write-up |
| **Mike** | Security design for H1/H2/H3 |
| **India** | Spec/decision-log integrity (H1/H3) |
| **Alpha** | Implementation server |
| **Foxtrot** | Deploy MiniTwo/DudeTwo, nginx log redaction (H5/H2) |
| **Charlie** | Login UX if H4 needs UI beyond copy |
| **Tango** | Member/operator copy honesty (H4) |
| **Kilo** | Characterization + e2e |
| **Lima** | Decision log, admin guide updates |
| **Delta** | H*-G assessments |

---

## 6. Seed inventory

Under `agents/p-auth-hardening/seeds/`:

| Seed | Agent | Phase |
|------|-------|-------|
| `W0-0-coach-go.md` | Coach | W0 |
| `W0-1-mike-posture.md` | Mike | W0 |
| `W0-G-delta-program-lock.md` | Delta | W0 |
| `H5-1-foxtrot-deploy.md` | Foxtrot | H5 |
| `H5-2-coach-verify.md` | Coach | H5 |
| `H5-G-delta-assessment.md` | Delta | H5 |
| `H3-1-mike-allowlist-design.md` | Mike | H3 |
| `H3-2-india-spec.md` | India | H3 |
| `H3-3-alpha-implement.md` | Alpha | H3 |
| `H3-4-kilo-tests.md` | Kilo | H3 |
| `H3-G-delta-assessment.md` | Delta | H3 |
| `H1-1-mike-live-role-design.md` | Mike | H1 |
| `H1-2-alpha-guards.md` | Alpha | H1 |
| `H1-3-kilo-tests.md` | Kilo | H1 |
| `H1-G-delta-assessment.md` | Delta | H1 |
| `H2-1-mike-sso-hygiene-design.md` | Mike | H2 |
| `H2-2-foxtrot-logs-ttl.md` | Foxtrot | H2 |
| `H2-3-alpha-labs-mitigations.md` | Alpha | H2 |
| `H2-G-delta-assessment.md` | Delta | H2 |
| `H4-1-lima-runbook.md` | Lima | H4 |
| `H4-2-charlie-tango-ux.md` | Charlie·Tango | H4 |
| `H4-3-kilo-e2e.md` | Kilo | H4 |
| `H4-G-delta-assessment.md` | Delta | H4 |
| `CLOSE-1-lima-decision-log.md` | Lima | Close |
| `CLOSE-G-delta-program.md` | Delta | Close |

---

## 7. Out of scope (until reevaluation promotes)

M1–M8, L1–L6 from audit — tracked on board as backlog.  
Access Control residuals stay on `p-access-control`.  
Full WP fotw-sso rewrite (POST code exchange) is H2 **phase B** optional.

---

## 8. Definition of program done

- All H5–H4 gates PASS or Coach-deferred with residual IDs  
- Decision log entries for H3/H1 design choices  
- Admin guide / deploy notes updated  
- Backlog re-ranked at least twice (post-H3, post-H1)  

---

*Juliet decomposition — W0 complete; execution active from H5.*
