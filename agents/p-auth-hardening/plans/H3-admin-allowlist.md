# H3 — Labs admin allowlist (stop WP auto-admin)

**Audit ID:** H3  
**Impact:** High · **Effort:** S–M  
**Depends on:** H5-G PASS (or Coach waive if dev-only first)  
**Closes:** Compromised/over-privileged WP admin cannot mint Labs administrator  

---

## Intent

Today SSO may:

```python
if pid.is_admin:
    UPDATE identities SET role_override = 'administrator' WHERE … override IS NULL
```

Replace with **explicit allowlist** (emails and/or WP external ids and/or provider).  
Default deny for WP `administrator` / `admin` role strings.

---

## Agents

| Seed | Agent | Work |
|------|-------|------|
| H3-1 | **Mike** | Design: env vs DB table; Coach names initial allowlist; fail-loud config |
| H3-2 | **India** | Spec amendment or decision-log SoR; Identity Access cross-link |
| H3-3 | **Alpha** | Implement allowlist check; remove bare auto-promote; migration if DB |
| H3-4 | **Kilo** | Tests: WP admin not on list → no override; listed email → admin OK |
| H3-G | **Delta** | Assessment + reevaluation |

---

## Design constraints (Mike must choose, Coach confirms)

| Option | Pros | Cons |
|--------|------|------|
| A. Env `LABS_ADMIN_EMAILS=a,b` | Simple, fail-loud | Redeploy to change |
| B. DB table `labs_admin_allowlist` | Runtime | Admin UI later |
| **Recommended:** A for P0 + optional B later | Fast | — |

Also: existing `role_override=administrator` rows **not** silently stripped (Coach decides migrate).

---

## Files likely in scope

- `server/routes/auth_routes.py` (SSO admin branch)  
- `server/config.py` or new `server/admin_allowlist.py`  
- `server/tests/test_sso_*.py` / new tests  
- `Architecture/00-decision-log.md`  
- Optional: `Specs/…Identity…` version bump  

## Out of scope

Live role for all gates (H1); rate limits (M1).

---

## Completion criteria

- [ ] Non-allowlisted WP admin JWT does **not** set role_override  
- [ ] Allowlisted identity can still be Labs admin (explicit path)  
- [ ] `"admin"` string alone never promotes  
- [ ] Decision log entry  
- [ ] pytest green  

---

## Assessment focus (H3-G)

| Question | Pass if |
|----------|---------|
| Privilege escalation via WP role closed? | Yes with test evidence |
| Existing Ernie/admin break? | No — Coach smoke |
| Next H still H1? | Default yes; note if M1 should jump |

## Reevaluation defaults after PASS

- Next: **H1**  
- Consider promote **M3** (iid 0) if close to guards work  
