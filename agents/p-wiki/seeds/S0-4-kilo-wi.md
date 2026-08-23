# S0-4 — WI1/4/7/8/10/11 (Kilo)

**Plan:** v2.0 GO S0  
**Depends:** S0-2

## In scope

Characterization: pin parse; `start_here` order/cap/draft-gate; existing wiki API rows. Fixture vaults **must restore** `LABS_WIKI_ROOT` so member `wiki_pages_idx` is not left on a test vault.

## Out of scope

WI3 hover, WI9 save, WI2/5/6.

## Completion

`pytest tests/test_wiki_store.py tests/test_wiki_api.py tests/test_wiki_pins.py -q` green. Post-run `wiki_pages_idx` count matches the real checkout.
