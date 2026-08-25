# IF-5-G — Hardening

**Gate:** IF-5-G  
**Token:** `agents/go/IKI-FACTORY-IF5.md`  
**DL:** **DL-578**  
**Verdict: PASS**

```text
pytest tests/test_iki_factory_if1.py tests/test_iki_factory_if2.py tests/test_iki_factory_if3.py tests/test_iki_factory_if4.py tests/test_iki_factory_if5.py -q
..........................................  42 passed
```

| AT | Proof |
|----|--------|
| Lineage Idea→…→Live; auto-move reasons | `test_lineage_idea_to_published` |
| Notify plane called; Deploy survives notify failure | `test_notify_called_on_published_and_survives_failure` |
| Invalid-move matrix | `test_invalid_move_matrix` |
| Hold skip/resume Spec and Live | `test_hold_skips_spec_and_live` |
| Window expiry visible | `test_window_expiry_visible` |
| Missing product spec stays Build | `test_missing_product_spec_stays_build` |
| Woo stub named, not success | `test_woo_stub_named_not_success` |
| Hotel pass | `test_hotel_pass_agent_drafted_strings` |

**Does not:** WC API; Runner; Wiki SC-3b; MiniTwo; named research skill. Nowhere left on this board without the store program.

**Signed:** Delta  
**Date:** 2026-08-24
