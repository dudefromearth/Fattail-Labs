# IF-4-4 — Characterization (Kilo)

**GO IF-4.** Feeds IF-4-G.

`server/tests/test_iki_factory_if4.py`  
Titles `zz-if4-*`. Mock Woo — never hit the store.

- Built-ready without product spec stays Build; waiting reason `waiting for product spec`.
- Product spec + Hold → stays Build; clear Hold → Live.
- Product spec + not Hold → Live; `store_visible`; `woo_product_id`; publication signal row; auto-move reason names Deploy.
- Woo raise → stays Build; failed reason visible.
- Member live list omits non-Live. Unauthenticated signal lists only Live.
- Factory modules do not import wiki / `contracts:deliver` / runner.

Pytest: `tests/test_iki_factory_if1.py` … `if4.py` green.
