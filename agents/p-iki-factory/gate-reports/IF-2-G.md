# IF-2-G — Research registry + empty fail-loud

**Gate:** IF-2-G  
**Token:** `agents/go/IKI-FACTORY-IF2.md`  
**Verdict: PASS**

```text
applied: 138_iki_factory_research.sql
pytest tests/test_iki_factory_if1.py tests/test_iki_factory_if2.py -q
................  16 passed
```

| AT | Proof |
|----|--------|
| `gemba` principal live | `test_gemba_principal_exists` |
| Empty registry → Blocked, 0 children, no pad | `test_empty_registry_blocks_no_children` |
| Unregistered version rejected | `test_unregistered_skill_rejected` |
| 3 findings → 3 cards | `test_three_findings_not_padded_to_ten` |
| 12 findings → 10 + remainder 2 | `test_twelve_findings_cap_ten_remainder` |
| 24 h window expiry visible | `test_window_expiry_visible` |

No production skill seeded. Hotel shape: `hotel-research-finding-shape.md`.

**Does not:** GO IF-3. Named skill. MiniTwo.

**Signed:** Delta  
**Date:** 2026-08-24
