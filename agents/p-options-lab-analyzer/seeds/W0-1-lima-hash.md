# Seed W0-1 — Lima path/hash reconcile + residual DL

**Agent:** Lima  
**Phase:** W0  
**Advisor fold:** P-B1 · P-B2 · P-A5  

## Ask

1. **Filename/version reconcile (P-B1):**  
   - Canonical Analyzer law = `Specs/FatTail-Labs-Options-Lab-Analyzer-Spec-v0_2.md` (content **v0.2.1**).  
   - `...Analyzer-Spec-v0_1.md` = SUPERSEDED stub only.  
   - Doc control notes path landing (DL-306).

2. **PB Spec v0.3 (P-B2):**  
   - Canonical = `Specs/FatTail-Labs-Options-Lab-Position-Builder-Spec-v0_3.md`  
     (PB-VIEW-7 + B5: six-state `liveState` · magnitude invariant · ANALYSIS-only).  
   - `...Position-Builder-Spec-v0_2.md` = SUPERSEDED.

3. **Triple hash verify (P-A5) — one pass:**  
   - Analyzer Spec v0_2  
   - PB Spec v0_3  
   - OPF Spec v0_2 (content v0.2.1)  
   - Method: sha1 of body **excluding** the integrity line; update integrity lines if drift.  
   - Record hashes in this seed reply / W0-G evidence.

4. Confirm residual plan path + board; plan revision **v1.0.1** disposition §11.  
5. File **DL-306** (path/hash · PB v0.3 · plan advisor fold).  
6. Index AGENTS.md + Architecture README to v0_2 / v0_3 paths.

## Done

| Check | Evidence |
|-------|----------|
| Analyzer path v0_2 | File + stub |
| PB path v0_3 | File + SUPERSEDED v0_2 header |
| Triple hashes match bodies | Listed in gate report |
| DL-306 present | Decision log |
| Indexes updated | AGENTS · Architecture README |

## Forbidden

- Implementing residual L/B/… code in this seed  
- Amending PB material law in place on v0.2 without version bump  
- Claiming W0-0 BUILD GO (Coach only)
