# H2 — SSO JWT query-string hygiene

**Audit ID:** H2  
**Impact:** High · **Effort:** M (phase A) / L (phase B full redesign)  
**Depends on:** H1-G PASS or Coach parallel  
**Closes:** Reduce leakage of bearer SSO JWTs via history, proxies, Referer, access logs  

---

## Intent

Today: `GET /api/auth/sso/…?sso=<JWT>` — JWT is a one-shot session mint credential.

### Phase A (in program — ship)

1. **Nginx/MiniThree:** redact `sso`/`token` query params from access logs.  
2. **WP ops note:** confirm/shorten fotw-sso JWT TTL (document required TTL, e.g. ≤120s).  
3. **Labs:** never log raw token (audit existing log lines).  
4. **Optional Labs:** accept one-time `code` if WP can send it later (stub design only unless WP ready).

### Phase B (optional Coach GO — out of H2-G minimum)

POST exchange or authorization code flow WP → Labs. Multi-system.

---

## Agents

| Seed | Agent | Work |
|------|-------|------|
| H2-1 | **Mike** | Threat model residual after phase A; phase B sketch |
| H2-2 | **Foxtrot** | nginx log format / deploy note; staging verify |
| H2-3 | **Alpha** | Grep/fix any Labs logging of query SSO; document callback |
| H2-G | **Delta** | Assessment (phase A) + reevaluation |

---

## Files likely in scope

- `infra/deploy.md` or nginx snippets under `infra/`  
- `server/routes/auth_routes.py` (logging only)  
- Docs: Identity Access or ops note  

## Out of scope unless Coach GO

Rewriting fotw-sso plugin.

---

## Completion criteria (phase A)

- [ ] Documented/implemented log redaction for SSO query secrets  
- [ ] Target SSO JWT max age stated and verified with WP owner (or residual BLOCKED)  
- [ ] Labs code does not log full JWT  
- [ ] Mike residual risk written  

---

## Assessment focus (H2-G)

| Question | Pass if |
|----------|---------|
| Phase A mitigations live or residual explicit? | Yes |
| Phase B needed now? | Coach call |

## Reevaluation defaults after PASS

- Next: **H4**  
- Phase B → backlog L or new project  
