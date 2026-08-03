# Auth / Session / SSO Hardening Audit

**Date:** 2026-08-02  
**Scope:** Labs identity, session JWT, FatTail/0-DTE SSO, logout, login UX, related admin gates  
**Context:** Sticky Alpha MSC vs Ernie account-switch incidents; Access Control engine recently shipped  

**Verdict:** Architecture is coherent (Labs identity + dual WP SSO + membership sync). Recent logout/SSO fixes closed real operator bugs. Residual risk is concentrated in **SSO trust boundary**, **long-lived JWT sessions**, **role snapshotted in JWT**, and **ops/deploy gap** (prod may lag git).

---

## 1. Architecture (as-built)

```text
Browser
  ├─ ft_session (HttpOnly JWT, HS256, iss=labs.fattail.ai)
  │     role snapshotted at login; feature_role() elevates for some gates
  ├─ Next.js rewrite /api/* → Labs FastAPI
  └─ Login buttons → WP (fattail.ai | 0-dte.com)
        fotw-sso → GET Labs /api/auth/sso/{provider}?sso=<JWT>
              verify HS256 → resolve identity_links → mint ft_session

WooCommerce → HMAC webhooks → memberships (entitlement source of truth for paid tiers)
```

| Layer | Trust |
|-------|--------|
| Session cookie | Labs `LABS_SESSION_SECRET` |
| SSO JWT | Per-site secret (`LABS_SSO_SECRET_*`) |
| Memberships | Webhooks + SSO entitlement keys → `provider_plan_map` |
| Admin | `role` in session JWT ≥ administrator (or `role_override`) |

---

## 2. Strengths (keep)

| Area | Notes |
|------|--------|
| Open redirect | `safe_next_path` rejects absolute/`//` URLs |
| Cookie flags | HttpOnly, SameSite=Lax, Secure outside dev |
| Logout | Multi-variant cookie clear; clear-before-set on mint |
| SSO reauth | `wp-login.php?reauth=1` wrap reduces sticky WP sessions |
| Passwords | scrypt (stdlib), enumeration-safe login errors |
| Dual identity model | Links by provider+external_id; email merge path exists |
| Access Control | Server evaluate; no public decision oracle; ungateable surfaces |
| Fail-loud config | Missing secrets / cookie domain outside dev abort boot |

---

## 3. Findings & recommendations

Impact: **H** = security/account integrity, **M** = abuse/ops reliability, **L** = polish.  
Effort: **S** = &lt;1 day, **M** = 1–3 days, **L** = multi-day / multi-system.

### P0 — High impact

| ID | Weakness | Impact | Effort | Recommendation |
|----|----------|--------|--------|----------------|
| **H1** | **Session JWT freezes `role` for up to 7 days** (`LABS_SESSION_TTL=604800`). `require_admin` / many routes use `claims["role"]`, not live `derive_role`. Cancelled admin or demoted user keeps cookie privilege until expiry. `/me` already computes `access_role` live for display. | **H** | **M** | Prefer **live role** for authorization (`feature_role` / `derive_role` on every privileged request), or short-lived JWT (≤1–2h) + refresh. Minimum: re-check admin on `require_admin`. |
| **H2** | **SSO JWT in query string** (`?sso=`). Lands in browser history, proxy logs, Referer, analytics. Token is bearer for session mint. | **H** | **M–L** | Prefer POST body or one-time exchange code (WP posts code → Labs exchanges server-side). Short SSO JWT TTL on WP side if not already. Strip `sso` from logs (nginx access log query redaction). |
| **H3** | **WP `administrator` role → Labs `role_override=administrator`** (SSO path, only if override NULL). Any compromised WP admin or over-privileged WP role becomes Labs admin forever until manually cleared. | **H** | **S–M** | **Allowlist** Labs admins (emails / WP user ids / separate claim). Never auto-promote from generic WP `admin` role string. Keep Ernie as explicit allowlist. |
| **H4** | **Account-switch is dual-system** (Labs cookie + two WP cookies). Ops will keep hitting this without product UX. reauth wrap helps; not foolproof if WP plugins ignore reauth. | **H** (ops integrity) | **S** (UX) / **M** (WP) | Product: “Switch account” always reauth + optional “open private window”. WP: confirm fotw-sso honors reauth. Document in Admin Access guide. |
| **H5** | **Deploy lag**: git has logout/SSO fixes; production MiniTwo may still run old cookie clear. | **H** until deployed | **S** | Ship migrate + restart API/web on MiniTwo; verify Set-Cookie Domain on logout in prod DevTools. |

### P1 — Medium impact

| ID | Weakness | Impact | Effort | Recommendation |
|----|----------|--------|--------|----------------|
| **M1** | **No rate limit** on native login, register, forgot-password, SSO callback. | **M** | **S–M** | IP + email rate limits (e.g. 10/min login, 5/hour forgot). Fail closed with 429. |
| **M2** | **SSO email not bound to link** after first link. `resolve_by_link(provider, external_id)` ignores email change. WP user 696 stays Alpha forever even if email changes; email collision if new user gets old email via get_or_create. | **M** | **M** | On SSO: if link exists but email differs, update email carefully or flag for merge; refuse create if email owned by different identity. |
| **M3** | **`identity_id=0` dev-admin** path in trade_log / session. Guarded by `LABS_ENV=dev` in places; any env mislabel is catastrophic. | **M** | **S** | Assert `identity_id != 0` in production guards; remove fallback that picks ernie@fattail email on iid 0 outside dev. |
| **M4** | **Cookie domain `.fattail.ai`** shares cookie with any `*.fattail.ai` if compromised subdomain. | **M** | **S** | Prefer host-only `labs.fattail.ai` if no need to share with other subdomains; or lock down subdomains. |
| **M5** | **Nuclear cookie clear** emits many `Set-Cookie` headers (DoS-ish header bloat; weird proxies). | **L–M** | **S** | After one clean deploy cycle, reduce to: domain+host × secure true/false × path=/ only. |
| **M6** | **No CSRF on cookie-auth state-changing POSTs**. SameSite=Lax mitigates classic cross-site POST from other sites on modern browsers; not complete for all cases. | **M** | **M** | Double-submit CSRF token or `Origin`/`Referer` check on mutating admin/member POSTs. |
| **M7** | **Membership webhook** HMAC only — no timestamp/nonce (replay). | **M** | **S** | Reject bodies older than N minutes; include timestamp in signed payload. |
| **M8** | **Access Control preview-as** cookie design incomplete in UI; if mis-implemented later without write suppress, admin could pollute member data. | **M** | **M** | Finish preview-as per Spec: empty enrollments, write suppress tests (AC5 residual). |

### P2 — Lower impact / hygiene

| ID | Weakness | Impact | Effort | Recommendation |
|----|----------|--------|--------|----------------|
| **L1** | Session JWT has no `jti` / server-side revoke list. Logout is cookie-clear only; stolen JWT works until exp. | **L–M** | **L** | Optional session table or short TTL + refresh. |
| **L2** | SSO callback accepts both `token` and `sso` params — fine for compat; document only. | **L** | — | Keep; ensure both verified identically. |
| **L3** | Login form shows email/password + SSO; native accounts vs SSO-only can confuse. | **L** | **S** | Copy: “Membership SSO is separate from Labs password.” |
| **L4** | `is_admin` from WP roles includes bare `"admin"` string — broad. | **L** | **S** | Fold into H3 allowlist. |
| **L5** | Characterization tests weak on cookie jar (TestClient ≠ browser). | **L** | **S** | Add Playwright e2e: logout → 401 /me → SSO reauth URL contains reauth=1. |
| **L6** | Access Control still residual: feature_gates dual-read, SSG skeleton. | **L** | **M** | Track on board; not auth-critical. |

---

## 4. Priority matrix (do first)

```text
        High impact
            ▲
     H1  H2 │ H3  H5
     H4     │
   ─────────┼────────► Effort
     M1  M3 │ M2  M6
     M5  M7 │ M4  M8
            │
        Low impact
```

**Suggested sequence**

1. **H5** Deploy current auth commits to staging/prod (effort S, unblocks truth).  
2. **H3** Admin allowlist for WP→Labs promotion (S–M).  
3. **H1** Live role check on `require_admin` + critical gates (M).  
4. **M1** Rate limits on auth endpoints (S).  
5. **H2** SSO token not in long-lived logs + short WP JWT TTL (M; full POST exchange later).  
6. **M2** Email/link consistency on SSO (M).  
7. **H4** Operator runbook + e2e switch-account test (S).  

---

## 5. Design principles to lock

1. **Labs session ≠ WordPress session** — always treat them as two cookies; product must say so.  
2. **Authorize from identity + live memberships**, not only JWT `role` claim.  
3. **Never auto-admin from WP role names** without an allowlist.  
4. **Secrets never in query logs** — SSO JWT is a secret.  
5. **Account switch = Labs clear + WP reauth** — already partially implemented.  

---

## 6. Out of scope this audit

- Full pen-test of MiniThree nginx / Cloudflare  
- WP plugin fotw-sso code review (recommend separate pass with MSC)  
- Access Control campaign UX beyond auth boundary  

---

*Findings from code review of `auth_routes.py`, `auth.py`, `providers.py`, `identity.py`, `guards.py`, LoginForm, config, and recent incident behavior.*

---

## 7. Execution program

Multi-agent execution: **`agents/p-auth-hardening/`**  
Full plan: **`docs/Auth-Hardening-Full-Agent-Bench-Plan.md`**  
Per-finding plans: **`agents/p-auth-hardening/plans/H*.md`**  
Board: **`agents/p-auth-hardening/ORCHESTRATOR.md`** (assessment + reevaluation after each H).
