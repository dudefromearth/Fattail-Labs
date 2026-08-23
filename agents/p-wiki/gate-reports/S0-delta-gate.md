# S0 Delta Gate — Member Wiki v0.1 (2026-08-23)

**Gate:** plan v2.0 S0-G · Interface WI1, WI4, WI7, WI8, WI10, WI11.  
**Verdict: PASS**  
Environment: local — API `:4000`, Next `:3000`, `LABS_WIKI_ROOT=/Users/ernie/lab-wiki`.

Delta did not modify the work under review.

## Criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | WI1 search-first; Start here from pins (or honest empty) | **PASS** | Search input focused (`#wiki-search`). `GET /api/wiki/index` `start_here` = six published pins in `pin_order`: position-sizing, routine-and-reflection, trade-management, the-0dte-clock, volume-profile-structure, vix-regimes. Browser: `agents/p-wiki/evidence/s0/01-entry-desktop.png`. |
| 2 | WI4 backlinks | **PASS** | `GET /api/wiki/pages/position-sizing` → 4 backlinks. Article rail **Linked from** lists them. Screenshot `02-article-desktop.png`. Pytest `test_page_payload_backlinks_and_links`. |
| 3 | WI7 graph + list | **PASS** | Graph 53 published nodes / 119 edges; draft `01-foundations-of-0dte` absent. SVG + **All pages** list (53). `05-graph.png`. |
| 4 | WI8 ⌘K | **PASS** | Palette opens from entry (`06-cmdk.png`). Enter on “convexity” → `/app/wiki/convexity-and-asymmetry`. |
| 5 | WI10 draft 404 member | **PASS** | Member `GET /api/wiki/pages/01-foundations-of-0dte` → **404**; admin → **200**. UI “Page not found” (`07-draft-member.png`). |
| 6 | WI11 card → `/app/wiki` | **PASS** | `GET /api/apps` wiki row `slug=wiki` `href=/app/wiki`. Card click lands on `/app/wiki`. Title/blurb/status **not** changed (**D-1** unfilled) — still “IKI Lab / soon”. |
| 7 | Browser + curl | **PASS** | Curl proofs above; Playwright walkthrough in `agents/p-wiki/evidence/s0/`. |
| 8 | Not hover | **PASS** | No hover-preview work in the S0 diff. |
| 9 | pytest wiki tests | **PASS** | `pytest tests/test_wiki_store.py tests/test_wiki_api.py tests/test_wiki_pins.py -q` → **18 passed** in 0.43s. |
| 10 | Member `wiki_pages_idx` not destroyed | **PASS** | After tests: **86** idx rows = checkout `load_pages`. Six pin rows cached. |
| 11 | No compile inbox; no pin table | **PASS** | Wiki layout is `WikiSwitcher` only. Migration 133 adds **derived columns** on `wiki_pages_idx` (`pin`, `pin_order`, `compiled_by`, `approved_by`) — not a pin table. Empty Related / In your practice rail slots hide. |

## Adjacent sweep

- Search from the entry box → `/app/wiki/search?q=convexity` with page results (`09-search.png`).
- No “Compile this into Wiki” on entry or article.
- Oscar `on_board_published` still no-ops idx (**DL-545**).
- Apps-card copy waits on D-1 (not a defect of this gate).

## Echo / Tango

S0-3 **PASS**. See `agents/p-wiki/seeds/S0-3-echo-tango.md`.

## Not this GO

S1 save / hover · S2–S6 · MiniTwo · D-1 title · lab-wiki remote push of pin frontmatter (local checkout has the six `pin: true` topics; D-12 will pick them up after that repo lands on the remote).

## Next

Optional **GO S0+S1** (WI9 + WI3 hover). S1–S6 wait on later stamps.
