# IF-3-2 — Characterization (Kilo)

**GO IF-3.** Feeds IF-3-G.

`server/tests/test_iki_factory_if3.py`  
Admin R→S → spec_ready + spec_md + waiting for plan.  
Agent cannot R→S.  
Spec→Build without plan 422.  
Attach plan_ref → auto Build + built_ready + auto-move reason.  
Hold + plan → stays Spec; clear Hold → conveyor.  
Gemba cannot Rework. Admin Rework to Research works.  
Titles `zz-if3-*`.

## Completion

`pytest tests/test_iki_factory_if3.py tests/test_iki_factory_if1.py tests/test_iki_factory_if2.py -q` green.
