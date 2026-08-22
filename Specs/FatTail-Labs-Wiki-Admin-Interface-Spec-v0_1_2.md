# FatTail Labs — Wiki Admin Interface Spec v0.1.2

**Scope statement (doctrine, 2026-08-22)**
- **Active program:** IKI Lab — Wiki.
- **Touches:** this spec (new); Wiki Interface Spec v0.1 §6 (component registry — additions). Consumes Wiki Spec v1.0 §4.2 candidate table; writes disposition only.
- **Touches outside program:** **TWO, staged, neither seeded:** launcher mount in `AppChrome` (P1) and on Options Lab routes (frozen, DL-539) — three-OK each. **v0.1 mounts on IKI Lab + Wiki routes only.**

**Status:** DRAFT v0.1.2 — W0 companion (read-only empty inbox region in W0; launcher / Compile / Dismiss are W1). Grok r3: **GO with nits**, nits folded **[v0.1.1]**.
**Date:** 2026-08-22
**Canonical filename:** `Specs/FatTail-Labs-Wiki-Admin-Interface-Spec-v0_1_2.md`
**Companion:** Wiki Spec v1.2 (laws WK1–WK15; this spec adds no law, only surfaces). This file is **the** Admin Interface spec. Do not cite `v0_1` or `v0_1_1` leftovers.

**Parents:**

| Doc | Role |
|---|---|
| Wiki Spec v1.2 | Candidate table, dispositions, write matrix — authoritative |
| Wiki Interface Spec v0.1 | Surfaces, §6 component registry, WI9 stay-put, WI10 admin-only draft pattern |
| Help System Spec v1.0 §3 | `HelpLauncher` **isolation pattern only** — mount once, ErrorBoundary, role-gated. **Not** its UI (Ask/screenshot/upload), **not** `page_context`, **not** its `AppChrome` mount **[v0.1.1]** |
| Help System Architecture v0.1 §3.2, §5 | Overlay pattern; `surface_key`/`state_key`; no member content in a capture |
| Identity-Access v1.0 | `administrator` gate; no new role |
| Human Interface Spec v1.0 · HIG | Control grammar, `--hit-min`, focus |
| Application Framework v1.0 Part A4 | Stay-put on admin curation writes |

## 0. Coach's intent

> There should be an admin interface in IKI Lab for this agent/admin interaction. … Maybe this is a panel in the wiki rather than a separate app. … The "Compile This into Wiki" interface sounds like a feature I might want to include in any part of FatTail Labs. Like a universal bug that follows me around.

## 1. Two surfaces, one row

| Surface | Where | What it writes |
|---|---|---|
| **Compile inbox** | Admin region of the Wiki entry page | `disposition`, `note`, target, audience narrowing — on an existing candidate |
| **"Compile this into Wiki" launcher** | Floating, every mounted route | One new candidate row (origin `admin_pointed`), optionally with `disposition=compile` |

Both act on `wiki_compile_candidates` and nothing else. Neither calls the compiler; the row does (Wiki Spec §4).

## 2. Compile inbox

- **Placement:** admin region of the Wiki entry (Wiki Interface §4), **below or beside search — never displacing WI1 search-first for administrators** **[v0.1.1]**. Visible to `administrator` only; absent from DOM otherwise (WI10 pattern). **Never a modal;** never leaves the page (WI9 / Part A4 stay-put).
- **Order:** `open` first, then `compiling`, `compiled`, `dismissed` collapsed.
- **Row:** kind · title · source (deep link) · SHA/date · origin · audience · Oscar's proposed target · rationale (one line) · actions.
- **Actions:** **Compile** (target override wiki/help/both — **help and both disabled until OD-WK6 closes**, same as the launcher; audience narrow only) · **Dismiss**. Compile is fire-and-forget — row → `compiling`, admin continues. Panel never blocks on Oscar.
- **Derived display:** board outcome per `compiled_content_ids`, read-only, mixed outcomes rendered as mixed. No approve/reject control here (WK5).
- **Empty state:** *"Nothing deployed without a wiki/help directive."* No illustration.
- Density, column widths, collapsed-row treatment: **design chain.**

## 3. Launcher — "Compile this into Wiki"

- **Name:** Coach's words, verbatim. Tango may not rename.
- **Pattern:** `HelpLauncher` isolation pattern — mounted once per route tree (**IKI suite chrome + wiki entry in v0.1**, not `AppChrome`), behind an ErrorBoundary, gated `role === administrator`. **The launcher captures; Oscar never does** **[v0.1.1]**.
- **Capture:** `surface_key` from the **declared IKI/Wiki-local list** (Wiki Spec §14 W1; H1 when as-built), declared `state_key` (token only, optional/null — never router search, never an entity id), route, timestamp, administrator identity. **Nothing else.** No screenshot, no page text, no Family B.
- **Sheet (first activation):** small; target chooser (wiki / help / both — **help and both disabled until OD-WK6 closes**, W1) · optional one-line note · **Compile now** / **Add to inbox**. Both write the same row; *Compile now* sets `disposition=compile`. No page preview.
- **Placement:** **not** the member `HelpLauncher` corner. Must read as operator chrome and survive screenshare without painting over member UI. Chord vs. visible mark: **design chain** (Interaction).
- **Mount v0.1:** IKI Lab routes + Wiki routes. `AppChrome` and Options Lab routes: packets may be specified, **not seeded** until OK 3 each.

## 4. Component registry additions (Wiki Interface §6)

| Component | Kind | Surface | Write |
|---|---|---|---|
| Compile inbox | Admin region | Wiki entry | S (administrator): disposition |
| Compile launcher | Host chrome, operator | mounted routes | S (administrator): new candidate |
| Compile sheet | Host chrome | launcher | — (part of launcher) |

## 5. Acceptance

| AT | Evidence |
|---|---|
| AT-WA1 | Inbox present for `administrator`; absent from DOM for Navigator without `role_override`. |
| AT-WA2 | Launcher present for `administrator`; absent from DOM otherwise. |
| AT-WA3 | **Unit:** capture function with fixture `surface_key=journal.*`, registry `state_key`, URL carrying a trade id in search → payload has `surface_key`, `state_key`, route only. **Live:** same on an IKI/Wiki route (v0.1 mount). Journal live waits on member-tool OKs. |
| AT-WA4 | Compile from launcher → same row as inbox path, `disposition=compile`, board card exists. |
| AT-WA5 | Admin-point twice on same identity while `open` → one row (WK7). |
| AT-WA6 | Stay-put on every inbox action: route, scroll, edit session preserved (WI9). |
| AT-WA7 | Audience widen attempted in inbox → refused with named error; narrow → recorded. |
| AT-WA8 | Fire-and-forget: compile action returns before Oscar runs; row shows `compiling`. |
| AT-WA9 | Mixed board outcome → inbox shows per-card status, no control. |
| AT-WA10 | Keyboard traversal of inbox and sheet; focus visible; targets ≥ `--hit-min`. |
| AT-WA11 | `git diff --stat`: only IKI/Wiki routes and this spec's declared components; no `AppChrome`, no Options Lab. |

## 6. Boundaries
No approval in the inbox. No new role. No page data captured. No `AppChrome` / Options Lab mount until three OKs. No compiler call except via the row. Layout, density, chord-vs-mark: design chain, not this spec.

## 7. Open decisions

| ID | Question | Owner |
|---|---|---|
| OD-WA1 | Three-OK: `AppChrome` mount — raise 1 of 3 requested. **Does not hold W0/W1.** | Coach |
| OD-WA2 | Three-OK: Options Lab routes mount — raise 1 of 3 requested here | Coach |
| OD-WA3 | Launcher affordance: chord vs. visible operator mark | Interaction / Echo |

## 8. Review chain
Juliet → India (candidate write boundary) → **UX → UI (Echo) → Interaction** → Tango (every string; "Compile this into Wiki" kept) → Mike (capture, AT-WA3) → Coach (OD-WA1/2) → Lima → Juliet seeds → Delta.
