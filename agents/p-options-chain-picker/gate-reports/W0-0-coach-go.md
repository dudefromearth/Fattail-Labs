# W0-0 — Coach GO

**Status:** PASS  
**Date:** 2026-08-10  
**Authority:** Coach  

## GO

**GO** on:

| Artifact | Path |
|----------|------|
| Product law | Spec v1.0.1 `Specs/FatTail-Labs-Options-Chain-Picker-Spec-v1.0.md` |
| Execution law | `docs/Options-Chain-Picker-Full-Agent-Bench-Plan-v1.0.md` |
| HIG | Human Interface Spec v1.0 — binds prelim + production |
| Board | `agents/p-options-chain-picker/` |

### OP1–OP12

All plan §3 locks are **product law**.

### Residual ODs (defaults — Coach silent)

| OD | Default |
|----|---------|
| OD-nav | Market parent `/app/market/*` |
| OD-poll-ms | 2000 |
| OD-ttl | 1.5–2.0 s |
| OD-vol-tier | Keep volume/OI on OC9 change set |
| OD-preform-ttl | 1 session day |
| OD-strike-step | SPX/NDX/RUT 5; XSP 1; equity 1 |

### BUILD AUTHORITY

Granted for H → E → U → K → P → Z after W0-G.  
**Never waive** H1-G or P1-G.

### Next

W0-1…W0-7 → W0-G.
