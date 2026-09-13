# XS0-8 — Seeds on disk

**Project:** Options Lab XSP / SPY Scale  
**Agent:** Juliet  
**Depends:** —  
**Feeds:** XS0-G · XS0-0

## Intent

| Item | Pin |
|------|-----|
| Board on disk | `agents/p-options-lab-xsp-spy-scale/` — **new**. Do not reopen closed Width Fit WF1–WF5 |
| Pasteable seed files | `seeds/XS0-1` … `XS0-9` (this set). XS1+ packets fire after GO |
| Isolation — WF | `p-options-lab-heatmap-width-fit` is **closed** (WF5-G · DL-526). No XS* seeds on that board. WIDTH-1 shots stay at `gate-reports/width1/` |
| Isolation — AF | `p-options-lab-heatmap` AF0–AF-Z closed. Do not implement AF-X as this product. No XS* seeds there |
| Isolation — LIM | `p-options-lab-heatmap-lim` remains **active**. No XS* seeds. Do not touch LIM files |
| Isolation — QFRIC | `p-quant-friction` remains **active**. No XS* seeds. Probe is read-only evidence |
| Isolation — Dialog | `p-options-lab-create-edit-dialog`: no Width picker restore. Sequence XS1 behind if that GO is still open. No XS* seeds on that board |
| **NX18** | Not IKI Labs, observer-light, or Factory catalog. Runner is Template Runner (`web/lib/runner/`) |

## Out of scope

Implementation. Coach stamp (this PR writes the token; Coach ticks are on `XS0-W0.md`).

## XS0-8 done

`seeds/` contains XS0 packets. CHARTER/ORCHESTRATOR point here and forbid WF/AF reopen.
