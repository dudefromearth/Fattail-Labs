# FatTail Labs — Enrollment & Lesson Access Spec v1.0

**Status:** Approved as built (2026-07-21, Coach directive)
**Supersedes:** `FatTail-Labs-Lesson-Video-YouTube-Spec-v1.0.md` §5's rule that
free-preview lessons are publicly playable — previews now require an account.
Extends `FatTail-Labs-Identity-Access-Spec-v1.0.md` §4.1 with self-serve registration.
**Parent spec:** `FatTail-Labs-Course-Hosting-Spec-v1.0.md`

---

## 1. Principle

**No lesson content plays anonymously — not even free previews.** The free preview is
the reward for creating a free account (observer tier), making signup the top of the
conversion funnel: browse publicly → register free to watch previews → become a member
to unlock everything. Catalog and course detail pages remain fully public (SEO surface
unchanged).

## 2. Self-Serve Registration (free account)

- `POST /api/auth/register {name, email, password}` → creates Identity + Credential,
  issues a session immediately (no email verification in v1.0 — logged as accepted
  debt; verification arrives before production launch), role derives to `observer`.
- Existing email → **409** ("account already exists — sign in"). This includes
  identities created by SSO: a password may NOT be attached to an existing identity
  via registration (account-takeover guard). Password setting for SSO identities is a
  future authenticated "set password" flow.
- Password policy: ≥ 10 chars (enforced in `identity.hash_password`).
- `/signup` page: name/email/password form → register → redirect `/courses`.
  Paid membership remains commerce-driven (WooCommerce provider or future native
  billing) — the page says so under the form.

## 3. Lesson Access Matrix (enforced in `GET .../lessons/{slug}`)

| Caller | Free-preview lesson | Gated lesson |
|---|---|---|
| Anonymous | **401** | **401** |
| observer (free account) | **200** — plays | **403** |
| activator / navigator / administrator | **200** | **200** — member playback |

- 401 vs 403 is meaningful and the player UI depends on it:
  **401 → "Create a free account to watch"** (Sign Up + Log In actions);
  **403 → "Become a member to unlock every lesson"** (membership CTA).
- This spec also ACTIVATES member playback of gated lessons (roles are real now);
  watch-progress tracking remains open P1c work.

## 4. Course Page Behavior

All lesson rows in the Modules tab are links (pages are shared/static — no per-user
rendering); the lesson endpoint is the sole access authority, and the player page
renders the 401/403 prompts. Lock icons remain on gated rows as visual state;
free-preview badges unchanged.

## 5. Invariants

1. Lesson content (embed config, body) never leaves the server without a valid session
   meeting the matrix above.
2. Registration never merges into an existing identity.
3. Public pages (catalog, course detail) stay fully anonymous-accessible — the SEO/AEO
   surface (§5.6 parent) is untouched by this spec.
