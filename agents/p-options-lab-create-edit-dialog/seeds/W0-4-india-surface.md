# W0-4 — India · architecture sign of the `surface` mechanism

**Phase:** W0
**Agent:** India
**Depends:** W0-0 GO
**Verdict:** APPROVED or RETURNED
**This seed is the entry gate on DLG0.** Without APPROVED, Charlie does not start.

## Why this exists

Position Control PC-VOCAB-1 said "one control vocabulary" and was built as "one appearance."
That produced a dialog styled as a blotter fragment. Spec v0.4 §2 replaces it. **Do not
re-derive this. It is settled.**

## Sign these, as written

| ID | Law |
|----|-----|
| **DLG-VOCAB-1** | Card and dialog share one control **behaviour and semantics**. |
| **DLG-VOCAB-2** | Card and dialog **do not share appearance.** |
| **DLG-VOCAB-3** | A shared control takes a required `surface` prop — `"card"` or `"dialog"` — and stamps `data-surface` on its root. All appearance is selected from that attribute; behaviour is identical across both. **One component, two appearances.** Never two components. Never one look forced onto both. A shared control without a `surface` prop is a defect. |

Shared controls in scope: `TosStepper`, `TosQtyControl`, `TosPadlock`, `CardMenuField`
in `web/components/options-lab/TosControls.tsx`.

Card call sites (`AnalyzerPositionsList.tsx`) will pass `surface="card"`.
Dialog call sites (`PositionBuilder.tsx`) will pass `surface="dialog"`.

Card keeps PC-HIG-8 grow-on-hover. Dialog is `--hit-min` at rest and has **no** grow-on-hover
(DLG-HIG-3). That difference is **appearance**, selected by `surface`. Stepping, locking, and
picking stay one implementation.

## Also sign as implementation routing, not product law (plan §14)

Universe from `useOptionsLab()` (props or hook inside PositionBuilder — same source).
Chain for a non-session underlying through existing `useBuilderChain`, not a new endpoint.
If that path cannot hydrate without `setSymbol` or a new fetch, the implementing packet
**stops and asks**. It does not invent.

## Do not

- Restate PC-VOCAB-1 as one look.
- Authorise two components.
- Authorise a modal.
- Authorise an IKI fork.
- Open other Labs dialogs.

## Deliverable

A short review under `agents/p-options-lab-create-edit-dialog/reviews/W0-4-india.md`:

- Verdict APPROVED or RETURNED
- § Bench delta
- § Flagged ideas or “inventory intact”
- Explicit sentence: *“The `surface` mechanism is signed as Spec v0.4 §2 wrote it. DLG0 may proceed.”* (or the return reasons)

**Out:** code. This seed is architecture sign-off, not implementation.
