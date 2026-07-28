# FatTail Labs — User Activity Analytics Spec v1.0

**Status:** Draft — pending live verification (2026-07-28)
**Context:** Operators need a `/admin` **Users** view: every person who signs into
Labs, keyed by email, with how they signed in, their membership (pulled from
fattail.ai / 0-dte SSO), and engagement — login frequency, pages navigated, and
time on platform.
**Related:** Identity & Access Spec v1.0, Member-Data-Privacy Spec, Feature Gates
(DL-063/064). Decision: DL-065.

---

## 1. Problem

Auth is stateless JWT (`ft_session`); nothing records logins, and there is no
navigation/engagement telemetry. Identity, membership, and course-progress data
exist but are not surfaced per-user for operators.

## 2. What ships (v1)

1. **Login logging** — every successful login writes one `login_events` row
   (identity, provider, role, ip, user-agent, time).
2. **Page-view tracking** — authenticated member navigations write `page_views`
   rows (path only). `/admin` routes and anonymous visitors are never recorded.
3. **Admin Users section** — `/admin/users`: searchable roster + per-user detail
   (logins, membership, pages, estimated time on platform, course engagement),
   plus roster CSV export.

Email is the identity key throughout (`identities.email` unique).

## 3. Data model (migration 039)

```
login_events(id, identity_id→identities, provider, role, ip, user_agent, created_at)
page_views(id, identity_id→identities, path, created_at)
```

Both cascade on identity delete. No new PII beyond IP/user-agent on logins and
member navigation paths.

## 4. Capture

- **Login:** `activity.record_login()` is called from the single session
  choke-point `_session_response()` in `routes/auth_routes.py` (native login,
  register, SSO callback). Best-effort — a failed analytics write **never** fails
  authentication. Internal id 0 (dev/admin bootstrap) is skipped.
- **Page view:** client `PageViewTracker` (mounted in `AppChrome`, non-admin
  routes) POSTs `{path}` to `/api/pageview` on each navigation, `keepalive`,
  fail-silent. Server (`routes/pageview.py`) records only when a valid member
  session is present (`claims_or_none`), always returns 200, and drops id 0 /
  `/admin` paths via `activity.clean_path()`.

## 5. Read side (`routes/users_admin.py`, admin-only)

- `GET /api/admin/users?search=&limit=&offset=` — roster: email, name, derived
  role, providers, membership label, login count, last login, page-view count,
  last active, watch seconds, courses enrolled. Ordered by last login.
- `GET /api/admin/users/export.csv?search=` — roster CSV.
- `GET /api/admin/users/{identity_id}` — detail: memberships (plan/status/source
  /period), linked providers, login history + by-method breakdown, page-view
  totals + top paths + recent, **time on platform**, and engagement
  (watch seconds, courses enrolled/completed, quiz attempts).

Role is the canonical `identity.derive_role`. Membership rows come from the same
`memberships` table the SSO sync populates (source = `wordpress:fattail` / `0-dte`).

## 6. Time-on-platform estimation

`activity.estimate_sessions(epochs)` groups a user's page-view timestamps into
sessions, splitting on inactivity gaps > `SESSION_GAP_SECONDS` (30 min).
Time = sum of (last−first) within each session. A single-view session counts as
0 measurable seconds — dwell on a lone page cannot be known without heartbeats;
we do not guess. This is an **estimate**, honestly labelled as such.

## 7. Privacy

Engagement **metadata** only (which paths, counts, timings) — never member
private content (journal/trade-log bodies remain governed by the Member-Data
Privacy spec + `member_access_audit`). Query strings and fragments are stripped
before storage. Open item: confirm with Coach whether member navigation logging
needs a consent/disclosure line, and a retention window for `page_views`.

## 8. Files

- `migrations/039_user_activity.sql`
- `server/activity.py`, `server/routes/pageview.py`, `server/routes/users_admin.py`
- `server/routes/auth_routes.py` (login hook), `server/main.py` (register routers)
- `web/components/PageViewTracker.tsx`, `web/components/AppChrome.tsx` (mount),
  `web/app/admin/users/page.tsx`, `web/app/admin/layout.tsx` (nav)
- `server/tests/test_user_activity.py`

## 9. Verification

1. `cd server && .venv/bin/python -m pytest tests/test_user_activity.py -q` —
   sessionisation, path cleaning, write helpers, `/api/pageview`, register→login
   logging, admin roster + detail (mocked/probe rows, self-cleaning).
2. Live: sign in (native + a WP SSO), confirm a `login_events` row and the user
   appears in `/admin/users`; navigate member pages, confirm `page_views` grow
   and the detail view shows pages + a non-zero time-on-platform after ≥2 views.

## 10. Not in v1 / future

- Heartbeat-based precise dwell time; logout events.
- Retention/rollup jobs for `page_views` (could grow large).
- Charts/trends over time; cohort/funnel views.
- Anonymous (pre-login) analytics.
