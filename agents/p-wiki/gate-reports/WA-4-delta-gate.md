# WA-4-G Delta Gate — Wiki Agent session + admin affordance (2026-08-23)

**Gate:** plan v0.1.2 WA-4-G + Coach riders 1–3.  
**Spec:** v0.1.3 APPROVED · **DL-548…554** · **GO WA-4**  
**Verdict: PASS**

Delta did not modify the work under review.

## Rider 1 — mount-point determination (Juliet, before Charlie)

**Determination:** wiki-owned layout + in-place-admin. Proceed. Pre-declared.

| File | Role |
|------|------|
| `web/app/app/wiki/layout.tsx` | Mounts `<WikiAgentPanel />` next to `WikiSwitcher` |
| `web/components/wiki/WikiAgentPanel.tsx` | `useIsAdmin()`; `if (!isAdmin) return null` |
| `web/lib/useIsAdmin.ts` | **Read only** — existing in-place-admin machinery |

**Not touched:** `web/components/AppChrome.tsx` (`git diff --stat` empty). This
is **not** a DL-539 three-OK. “Callable from anywhere” is a **content**
directive (DL-553): `{surface, route, entity}` is input to the entry, not a
license to mount host chrome.

WA-1 `server/main.py` two-line seam remains the last free router-mount (DL-548,
pre-declared). This packet did not add a new seam there.

## Allowlist (this packet)

| Path | Role |
|------|------|
| `Architecture/00-decision-log.md` | **DL-551…554** |
| `Architecture/05-security-and-access.md` | Access doctrine (DL-552) |
| `Architecture/11-wiki-design.md` | WA-4 as-built |
| `Architecture/README.md` | Arch 11 blurb |
| `Specs/FatTail-Labs-Wiki-Agent-Spec-v0_1_3.md` | Spec of record (new) |
| `Specs/FatTail-Labs-Wiki-Agent-Spec-v0_1_2.md` | SUPERSEDED banner |
| `Specs/FatTail-Labs-Member-Wiki-Spec-v0.1.md` + `v0_1.md` | D-3 dissolved |
| `docs/Wiki-Agent-Full-Agent-Bench-Plan-v0_1_2.md` | WA-6 slice + A5 + GO WA-4 |
| `agents/p-wiki/seeds/WA-4-*.md` | Juliet seeds |
| `agents/p-wiki/ORCHESTRATOR.md` | board |
| `server/wiki_agent_session.py` | opening turn, accrete, compose, discharge, drain N |
| `server/wiki_agent_store.py` | unsealed payload update + seal |
| `server/wiki_agent_linkage.py` | queue drain → board cards |
| `server/routes/wiki_agent.py` | turns / seal / draft / affordance / drain |
| `server/tests/test_wiki_agent_wa4.py` | Kilo |
| `server/tests/test_wiki_agent_portal.py` | opening-turn assertion |
| `web/app/app/wiki/layout.tsx` | mount |
| `web/components/wiki/WikiAgentPanel.tsx` | admin-only panel |

**Not touched:** AppChrome · course/help/IKI trees · compile-inbox · runner ·
public wiki read · registration kind · MiniTwo.

**Inherited, not introduced:** `server/main.py` two lines (WA-1 seam, DL-548).

## Evidence

### Wiki suite

```
cd server && .venv/bin/python -m pytest \
  tests/test_wiki_agent_portal.py tests/test_wiki_agent_wa2.py \
  tests/test_wiki_agent_wa3.py tests/test_wiki_agent_wa4.py \
  tests/test_wiki_store.py tests/test_wiki_api.py tests/test_wiki_pins.py -q
50 passed in 3.21s
```

### House box

```
cd server && .venv/bin/python -m pytest tests -q --tb=line
8 failed, 1127 passed, 4 skipped in 349.73s
```

Tolerated 8 only (1 OPF `test_cl21_ladder_http_carries_opf_session` + 7 Curate
`Phase 'development' is full`). SSR not in the fail list (flake, DL-550
routing; non-chargeable). **No other new failures.**

### Gate table

| Criterion | Result |
|-----------|--------|
| Open with `{surface, route, entity}`; first agent turn cites them | **PASS** `test_open_cites_strategy_lab_context` — content contains `strategy-lab`, `/app/strategy-lab`, `house-defined-risk` |
| Accrete then seal; mutate-after-seal REJECTED | **PASS** `test_accrete_seal_and_mutate_rejected` — POST turns after seal → **409** `session_sealed` |
| Follow-on new `contract_id` referencing sealed id | **PASS** `test_follow_on_new_contract_refs_sealed`; unsealed follow-on → `follow_on_unsealed` |
| Context-into-entry draft file | **PASS** `test_context_into_entry_and_wa2_board_path` — see draft below |
| Draft path = WA-2 (git commit + board `awaiting_approval`) | **PASS** same test: `commit_shas`, card status `awaiting_approval`, git log contains contract id + `wiki-agent` |
| Rider 2 drain | **PASS** `test_drain_one_item_decrements_queue` — drained=1, queued_remaining == before, card `awaiting_approval`. `test_drain_n_fail_loud` — missing `LABS_WIKI_LINKAGE_DRAIN_N` → ConfigError / HTTP 500 |
| Rider 3 both layers | **PASS** `test_member_and_bearer_rejected_admin_affordance` + `test_mount_point_not_appchrome` |

### Rider 3 captured

```
navigator POST /api/wiki-agent/contracts          → 403
navigator GET  /api/wiki-agent/session/affordance → 404
admin      GET  /api/wiki-agent/session/affordance → 200 {"render": true}
ftl_ag_    POST contracts (even with admin cookie) → 403 session_requires_human
ftl_ag_    POST .../turns                          → 403 session_requires_human
admin      full open → accrete → draft → seal      → 200
```

DOM/source proof (no AppChrome; panel hidden unless admin):

```
layout.tsx imports WikiAgentPanel; does not import AppChrome
WikiAgentPanel.tsx: useIsAdmin(); if (!isAdmin) return null;
  data-testid="wiki-agent-panel" only after that return
  copy: "Wiki agent" / "Draft on the board — you still approve."
  / "What should the wiki page cover?"
git diff --stat -- web/components/AppChrome.tsx  → empty
```

Initial client render is `useIsAdmin() === false` until `/api/auth/me` resolves,
so non-admin never hydrates the panel.

### Context-into-entry draft (composer; same bytes the API writes)

Opening turn:

```
This is strategy-lab at /app/strategy-lab. Entity: strategy `house-defined-risk` at `/app/strategy-lab/design`. What should the wiki page cover?
```

Draft file `wiki/concepts/wa4-session-{contract_id}.md`:

```
---
title: house defined risk
kind: concept
status: draft
session_contract_id: 01EXAMPLECONTRACTULID00001
calling_surface: strategy-lab
calling_route: /app/strategy-lab
calling_entity_kind: strategy
calling_entity_id: house-defined-risk
calling_entity_url: /app/strategy-lab/design
---

# house defined risk

Called from **strategy-lab** at `/app/strategy-lab`.

Entity: strategy `house-defined-risk` (`/app/strategy-lab/design`).

## Direction

Page should frame defined risk as process control.

## Candidate linkages

- [[house-defined-risk]] (strategy `house-defined-risk` at `/app/strategy-lab/design`)
```

No `ai.complete()` on this path — composition is deterministic from contract
evidence (Hotel no-invention). Git credentials never reach a model.

### git diff --stat vs allowlist

Tracked:

```
 Architecture/00-decision-log.md             | 172 ++++++++++++++++++++++++++++
 Architecture/05-security-and-access.md      |   7 ++
 Architecture/11-wiki-design.md              |  47 +++++++-
 Architecture/README.md                      |   7 +-
 Specs/FatTail-Labs-Member-Wiki-Spec-v0.1.md |   9 +-
 agents/p-wiki/ORCHESTRATOR.md               |   6 +-
 web/app/app/wiki/layout.tsx                 |   3 +
 7 files changed, 238 insertions(+), 13 deletions(-)
```

New in this packet: `wiki_agent_session.py` (221) · `test_wiki_agent_wa4.py`
(374) · `WikiAgentPanel.tsx` (329) · spec v0.1.3 (380) · WA-4 seeds.

Touched wiki-agent modules already untracked from WA-1…3: `routes/wiki_agent.py`,
`wiki_agent_store.py`, `wiki_agent_linkage.py`, `test_wiki_agent_portal.py`.

**Off-allowlist frozen files:** AppChrome empty. `main.py` still the two-line
WA-1 seam only (not a new WA-4 edit).

## Isolation

No public read (WA-6). No registration (WA-5). No MiniTwo. No member-visible
strings (panel gated). No Family B in envelopes (`test_family_b_entity_rejected`).

## Stop line

STOP after WA-4-G. WA-5 waits on Coach directing Help Package spec creation and
naming file + version. WA-6 defined, unstamped — Coach stamps timing; Sierra +
Mike reviews cover implementation, not whether.
