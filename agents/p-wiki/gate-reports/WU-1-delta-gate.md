# WU-1-G Delta Gate — floating agent under chrome ruling B (2026-08-23)

**Gate:** plan v1.0 WU-1-G + Coach ruling **(B)**  
**Spec:** v0.2.1 APPROVED · **DL-555** · **DL-557** · **GO WU-1**  
**Verdict: PASS**

Delta did not modify the work under review.

## Chrome ruling (B) — O1 disposition

**Keep and evolve** `WikiAgentPanel` on wiki-owned
`web/app/app/wiki/layout.tsx`. **No second orb.** `WikiAgentLauncher.tsx` does
not exist. Standing-presence defect on frozen surfaces accepted until a later
three-OK.

Discovery (WU-1-0): Help still mounts at `web/components/AppChrome.tsx`
lines **16** and **35–39**. This packet did not touch that file.

## Allowlist

| Path | Role |
|------|------|
| `web/components/wiki/WikiAgentPanel.tsx` | evolved message window (one orb) |
| `web/app/app/wiki/layout.tsx` | existing mount; comment only |
| `server/wiki_agent_context.py` | registry, hub=/app exact |
| `server/wiki_agent_session.py` | propose-and-dispose copy; opening-turn registry note |
| `server/routes/wiki_agent.py` | GET `/api/wiki-agent/context`; enrich on open |
| `server/tests/test_wiki_agent_wu1.py` | Kilo |
| `server/tests/test_wiki_agent_portal.py` / `wa4.py` | env autouse |
| `agents/p-wiki/seeds/WU-1-*.md` | seeds |
| `Architecture/00-decision-log.md` | **DL-557** |
| `Architecture/11-wiki-design.md` | WU-1 paragraph |

**Not touched:** AppChrome · `web/app/layout.tsx` · HelpLauncher · hub restyle
(the `/app` page “Wiki”→“IKI Lab” metadata hunk is **prior IKI dirt**, not this
packet) · public read · registration · Factory/charter.

## Evidence

### Wiki suite

```
cd server && .venv/bin/python -m pytest \
  tests/test_wiki_agent_portal.py tests/test_wiki_agent_wa2.py \
  tests/test_wiki_agent_wa3.py tests/test_wiki_agent_wa4.py \
  tests/test_wiki_agent_wu1.py tests/test_wiki_store.py \
  tests/test_wiki_api.py tests/test_wiki_pins.py -q
58 passed in 3.41s
```

### House box

```
8 failed, 1135 passed, 4 skipped in 368.19s
```

Tolerated 8 only (1 OPF + 7 Curate `Phase 'development' is full`). SSR not in
the fail list. No new packet failures.

### Gate table

| Criterion | Result |
|-----------|--------|
| Discovery file+lines; mount = wiki layout | **PASS** WU-1-0 + `test_mount_ruling_b_one_orb` |
| Hub provider enriches `/app` | **PASS** `test_hub_provider_enriches_entity` — entity `{kind: hub, id: apps, canonical_url: /app}` |
| `/app/wiki` is not captured by hub prefix | **PASS** `test_hub_prefix_does_not_capture_wiki_route` |
| Unregistered = route-context | **PASS** `test_unregistered_surface_is_route_context` |
| First turn cites context | **PASS** hub test + existing WA-4 strategy-lab test |
| Propose-and-dispose | **PASS** `test_accrete_does_not_draft` — HEAD unchanged, no board ids |
| Explicit draft = WA-2 path | **PASS** `test_explicit_draft_still_wa2_path` |
| Both layers | **PASS** navigator 403/404; affordance 404; `ftl_ag_` `session_requires_human` |
| Fail-loud registry | **PASS** `test_providers_fail_loud` |
| One orb, not Help emerald | **PASS** no `WikiAgentLauncher`; no `bg-emerald`; `useIsAdmin` null |

### git diff --stat vs freeze

```
web/components/AppChrome.tsx     (empty)
web/app/layout.tsx               (empty)
web/components/HelpLauncher.tsx  (empty)
```

`web/app/app/page.tsx` shows a 1-line IKI Lab metadata change **not introduced
here** (git status at session start already had `M web/app/app/page.tsx`).
WU-1 did not restyle the hub.

## Isolation

No public read. No registration. No Factory/charter. Members never see the
window (`if (!isAdmin) return null`; API 403/404). Guidelines file untouched.

## Stop line

**STOP after WU-1-G.** WU-2 timing unstamped. WU-3 unnamed.
