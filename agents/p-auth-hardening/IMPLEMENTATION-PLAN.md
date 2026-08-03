# Implementation Plan — p-auth-hardening

**Canonical:** [`docs/Auth-Hardening-Full-Agent-Bench-Plan.md`](../../docs/Auth-Hardening-Full-Agent-Bench-Plan.md)  
**Audit:** [`docs/Auth-Hardening-Audit-2026-08-02.md`](../../docs/Auth-Hardening-Audit-2026-08-02.md)

---

## Mission (one screen)

Close five high-impact auth findings **one at a time**, assess after each, re-rank what is left.

---

## Sequence

```text
W0 → H5 deploy → H3 allowlist → H1 live role → H2 SSO hygiene → H4 switch ops → CLOSE
```

Each `H*` has its own plan under `plans/H*.md` and ends in `H*-G` assessment.

---

## Assessment → reevaluation

After every H*-G **PASS**:

1. Update residual risk for that H.  
2. Re-rank H remaining + M backlog.  
3. Set board **NEXT**.  

No automatic start of the next H without board update.
