# W0-4 — India · architecture sign of the `surface` mechanism

**Date:** 2026-09-11
**Verdict:** **APPROVED**
**Spec:** v0.4 §2 · DLG-VOCAB-1 · 2 · 3
**Plan:** v1.0 L1 · W0-4

## Sign-off (as written — not re-derived)

Position Control PC-VOCAB-1 said "one control vocabulary" and was built as
"one appearance." Spec v0.4 §2 replaces it. Signed:

| ID | Signed |
|----|--------|
| **DLG-VOCAB-1** | Card and dialog share **behaviour and semantics**. |
| **DLG-VOCAB-2** | Card and dialog **do not share appearance.** |
| **DLG-VOCAB-3** | Required `surface` `"card"` \| `"dialog"` stamps `data-surface` on the root of `TosStepper`, `TosQtyControl`, `TosPadlock`, `CardMenuField`. Appearance from that attribute. Behaviour identical. One component, two appearances. Never two components. Never one look forced onto both. A shared control without `surface` is a defect. |

Card call sites pass `surface="card"` (PC-HIG-8 grow-on-hover remains — appearance).
Dialog call sites pass `surface="dialog"` (`--hit-min` at rest, no grow-on-hover —
appearance, from DLG1). Stepping, locking, and picking stay one implementation.

Plan §14 routing (universe from `useOptionsLab`; chain from existing
`useBuilderChain`; stop-and-ask if a new endpoint would be required) is
implementation routing, not product law. Signed as such.

Not authorised: two components, one look forced onto both, a modal, an IKI fork,
other Labs dialogs, restating PC-VOCAB-1 as one appearance.

**The `surface` mechanism is signed as Spec v0.4 §2 wrote it. DLG0 may proceed.**

## § Bench delta

The next packet that restates "one appearance" has a named FAIL: this review.
DLG0 seeds against a signed mechanism, not an aspiration.

## § Flagged ideas

Inventory intact. Dialog appearance (HIG tokens, no grow-on-hover) is DLG1, not
this sign-off.
