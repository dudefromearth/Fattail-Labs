# WA-2-3 — Characterization (Kilo)

**Plan:** GO WA-2

## In scope

created / updated / retired; bad pointer at **start** → `failed`; **RIDER 2:** after draft bytes exist, induce failure → ledger `failed` + board `failed-partial`. Restore `LABS_WIKI_ROOT` index. GET-only poller log.

## Out of scope

WA-3 linkage. Full-suite frozen 8 (A2 baseline).

## Completion

`pytest tests/test_wiki_agent_*.py` green. Member DB not on a fixture vault.
