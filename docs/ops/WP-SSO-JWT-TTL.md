# Ops — WordPress fotw-sso JWT TTL (H2 residual)

## Problem

Labs SSO callback accepts a one-shot HS256 JWT in the query string:

```text
GET /api/auth/sso/wordpress:fattail?sso=<JWT>
```

That value can land in:

- Browser history  
- nginx/proxy access logs (if query strings are logged)  
- Referer headers to third parties (if any intermediate page)  

Long-lived SSO JWTs expand the leak window. Labs session cookies are separate and already HttpOnly.

## Requirement

**Maximum recommended SSO JWT lifetime: 120 seconds** (2 minutes) from `iat` to `exp`.

Preferred: **30–60 seconds** if WP plugin and clock skew allow (Labs verifies with 10s leeway).

## Where to set (WordPress)

| Site | Plugin | Owner |
|------|--------|--------|
| fattail.ai | fotw-sso | WP / FatTail ops |
| 0-dte.com | fotw-sso | WP / FatTail ops |

Exact setting name depends on plugin version (TTL / token lifetime / exp).  
MarketSwarm-Canonical / fotw-sso is the source of truth for mint behavior.

## Verification

1. Capture one SSO redirect URL immediately after login (DevTools Network).  
2. Decode JWT payload (jwt.io or `python -c` base64) — do **not** paste secrets into chats long-term.  
3. Confirm `exp - iat` ≤ 120.  
4. Confirm Labs still accepts tokens within leeway (login succeeds).  

## Labs side (already done)

- SSO login entry wrapped with `wp-login.php?reauth=1` (account switch).  
- Labs logs email **domain only**, never the JWT.  
- nginx should log `$uri` without query for `/api/auth/sso/` — see `infra/nginx/labs-sso-access-log.conf`.

## Residual if TTL cannot be changed soon

- Apply nginx redaction first (cuts log retention of tokens).  
- Keep reauth so sessions are intentional.  
- Schedule H2 phase B (code exchange, no JWT in URL) as a later multi-system project.
