# W5-G — Lima as-built

**Verdict:** **PASS**  
**Date:** 2026-08-17  
**Agent:** Lima  

---

## Evidence

| Artifact | Says | Matches code |
|----------|------|----------------|
| Autofit Spec v0.1.1 §3 | Autofit on book change + button; drop What-if; no live-spot; no playhead | `autofitShouldRun` + `fitHoldRef` |
| DL-421 | same | yes |
| Arch 33 Autofit row | v0.1.1 ACCEPTED · book + button only | yes |
| App Spec §5.3 pointer | Autofit spec · playhead does not change S | yes |
| New decision? | none — **no new DL** | — |

**Defects:** none. W4 live walk still **BLOCKED**; that is a gate residual, not a spec lie.
