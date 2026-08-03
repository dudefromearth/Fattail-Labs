# Operator runbook — Switch Labs accounts (Alpha MSC ↔ Ernie, etc.)

**Why this exists:** Labs logout only clears the **Labs** cookie (`ft_session`).  
**FatTail.ai** and **0-DTE.com** each keep their own **WordPress** session.  
SSO always mints Labs as whoever is (or re-auths as) on that WP site.

## Quick switch (recommended)

1. Labs: **Sign out** (or `/login` → Force clear Labs session if shown).  
2. Confirm logged out: open `/api/auth/me` → should fail (401).  
3. Labs `/login` → **Continue with FatTail.ai** (URL should include `wp-login.php` + `reauth=1`).  
4. Enter the **intended** WP credentials (e.g. ernie@dudefromearth.com).  
5. Confirm header shows the correct name/role.

## If still the wrong person

| Step | Action |
|------|--------|
| A | Private/incognito window → Labs login → FatTail SSO |
| B | Sign out of WordPress: https://fattail.ai/wp-login.php?action=logout then SSO again |
| C | Use **0-DTE** SSO if that site already has the correct admin session (separate cookie) |
| D | Hard-clear site cookies for `localhost` / `labs.fattail.ai` / `fattail.ai` |

## Two WordPress cookies

| Site | Cookie jar | Labs provider |
|------|------------|---------------|
| fattail.ai | WP session A | `wordpress:fattail` |
| 0-dte.com | WP session B | `wordpress:0-dte` |

Logging out of Labs never signs you out of either WP site.

## Admin allowlist (H3)

Only emails in `LABS_ADMIN_EMAILS` can gain Labs `role_override=administrator` from WP `is_admin` claims.  
Having WP admin on a test account does **not** grant Labs admin unless allowlisted.

## Related

- Audit: `docs/Auth-Hardening-Audit-2026-08-02.md`  
- Program: `agents/p-auth-hardening/`  
