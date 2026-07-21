# FatTail Labs — Identity & Access Spec v1.0

**Status:** Approved for build (2026-07-21, Coach directive)
**Supersedes:** parent spec §7.2–7.3's WordPress-first auth model. WordPress SSO +
WooCommerce entitlements remain fully supported — but demoted from foundation to
**pluggable provider**. The dual-issuer JWT mechanics of §7.2 survive inside the
WordPress provider implementation.
**Parent spec:** `FatTail-Labs-Course-Hosting-Spec-v1.0.md`

---

## 1. Principle

**Labs owns its own identity, role, subscription, and membership model.** It must be
fully operable standalone — native login, native memberships, native role grants —
with external systems (WordPress SSO, WooCommerce subscriptions, future Stripe/OAuth)
integrating through a provider interface. No external system's schema or vocabulary
leaks into the core model.

## 2. Core Domain Model

```
Identity        (identity_id, email UNIQUE, display_name, role_override NULL, created_at)
IdentityLink    (identity_id, provider, external_id)   UNIQUE(provider, external_id)
Credential      (identity_id PK, password_hash)         -- native password auth
Plan            (id, slug UNIQUE, name, grants_role)    -- Labs-native plans
Membership      (identity_id, plan_id, status, source, external_ref,
                 started_at, current_period_end, updated_at)
ProviderPlanMap (provider, external_key, plan_id)       UNIQUE(provider, external_key)
```

- **Identity** is the person. Email is the universal join key across providers.
- **IdentityLink** ties one identity to any number of auth providers
  (`password` is implicit via Credential; `wordpress:fattail`, `wordpress:0-dte`,
  later `google`, etc.). Same person logging in via either WP site or password
  resolves to ONE identity (matched by link first, then by verified email).
- **Plan** is Labs vocabulary: e.g. `labs-membership` → grants `activator`;
  `coaching` → grants `navigator`. Plans exist independent of any billing system.
- **Membership** is the Labs record of an entitlement: `status`
  (active | grace | cancelled | expired), `source` (`native` | `wordpress:fattail` |
  `wordpress:0-dte` | future `stripe`), `external_ref` (e.g. Woo subscription id).
- **ProviderPlanMap** translates provider vocabulary (Woo product/membership slugs)
  into Labs plans. Data-driven — adding a Woo product requires a row, not a deploy.

## 3. Role Derivation (single algorithm, all providers)

```
role(identity) =
  identity.role_override                     if set (admin grants)
  else max(plan.grants_role                  over memberships with status in
           {active, grace})                  (cumulative order:
  else observer                               observer<activator<navigator<administrator)
```

Roles are computed at session issuance and snapshotted into the session JWT
(no per-request DB hit, same as before). Membership changes take effect at next
login/session refresh; webhook-driven changes may force refresh later (v1.1).

## 4. Authentication Paths

### 4.1 Native (standalone)
- `POST /api/auth/login {email, password}` → verify scrypt hash → issue session.
- Password hashing: stdlib `hashlib.scrypt` (n=16384, r=8, p=1, 32-byte salt),
  stored as `scrypt$n$r$p$salt_hex$hash_hex`. No external crypto dependency.
- User creation: `server/create_user.py` CLI (email, password, --admin,
  --plan <slug>) — operator tooling until self-serve signup; self-serve signup
  remains commerce-driven (provider) or native-Stripe (future spec).

### 4.2 SSO providers (pluggable)
- Provider interface: `verify(token) -> ProviderIdentity{provider, external_id,
  email, display_name, is_admin, entitlement_keys[]}`.
- WordPress provider (per issuer): verifies HS256 JWT with issuer secret (mechanics
  identical to parent §7.2 incl. role normalization), reads entitlement keys from the
  token's plans/memberships claim.
- `GET /api/auth/sso/{provider}?token=...` callback: verify → upsert identity+link →
  sync memberships from entitlement keys via ProviderPlanMap (source=provider,
  replace-by-source semantics) → issue session → redirect `/courses`.
- `GET /api/auth/providers` → configured providers + their login redirect URLs
  (from env; login page renders only configured buttons). Pluggability is config,
  not code.

### 4.3 Membership webhooks (pluggable)
- `POST /api/integrations/{provider}/membership` — HMAC-SHA256 signature over the
  raw body with the provider secret (`X-Labs-Signature`). Body:
  `{external_id, email, plan_key, status, external_ref?}` → upsert the membership
  (mapped via ProviderPlanMap). This is the WooCommerce
  subscription-lifecycle sync surface (activated/cancelled/expired → status).

### 4.4 Sessions (unchanged)
`ft_session` HttpOnly JWT: identity_id, role, sso_issuer/provider, 7-day TTL,
cookie domain `.fattail.ai` outside dev. `GET /api/auth/logout` clears.
Dev-only `/api/auth/dev-login` remains (404 outside dev).

## 5. Standalone Guarantee

With zero providers configured, the system supports: password login, admin-granted
native memberships, full role ladder, member features, and admin editing. WordPress
and WooCommerce disappearing costs authentication *convenience*, not capability.

## 6. Config Surface

- `LABS_SSO_SECRET_FATTAIL` / `LABS_SSO_SECRET_0DTE` — WordPress provider secrets
  (double as webhook HMAC keys per provider).
- `LABS_SSO_LOGIN_URL_FATTAIL` / `LABS_SSO_LOGIN_URL_0DTE` — optional; WP login page
  URLs for the SSO buttons. Unset → button not rendered.
- `LABS_ENTITLEMENTS` env mapping is **removed** — replaced by the `plans` +
  `provider_plan_map` tables (data-driven).

## 7. Migration

`003_identity_access.sql`: restructure `identities` (drop issuer/wp_user_id →
IdentityLink; email UNIQUE; add role_override; drop stored role — roles are derived),
create identity_links, credentials, plans, memberships, provider_plan_map.
Seed default plans + WP mappings in `seed_dev.py`.

## 8. Invariants

1. Core model never stores provider vocabulary — translation happens only at the
   provider boundary (ProviderPlanMap).
2. Role is derived, never stored on Identity (role_override is an explicit admin
   grant, not a cache).
3. Passwords: scrypt only, per-user salt, constant-time compare; never logged.
4. Webhooks are HMAC-authenticated; unauthenticated webhook = membership dispenser.
5. Same email via different providers = same identity (merge by verified email).
6. Standalone guarantee (§5) must never regress.
