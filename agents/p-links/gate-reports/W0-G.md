# Links — W0-G census — LK-1

**Gate:** W0-G (G-0)
**Machine:** StudioTwo
**Time:** 2026-10-04 23:26 EDT
**Spec:** `Specs/LK-1.md` (seated this intake). Source draft `Specs/Links-Spec-v0_4.md` unchanged, 21665 bytes. Header of the source is the v0.4 DRAFT line. `LK-L0` occurs twice in both files.
**HEAD:** `4faabfd8`. Census is of the working tree at that commit.
**Local drift in the files this census opened:** `server/main.py` is modified (+23 lines: the access-line middleware below). `server/access_log.py` is untracked. `server/session_refresh.py`, `server/csrf.py`, `server/guards.py`, `server/routes/apps.py`, `server/routes/pageview.py`, `server/routes/landing.py`, `web/next.config.ts`, `web/app/admin/page.tsx`, `migrations/033_apps.sql`, `migrations/039_user_activity.sql`, and `migrations/125_landing_events.sql` match HEAD.
**Seats:** India and Juliet, read-only. Delta has not reviewed this report.
**Product allowlist:** none. This file is the only W0 path. No product tree is named.

## Verdict

**GO.** A public `GET /q/<slug>` does not need an exemption from global auth middleware. A request with no session cookie is not refused before a handler runs.

This GO is the census question only. It is not a stamp. BUILD AUTHORITY stays none. W1 is not released. No product allowlist is bound.

The stop condition (an auth exemption) is not met. Two scope lines below are reported for Coach. They are not planned and they are not added to a later allowlist.

## 1. Auth middleware

Session refusal is per route, in `server/guards.py`: `require_session` (line 84), `require_role` (line 144), `require_admin` (line 162). A route that does not call one of those is not answered 401 by a global gate.

`server/main.py` `create_app` registers three HTTP middlewares and no global `Depends`:

1. `CsrfOriginMiddleware` (`server/csrf.py`). `should_check_csrf` returns false for GET, HEAD, OPTIONS, and TRACE, and returns false when the session cookie is absent. A cookieless GET is not CSRF-blocked.
2. `rolling_session_middleware` (`server/session_refresh.py`), registered on HEAD and in the working tree. It calls the handler first. After the handler, if `ft_session` is absent it returns the response unchanged and does not verify a session. If the cookie is present it reads the cookie, may call `auth.verify_session`, and may `set_cookie` a refreshed session when the token is old enough.
3. `access_line_middleware`, working tree only (the +23 lines in `server/main.py`, helper `server/access_log.py`). It logs time, duration, status, and path. The path is stripped of the query string. The line has no client address, no cookie, and no member name. This middleware is not in commit `4faabfd8`.

Of 79 route modules under `server/routes` (Python files whose names do not start with `_`), 67 contain `require_session`, `require_role`, `require_admin`, or `require_human_admin`.

Handlers that already answer with no session, read on disk:

- `GET /api/health` in `server/main.py`
- `POST /api/apply` in `server/routes/apply.py`
- `server/routes/auth_routes.py`: `POST /login`, `POST /forgot-password`, `POST /reset-password`, `POST /register`, `GET /sso/…`, `GET /providers`. `GET /me` raises 401 in the handler when the cookie is absent.
- `POST /api/pageview` (`server/routes/pageview.py`): `claims_or_none`, always returns 200, writes only for a non-zero identity
- `POST /api/landing` (`server/routes/landing.py`): `claims_or_none`, always returns 200, anonymous visits included
- `POST /api/presence` (`server/routes/presence.py`): no claims returns `{ok: true, authed: false}`

`server/routes/courses.py` and `server/routes/lessons.py` call their own `_session_claims` and still respond when the cookie is absent. `server/routes/ai_admin.py` uses `require_actor`, not `require_session`. The market-stream websocket accepts, then closes 4401 when `claims_or_none` is empty. `server/routes/trade_log/commit.py` and `common.py` are helpers; the route modules beside them call `require_session`.

## 2. Public route on the Labs host

A non-`/api` GET is served by the Next app in `web/`. `web/next.config.ts` rewrites only `/api/:path*` to the API. There is no `web/middleware.ts`. No `layout.tsx` under `web/app` redirects to `/login`. Pages already on that host include `login`, `apply`, `hub`, `signup`, and `about`.

`/q/` can exist on that host without a new exemption. Nothing in this repo serves `/q/` today.

**Scope line (not an exemption, not a tree).** If C3 is registered on the FastAPI app, `rolling_session_middleware` reads `ft_session` whenever that cookie is present and may reissue it. RD-L1 says the redirect sets no Labs session. RD-L2 and AT-11a say the route reads no cookie, including when the phone carries a Labs session cookie. A Next page at `/q/[slug]` does not pass through that middleware. This census does not choose which tree holds C3.

**Scope line (not an exemption, not a tree).** The API process on StudioTwo is `uvicorn main:app --host 127.0.0.1 --port 4000 --reload` with no `--no-access-log`. Uvicorn's default access format (`uvicorn/config.py`) is `%(client_addr)s - "%(request_line)s" %(status_code)s`. A C3 mounted on that process would write the client address to that log. RD-L3 says the raw IP is not logged. The uncommitted Labs access line does not contain the address. This census does not turn the log off and does not move the route.

## 3. App registry

`migrations/033_apps.sql` creates `apps` with `id`, `slug`, `title`, `blurb`, `status`, `sort_order`, `created_at`, `updated_at`. There is no role column. Seeds are inserts of slug, title, blurb, status, and sort order.

`server/routes/apps.py` `POST /api/admin/apps` calls `require_admin` before insert. Role for member surfaces lives on access-control policy as `min_role` (`server/access_control/types.py`, `server/access_control/policy.py`), not on `apps`.

The admin overview is the hardcoded `CARDS` array in `web/app/admin/page.tsx`. Inserting an `apps` row does not add a card there. This census does not add a row and does not name which of those two surfaces C6 uses.

## 4. Instrumentation

Q4 is ruled in LK-1 §9.1: C2 is the app's own store. This census reports the existing schemas and does not choose one.

`migrations/039_user_activity.sql` `page_views`: `identity_id` NOT NULL, foreign key to `identities`, `path`, `created_at`. The file's comment says authenticated in-app navigation only; anonymous visitors are not recorded. `server/activity.py` `record_pageview` is the writer. `server/routes/pageview.py` is the ingest.

`migrations/125_landing_events.sql` `landing_events`: nullable `visitor_id`, nullable `identity_id`, `path`, landing flag, referrer, UTM fields, `user_agent`. The file's comment says every visit, anonymous included, and that raw IP is not stored. `server/routes/landing.py` is the ingest.

Both tables are the member-behavior and traffic stores a public route is ruled not to write. C2 is a separate store. Its path is not named here.

## 5. Trees the spec does not name

Raised to Coach, not added to an allowlist:

- The FastAPI session-refresh middleware and the uvicorn access log, if C3 is mounted on the API process (section 2).
- No WordPress tree in this repo (`wordpress/` and `wp-content/` are absent). README: fattail.ai is the WooCommerce brand host; labs.fattail.ai is this product. LK-1 W6 says placing the disclosure page is a one-page WordPress content edit, not a tree, and that Juliet confirms that at W0-G. This census confirms there is no WordPress tree here. LK-1 §11 says any WordPress change is out of scope for this version. Both sentences stand. W6 drafts the paragraph. This version does not place it.

## Law mismatch (reported, not rewritten)

LK-L4 says "default H with a center logo" and, in the same sentence, that the FatTail mark is off by default (ruled Q5). §9.1 Q5 says the mark is off by default. This report does not pick which clause an implementer follows.

## Unmeasured

No request was sent to `/q/` (the path does not exist). No session-bearing request was issued to watch the refresh middleware. No uvicorn access line was captured. The admin card list was not clicked. GeoLite2 was not opened. Delta has not reviewed this file.
