# FatTail Labs — Wiki Interface Spec v0.1

> **SUPERSEDED (DL-555).** Spec of record is
> [`FatTail-Labs-Wiki-Spec-v0_2_1.md`](./FatTail-Labs-Wiki-Spec-v0_2_1.md)
> (Wiki Spec v0.2.1 APPROVED). This file is frozen so historical gates and DL
> citations still resolve. Do not implement from this document. Banner-only.

**Status:** SUPERSEDED — see banner. Historical DRAFT body below is frozen.
**Product:** FatTail Labs (`labs.fattail.ai`)
**Purpose:** Member-facing interface for the Wiki app — entry surface, article surface,
search, graph, and the apps-grid card. Defines *what members see and how it behaves*.
**Parent spec:** [`FatTail-Labs-Member-Wiki-Spec-v0.1.md`](./FatTail-Labs-Member-Wiki-Spec-v0.1.md)
(system of record for data model, pipeline, corpus, privacy firewall — not repeated here).  
**Suite naming (DRAFT):** Apps card **IKI Lab**; sibling app **IKI Factory** — [`FatTail-Labs-IKI-Lab-and-Factory-Spec-v0.1.md`](./FatTail-Labs-IKI-Lab-and-Factory-Spec-v0.1.md) · **DL-527**. This file still owns Lab surfaces until that spec is BUILD.
**Framework home:** Application Framework v1.0 — this spec declares the Wiki templates'
slots and registers their components (Part C/D2 obligations).
**Doctrine:** capacity-over-dependency; process outcomes only; HIG per Echo.

**Reviewers (PENDING until Coach schedules):**

| Gate | Reviewer | Concern |
|---|---|---|
| Boundary / slots | **India** | Templates compose registered components; search reads derived index only |
| Entitlements | **Mike** | All surfaces member-gated; personal rail isolation (parent W10) |
| Design + member psychology | **Echo + Tango** | HIG translation; search-first hierarchy; no engagement-bait patterns |
| Trading accuracy | **Hotel** | Rendered claims carry provenance; no profit framing anywhere |
| Evidence | **Delta** | Acceptance tests §8 |
| Approver | **Coach** | Ship / scope / naming (parent D-1) |

---

## 0. One-paragraph standard

> The Wiki opens **search-first**: members arrive with a question, so the entry surface
> is a search box over pages *and* transcripts, above a small curated "Start here" row
> and an auto-fed "New this week" strip. The **Obsidian character** — wikilinks,
> backlinks, local graph, quick switcher — lives on the **article surface**, where it
> aids reading; the full graph view is a secondary destination, not the front door.
> Every article shows its **provenance** (compiled from → approved by) and connects
> outward (related lessons/replays with timestamps) and inward (**"In your practice"**
> — the viewing member's own Journal/Trade Log/Journey entries). One card on the Apps
> grid is the single entry point. No feature on any surface displays P&L or profit
> framing.

---

## 1. Entry points

### 1.1 Apps-grid card (replaces the Vexy slot)

The Wiki takes the sixth card position on `/app` (currently Vexy "coming soon").

| Element | Value |
|---|---|
| Slug | `wiki` (`apps` table row; Vexy row retired or re-slotted — see D-i4) |
| Title | Per parent D-1 (working title "Wiki") |
| Badge | `soon` until W1 ships, then `live` |
| Blurb | "The compiled map of everything we teach — courses, live sessions, and videos, cross-linked and searchable." |
| Action | `Open →` → `/app/wiki` |

Card anatomy identical to Journey / Trade Log cards — no special treatment.

### 1.2 Global quick switcher

`⌘K` / `ctrl-K` opens the switcher **from any wiki surface** (v1 scope: wiki routes
only; app-wide is D-i2). Fuzzy-matches page titles first, then corpus items; `Enter`
navigates, arrow keys move selection. Keyboard-first, mouse optional.

### 1.3 Deep links

Wiki URLs are stable and shareable **inside the membership**: `/app/wiki` (entry),
`/app/wiki/[slug]` (article), `/app/wiki/graph` (map), `/app/wiki/search?q=` (results).
Unauthenticated hits redirect to login and return after auth. No public rendering in
v1 (parent: no SEO surface).

---

## 2. Entry surface — `/app/wiki`

Three zones, in fixed order. No hero art, no carousel.

| Zone | Contents | Data | Notes |
|---|---|---|---|
| **Search** | Large search input, autofocused on desktop; placeholder names the corpus ("Search topics, transcripts, lessons…"); `⌘K` hint | search API | The primary affordance — visually dominant |
| **Start here** | 5–8 admin-pinned topic cards (title + one-line teaser) | pinned pages (admin-curated, in-place editable) | Sequencing lever: flagship "stop the bleeding" material leads, same routing philosophy as Pathway |
| **New this week** | Compact strip: latest recaps + newly linked corpus (title, kind icon, date) | recent pages + refs | Auto-fed by the perpetual loop; capped (≤6 items); links "Explore the map" → graph |

**Empty states:** before content exists, Start here shows nothing (admin sees an
in-place "pin pages" affordance); New this week hides entirely. Search always renders.

## 3. Article surface — `/app/wiki/[slug]`

Two-column on desktop (article ~2/3, rail ~1/3); single column on mobile with the rail
sections as collapsed accordions **below** the article, in the same order.

### 3.1 Article column

| Slot | Behavior |
|---|---|
| Kind + title | Kind label (topic/concept/recap/glossary) above H1 |
| Body | Markdown via the shared renderer + **wikilink extension**: `[[slug]]` → styled internal link with hover preview card (first ~40 words of target); unresolved wikilinks render muted + non-navigable for members |
| Compiled from | Source list (parent `wiki_refs` relation=`source`): lessons link to lesson URLs; replays/videos link with `t=` timestamps ("Live 07-24 at 12:40") |
| Provenance line | "Updated {date} · compiled by {agent/admin} · approved by {approver}" — always present on agent-compiled pages |

### 3.2 Rail (top to bottom — order is deliberate)

| Section | Contents | Rules |
|---|---|---|
| **In your practice** | Viewing member's own matching Journal / Trade Log / Playbook / Journey entries (≤5, most recent first), each linking into its app | Parent §5.3 governs matching + isolation; section hides when no matches (never shows an upsell); **no P&L values rendered here even if entries contain them** |
| **Related** | Engine-scored corpus: lessons, replays w/ timestamps, videos, resources (≤6) | Parent wiki_refs relation=`related`/`pinned`; pinned first |
| **Linked from** | Backlinks — pages whose body wikilinks here | Reverse `wiki_links` query; alphabetical |
| **Local graph** | Mini force-graph: this page + 1-hop wikilink neighbors; click navigates | Read-only; links "Open full graph" |

Rationale for order: the member's own practice is the highest-value connection
(engagement + reflection), then outward discovery, then structural navigation.

## 4. Search — `/app/wiki/search?q=`

| Aspect | Behavior |
|---|---|
| Scope | Published wiki pages + corpus transcripts (parent FULLTEXT index), merged |
| Ranking | Page-title match > page-body match > transcript match; recency tiebreak |
| Page results | Title, kind, first matching snippet with highlight |
| Transcript results | Corpus item title + matching snippet + **timestamp**; click opens the replay/lesson at that moment |
| Grouping | Pages first, then "In the archive" (transcript hits) — labeled groups, one list |
| No results | Suggest the graph + Start here; log the query (de-identified count only) as a page-gap signal for the discovery agent |
| Latency | Results render < 500 ms p95 at v1 corpus size (server FULLTEXT; no client index) |

## 5. Graph — `/app/wiki/graph`

| Aspect | Behavior |
|---|---|
| Default | Published pages as nodes; wikilinks as edges; kind → node color (Echo assigns; legend shown) |
| Corpus toggle | Off by default; on = corpus items join as smaller satellite nodes via refs (parent D-10) |
| Interaction | Pan/zoom, hover = title, click = navigate to page. **No editing** — the graph is a reading instrument (v1 doctrine) |
| Performance | Client-rendered; node cap per parent D-10; degrade gracefully (hide corpus toggle) past cap |
| Entry | "Explore the map" links (entry surface, local graphs); not in the top nav |

## 6. Component registrations (Application Framework Part D2)

New registered components this spec introduces; all Family A display components unless
noted. Stay-put rules inherit Part A4 for the admin curation paths.

| Component | Kind | Surfaces | Write |
|---|---|---|---|
| Wiki search box + results | Host chrome + display | Entry, search | read-only |
| Quick switcher palette | Host chrome | All wiki routes | read-only |
| Pinned topic card row | Ordered list (admin curation) | Entry | S (admin) |
| New-this-week strip | Display | Entry | derived |
| Wikilink renderer + hover preview | Display long (renderer extension) | Article | — |
| Compiled-from list | Display | Article | derived |
| Provenance line | Display | Article | derived |
| Practice rail | **Family B read** (member-scoped) | Article | read-only, member session |
| Related rail | Display | Article | derived |
| Backlinks list | Display | Article | derived |
| Local graph / full graph | Display (interactive) | Article, graph | read-only |

Admin in-place editing of article body/title uses the **existing** Family A path
(EditableMarkdown + wikilink autocomplete on `[[`) — no new edit machinery. Note:
because page bytes live in the `lab-wiki` repo (parent §3.0), admin in-place saves
write **through the server to the checkout + commit**, not to MySQL — mechanics in
parent D-11/D-12; the UI contract (stay-put, dirty/save) is unchanged.

## 7. HIG and conduct notes

1. Labs visual tokens throughout — this is **Labs that behaves like Obsidian**, not an
   Obsidian theme. Echo owns translation.
2. No gamification: no read streaks, no completion percentages on wiki surfaces, no
   "members also read" social proof. Discovery, not engagement-bait (Tango).
3. Process outcomes only — includes agent-compiled snippets surfaced in search results.
4. Accessibility: switcher and search fully keyboard-operable; graph has a list-view
   fallback ("All pages" index) for screen readers and no-JS.
5. Mobile: rail → accordions; graph available but not promoted; switcher via search
   field focus (no hardware keys assumed).

## 8. Acceptance (Delta gate)

| ID | Test | Pass |
|---|---|---|
| WI1 | Open `/app/wiki` as member | Search focused; Start here + New this week render from data |
| WI2 | Search a term known only in a transcript | Result appears under "In the archive" with timestamp; click opens replay at that moment |
| WI3 | Article with wikilinks | Links resolve; hover preview shows target snippet; unresolved link muted |
| WI4 | Backlinks | Page B wikilinks page A → A's "Linked from" lists B |
| WI5 | Practice rail isolation | Two members on same article see only their own entries (parent W10 evidence) |
| WI6 | Practice rail P&L | Entry containing P&L renders without P&L values |
| WI7 | Graph | Renders published pages only; click navigates; list fallback exists |
| WI8 | ⌘K | Opens from entry, article, graph; fuzzy match; Enter navigates |
| WI9 | Admin in-place edit of article | Stay-put holds (route, scroll, edit session); save lands in `lab-wiki` checkout |
| WI10 | Draft page | `status: draft` page 404s for members, visible to admin |
| WI11 | Card | `/app` grid shows Wiki card in the sixth slot; Open → `/app/wiki` |

## 8.1 Verification runbook (how to actually check it)

Every acceptance row in §8 maps to a concrete proof. Run from the repo root on dev
(`uvicorn :4000` + `next dev :3000`), with `LABS_WIKI_ROOT` pointing at a
`lab-wiki` checkout. "It renders" is never evidence — capture the command + output.

### Prerequisites

```bash
cd server && .venv/bin/python migrate.py --dry-run   # expect: 034+ wiki migrations listed or already applied
echo $LABS_WIKI_ROOT                                  # expect: /Users/ernie/lab-wiki (or MiniTwo checkout path)
ls "$LABS_WIKI_ROOT/wiki/index.md"                    # expect: file exists — API must fail loud if not
```

### WI11 — card

```bash
curl -s localhost:4000/api/apps | python3 -m json.tool | grep -A3 '"wiki"'
# expect: slug wiki, status soon|live, sort_order 5; no vexy row
```

### WI1 — entry surface

Browser: `/app/wiki` logged in → search input focused; Start here row renders pinned
pages; New this week shows recent published pages (or hides when none).
Logged out → login redirect with `next=/app/wiki`.

### WI2 — transcript search with timestamp

```bash
curl -s "localhost:4000/api/wiki/search?q=<term-known-only-in-a-transcript>" \
  -H "Cookie: ft_session=<member-session>" | python3 -m json.tool
# expect: hit with kind: transcript, corpus item title, snippet, anchor_s (seconds)
```

Browser: same query in the UI → result under "In the archive"; click opens the
replay/lesson at that timestamp.

### WI3/WI4 — wikilinks + backlinks

Publish page A containing `[[page-b]]`. Browser: A renders the link; hover shows
preview; B's "Linked from" lists A. API check:

```bash
curl -s localhost:4000/api/wiki/pages/page-b -H "Cookie: ft_session=<member>" \
  | python3 -m json.tool | grep -A5 backlinks
```

### WI5/WI6 — practice rail isolation + P&L suppression

With two member accounts that each have trade-log/journal entries matching a page:

```bash
curl -s localhost:4000/api/wiki/pages/<slug>/practice -H "Cookie: ft_session=<member-A>"
curl -s localhost:4000/api/wiki/pages/<slug>/practice -H "Cookie: ft_session=<member-B>"
# expect: disjoint results — A never sees B's entries (record both outputs as evidence)
# expect: no pnl/profit fields in either payload even if the rows contain them
```

### WI7 — graph

Browser: `/app/wiki/graph` renders published pages only (draft slugs absent from the
payload); click navigates. `curl` the graph endpoint and grep for a known draft slug —
expect absent. List-view fallback reachable without JS.

### WI8 — quick switcher

Browser: press ⌘K on entry, article, and graph pages → palette opens; type a partial
title → fuzzy match; Enter navigates.

### WI9 — admin in-place edit stay-put

As admin, edit an article field, save. Expect: same route, same scroll, edit session
alive, **no** `location.reload`. Then on the wiki checkout:

```bash
cd "$LABS_WIKI_ROOT" && git log --oneline -1 && git status --short
# expect: the save landed as a commit (or staged write per D-11 mechanics)
```

### WI10 — draft gate

```bash
curl -s -o /dev/null -w "%{http_code}\n" localhost:4000/api/wiki/pages/<draft-slug> \
  -H "Cookie: ft_session=<member>"     # expect: 404
# same slug with admin session          # expect: 200
```

### Index rebuild (supporting check for WI2)

```bash
curl -s -X POST localhost:4000/api/admin/wiki/reindex -H "Cookie: ft_session=<admin>"
# expect: {pages: N, transcripts: M, ...} matching counts in $LABS_WIKI_ROOT
# then repeat a search — new content findable
```

Delta gate = this runbook executed with outputs captured, not a checklist of beliefs.

## 9. Open decisions

| ID | Decision | Proposal |
|---|---|---|
| **D-i1** | **"Ask" mode** — conversational answers over the corpus with cited pages, absorbing the retired Vexy card's "cognitive partner" role | v2. Decide deliberately with naming (parent D-1) — search-first v1 ships without it; the search box design leaves room for an "Ask" toggle |
| **D-i2** | Quick switcher app-wide (all Labs routes) vs wiki-only | Wiki-only v1; app-wide is a separate HIG decision |
| **D-i3** | Hover preview on touch devices | Skip on touch (tap = navigate); no long-press behavior v1 |
| **D-i4** | Vexy `apps` row disposition | Retire the row when Wiki ships (D-i1 records that Ask-mode absorbs the concept); no orphan "coming soon" card |
| **D-i5** | Transcript snippet length in search results | ~30 words with highlight; tune after real use |

---

## Version history

| Ver | Change |
|---|---|
| **v0.1** | Initial draft — entry card, search-first entry surface, article + rail (practice/related/backlinks/local graph), search behavior, graph view, component registrations, acceptance tests |

---

*DRAFT v0.1 — drafted from Coach direction (2026-07-27: wiki replaces the Vexy card;
interface recommendation approved for spec). Where this conflicts with the parent
Member Wiki spec, the Application Framework, or the decision log, the source wins and
this draft is the bug.*
