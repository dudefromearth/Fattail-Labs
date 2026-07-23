# Security & Access Design

**Status:** As-built (retroactive, 2026-07-23)  
**Primary specs:** Identity-Access, Enrollment-Access, Native Billing Stripe, Lesson Video

---

## 1. Goals

1. **One identity** per email across providers  
2. **Cumulative roles** from memberships + override  
3. **Server-side enforcement** on every gated route  
4. **No payment card data** in Labs (Stripe/Woo own checkout)  
5. **Minimal secret surface** — env only, never committed  

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

---

## 5. Media & injection boundaries

| Boundary | Control |
|---|---|
| Video player URL | Server-built allowlist only (`video.py`) |
| Admin JSON fields | Allowlists; unknown fields 422 |
| Upload types/sizes | Content-type maps + max bytes |
| Path traversal on media delete | Rejected |
| Markdown render | `react-markdown` + `rehype-sanitize` on web |

---

## 6. Agent / LLM security

| Rule | Implementation |
|---|---|
| Keys server-side only | `XAI_API_KEY`, `ANTHROPIC_API_KEY` |
| No member chat API | Admin `/api/admin/ai/*` only |
| Status never leaks keys | Booleans + model names |
| Completions fail loud | 503 without key; 502 provider errors |
| Agent publish authority | Humans approve; Quebec never sets published |

**Phase A (shipped):** agents authenticate as **principals** with scoped API keys
(`ftl_ag_…`, scopes `ai:run` / `ai:status` / …). Human admins mint/revoke keys.
Workbench accepts human session **or** agent bearer; `actor_events` records runs.
Agents still do **not** receive billing or key-minting authority. Content mutation
scopes (`admin:content`) reserved for later phases.

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
