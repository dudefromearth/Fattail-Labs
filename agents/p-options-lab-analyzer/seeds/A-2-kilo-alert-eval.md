# Seed A-2 — Kilo raw-mark alert evaluation characterization

**Agent:** Kilo  
**Phase:** A (P-A3 — characterization is Kilo-lane, not Charlie-only)  
**Depends:** L-G (alerts UI polish may land in parallel A-1)  

## Ask

Characterize and evidence **raw-mark evaluate / smoothed draw** law (A1):

1. Where evaluation reads underlier/option mark (file + function).  
2. Where draw path uses smoothed series (if any).  
3. Fixture or unit: mark crosses threshold → alert fires; smoothed-only path does **not** hide a raw cross.  
4. Note gaps as residual (do not silent-green).

## Done

Characterization note under `gate-reports/` or seed reply with file:line evidence; FAIL if raw-eval claim unevidenced.
