# IF-4-G — Deploy + Published + Woo stub

**Gate:** IF-4-G  
**Token:** `agents/go/IKI-FACTORY-IF4.md`  
**DL:** **DL-577** (Coach rulings same day)  
**B5:** Factory Live / Published + publication signal (no Runner)  
**Verdict: PASS**

```text
applied: 141_iki_factory_live.sql
applied: 142_iki_factory_published.sql
pytest tests/test_iki_factory_if1.py … if4.py -q
..................................  34 passed
```

| AT / ruling | Proof |
|-------------|--------|
| Missing product spec stays Build | `test_missing_product_spec_stays_build` |
| Hold blocks; clear Hold → Published | `test_hold_blocks_deploy_clear_resumes` |
| Live write first; Woo stub after; never success | `test_product_spec_writes_published_then_stub` · `test_woo_stub_does_not_return_success` |
| Woo absence leaves Published, never Build | `test_woo_absence_leaves_published_not_build` |
| Free obtainable; paid not | `test_paid_not_obtainable_free_is` |
| Catalog by id | `test_catalog_visibility_by_id` |
| Gemba cannot Rework; Admin can | `test_gemba_cannot_rework_published` · `test_admin_rework_from_published` |
| Signal four fields | `evidence/if4-g/signal.json` — id 260, title, live_at, content_hash |
| Stub named | card `woo_reason` = `Woo step stubbed — store interface is a later program.` |
| Fixture through the belt | `evidence/if4-g/published-fixture.json` id **260** on running API `:4000` (`LABS_ENV=dev`). `labs-stage.fattail.ai` DNS did not resolve. |
| Tango catalog copy | `tango-live-catalog.md` APPROVED |
| No Wiki / runner coupling from Factory modules | `test_factory_does_not_touch_wiki_or_runner` |

**Does not:** WC API; Runner; Wiki SC-3b; MiniTwo; named research skill.

**Signed:** Delta  
**Date:** 2026-08-24
