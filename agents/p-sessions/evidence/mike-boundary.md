# GSC0-6 — Mike · Auth boundary

**Agent:** Mike  
**Date:** 2026-09-09  
**Product code:** none. No new policy.

---

## Existing guard is enough

| Piece | As-built | Sessions use |
|-------|----------|--------------|
| Session cookie | `ft_session` HttpOnly SameSite (Labs JWT) | Browser sends on `fetch("/api/auth/me", { credentials: "same-origin" })` |
| Identity | `GET /api/auth/me` | `fetchMe()` in `web/lib/useIsAdmin.ts` — **one in-flight promise per cache generation** |
| Observer trial | `access_role` elevation (header already treats Observer ≡ navigator feature floor) | No new membership slug. Spec: Observer included, no tier gate |
| Server role checks | API still checks session on `/api/*` | Sessions page **stores no member data** and calls **no Sessions API**. After identity, **zero application network** (AT-GSC-30) |

No entitlement table. No new issuer. No webhook. Family B: nothing to isolate — no rows written.

**AT-GSC-30:** `fetchMe()` must run **once** when the page leaves `loading`. Date change must not call it. `useIsAdmin()` re-runs an effect on **pathname** — do not use that hook for the Sessions gate; call `fetchMe()` from a mount-only effect (Charlie GSC0-5). Chrome may already have populated `mePromise`; then Sessions adds **zero** fetches. That still satisfies “exactly once” at the application layer (one cache fill per session generation).

Anon: 200 HTML + sign-in link (not a 401 document). That matches Trade Log’s client `state === "anon"` pattern — client is not trusted for **data**; there is no data. Mike: acceptable for a read-only clock with no secrets. Do not add a server middleware just for this route unless Coach wants a hard 302 — that would be a new policy. **Recommendation (not a pick):** keep client gate.

---

## Appearance allowlist

`server/appearance.py` `ALLOWED_MEMBER_HREFS` includes `"/resources"` and does **not** include `"/resource"` or any `/resource/sessions`.

That list gates **configurable member chrome nav items**, not every Next route. Sessions is a **Resources sub-nav child**, not a `SiteHeader` item (JR6).

| If Coach stamps | Allowlist needed? |
|-----------------|-------------------|
| OD-S1 (a) `/resource/sessions` + JR6 (no header) | **No.** Child route; chrome unchanged |
| OD-S1 (b) `/resources/sessions` + JR6 | **No.** Same |
| Coach later puts Sessions in `member_chrome.nav` | **One line** in `ALLOWED_MEMBER_HREFS`: the stamped path. That is an href allowlist edit, **not** a membership policy |

**This ship: no appearance.py edit unless Coach overrides JR6.** Known divergence `/resources` vs `/resource` is Lima’s GSC6-1 DL, not a Sessions policy.

---

## GSC0-6 done

Guard named. No new policy. Allowlist: none for the recommended chrome. Observer rides `access_role`.
