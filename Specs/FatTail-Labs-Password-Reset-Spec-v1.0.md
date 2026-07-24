# FatTail Labs — Password Reset Spec v1.0

**Status:** Approved as built (2026-07-23)  
**Parents:** Identity-Access Spec v1.0  
**Decision log:** 2026-07-23 "Native forgot-password flow"

---

## 1. Purpose

Members (and operators) who use **native Labs email/password** can request a
time-limited reset link by email and set a new password without shell access.

Does **not** replace WordPress SSO password recovery on FatTail / 0-DTE sites.

---

## 2. Flow

```text
POST /api/auth/forgot-password  { "email": "…" }
  → if SMTP configured:
       if identity + credentials: mint token, email link
       always return same 200 detail (enumeration-safe)
  → if SMTP missing: 503 (fail loud; no silent drop)

User opens  /reset-password?token=<raw>

POST /api/auth/reset-password  { "token": "…", "password": "…" }
  → validate token (hash match, not used, not expired)
  → scrypt-hash password (≥10 chars)
  → update credentials; mark token used
  → 200; user signs in via /login
```

---

## 3. Data model

Migration `022_password_reset.sql` — table `password_reset_tokens`:

| Column | Notes |
|---|---|
| `identity_id` | FK → identities |
| `token_hash` | SHA-256 hex of raw token (unique) |
| `expires_at` | UTC |
| `used_at` | NULL until consumed or superseded |
| `request_ip` | Optional audit |

Raw tokens are never stored.

---

## 4. Security invariants

1. **No account enumeration** — forgot-password response text is identical whether
   or not the email has a Labs password.  
2. **Native credentials only** — no email if the identity has no `credentials` row
   (SSO-only users keep using their membership site).  
3. **Single-use** — `used_at` set on success; prior outstanding tokens invalidated
   when a new reset is requested.  
4. **TTL** — default **3600s** (`LABS_PASSWORD_RESET_TTL_SECONDS`, 300–86400).  
5. **Password policy** — same as register: ≥10 characters via `identity.hash_password`.  
6. **SMTP required** for the feature — missing `LABS_SMTP_*` → **503**, not a fake success.  
7. **Absolute link** requires `LABS_WEB_ORIGIN` (or `NEXT_PUBLIC_SITE_URL` fallback via notify).  
8. **No auto-login** after reset — user signs in explicitly.

---

## 5. Config

| Env | Role |
|---|---|
| `LABS_SMTP_HOST` / `FROM` / … | Required to send mail (Hostinger path) |
| `LABS_WEB_ORIGIN` | Base URL for `/reset-password?token=…` |
| `LABS_PASSWORD_RESET_TTL_SECONDS` | Optional; default 3600 |

---

## 6. UI

| Route | Behavior |
|---|---|
| `/login` | Link “Forgot password?” |
| `/forgot-password` | Email form → calls forgot-password API |
| `/reset-password` | New password form; requires `?token=` |

---

## 7. Operator fallback

Shell reset remains available: `server/create_user.py <email>` (overwrites hash).

---

## 8. Verification

`server/tests/test_password_reset.py`

- Invalid email → 422  
- SMTP missing → 503  
- Unknown email → 200 same detail, no token row  
- Known credential + mocked SMTP → token row + email body has link  
- Reset with token → login succeeds with new password  
- Reuse token → 400  
- Short password → 422  
