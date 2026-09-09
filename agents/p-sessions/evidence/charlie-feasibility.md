# GSC0-5 — Charlie · Feasibility (no code)

**Agent:** Charlie  
**Date:** 2026-09-09  
**Machine:** Ernies-MacBook-Pro.local  
**Product code:** none. `web/` read-only this session.

Hand-over in: India OD-S1/S2 as-built; Echo nav contract; Mike will confirm auth. HTML search completed here.

---

## File tree (JR4 — recommendation only; Coach stamps OD-S1 path)

```
web/lib/marketCalendar/index.ts
web/lib/marketCalendar/index.test.ts
web/lib/sessions/timeAxis.ts
web/lib/sessions/exchanges.ts
web/lib/sessions/sessionView.ts
web/lib/sessions/timeAxis.test.ts
web/lib/sessions/sessionView.test.ts
web/app/resource/sessions/page.tsx          # if OD-S1 (a)
# or web/app/resources/sessions/page.tsx    # if OD-S1 (b) — Coach picks
web/components/resources/sessions/SessionMap.tsx
web/components/resources/sessions/SessionControls.tsx
web/components/resources/sessions/StatusBanner.tsx
web/components/resources/sessions/ClosuresList.tsx
```

Edits (not creates): `ResourcesHub.tsx` (`ResourcesSubNav`), `ResourcesPageClient.tsx`, Echo later `tokens.css`.

### Write trees (absolute)

| Packet | May write | Must not |
|--------|-----------|----------|
| GSC1 | `web/lib/marketCalendar/` only | `web/lib/sessions/` |
| GSC2-axis | `timeAxis.ts`, `exchanges.ts` | `marketCalendar/`, `sessionView.ts` |
| GSC2-view | `sessionView.ts` + its tests | **`timeAxis.ts` / `exchanges.ts` full stop.** No `GSC2-axis-G`. |
| GSC3+ | page + components listed | Practice suite, SiteHeader NAV, DL-539 trees |

Zero new `server/` files.

---

## ResourcesSubNav → Sessions Link (no Practice edit)

Today: `ResourcesSubNav` is a **tablist of buttons** (`library` | `tags`) in `ResourcesHub.tsx`. Hub page is public CSR client.

Charlie (GSC3): lift `ResourcesSubNav` so items can be `button` **or** `Link`.

- Library / Tags stay in-page tabs on `/resource` (OD-S2 (a) if Coach silent).  
- **Sessions** is `<Link href={stampedPath}>Sessions</Link>` with `aria-current="page"` when `pathname` matches.  
- Same pill class names as existing `ResourcesSubNav` / `PracticeSuiteNav` (`inline-flex min-h-9 …`). Do **not** import or edit `PracticeSuiteNav` / `practiceSuite.ts`.  
- On the Sessions page, render the same nav with Sessions active; Library/Tags links go to `/resource` (Library) and `/resource` with tab=tags **or** stay hub-only — if OD-S2 (a), Tags is not a route; from Sessions, Tags can link to `/resource` and the hub defaults Library. Charlie will not invent `/resource/tags` unless Coach ticks OD-S2 (b).

---

## Auth — client-rendered, `/api/auth/me` once

Reuse **`fetchMe()`** in `web/lib/useIsAdmin.ts` (module-level promise cache, `credentials: "same-origin"`). Do **not** call `useIsAdmin()` for the gate: that hook’s effect depends on **`pathname`** and would re-hit the cache machinery on nav; the gate only needs identity once.

Sessions page: `"use client"`; `useEffect` with **empty deps** calls `fetchMe()` once → `anon` | `member`. Anon: same copy pattern as other member surfaces — `<Link href="/login">Sign in</Link>`. Observer: `fetchMe()` JSON includes `access_role` / memberships — no new slug (Mike).

Date change is React state, **not** a route change → must not call `fetchMe()` again (AT-GSC-30).

**No `next/dynamic`. No dynamic `import()`** in `page.tsx` or `web/components/resources/sessions/**`. Static imports only (AT-GSC-41c).

Title: `export const metadata` is for server pages; CSR child can set `document.title` **or** a small server wrapper `page.tsx` that only exports `metadata: { title: "Sessions" }` and renders the client chart. Wrapper with metadata + client child is the Labs pattern for member titles (`%s — FatTail Labs`). If the wrapper is a server file with zero fetch, AT-GSC-30 still holds on the client tree.

Tests: `npx --yes tsx web/lib/marketCalendar/index.test.ts` (bare Node, no DOM) — existing pattern `web/lib/ikiSuite.test.ts`.

---

## `session-clock.html`

Search (2026-09-09, this machine):

```bash
find /Users/ernie -name 'session-clock*.html' \
  -not -path '*/node_modules/*' \
  -not -path '*/Library/*' \
  -not -path '*/.Trash/*' 2>/dev/null
```

Also: repo, Desktop, Downloads, Documents (earlier same day).

**Result: zero paths.** Duration ~181s. **Missing.**

OD-S4: GSC4 entry, **not a GSC0 stop**. Reconstruct (c) is feasible from Spec §5–§8 + Echo visual contract in `echo-ia.md`. Charlie can build GSC1–GSC3 without the HTML.

---

## GSC0-5 done

File tree named. Nav lift named. Auth once named. No dynamic import. HTML missing, recorded.
