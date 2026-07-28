# W1 Delta Gate — Member Wiki spine (2026-07-28)

**Gate:** Interface Spec §8.1 runbook + Member-Wiki §7.1 W1 proofs.
**Verdict: PASS** (rows in scope). Deferred rows are parent-spec W2/W4 work, not failures.
Environment: dev (StudioTwo) — API :4000, built Next :3000, `LABS_WIKI_ROOT=/Users/ernie/lab-wiki`.

## Evidence by row

### Prerequisites
- Migration: `applied: 035_wiki_index.sql` (migrate.py output)
- `LABS_WIKI_ROOT` set in `.env`; checkout validated (wiki/index.md present)
- **Fail-loud proven:** boot without env →
  `config.ConfigError: Missing required environment variable: LABS_WIKI_ROOT`

### WI11 — card
`GET /api/apps` → `('wiki', 'soon', 5)` present; no vexy row. PASS
*(Note: parallel Apps-hub work (migration 036) is reorganizing the grid — card
placement verified against 034 state.)*

### Index reconciliation (Member-Wiki §7.1 W1)
`POST /api/admin/wiki/reindex` → `{"pages":82,"published":0,"drafts":82,"links":374,"unresolved_links":199,"skipped":0}`
`find $LABS_WIKI_ROOT/wiki/{topics,concepts,recaps,glossary,sources} -name '*.md' | wc -l` → `82`. **Counts match.** PASS

### Auth — anonymous
All member routes + reindex → **401** (curl, via :4000 and the :3000 proxy). PASS

### WI10 — draft gate
`GET /api/wiki/pages/otm-butterfly` (draft): member cookie → **404**; admin cookie
→ **200**. PASS. Draft leakage also covered for search/graph/index/backlinks by
`tests/test_wiki_api.py` (draft never in member payloads). PASS

### WI1 — entry surface
Browser (admin session, built output): search autofocused; Start here renders 8
topic cards from index payload; New this week renders recent pages; spec-name
footer removed. Screenshot captured in session 2026-07-28. PASS

### WI3/WI4 — wikilinks + backlinks
Article `/app/wiki/otm-butterfly`: body wikilinks render as internal links
(volume-profile-structure, expected-move, …); "Linked from" lists 21 backlinks;
"See also" lists resolved outbound; provenance line renders. Unresolved links
render muted non-navigable (verified in payload: resolved=false entries). PASS

### WI7 — graph
`/app/wiki/graph`: SVG renders (82 nodes ≤ 150 cap); "All pages" list fallback
populated alphabetically with kind labels; API payload excludes drafts for members
(test-verified). PASS

### WI8 — switcher
⌘K/Ctrl-K palette mounted on all wiki routes (layout); fuzzy search; Enter
navigates. Implemented; manual keyboard verification on dev. PASS

### Search + snippet
`GET /api/wiki/search?q=convexity` (admin) → ranked:
`become-a-0dte-convexity-hunter, 0dte-podcast-may-11, tactical-0dte-playbook-conditional-convexity, convexity-and-asymmetry, convexity`
UI renders grouped results with ~30-word snippets; honest empty state. PASS

### Tests (Kilo)
`pytest tests/test_wiki_store.py tests/test_wiki_api.py -q` → **12 passed**.
Full suite: 238 passed; 4 pre-existing failures in `test_resources.py` proven
unrelated (fail with wiki changes stashed; flagged as separate task). PASS*

### Deferred (not failures)
- WI2 transcript search w/ timestamps — parent W2 (corpus/transcriber)
- WI5/WI6 practice rail isolation — parent W4 (Mike gate)
- WI9 admin in-place wiki editing — parent D-11 mechanics (publish flow is
  git-based today, documented in ADMIN-GUIDE)

## Echo/Mike review notes (WK5)
- Mike: all routes session-gated server-side; draft gate test-covered incl. graph
  and backlinks; no member data exists anywhere in wiki payloads (content is
  lab-wiki markdown only); reindex dual-auth (human admin / `wiki:reindex` agent
  scope) matching sync-tick design. PASS
- Echo: surfaces use house tokens; sentence case; no gamification; double-title
  render fixed (leading body h1 stripped when it matches frontmatter title).
  Graph colors from token cycle. PASS (full HIG pass can iterate post-W0)

## Coach actions outstanding
1. **W0:** approve/amend both specs (still DRAFT)
2. **Content:** flip starter set to `status: published` in lab-wiki (topics +
   glossary suggested) — until then, members see an honest empty wiki; admins see
   everything
3. **Ship:** card `soon` → `live` after 1–2
