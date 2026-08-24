# WA-2-G Delta Gate — Wiki Agent pollers + discharge (2026-08-23)

**Gate:** plan v0.1.2 WA-2-G + riders 1–3.  
**Spec:** v0.1.2 APPROVED · **DL-548** · **DL-549** · **GO WA-2**  
**Verdict: PASS**

Delta did not modify the work under review.

## Part A (WA-1 record closure)

**A1 seam:** Coach-ratified on **DL-548** (one paragraph) and WA-1-G. Juliet standing rule: router-mount seams pre-declared.

**A2 baseline** (parent `5efba75`, worktree `/tmp/ftl-wa1-parent`):

```
9 failed, 1086 passed, 4 skipped in 84.93s
```

The **8** WA-1-G failures (1 OPF + 7 curate) **exist at the parent**. Extra parent fail: `test_ssr_session_map.py::test_at_ssr_h_g_flag_off_missing_map_polls` (SSR, not wiki). Stop condition not met. Full addendum: `WA-1-delta-gate.md` A2.

**A3 routed (not fixed):**

- `agents/p-ot-ef-session-print/ORCHESTRATOR.md` — OPF envelope test  
- `agents/p-strategy-runtime/ORCHESTRATOR.md` — 7 curate tests  

## Allowlist (WA-2)

| Path | Role |
|------|------|
| `migrations/135_wiki_pointers.sql` | pointer registry |
| `server/wiki_agent_http.py` | GET-only client |
| `server/wiki_agent_pointers.py` | registry |
| `server/wiki_agent_poller.py` | courseware + help pollers |
| `server/wiki_agent_discharge.py` | Oscar discharge |
| `server/wiki_agent_git.py` | commit_paths |
| `server/wiki_agent_store.py` | failed / board ids |
| `server/tests/test_wiki_agent_wa2.py` | Kilo |
| `agents/p-wiki/hotel-agent-draft-guidelines.md` | Hotel WA-2-0 |
| `agents/p-wiki/seeds/WA-2-*.md` | seeds |
| `Architecture/11-wiki-design.md` | WA-2 paragraph |
| `Architecture/00-decision-log.md` | DL-549 |

**A3 only (Coach-ordered, not wiki product):** two foreign ORCHESTRATOR one-liners.

**Not touched:** `/app/wiki` UI, compile-inbox, `web/lib/runner/**`, course/help/IKI route modules, `wiki_refs`, session accrete/seal, registration kind.

## Evidence

### Hotel artifact (Rider 1)
`agents/p-wiki/hotel-agent-draft-guidelines.md` on disk. Discharge **references** it:

```
GUIDELINES = (
    Path(__file__).resolve().parent.parent
    / "agents"
    / "p-wiki"
    / "hotel-agent-draft-guidelines.md"
)
```

(`server/wiki_agent_discharge.py`; missing file is `ConfigError`.) Test `test_hotel_guidelines_on_disk` + `test_discharge_draft_board_member_404` asserts “No invention” in the system prompt.

**A2 retired-path:** `test_updated_and_retired_annotate_not_delete` — file remains; body contains “retired”. Gate table row above.

### Characterization

```
cd server && .venv/bin/python migrate.py
applied: 135_wiki_pointers.sql
pytest tests/test_wiki_agent_wa2.py tests/test_wiki_agent_portal.py tests/test_wiki_store.py tests/test_wiki_api.py tests/test_wiki_pins.py -q
36 passed in 1.82s
```

| Criterion | Result |
|-----------|--------|
| Courseware + help contracts → draft `status: draft` → board → member 404 | **PASS** `test_discharge_draft_board_member_404` |
| created / updated / retired; retired annotates, file not deleted | **PASS** `test_updated_and_retired_annotate_not_delete` |
| Pointer rows reconcile | **PASS** `test_poller_get_only_and_pointer_rows`, `test_help_poller_and_retire` |
| Bad pointer at start → `failed`, no partial card | **PASS** `test_bad_pointer_at_start_failed_no_partial` |
| **Rider 2** mid-discharge after bytes: ledger `failed` + board title `failed-partial` | **PASS** `test_failed_partial_after_draft_bytes` |
| Profit-claim grep | **PASS** `test_profit_claim_fails_before_write` + discharge draft body |
| `wiki_pages_idx` via reindex only | **PASS** live pages 86 = idx 86 after suite |

### Rider 3 — GET-only + no adjacent writes

Poller HTTP log from `test_poller_get_only_and_pointer_rows`:

```
("GET", "/api/courses")
("GET", "/api/courses/zz-wa2-course")
```

`GetOnlyClient.request("POST", …)` raises `poller may only GET`.

Real catalog: `test_real_courses_list_is_get` — `client.get("/api/courses")` only.

Help catalog: `GET /help-catalog` (injected canonical JSON; no help.py edits).

Adjacent trees: no edits under `server/routes/courses.py`, `lessons.py`, `help.py`, `web/lib/runner/**`.

### Full suite (house box)

```
8 failed, 1113 passed, 4 skipped in 343.86s
```

Same 8 as WA-1-G (OPF + curate). **No new failures.** Parent baseline documented in A2.

## Isolation

No WA-3 `wiki_refs`. No WA-4 chrome/accrete. No WA-5 registration. No MiniTwo. Git author env at commit time only. `ai.complete` never receives git credentials.

## Next

**STOP.** GO WA-3 not granted.
