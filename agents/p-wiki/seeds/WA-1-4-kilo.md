# WA-1-4 — Characterization (Kilo)

**Plan:** GO WA-1 · **DL-548**

## In scope

`server/tests/test_wiki_agent_*.py`. Restore real `LABS_WIKI_ROOT` index after any reindex. Do not commit into the member lab-wiki checkout (tmp git only).

**WA-1-G extra line:** unregistered principal + **valid schema** → loud failure, **distinct** `reject_reason` from schema rejection.

## Out of scope

WA-2-3 `failed-partial` induction (plan margin; GO WA-2).

## Completion

`pytest tests/test_wiki_agent_*.py tests/test_wiki_store.py tests/test_wiki_api.py tests/test_wiki_pins.py -q` green. Then full `tests -q`.
