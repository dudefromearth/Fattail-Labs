# W0-G — Coach GO token

**Verdict:** **PASS**  
**Date:** 2026-08-16  
**Agent:** Delta  
**Artifact:** `agents/go/OLS-W0.md`  
**Plan:** v1.0.1  

Delta read **the token file**, not chat (DL-328).

---

## Evidence

| Check | Evidence | Result |
|-------|----------|--------|
| File exists | `agents/go/OLS-W0.md` | **PASS** |
| Plan named v1.0.1 | Token header + plan revision field | **PASS** |
| Spec v0.1.8 hash | Token cites `432b79faea9e875bf525c7ab45267c0914ce3208` | **PASS** |
| **GO** checked | `- [x] **GO**` | **PASS** |
| Amend/Stop unchecked | boxes empty | **PASS** |
| Signed | `Coach` · `2026-08-16` | **PASS** |
| Preconditions named | chrome closed · no migration before stamp · no Backtest seed · LAW now / FEED later · W2-G first-ship only | **PASS** |

**Defects:** none.

W1 and W2 may fire. W3-1 remains blocked until W1-G **and** W2-G.
