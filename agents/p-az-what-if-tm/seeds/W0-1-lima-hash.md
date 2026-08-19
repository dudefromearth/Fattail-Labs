# Seed W0-1 — Lima hash and parent cites

**Project:** p-az-what-if-tm  
**Agent:** Lima  
**Phase:** W0  
**Depends:** W0-0 STAMP  
**Gate it feeds:** W0-2

## Intent

Make the DRAFT citeable: filename/version match, parent table honest, no silent OPF rewrite.

## Files in scope (read; one-line cite fixes only)

- `Specs/FatTail-Labs-Options-Lab-Analyzer-What-If-Time-and-Measured-Vol-Spec-v0.1.md`  
- Analyzer v0.2.1 §1.11–1.12  
- OPF v0.2.1 §3.7 · §6.7 (OPF29 · OPF31)  
- Surface App Spec v0.1.8 §4.6 / §5.3c  
- This plan + board paths

## Asks

1. Spec filename = header filename. Status still DRAFT.  
2. Parent table includes OPF §3.7/§6.7 and Surface v0.1.8.  
3. Record `shasum -a 1` of the spec body (or note hash method) in the W0-1 note.  
4. Do **not** log a DL until W0-BA.

## Out of scope

Decision-log entry. Implementation. Rewriting law.

## Done when

Note in `gate-reports/` or a Lima appendix: hashes + path check PASS/FAIL.

## Invariants

Documentation parity. Nothing hidden. No DL before BUILD AUTHORITY.
