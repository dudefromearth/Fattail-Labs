# FatTail Labs ↔ WordPress SSO + WooCommerce Integration Guide

**Audience:** operators wiring `labs.fattail.ai` to **fattail.ai** and/or **0-dte.com**  
**Status:** As-built (Identity & Access Spec v1.0 + MSC-compatible claims)  
**Labs specs:** `Specs/FatTail-Labs-Identity-Access-Spec-v1.0.md`  
**SSO source of truth (do not reinvent):** **MarketSwarm-Canonical** + WP **`fotw-sso`**

---

## 1. Where the SSO lives

Labs does **not** mint SSO tokens. WordPress does, via the same plugin MarketSwarm uses.

| Layer | Location |
|---|---|
| **WP plugin (mint JWT)** | **`fotw-sso`** on fattail.ai / 0-dte.com — routes `/fotw-sso/`, `/fotw-sso-logout/` |
| **WP ops reference** | `MarketSwarm-Canonical/org/reference/softwares/flyonthewall_wordpress.md` §SSO |
| **App login entry (pattern)** | `MarketSwarm-Canonical/UI/src/components/LoginPage.tsx` |
| **JWT verify (Python)** | `MarketSwarm-Canonical/src/auth/sso.py` |
| **App SSO callback** | `MarketSwarm-Canonical/api/routes/auth_routes.py` → `GET /api/auth/sso` |
| **Legacy Node verify** | `MarketSwarm-Canonical/services/sse/src/auth.js` → `verifyWpSsoToken` |
| **Labs verify + session** | `Fattail-Labs/server/providers.py`, `routes/auth_routes.py` |

**Invariant (Labs doctrine):** no shared *code* with MSC — HTTP/JWT contracts only. Claim shapes and secrets are aligned with MSC; implementation is Labs-native.

---

## 2. Architecture

```text
┌─────────────────────────────────┐
│  WordPress (fattail.ai / 0-dte) │
│  fotw-sso plugin                │
│  WooCommerce Memberships + Subs │
└───────────────┬─────────────────┘
                │ 1) User visits /fotw-sso?redirect=<Labs callback>
                │ 2) Plugin mints short-lived HS256 JWT
                │ 3) Redirect → Labs callback?sso=<JWT>  (or token=)
                ▼
┌─────────────────────────────────┐
│  FatTail Labs                   │
│  GET /api/auth/sso/             │
│    wordpress:fattail|0-dte      │
│  verify → identity + membership │
│  Set ft_session → /courses      │
└─────────────────────────────────┘

Optional continuous sync (Labs-specific surface):
  Woo lifecycle → signed POST /api/integrations/{provider}/membership
```

| Responsibility | System |
|---|---|
| Sell / cancel | WooCommerce only |
| Mint SSO JWT | **fotw-sso** on WP |
| Verify JWT + Labs session | Labs |
| Plan product → Labs role | `provider_plan_map` (Labs DB) |
| Card data | Never on Labs |

---

## 3. Issuers, secrets, providers

### 3.1 Mapping

| WP site | JWT `iss` (fotw-sso / MSC) | Labs provider path | Labs env secret |
|---|---|---|---|
| **fattail.ai** (ex-FOTW) | **`fotw`** (also accept `fattail`) | `wordpress:fattail` | `LABS_SSO_SECRET_FATTAIL` |
| **0-dte.com** | **`0-dte`** | `wordpress:0-dte` | `LABS_SSO_SECRET_0DTE` |

MSC env names for the **same secrets** (MarketSwarm host):

| Labs | MarketSwarm-Canonical |
|---|---|
| `LABS_SSO_SECRET_FATTAIL` | `SSO_FOTW_SECRET` |
| `LABS_SSO_SECRET_0DTE` | `SSO_0DTE_SECRET` |

These must match the **fotw-sso** shared secret in WP admin (FOTW SSO settings).

### 3.2 Labs `.env`

```bash
LABS_SSO_SECRET_FATTAIL=<same as WP fotw-sso + MSC SSO_FOTW_SECRET, ≥32 chars>
LABS_SSO_SECRET_0DTE=<same as 0-dte plugin + MSC SSO_0DTE_SECRET, ≥32 chars>
LABS_SESSION_SECRET=<Labs-only; never shared with WP>
LABS_COOKIE_DOMAIN=.fattail.ai          # staging/production
LABS_WEB_ORIGIN=https://labs.fattail.ai

# Login buttons — same URL pattern as MSC LoginPage
# redirect = encodeURIComponent( Labs callback absolute URL )
LABS_SSO_LOGIN_URL_FATTAIL=https://fattail.ai/fotw-sso?redirect=https%3A%2F%2Flabs.fattail.ai%2Fapi%2Fauth%2Fsso%2Fwordpress%3Afattail
LABS_SSO_LOGIN_URL_0DTE=https://0-dte.com/fotw-sso?redirect=https%3A%2F%2Flabs.fattail.ai%2Fapi%2Fauth%2Fsso%2Fwordpress%3A0-dte
```

**Redirect construction (same idea as MSC):**

```text
https://fattail.ai/fotw-sso?redirect=<urlencoded Labs callback>

Labs callback (either query name works):
  https://labs.fattail.ai/api/auth/sso/wordpress:fattail
  # fotw-sso should append ?sso=<jwt> or &sso=<jwt>
  # Labs also accepts ?token=<jwt>
```

If the plugin only appends `?sso=` to the redirect URL, set:

```text
redirect = https://labs.fattail.ai/api/auth/sso/wordpress:fattail
→ final: https://labs.fattail.ai/api/auth/sso/wordpress:fattail?sso=<JWT>
```

Staging: use `labs-stage.fattail.ai` in the redirect.

---

## 4. JWT contract (from fotw-sso / MSC)

Documented in MSC WP reference + consumed by `src/auth/user_store.py` / Labs `providers.py`.

| Claim | Required | Notes |
|---|---|---|
| `iss` | **Yes** | `fotw` or `0-dte` |
| User id | **Yes** | `sub` or `id` (plugin docs also list `wp_id`; Labs also accepts `wp_user_id`) |
| `email` | **Yes** | Join key across providers |
| `name` / `display_name` | Recommended | Display name |
| `roles` | Recommended | List or comma-string; `administrator` may set Labs override once |
| `membership_plans` | Recommended | Active Woo **membership plan slugs** (list or csv) |
| `plans` | Alternate | Labs also accepts this name |
| `subscription_tier` | Optional | Single tier slug; Labs adds to entitlement keys if present |
| `iat` / `exp` | Yes (plugin: **~60s TTL**) | Short-lived; clock skew leeway 10s |

**Algorithm:** HS256 only.

**What Labs does on callback**

1. Verify signature with issuer secret (leeway 10s, MSC-compatible).  
2. Resolve identity by link `(provider, external_id)`, else email.  
3. Sync memberships from entitlement keys via `provider_plan_map` (replace-by-source).  
4. Issue `ft_session` → 302 `/courses`.

---

## 5. Plan mapping (Labs DB)

Woo membership plan **slugs** from the JWT must exist in `provider_plan_map`.

Example seed rows (`seed_dev.py`) — **replace with production slugs** from Woo Memberships:

| Provider | `external_key` (Woo plan slug) | Labs plan |
|---|---|---|
| `wordpress:fattail` | `labs-membership` | `activator` |
| `wordpress:0-dte` | `coaching` | `navigator` |
| `wordpress:0-dte` | `labs-membership` | `activator` |

FOTW Woo memberships (from MSC WP audit — map as you retire FOTW/LearnDash):

| Plan name | Plan slug (example) |
|---|---|
| Observer Access | `observer-access` |
| Activator Access | `activator-access` |
| Navigator Access | `navigator-access` |
| Coaching Access | `coaching-access` |

```sql
-- Map a real Woo membership slug → Labs plan
INSERT INTO provider_plan_map (provider, external_key, plan_id)
SELECT 'wordpress:fattail', 'activator-access', id FROM plans WHERE slug = 'activator'
ON DUPLICATE KEY UPDATE plan_id = VALUES(plan_id);
```

Unknown keys in the JWT are **ignored** (no membership). Unknown keys on **webhook** → 422.

---

## 6. WooCommerce membership webhooks (Labs surface)

MSC app session does not replace this: **subscription lifecycle** should update Labs memberships without waiting for the next SSO.

```http
POST https://labs.fattail.ai/api/integrations/wordpress:fattail/membership
POST https://labs.fattail.ai/api/integrations/wordpress:0-dte/membership
X-Labs-Signature: <hmac-sha256 hex of raw body with provider secret>
Content-Type: application/json
```

Body:

```json
{
  "external_id": "12345",
  "email": "member@example.com",
  "plan_key": "activator-access",
  "status": "active",
  "external_ref": "wc_sub_9876"
}
```

| Field | Notes |
|---|---|
| `external_id` | Same WP user id as JWT `sub` |
| `plan_key` | Must match `provider_plan_map.external_key` |
| `status` | `active` \| `grace` \| `cancelled` \| `expired` |

Only `active` / `grace` count toward role. Role is snapshotted into the session at login — members may need re-SSO after a plan change.

**WP glue:** not shipped inside MSC repo as a Labs webhook; implement beside fotw-sso or membership-auto-upgrade (HMAC POST to Labs). Reuse the same shared secret as SSO.

---

## 7. MarketSwarm vs Labs (do not confuse)

| Topic | MarketSwarm-Canonical | FatTail Labs |
|---|---|---|
| Callback path | `/api/auth/sso?sso=` | `/api/auth/sso/wordpress:{issuer}?sso=` or `?token=` |
| Session cookie | MSC app session | `ft_session` |
| Code sharing | — | **None** (API/JWT only) |
| Secrets | `SSO_FOTW_SECRET`, `SSO_0DTE_SECRET` | `LABS_SSO_SECRET_*` (same values as WP) |
| After login | Risk graph / app | Courses / membership education |

Same **fotw-sso** plugin can redirect to **either** app depending on the `redirect` query param.

---

## 8. Verification

### 8.1 Labs characterization (no live WP)

```bash
cd server && .venv/bin/python -m pytest tests/test_sso_providers.py -q
```

Includes MSC-shaped JWT (`iss=fotw`, `sub`, `membership_plans`, `?sso=`).

### 8.2 Live smoke (staging)

1. Open Labs login → FatTail SSO button → land on `/courses` with session.  
2. Confirm `GET /api/auth/me` shows email + expected role.  
3. Webhook probe:

```bash
BODY='{"external_id":"…","email":"…","plan_key":"…","status":"active"}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$LABS_SSO_SECRET_FATTAIL" | awk '{print $2}')
curl -sS -X POST "https://labs-stage.fattail.ai/api/integrations/wordpress:fattail/membership" \
  -H "Content-Type: application/json" -H "X-Labs-Signature: $SIG" -d "$BODY"
```

### 8.3 Compare secrets with MSC (ops)

On each host, confirm fingerprint of shared secrets matches WP (and each other for the same issuer). Do not paste secrets into tickets.

---

## 9. Cutover checklist

- [ ] Read MSC WP SSO section + LoginPage redirect pattern  
- [ ] fotw-sso secrets set on fattail.ai / 0-dte.com  
- [ ] Same secrets in Labs `LABS_SSO_SECRET_*` (and MSC if both apps run)  
- [ ] Labs `provider_plan_map` matches real Woo membership **slugs** from JWT  
- [ ] `LABS_SSO_LOGIN_URL_*` point at `/fotw-sso?redirect=` Labs callback  
- [ ] Staging SSO end-to-end before production buttons go live  
- [ ] Break-glass native admin via `create_user.py --admin`  
- [ ] (Optional) Woo lifecycle webhook → Labs integrations URL  

---

## 10. Troubleshooting

| Symptom | Check |
|---|---|
| SSO 401 | Secret mismatch; expired 60s JWT; wrong `iss`; clock skew |
| Issuer not allowed | JWT `iss` must be `fotw`/`fattail` (FatTail path) or `0-dte` |
| Logged in as observer | `membership_plans` empty or not mapped in `provider_plan_map` |
| Button missing | `LABS_SSO_LOGIN_URL_*` unset |
| Works in MSC, not Labs | Callback path must include `wordpress:fattail` or `wordpress:0-dte` |
| Webhook 401 | HMAC over raw body; same secret as SSO |

---

## 11. Related

| Doc / code | Role |
|---|---|
| **MarketSwarm-Canonical** `src/auth/sso.py` | Canonical verify algorithm |
| **MarketSwarm-Canonical** `org/reference/softwares/flyonthewall_wordpress.md` | fotw-sso ops |
| **MarketSwarm-Canonical** `UI/src/components/LoginPage.tsx` | redirect URL pattern |
| Labs `server/providers.py` | MSC-compatible claim parse |
| Labs Identity-Access Spec v1.0 | Domain model |
| Labs `infra/deploy.md` | Env on MiniTwo |

---

*Sell in Woo. Authenticate with fotw-sso (MSC). Authorize with Labs memberships mapped from membership plan slugs. Never copy MSC code into Labs.*
