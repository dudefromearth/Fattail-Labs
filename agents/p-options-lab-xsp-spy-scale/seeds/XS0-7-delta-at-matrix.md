# XS0-7 — AT ownership

**Project:** Options Lab XSP / SPY Scale  
**Agent:** Delta  
**Depends:** —  
**Feeds:** XS0-G · XS4

## Intent

| Item | Pin |
|------|-----|
| Characterization lock | [`characterization-list.md`](../characterization-list.md) is the XS4 lock. AT-XS1…21 + 2b/5b/7b–7g/8b/12b |
| Gate names | **XS0-G … XS5-G** only. Not W0-G, not WF*-G, not LIM*-G |
| Dialog overlap FAIL | Diff that touches dialog chrome, Tos padlock, or `defaultWidth` is **FAIL**. `AnalyzerPositionsList.tsx` in the diff is **FAIL** |
| Ternary | PASS / FAIL / BLOCKED. No waive. Coach overrule needs a DL |
| XS0-G cannot PASS | If seed files are missing, if product code is in this PR, or if L* are cited as Coach rulings before the GO token |
| **AT-XS7c** | Kilo cannot certify XS2 if skipped |
| OD-XS1 (b) | Heatmap 1–7 ATs descoped on DL, not a waive. Create ATs still ship |

## Out of scope

Writing tests (XS4). Shipping. Product code.

## XS0-7 done

Ownership matrix acknowledged. Characterization list unmodified unless a hole is named (then flag, do not drop Coach ATs).
