# GSC3-G — route · nav · auth · shell

**Delta** · 2026-09-09 · Ernies-MacBook-Pro.local  
**Verdict:** **PASS**

Entry: `agents/go/GSC-W0.md` GO · `gate-reports/GSC2-G.md` PASS.  
Stamps used: **OD-S1 (a)** `/resource/sessions` · **OD-S2 (a)** Sessions Link, Tags not a route · **OD-S3 (a)** gated, pill hidden when anonymous · **JR6** no SiteHeader `NAV`.  
**OD-S4** not this phase (GSC4 entry).

Local stack only: API `http://127.0.0.1:4000` · web `http://localhost:3000`.

---

## Declared allowlist (GSC3 writes)

| Path | Touch |
|------|--------|
| `web/app/resource/sessions/page.tsx` | Create. `"use client"` CSR member route. `fetchMe()` empty-deps. Trade Log anon → Sign in `/login`. Chart stub. No `next/dynamic`. |
| `web/app/resource/sessions/layout.tsx` | Create. **Added after first walk:** client `page.tsx` cannot export metadata; Next kept `<title>FatTail Labs</title>`. Layout exports `title: "Sessions"` (zero fetch) so L6 template yields `Sessions — FatTail Labs`. |
| `web/components/resources/ResourcesHub.tsx` | Named on GO allowlist. Lift `ResourcesSubNav`: Sessions `Link`; Library/Tags stay in-page tabs on `/resource`. `min-h-[var(--hit-min)]` + `focus-visible` rings. |
| `web/app/resource/ResourcesPageClient.tsx` | `fetchMe()` once for `showSessions`. `?tab=tags` so the Sessions-page Tags `Link` lands on Tags. Library/Tags keep working. |

**Not touched:** `web/components/resources/sessions/**` (does not exist) · SiteHeader `NAV` · Practice · `web/lib/marketCalendar/**` · `web/lib/sessions/**` · `server/**` · `migrations/**` · `appearance.py`.

---

## GSC3-0 Charlie

- Route: `/resource/sessions`. Client page. No `revalidate`, no server fetch on render.
- Title slot **`Sessions`**. Rendered `<title>Sessions — FatTail Labs</title>`.
- Sessions child is a `Link`. Active `aria-current="page"` on this route.
- Auth: `fetchMe()` → `anon` shows Trade Log copy (`Sign in` → `/login`); `member` sees stub. No new policy / slug / table / API.
- No `next/dynamic`, no `import()`.
- Stub: `data-testid="sessions-map-stub"` — “Session map lands in GSC4.” No bars, grid, axis, now-line.

---

## GSC3-1 Echo (chrome only)

- Pill sits in the same centered Practice-style capsule (`rounded-full` fill, `gap-0.5`, above the title).
- Keyboard Tab: 2px solid outline on Sessions (`outline: rgb(29, 29, 31) solid 2px`). Visible. Tint-coloured ring can wait; do not invent a third capsule.
- Hit target: **44×91 px** (height = `--hit-min` 2.75rem). Width > 44.
- **GSC4 sticky gutter (do not build):** `ResourcesSubNav` is not sticky; it will scroll away. Site header uses `--header-height` 56/64. Page is `max-w-5xl px-6 py-10`. Stub has no reserved chart height. Compact density already drops `--hit-min` to 2.25rem (36px) — existing token, not a GSC3 change. Wiki/Help dock is bottom-right.

---

## GSC3-2 Mike

- Gate is existing session cookie + `GET /api/auth/me` via `fetchMe()`. No entitlement table, no membership slug, no `server/` diff, no API route.
- Appearance allowlist: **no edit**. JR6 — Sessions is not a `SiteHeader` item. GSC0-6 one-line `ALLOWED_MEMBER_HREFS` was not required and was not taken.
- AT-GSC-45a static: GSC3 pathspec contains no policy.

---

## GSC3-G Delta — browser evidence

Walk script: `agents/p-sessions/evidence/gsc3-walk.mjs`  
JSON: `agents/p-sessions/evidence/gsc3/walk.json`  
Machine: Ernies-MacBook-Pro.local · 2026-09-09T19:54:16Z

### 1. Signed-in member (dev-login)

- `/resource/sessions` inside Labs shell (`header.site-header`).
- Sessions pill **active** (`aria-current="page"`). Stub visible.
- Title: `Sessions — FatTail Labs`.
- Shot: `evidence/gsc3/member-sessions.png` · focus `member-sessions-focus.png`.

### 2. Anonymous

- Same URL, 200. Sign in to use Sessions. **Sessions pill absent** (OD-S3 a).
- Shot: `evidence/gsc3/anon-sessions.png`.

### 3. No regression — Library and Tags on `/resource`

- Member: both clicked. Library hub + Tags vocabulary render. Sessions pill remains on the hub.
- Anon: Library (sign-in card) + Tags still switch; Sessions pill still absent.
- Shots: `member-resource-library.png` · `member-resource-tags.png` · `anon-resource-library.png` · `anon-resource-tags.png`.

### 4. `/api/auth/me`

| Window | Count |
|--------|-------|
| Sessions load (member) | **3** parallel GETs (SiteHeader raw fetch · HelpLauncher raw fetch · `fetchMe()` cache shared by IdleSessionGuard + this page) |
| After settle 3s (still on Sessions; **no date control in GSC3**) | **0 extra** |
| After Library/Tags client nav | +2 (HelpLauncher is keyed on `pathname` — pre-existing chrome) |

Sessions-owned call is `fetchMe()` with **empty deps**. Date change is GSC5; the static half of AT-GSC-30 is this empty-deps effect. See NOTES.

### 5. Diff subset

```text
git diff --stat -- web/app/resource/ResourcesPageClient.tsx \
  web/components/resources/ResourcesHub.tsx web/app/resource/sessions
# web/app/resource/ResourcesPageClient.tsx  | 25 ++++++--
# web/components/resources/ResourcesHub.tsx | 97 ++++++++++++++++++++++---------
# 2 files changed, 89 insertions(+), 33 deletions(-)

git status --short -- web/app/resource/sessions
# ?? web/app/resource/sessions/   (page.tsx + layout.tsx)
```

Nothing under `web/components/resources/sessions/`.  
Tracked files outside this pathspec (`Architecture/00-decision-log.md`, `agents/README.md`, `web/package-lock.json`) are **not GSC3 writes** (GSC0 Lima / unrelated fsevents line). Untracked `web/lib/marketCalendar/` and `web/lib/sessions/` are GSC1 / GSC2.

### 6. Title

Slot `Sessions`. Document title `Sessions — FatTail Labs` (root `title.template`).

AT-GSC-40 placement satisfied. AT-GSC-45 static half satisfied (existing authenticated floor, Observer included via existing `access_role`, no new policy). Observer-specific Playwright login was not a separate account this walk (dev-login is administrator, above the floor).

---

## BLOCKERS

*(empty)*

---

## NOTES

1. **OD-S4 still PENDING.** GSC-W0 §4 said resolve before GSC3-G. This runner says GSC3 does not wait; HTML gates GSC4 only. Followed the runner. Not ticked.
2. **Raw `/api/auth/me` count is 3 on every Labs member route**, because `SiteHeader` and `HelpLauncher` fetch outside `fetchMe()`. Collapsing them onto the cache would make the network count 1. **Escalated, not decided** — those files are not on the GSC3 allowlist. Sessions does not add a fourth request and does not re-fire after settle.
3. **`layout.tsx`** is a fourth product file, required for L6. Declared above.
4. Compact `--hit-min` 36px is an existing member-density token. Default 44px holds.
5. Did not start GSC4. No `SessionMap` / `SessionControls` / `StatusBanner` / `ClosuresList`. No session bars.

---

## Does not

Unlock GSC4 (needs OD-S4). Deploy. Stamp OD-S4.
