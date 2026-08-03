# H5 — Deploy auth fixes to staging/production

**Audit ID:** H5  
**Impact:** High (until deployed) · **Effort:** S  
**Depends on:** W0-G PASS  
**Closes:** Logout cookie clear, SSO reauth wrap, login sticky-session UX live on MiniTwo/DudeTwo  

---

## Intent

Git already has:

- `fca01d7` logout domain/path clear  
- `7a588b4` nuclear clear + login force-clear  
- `f07a8ae` WP reauth=1 SSO URLs  
- Access Control MVP (`7415c01`) if not yet on prod  

**H5 is ops evidence**, not new product code.

---

## Agents

| Seed | Agent | Work |
|------|-------|------|
| H5-1 | **Foxtrot** | Deploy playbook: pull main, migrate (incl. 075 if pending), build web, restart launchd, health curl |
| H5-2 | **Coach** | Prod smoke: logout Set-Cookie, /me 401, FatTail SSO URL contains reauth=1 |
| H5-G | **Delta** | Assessment + reevaluation |

---

## Files in scope

- `infra/deploy.md` (only if checklist gaps)  
- No server feature code unless deploy scripts broken  

## Out of scope

New auth features (H1–H4); WP plugin changes.

---

## Completion criteria (verifiable)

- [ ] Staging (if used) health 200 on new revision  
- [ ] Production MiniTwo: API health, web serves `/login`  
- [ ] Logout response includes `ft_session` Max-Age=0 with Path=/ (and Domain if configured)  
- [ ] `GET /api/auth/providers` → fattail URL contains `wp-login.php` and `reauth=1`  
- [ ] Migration 075 applied if access_policies missing  

---

## Assessment focus (H5-G)

| Question | Pass if |
|----------|---------|
| Are operators still on pre-fix build? | No — commit hash or mtime evidence |
| Can we start H3 safely? | Yes if logout/SSO reauth live |

## Reevaluation defaults after PASS

- Next: **H3**  
- Do not promote M* yet (need allowlist first)  
