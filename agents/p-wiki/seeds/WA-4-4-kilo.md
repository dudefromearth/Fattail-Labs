# WA-4-4 — Kilo WA-4 characterization

**Plan:** Wiki Agent v0.1.3 · **GO WA-4** · gate table + riders

## In scope

`server/tests/test_wiki_agent_wa4.py` (+ portal opening-turn assertion).
Restore `LABS_WIKI_ROOT` after fixture vaults. House box: tolerated 8 only.

## Proof rows

- Open with `{surface, route, entity}`; first agent turn cites them
- Accrete then seal; mutate-after-seal REJECTED
- Follow-on new `contract_id` referencing sealed id
- Context-into-entry draft file (Strategy Lab context)
- Draft path = WA-2 (git commit + board `awaiting_approval`)
- Rider 2: one queued item drains to a card; queue count decrements
- Rider 3: member 403/404 + no panel; bearer `session_requires_human`; admin works
- Drain N fail-loud
- Mount files do not import AppChrome

## Out of scope

Fixing OPF/curate/SSR house failures. WA-5. WA-6.
