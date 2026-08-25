# IF-2-4 — Characterization (Kilo)

**GO IF-2.** Feeds IF-2-G.

`server/tests/test_iki_factory_if2.py`  
Empty registry → blocked, 0 children. Unregistered version rejected. Fixture skill returning 3 → 3 cards not 10. Fixture returning 12 → 10 children + remainder 2. Window expiry visible. Principal `gemba` exists. Probe titles `zz-if2-*`.

## Completion

`pytest tests/test_iki_factory_if2.py -q` green.
