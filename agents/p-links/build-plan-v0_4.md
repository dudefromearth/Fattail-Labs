# Links — Phase 1 build plan v0.4 — C1–C7 paths bound

**Plan:** v0.4
**Supersedes:** `agents/p-links/build-plan-v0_3.md` (left on disk). Do not dispatch from v0.1, v0.2, or v0.3.
**Law:** `Specs/LK-1.1.md`. Stamped baseline `Specs/LK-1.md` (21872 bytes; sha256 in `Specs/LK-1-STAMP.md`). Do not edit the law, the baseline, or the stamp.
**BUILD AUTHORITY:** Phase 1. Phases 2–4 are not in any packet.
**Machine:** StudioTwo. Promote to MiniTwo only at W5, and only after Coach's G-P.
**Orchestrator:** dispatches seats and does not implement.

## What changed v0.3 → v0.4

| Area | v0.3 | v0.4 |
|---|---|---|
| File tree | unnamed | C1–C7 paths below |
| Allowlists | unbound | W1, W2, and W3 bound |
| Redirect process | "a Next page, never /api" | Next page calls a loopback worker that is not the FastAPI app |
| W1 | waiting on this document | dispatchable |

Coach's three constraints, carried forward:

1. The browser hits a Next page at `/q/<slug>`. That page is never an `/api` route and never a FastAPI route.
2. Admin-only uses the existing `require_admin` derivation. `web/app/admin/page.tsx` gains one card. No role column on `apps`.
3. The disclosure paragraph is a W6 draft. Nothing is placed on fattail.ai.

---

## 1. File tree

The public request never enters `server/main.py`. FastAPI's session middleware reads `ft_session` when a cookie is present, and uvicorn's access log records the client address. RD-L2 and RD-L3 forbid both on the redirect. The Next route does not read a cookie and does not forward one.

| Component | Path | Packet |
|---|---|---|
| C1 link store | `migrations/155_links.sql`, `server/links/store.py`, `server/links/slug.py`, `server/links/fence.py` | W1 Alpha |
| C2 event store | `server/links/events.py` | W1 Alpha |
| C3 redirect | `web/app/q/[slug]/route.ts`, `web/lib/links/publicRedirect.ts`, `server/links/public_worker.py`, `server/links/__init__.py` | W1 Alpha |
| C7 fixtures | `server/links/fixtures/d4_bots.txt`, `server/links/fixtures/fence_cases.json`, `server/links/fixtures/user_agents.json`, `server/tests/test_links_w1.py` | W1 Kilo |
| C4 QR | `server/links/qr.py`, `server/requirements.txt` (pin only), `server/tests/test_links_w2.py` | W2 Alpha |
| C5 geo | `server/links/geo.py`, `server/links/fixtures/geolite2-test.mmdb` | W2 Alpha |
| C5 wire-up | `server/links/public_worker.py`, `web/lib/links/publicRedirect.ts` | W2 Alpha, geo call only |
| C6 admin API | `server/routes/links_admin.py`, `server/main.py` (one `include_router` only) | W3 Charlie |
| C6 admin UI | `web/app/admin/links/page.tsx`, `web/app/admin/links/[slug]/page.tsx`, `web/components/admin/LinksAdmin.tsx`, `web/app/admin/page.tsx` (one card) | W3 Charlie |
| W6 | `Architecture/00-decision-log.md`, `Architecture/38-links.md`, `Architecture/README.md`, `agents/p-links/gate-reports/W6-disclosure.md`, `agents/p-links/gate-reports/W6-G.md` | not dispatched |

`server/links/__init__.py` is empty of FastAPI imports. The worker listens on `127.0.0.1:4017` only. It writes no access line that contains an address. It has no cookie parameter.

### Schema (`migrations/155_links.sql`)

`links`: slug (unique, length 6), destination, label, active, static flag, placement columns `source`, `medium`, `campaign`, `placement` (nullable), `owner` nullable and written by no statement in this phase, `design_json`, created_at, updated_at.

`link_events`: occurred_at UTC, slug, kind, device_class, os_family, referrer, country, region, bot. Columns `member_id` and `marker_id` exist and every insert writes them NULL. No IP column.

`link_misses`: attempted string, occurred_at. Not an event on a link.

### Frozen W1 functions

```text
fence.assert_destination_storable(url) -> None          # FenceError, no network
fence.assert_public_answers(addresses) -> None          # FenceError, no network
fence.reachability(url) -> str | None                   # only after the fence passes
slug.ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz"
store.create_link(cur, *, destination, label, static=False, design=None, placement=None) -> dict
store.update_link(cur, slug, *, destination=None, label=None, active=None, design=None, placement=None) -> dict
store.get_link(cur, slug) -> dict | None
events.record_pass(cur, *, slug, kind, device_class, os_family, referrer, country, region, bot) -> None
events.record_miss(cur, *, attempted) -> None
events.classify(ua, referrer) -> dict                   # reads fixtures/d4_bots.txt
public_worker.decide(slug, ua, referrer) -> dict        # no cookie, no IP, no write
public_worker.log_after(slug, ua, referrer) -> None     # failure must not raise to the caller
```

`create_link` and `update_link` have no `owner` parameter. A destination that fails the fence is not stored and `reachability` is not called. A reachability failure after a passing fence is a warning on the returned dict; the row is stored. Slug is editable only while the link has zero events, then frozen. Static links redirect and write no event. Unknown and inactive write a miss and no `link_events` row. Inactive returns a plain "no longer active" page. Unknown returns a plain 404. A hit with a valid stored https destination returns 302 and these headers verbatim: `Cache-Control: no-store, no-cache, max-age=0, must-revalidate`, `Pragma: no-cache`, `Expires: 0`, `Vary: *`. No `Set-Cookie`. The route re-checks the scheme and refuses a non-https stored destination. The request's destination query is ignored.

`events.classify` reads `server/links/fixtures/d4_bots.txt`. Kind is `scan` when the request has no referrer and a mobile UA, otherwise `click`. Referrer absent is stored as `direct`. Country and region are `unknown` until W2.

The Next route calls `decide`, sends the response, then `log_after`. It does not import `cookies`. It does not copy the incoming `Cookie` header.

### D4 fixture (Kilo writes this text)

```text
iMessage preview
Slackbot-LinkExpanding
Discordbot
bot|crawler|spider|preview
```

The last line is the generic match. The three names above it are pinned substrings.

---

## 2. Allowlists

A path not on the packet's list stops that gate. Seats do not revert unrelated dirty files. `server/main.py`'s existing access-line hunk is not this program and is not on the W1 or W2 list.

### W1 Alpha

- `migrations/155_links.sql`
- `server/links/__init__.py`
- `server/links/store.py`
- `server/links/slug.py`
- `server/links/fence.py`
- `server/links/events.py`
- `server/links/public_worker.py`
- `web/app/q/[slug]/route.ts`
- `web/lib/links/publicRedirect.ts`

### W1 Kilo

- `server/links/fixtures/d4_bots.txt`
- `server/links/fixtures/fence_cases.json`
- `server/links/fixtures/user_agents.json`
- `server/tests/test_links_w1.py`

### W2 Alpha

- `server/links/qr.py`
- `server/links/geo.py`
- `server/links/fixtures/geolite2-test.mmdb`
- `server/requirements.txt`
- `server/tests/test_links_w2.py`
- `server/links/public_worker.py` (pass a peer address into geo, then drop it; still no cookie)
- `web/lib/links/publicRedirect.ts` (forward the peer address only; still no cookie)

### W3 Charlie (bound now, not dispatched)

- `server/routes/links_admin.py`
- `server/main.py`
- `web/app/admin/links/page.tsx`
- `web/app/admin/links/[slug]/page.tsx`
- `web/components/admin/LinksAdmin.tsx`
- `web/app/admin/page.tsx`

W3 starts only after Coach records G-D. Every admin API calls `require_admin`. The card is `href: "/admin/links"`, `title: "Links"`, `testId: "admin-card-links"`.

---

## 3. Gates

Evidence is pinned to StudioTwo, the git SHA of the tree under test, and the machine clock. AT-10 includes a network capture showing fence failures make no outbound request.

**W1-G:** AT-1, AT-4, AT-5, AT-6, AT-10, AT-11a, and the RD-L1 latency bar (under 0.5 s after receipt on a warm worker). `git diff --stat` matches the W1 lists. Delta writes `agents/p-links/gate-reports/W1-G.md` with an explicit GO or NO-GO and an **Unmeasured** heading. Delta does not edit the work.

**W2-G:** AT-2, AT-3. AT-2 is every SVG and PNG at L/M/Q/H, with and without the mark, decoded by the server's own decoder. A center logo is rendered only at H. The default render has no logo. AT-3: a resolvable address yields country and region only; the city is absent; an unresolvable address yields `unknown`; grep of `link_events` and the worker log shows no IP. Delta writes `agents/p-links/gate-reports/W2-G.md`.

**Then stop for Coach.** Echo writes the admin mockup for G-D. W3, W4, and W5 do not start in this plan's dispatch until Coach says so.

**W3-G** (after G-D): AT-7, AT-8, AT-11b, one screenshot per view.

**W4-G** and **W5-G** are Coach's. W5 is MiniTwo, market closed, rollback named before it starts.

**W6** drafts the decision-log entry, `Architecture/38-links.md` (the public route, and `member_id`, `marker_id`, and `owner` documented as reserved), India's drift check, Lima's Help-doc check, and the disclosure paragraph. It does not place the paragraph.

---

## 4. Stops

- Any cookie or session read on the redirect
- The redirect mounted on FastAPI or under `/api`
- An auth exemption
- An `owner` write, a channel report, a WordPress change, a rule engine
- A product file outside the packet allowlist
- A later phase
- LK-1's sha256 differing from `Specs/LK-1-STAMP.md`

Auto-GO a clean W1-G and W2-G. Do not auto-GO G-D, W4-G, or W5-G.
