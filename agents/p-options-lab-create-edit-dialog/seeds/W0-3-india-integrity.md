# W0-3 — India · Specs integrity

**Phase:** W0
**Agent:** India
**Depends:** W0-0 GO
**Verdict:** APPROVED or RETURNED (build readiness)

## Intent

1. Live Spec is v0.4. Same content check as W0-0 (plan §3).
2. Grep every L1–L20 citation and every `AT-DLG-*` against
   `Specs/FatTail-Labs-Options-Lab-Create-Edit-Position-Dialog-Spec-v0_4.md`.
3. Parent Spec paths intact. No MSC. Freeze isolation (DL-539).
4. `Specs/` holds only versioned feature contracts for this program. v0.3 is the prior
   baseline — **do not flag it as a stray**. This plan lives in `docs/`, not `Specs/`.
5. Frozen Position Control Spec v1.2 is unedited.

**§ Bench delta** required. **§ Flagged ideas** or “inventory intact”.

**Out:** code, editing v1.2, re-deriving DLG-VOCAB.
