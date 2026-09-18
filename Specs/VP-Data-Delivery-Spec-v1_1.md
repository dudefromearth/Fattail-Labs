# VP Data Delivery — Spec v1.1

**Status:** BINDING deliverable spec. **Supersedes:**
VP-Data-Delivery-Spec-v1_0.md (sha1
ce2064af71f72883dc0e3cc91a60ac1c5ffc5392) — v1.0 carries forward in
full; v1.1 ADDS the continuous-contract law (Coach's TV comparison:
ES1! is the back-adjusted continuous series; ours must be too).
**Date:** 2026-09-18

## 1a. Continuous futures series (D6 — the law v1.0 was missing)

- **D6 —** For every futures source, "the symbol" (ES, MES) means
  the **back-adjusted continuous contract**, industry-standard,
  exactly TV's ES1! B-ADJ semantics:
  1. **Splice:** contract eras join at roll dates per the lead
     rule (volume leadership / vendor Contracts metadata).
  2. **Back-adjust:** at each roll, all history behind the splice
     shifts by that roll's gap (additive), aligning every era into
     the CURRENT contract's price frame. Recent prices are true;
     older absolute prices are adjusted — the accepted trade-off
     of every continuous chart in the industry.
  3. **One series everywhere:** OHLC bars, the full-history
     profile (A12), the hot tier, and the stream all serve the
     continuous series for futures sources — so the deep ES
     profile reads like TV's VRVP, one coherent terrain across
     years and rolls.
  4. **Derived, never destructive:** per-contract raw prints
     remain the sole SoR; the continuous series is a rebuildable
     derived view — roll rule and adjustment method are versioned
     parameters (VP-L6), a rebuild reproduces it byte-identically,
     and a future roll-rule change is a new generation, never an
     edit.
  5. **Honest provenance, once:** futures payloads carry
     `continuous: {adjusted: true, method: "back-adjust",
     rolls: N}`; the surface states "continuous (back-adjusted)"
     in provenance — one calm chip, not a nag.
  6. **SPX/XSP space is unchanged and separate:** per-era basis
     mapping (VPS3 + roll-coherence law) remains the path for
     index-space display; both views derive from the same archive
     and never mix frames on one canvas (A8.4).
- **Acceptance addition — T5:** on ES, pan back through a roll
  boundary: candles and profile continue seamlessly across it,
  no cliff, no doubled band; provenance shows the continuous chip.

## 1–5. Carried from v1.0 unchanged

History deliverables D1–D3 (3-month floor, 6-month target, real
fetch), schedule S1–S3, live D4–D5, acceptance T1–T4, round log —
all as in v1.0; D6/T5 join them.

## Round log

- v1.0 — history + live deliverables, acceptance tests.
- v1.1 — D6 continuous back-adjusted futures series (Coach's TV
  B-ADJ comparison); T5. Backfilled eras now join the ES/MES
  terrain immediately via back-adjustment; SPX-space mapping
  proceeds in parallel as its own deliverable.
