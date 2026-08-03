# H1 — Live authorization role (not frozen JWT role alone)

**Audit ID:** H1  
**Impact:** High · **Effort:** M  
**Depends on:** H3-G PASS recommended (admin truth first)  
**Closes:** Demoted/cancelled admins retain JWT `role` up to 7 days  

---

## Intent

Session JWT stores `role` at mint time. Many gates use `claims["role"]`.  
`/me` already exposes live `access_role` via `feature_role()`.

**Minimum viable H1:** `require_admin` / `require_role` re-derive live role from DB.  
**Stretch:** privileged member gates use `feature_role` consistently (enumerate, don’t big-bang).

---

## Agents

| Seed | Agent | Work |
|------|-------|------|
| H1-1 | **Mike** | Design: which helpers change; session still carries identity_id; fail closed if identity missing |
| H1-2 | **Alpha** | Implement `guards.require_admin` live check; optional `require_role` |
| H1-3 | **Kilo** | Test: mint admin JWT, clear role_override + memberships → 403 on admin route |
| H1-G | **Delta** | Assessment + reevaluation |

India: decision log if SoR changes Identity Access wording.

---

## Files likely in scope

- `server/guards.py`  
- Possibly `server/auth.py` helpers  
- Call sites only if Mike scopes “critical list”  
- `server/tests/…`  

## Out of scope

Full session store / jti revoke (L1); shortening TTL alone without live check (insufficient).

---

## Completion criteria

- [ ] Admin JWT + demoted identity → **403** on `/api/admin/*` (or require_admin)  
- [ ] Valid admin still **200**  
- [ ] Observer-trial elevation still works where intended (`feature_role`)  
- [ ] pytest characterization  
- [ ] Decision log  

---

## Assessment focus (H1-G)

| Question | Pass if |
|----------|---------|
| Frozen admin privilege closed for require_admin? | Yes |
| Performance OK? | No N+1 disaster; single derive per request OK |
| Promote M1 rate limit next? | Often yes after H1 |

## Reevaluation defaults after PASS

- Next: **H2** or **M1** (Coach pick — security token leak vs abuse)  
- Default program: **H2**  
