# GO token — Options Lab Surface Autofit W0

**ID:** `OLSAF-W0`  
**Program:** Options Lab Surface Autofit  
**Plan:** [`docs/Options-Lab-Surface-Autofit-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Options-Lab-Surface-Autofit-Full-Agent-Bench-Plan-v1.0.md) **v1.0**  
**Spec:** Autofit **v0.1.1 ACCEPTED** · **DL-421**  
**Board:** `agents/p-options-lab-surface-autofit/`  

**DL-328:** Delta gates W0 by **this file**. Chat is not a stamp.

---

## Preconditions (file must name these)

| Check | Value |
|-------|--------|
| Plan revision | **v1.0** |
| Spec | Autofit **v0.1.1** — do not reopen v0.1 arguments |
| Surface first-ship | **Closed** — do not reopen `p-options-lab-surface` |
| AF-n | **Not seeded** until Coach screenshot + spec amendment |
| Analyzer 2D autofit | **Out** — do not merge `autofitView.ts` |

---

## Coach stamp

Stamp **one**:

- [x] **GO** — fire W1 + W2; W3 after W1-G + W2-G  
- [ ] **Amend** — reason below; board stays DRAFT  
- [ ] **Stop**

**Signed:** Coach  
**Date:** 2026-08-17  

**W3 seed file law (this stamp):** in-scope files are only
`web/lib/risk-graph/surfaceAutofit.ts`,
`web/lib/risk-graph/surfaceAutofit.test.ts`,
`SurfaceApp` Autofit call site,
`CameraHud` button copy. Nothing else.

Delta: W0-G **PASS** only if this file shows **GO** checked and signed.
W0-G **FAIL** if missing, unsigned, or Amend/Stop.
