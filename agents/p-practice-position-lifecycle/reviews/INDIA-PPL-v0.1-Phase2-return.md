# INDIA — Phase 2 return (B1–B3 landed)

**Agent:** India  
**Date:** 2026-09-14  
**Subject:** `Specs/FatTail-Labs-Practice-Position-Lifecycle-Spec-v0.1.md` (**DRAFT**, Juliet Phase 2 return)  
**Prior:** `agents/p-practice-position-lifecycle/reviews/INDIA-PPL-v0.1-Phase2.md` **RETURNED**  
**This pass:** re-read §0.3, §4.3, §5.1, §5.2, §7.1, §11, §12 OD-25, §14. Spec not edited. ODs not disposed.

---

## Up front (required if true)

This pass **did not change or drop** anything Coach wrote. The spec file was not edited.

Juliet’s Phase 2 return is B1–B3 only. B0 contract, both Coach phrases, matcher freeze, and transcribed ODs remain.

---

## Bench delta

1. **B1–B3 are packetable.** Write-path table + OD-25, Privacy DS-4 named amend, exhaustive PPL-2 consumers + slot qty SoR. Echo + Tango + Hotel can review this DRAFT.
2. **OD-25 is the import-commit gate.** W2 may seed member `POST /trades`; W2 **must not** seed import-commit gates until Coach disposes. PATCH is enumerated (no silent create-then-PATCH hole) and stays gated **or** excepted-pending-OD.
3. **Qty SoR is the match slot.** `open_qty_and_avg_cost(trade)` is not remaining-qty. GET `/opens` is a named PPL-2 consumer. Leftover `m.close` callers are inherit / GO-allowlist / out-of-scope — including `campaign_phase_reports.py` (not Campaign chrome).

---

## Coach content intact?

Yes — B0 v1.1 findings, both **partial-residual** and **unfinished cycle**, absorbing sentence in §4.4 / §6.2, OD-21 left to Hotel. OD-19 / 21 / 9 / 22 / 23 / 24 transcribed, not answered. **OD-25** added from India B1, **not answered**. India opinion on OD-25 is labeled opinion in §12.

---

## Blocks (invariant | law | system only)

None remaining from B1–B3.

| Prior block | Landed |
|-------------|--------|
| **B1** write-path table + OPEN OD for import commit | §5.2 / §7.1 table (`POST` · `PATCH` · import commit) each **gated or excepted-pending-OD**. **OD-25** in §12. W2 import-commit packets cannot start. Juliet does not pick. |
| **B2** Privacy DS-4 parent for declarations | Parents table + §0.3 named later amend when OD-22 disposed. No declarations schema. Coverage window does not trigger DS-4. |
| **B3** exhaustive PPL-2 consumers + slot qty SoR | §4.3 / §5.1 / §7.6: qty SoR = match slot. Table includes GET `/opens`, `positions_valuation`, day-book. Leftover callers named. |

---

## Opinions / recommendations (not blocks — Coach may discard)

- **POST** is already PPL-3 (API SoR, 422). Combined with “W2 may seed this path,” member close is packetable without answering OD-25. Coach Phase 5 may lock POST as **gated** (not excepted) if that sentence should be tighter; not required to leave Phase 2.
- **PATCH** remains FLAGGED in §11 and enumerated. India O3 (same gates as POST) is still opinion.
- **OD-25 India opinion** in §12 matches prior O3; still not law.
- **FI-PPL-1 / FI-PPL-2** in §11; hold-boundary direction still not picked; Hotel vocabulary still not invented. Correct.
- Still DRAFT, not BUILD AUTHORITY. Phase 5 must seat this program vs LIM / QFRIC / XS (prior bench delta item 8). Not a Phase 2 block.

---

## Flagged ideas

Flagged ideas: none new — inventory intact (`FI-PPL-1`, `FI-PPL-2` already in spec §11).

---

## Build disposition

**APPROVED** (implementation readiness of this DRAFT — not product deletion, not BUILD AUTHORITY, not GO)

Echo + Tango → Hotel may proceed. Juliet does not seed until Coach Phase 5. ODs 19 / 21 / 9 / 22 / 23 / 24 / **25** stay OPEN.

---

*India · Phase 2 return · 2026-09-14 · spec not edited · ODs not disposed*
