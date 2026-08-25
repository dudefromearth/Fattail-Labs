# IF-1-G — IKI Factory Board + Ideas

**Gate:** IF-1-G  
**Delta.** Evidence-based. Work under review not modified.  
**Token:** `agents/go/IKI-FACTORY-IF1.md`  
**DL:** **DL-559** · **DL-563** (B4 dead; board card on SC-0 list)

## Verdict

**PASS** — characterization + browser walk on record.

## Characterization

```text
cd server && .venv/bin/python -m pytest tests/test_iki_factory_if1.py -q
..........                                                               [100%]
10 passed
```

| AT (plan IF-1-G) | Proof |
|------------------|--------|
| Admin creates Idea; pickup stub to Research | `test_create_idea_pickup_stub` |
| Non-admin 403 / unauthenticated 401 | `test_non_admin_403` · `test_unauthenticated_401` |
| Research→Spec Admin allowed | `test_admin_research_to_spec_allowed` |
| Research→Spec Gemba bearer rejected; card stays; reason on card | `test_gemba_bearer_research_to_spec_rejected` |
| Invalid Spec→Build / skip-forward 422 | `test_spec_to_build_waiting_for_plan` · `test_skip_forward_rejected` |
| Hold persists | `test_hold_persists` |
| Not `content_items` | `test_does_not_write_content_items` |
| Member pill unchanged | `test_member_factory_page_still_soon` |
| `gemba.md` untouched | allowlist |

## Browser walk (required before GO IF-2)

```text
cd web && npx playwright test e2e/iki-factory-if1.spec.ts --reporter=list
  ✓  pickup stub, drag, invalid move reason, non-admin 403 (5.1s)
```

Evidence: `agents/p-iki-factory/evidence/if1-g/`

| Walk | File |
|------|------|
| Pickup stub: auto-move reason + “waiting for skills” | `if1-pickup-stub.png` |
| Drag Research → Spec | `if1-drag-research-to-spec.png` |
| Invalid skip-forward stays in Spec; reason on the card | `if1-invalid-move-reason.png` |
| Non-admin (activator) hits Administrator-required (API 403) | `if1-nonadmin-403.png` |

Spec: `web/e2e/iki-factory-if1.spec.ts`

## B4

**DEAD** (Coach 2026-08-24 · **DL-563**). Help Package superseded by Source Contract v0.1.4 (**DL-560**). Does not block IF-4. SC-0 list now includes the IKI Factory board card.

## Does not

**GO IF-2** — not granted. Skills registry. `gemba` principal. B5. MiniTwo.

**Signed:** Delta  
**Date:** 2026-08-24
