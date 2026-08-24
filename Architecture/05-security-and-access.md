# Security & Access Design

**Status:** As-built (retroactive, 2026-07-23) · amended 2026-08-06 for Discord entitlement  
**Primary specs:** Identity-Access, Enrollment-Access, Native Billing Stripe, Lesson Video,  
Community App Spec v1.0.2 (BUILD AUTHORITY · DL-239/240)

---

## 1. Goals

1. **One identity** per email across providers  
2. **Cumulative roles** from memberships + override  
3. **Server-side enforcement** on every gated route  
4. **No payment card data** in Labs (Stripe/Woo own checkout)  
5. **Minimal secret surface** — env only, never committed  

**Access doctrine (Coach 2026-08-23 · DL-552):** Access rules come only from
Coach’s explicit direction. Where Coach has not directed, specs carry access as
an OPEN question put to Coach — never a defaulted posture in either direction.
**Wiki (DL-551):** contents are wide open by default; specific restrictions only
when Coach names them. That is directed for this product, not a platform-wide
default. The SSO perimeter is the instrument when a restriction *is* named.

---

## 2. Authentication

### 2.1 Session

| Property | Value |
|---|---|
| Cookie | `ft_session` |
| Type | HS256 JWT |
| Issuer claim | `labs.fattail.ai` |
| Payload | `identity_id`, `role`, `sso_issuer`, `iat`, `exp` |
| Flags | HttpOnly, SameSite=lax; Domain `.fattail.ai` outside dev |
| Secret | `LABS_SESSION_SECRET` (≥32 chars) |

Issue: `auth.issue_session`. Verify: `auth.verify_session`.

### 2.2 Native credentials

- Register / login via `/api/auth/register`, `/api/auth/login`  
- Passwords: stdlib **scrypt** (`identity.hash_password` / `verify_password`)  
- Minimum length enforced in identity layer  

### 2.3 WordPress SSO (pluggable)

- Providers: `wordpress:fattail`, `wordpress:0-dte`  
- HS256 JWT verified with per-issuer secrets from env  
- Claims → `ProviderIdentity` → link identity + map entitlement keys → plans  
- Login button URLs optional via env (unset → button hidden)  
- WooCommerce lifecycle: HMAC webhooks → membership upsert  
- **Operator integration guide:** `docs/WooCommerce-SSO-Integration-Guide.md`  


### 2.4 Dev login

`GET /api/auth/dev-login` only when `LABS_ENV=dev` — mints administrator session
(identity_id 0, issuer `internal`). **Must not exist in staging/production behavior.**

---

## 3. Authorization model

### 3.1 Role ladder

```text
observer < alumni < activator < navigator < administrator
```

`auth.role_at_least(role, minimum)` is the single comparison helper.

### 3.2 Role derivation

1. If `identities.role_override` set → that role  
2. Else best **active/grace** membership’s plan `grants_role`  
3. Else `observer`  
4. Alumni plan may be granted by tenure rules (membership tiers spec)

### 3.3 Guards

| Helper | Effect |
|---|---|
| `require_session` | 401 if missing/invalid cookie |
| `require_role(..., minimum)` | 403 if below ladder |
| `require_admin` | administrator only |

Admin AI, media delete, structural course edits, live admin, moderation → admin.

### 3.4 Content access examples

| Resource | Rule (simplified) |
|---|---|
| Public course list/detail | Published only; no gated lesson bodies |
| Free-preview lesson | Allowed without paid role (public subset API) |
| Gated lesson video | Auth + role/enrollment per Enrollment-Access spec |
| Private attachment | Role or free_preview flag |
| Live join | Category audience contract (public/members/…) |

---

## 4. Commerce boundary

```text
Stripe Checkout / Customer Portal  ──webhook──►  memberships
WooCommerce (WP)                   ──provider──► memberships
                Labs never stores PAN/CVV
```

- Plans displayed via `display_json` + billing routes  
- Webhooks authenticate (Stripe signature / shared secret patterns per spec)  
- Downgrade loses access, **preserves progress data**  
- Memberships **expire by `current_period_end`** (date-aware role derivation)

### 4.1 Discord guild roles (Community — BUILD AUTHORITY Spec v1.0.2 / DL-237–240)

When Community Discord sync ships (p-community P1b+):

| Rule | |
|------|--|
| Guild | **FatTail AI** |
| **Member connect** | **Woo Subscription Discord** plugin on fattail.ai (`woo-subscriptions-discord` · ExpressTech) — DL-240; not Labs-primary OAuth |
| Display name | WP user meta `_ets_woo_subscriptions_discord_username` (+ snowflake `_…_user_id`); Labs ingests |
| Entitlement | Same date-aware memberships as Labs roles (Observer **6-week** term, alumni year, etc.) |
| Link | `identity_links` provider `discord` from SSO claims `discord_user_id` (Mike C0-3) |
| Fast path | **WP plugin** primary role writer on Woo subscription status |
| **Safety net** | **Labs scheduled reconcile** (DL-238) — revoke orphan paid roles; alert missing roles |
| SoR | Labs membership for *who is paid*; Discord for guild chat; WP for connect + name + commerce roles |

Do **not** rely on billing webhooks alone for revocation (trial/alumni date ends).  
Do **not** add a competing Labs Discord OAuth product without Coach amend.  
Do **not** store WP Discord OAuth access/refresh tokens in Labs.  
**Mike gate:** `agents/p-community/gate-reports/C0-3-mike.md`.

---

## 5. Media & injection boundaries

| Boundary | Control |
|---|---|
| Video player URL | Server-built allowlist only (`video.py`); Bunny embeds time-limited |
| Admin JSON fields | Allowlists; unknown fields 422 |
| Upload types/sizes | Content-type maps + max bytes |
| Path traversal on media delete | Rejected |
| Markdown render | `react-markdown` + `rehype-sanitize` on web |

---

## 6. Agent / LLM security

| Rule | Implementation |
|---|---|
| Keys server-side only | `XAI_API_KEY`, `ANTHROPIC_API_KEY`, `HEYGEN_API_KEY` |
| No member chat API | Admin `/api/admin/ai/*` only |
| Status never leaks keys | Booleans + model names |
| Completions fail loud | 503 without key; 502 provider errors |
| Agent publish authority | Humans approve; Quebec tick never sets published |
| HeyGen | Production-only (admin board); not learner runtime; live jobs budgeted |
| Password reset | Token SHA-256 only; enumeration-safe forgot; single-use + TTL; SMTP required |

**Phases A–D (shipped):** agents authenticate as **principals** with scoped API keys
(`ftl_ag_…`; scopes include `ai:run`, `ai:status`, `board:operate`). Human admins
mint/revoke keys and sole-own publish/reject on the board and course publish.
Workbench accepts human session **or** agent bearer; `actor_events` + packages
record provenance. Agents do **not** receive billing or key-minting authority.
Placement creates **drafts** only — never auto-publishes member-visible courses.

---

## 7. Threat notes (engineering posture)

| Class | Mitigation present | Residual risk |
|---|---|---|
| Session theft | HttpOnly + SameSite | XSS still valuable — keep sanitization |
| Privilege escalation | Server role checks | Client-only checks are never sufficient |
| Webhook forgery | Signatures required | Misconfigured secrets in env |
| YouTube leakage | Unlisted IDs guessable | Accepted; CDN later if needed |
| SSRF via admin URLs | Limited URL fields | Review new URL-accepting fields |
| Prompt injection in agent tasks | Charter + section validation | Untrusted source material still risky |

Full penetration test is out of band of this design doc.

---

## 8. Secrets checklist (ops)

Never commit:

- `LABS_SESSION_SECRET`, SSO secrets  
- DB passwords  
- Stripe keys  
- `XAI_API_KEY` / `ANTHROPIC_API_KEY`  

Rotate by env replace + process restart (`launchctl kickstart` on MiniTwo).

---

*Deploy and verification: `06-operations-and-verification.md`.*
