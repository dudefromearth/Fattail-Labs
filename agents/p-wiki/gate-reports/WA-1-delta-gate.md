# WA-1-G Delta Gate — Wiki Agent portal (2026-08-23)

**Gate:** plan v0.1.2 WA-1-G + unregistered-principal line.  
**Spec:** v0.1.2 **APPROVED** · **DL-548** · **GO WA-1**  
**Verdict: PASS** (WA-1 criteria). Frozen-tree pytest failures listed below are **not** this packet.

Delta did not modify the work under review.

## Allowlist check (`git status` / new files)

On-allowlist:

| Path | Role |
|------|------|
| `migrations/134_wiki_contracts.sql` | ledger + source registry + `sealed_at` |
| `server/wiki_agent_ulid.py` | `wiki_agent_*.py` |
| `server/wiki_agent_schema.py` | envelope |
| `server/wiki_agent_store.py` | ledger |
| `server/wiki_agent_git.py` | fixture commit |
| `server/routes/wiki_agent.py` | POST/GET |
| `server/agent_auth.py` | `contracts:deliver` only |
| `server/tests/test_wiki_agent_portal.py` | Kilo |
| `agents/p-wiki/seeds/WA-1-*.md` | seeds |
| `Architecture/11-wiki-design.md` | §6 one section |

**Seam (Coach-ratified 2026-08-23, A1):** `server/main.py` — two lines: import + `include_router(wiki_agent_router)`. Standing Juliet rule: router-mount seams are pre-declared on future allowlists.

**Same-day docs (Coach sequence, not product UI):** `Architecture/00-decision-log.md` **DL-548**; spec status APPROVED; plan margin WA-2-3 note.

**Not in this diff:** `web/app/app/wiki/**`, compile-inbox, course/help/IKI trees, `web/lib/runner/**`, session chrome, AppChrome, pollers, pointer registry, Hotel guidelines.

`SHOW COLUMNS FROM wiki_contracts LIKE 'body_md'` → **None**.

## Evidence (commands + output)

### Migration
```
applied: 134_wiki_contracts.sql
```

### Characterization (WA-1 + wiki restore)

```
cd server && .venv/bin/python -m pytest tests/test_wiki_agent_portal.py -v --tb=line
============================== 9 passed in 0.58s ===============================
```

| Criterion | Result | Test / probe |
|-----------|--------|----------------|
| Invalid schema → 4xx + `rejected` | **PASS** | `test_schema_invalid_rejected_ledger` — 400, `reject_reason=schema_invalid`, ledger `rejected` |
| Valid → `contract_id` | **PASS** | `test_valid_registered_agent_returns_contract_id` — 200, `status=validated` |
| **Unregistered principal + valid schema**, distinct from schema fail | **PASS** | `test_unregistered_principal_valid_schema_distinct` — 403, `reject_reason=unregistered_principal` ≠ `schema_invalid` |
| GET disposition | **PASS** | same test GET 200, same `contract_id` |
| Git log agent commit + contract ID | **PASS** | `test_fixture_git_commit_contains_contract_id` — message contains id; author `wiki-agent` via env at commit time |
| `wiki_pages_idx` only via reindex | **PASS** | git test does not reindex; live `load_pages` 86 = idx 86 |
| Member DB not left on fixture | **PASS** | idx 86 after tests |
| Zero source-tree imports | **PASS** | new modules import FastAPI, db, config, guards, stdlib, git subprocess |
| Session open without sealed transcript | **PASS** | `test_session_open_admin_cookie_no_sealed_transcript` — `sealed_at is None`, `transcript=[]` |
| Session rejects agent bearer | **PASS** | `test_session_rejects_agent_bearer` — 403 `session_requires_human` |
| Family B refs | **PASS** | `test_family_b_ref_rejected` — 400 `family_b_ref` |
| `wiki:reindex` cannot deliver | **PASS** | `test_reindex_scope_cannot_deliver` — 403 |

Wiki suite: `pytest tests/test_wiki_store.py tests/test_wiki_api.py tests/test_wiki_pins.py tests/test_wiki_agent_portal.py tests/test_agent_identity.py -q` → **33 passed**.

### Full `pytest tests -q` (house box)

```
8 failed, 1104 passed, 4 skipped in 280.92s
FAILED tests/test_opf_session_envelope.py::test_cl21_ladder_http_carries_opf_session
FAILED tests/test_strategy_lab_curate.py::test_curate_* (7)
```

Those files are **not** in the WA-1 allowlist (DL-539 frozen). Delta does **not** waive WA-1 evidence. Full-suite green is **blocked by frozen-tree failures**, not by this packet.

## Isolation

No compile-inbox UI. No `/app/wiki` member edits. No MiniTwo. No WA-2 pollers / pointer registry / Hotel artifact.

## Next

WA-1 closed. GO WA-2 is a later stamp.

## A2 baseline addendum (parent of WA-1 packet)

WA-1 is uncommitted. Parent commit: `5efba75` (`fix(wiki): keep Wiki · Factory · Runner suite nav`).

```
git worktree add /tmp/ftl-wa1-parent 5efba75
cd /tmp/ftl-wa1-parent/server && .venv/bin/python -m pytest tests -q --tb=no
9 failed, 1086 passed, 4 skipped in 84.93s
FAILED tests/test_opf_session_envelope.py::test_cl21_ladder_http_carries_opf_session
FAILED tests/test_ssr_session_map.py::test_at_ssr_h_g_flag_off_missing_map_polls
FAILED tests/test_strategy_lab_curate.py::test_curate_create_arm_tick_open
FAILED tests/test_strategy_lab_curate.py::test_curate_envelope_blocks_second_open
FAILED tests/test_strategy_lab_curate.py::test_curate_manage_take_profit
FAILED tests/test_strategy_lab_curate.py::test_curate_unknown_symbol_fails_loud
FAILED tests/test_strategy_lab_curate.py::test_curate_positions_report
FAILED tests/test_strategy_lab_curate.py::test_deploy_reports_book_shape
FAILED tests/test_strategy_lab_curate.py::test_curate_isolation
```

The **8** named in WA-1-G (1 OPF + 7 curate) **exist at the parent**. WA-1 did not introduce them.

Extra at parent: `test_ssr_session_map.py::test_at_ssr_h_g_flag_off_missing_map_polls` (SSR tree; not in WA-1-G’s 8; not wiki). Not a stop condition.
