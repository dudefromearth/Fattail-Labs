# IF-3-G — Spec + conveyor Spec→Build

**Gate:** IF-3-G  
**Token:** `agents/go/IKI-FACTORY-IF3.md`  
**DL:** **DL-569**  
**Verdict: PASS**

```text
applied: 140_iki_factory_spec.sql
pytest tests/test_iki_factory_if1.py tests/test_iki_factory_if2.py tests/test_iki_factory_if3.py -q
.......................  23 passed
```

| AT | Proof |
|----|--------|
| Admin R→S drafts Spec, Spec-ready, waiting for plan | `test_admin_research_to_spec_drafts_and_waits` |
| Agent cannot R→S | `test_agent_cannot_research_to_spec` |
| Spec→Build without plan rejected | `test_spec_to_build_without_plan_rejected` |
| Plan attach auto-advances to Build; built_ready; reason names approval | `test_plan_attach_conveyors_to_build` |
| Hold blocks; clear Hold resumes conveyor | `test_hold_blocks_conveyor_clear_resumes` |
| Gemba cannot Rework | `test_gemba_cannot_choose_rework` |
| Admin Rework destination | `test_admin_rework_to_research` |

**Does not:** GO IF-4. Deploy. Wiki envelope. MiniTwo.

**Signed:** Delta  
**Date:** 2026-08-24
