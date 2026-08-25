# IF-1-0 — Conveyor state machine (India)

**GO IF-1.** Token `agents/go/IKI-FACTORY-IF1.md`.

## In scope

Name the IF-1 machine Alpha must encode in `server/iki_factory.py` (not `content_items`).

Lanes (OD-F1): `ideas` → `research` → `spec` → `build` → `live`.

| Transition | Who | IF-1 rule |
|------------|-----|-----------|
| Ideas → Research | auto on deposit (pickup stub) | Always. Log auto-move reason. `waiting_reason` = waiting for skills. No skill run. |
| Research → Spec | **Admin human only** | Agent / auto → reject, card stays, visible reason. |
| Spec → Build | conveyor when Spec-ready + `plan_ref` + not Hold | IF-1: those fields empty → reject “waiting for plan”. No second Approve column (`plan_ref` is the approval field). |
| Build → Live | conveyor when Built-ready + product spec + complete Help Package + not Hold | IF-1: reject named waiting reason. No Deploy. |
| Hold | Admin flag | Blocks **auto** only. Admin may still override. Persist across reload. |
| Backward / Archive / Trash | Admin | Always allowed. |
| Rework | Admin chooses destination | Gemba never chooses. |

Happy-path drag/click is **one step**. Skip-forward is invalid.

## Out of scope

Skills registry, `gemba` principal seed, Woo, registration, Runner, `gemba.md`.

## Completion

Machine is in code + tests, not a second spec.  
