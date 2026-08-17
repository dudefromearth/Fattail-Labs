# W0-G — Coach GO token

**Verdict:** **PASS**  
**Date:** 2026-08-17  
**Agent:** Delta  
**Artifact:** `agents/go/OLSAF-W0.md`  
**Plan:** v1.0  

Delta read **the token file**, not chat (DL-328).

---

## Evidence

| Check | Evidence | Result |
|-------|----------|--------|
| File exists | `agents/go/OLSAF-W0.md` | **PASS** |
| Plan named v1.0 | Token header + plan revision **v1.0** | **PASS** |
| Spec v0.1.1 | Token cites Autofit **v0.1.1 ACCEPTED** · DL-421 | **PASS** |
| **GO** checked | `- [x] **GO**` | **PASS** |
| Amend/Stop unchecked | boxes empty | **PASS** |
| Signed | `Coach` · `2026-08-17` | **PASS** |
| Preconditions named | first-ship closed · no AF-n seed · no `autofitView.ts` merge | **PASS** |
| W3 file law | Token names the four files only | **PASS** |

**Defects:** none.

W1 and W2 may fire. **W3 remains blocked** until W1-G **and** W2-G.
W3 seed in-scope files are only those four paths.
