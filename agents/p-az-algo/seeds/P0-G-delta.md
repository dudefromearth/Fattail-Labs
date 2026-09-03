# Seed P0-G — Delta P0 gate

**Project:** p-az-algo  
**Agent:** Delta  
**Phase:** P0  
**Depends:** P0-0 · P0-1 · P0-2 · P0-3  
**Law:** token AZALGO-W0 · **DL-328**  
**Gate it feeds:** P1 (blocked until this PASS)

## Intent

Ternary gate. Read **the token file**, not chat.

## Checks

1. `AZALGO-W0` is **GO**, signed, dated 2026-09-03.  
2. Spec sha1 on the token = `shasum -a 1` of the v2.2.2 file.  
3. Fixtures 1–18 handwritten on disk. P0-2 freeze check recorded.  
4. P0–P6 seeds present.  
5. No product-code file opened in this phase.

## Out of scope

Waiving. Opening `algoEval.ts`. Firing P1.

## Done when

`agents/p-az-algo/gate-reports/P0-G.md` is PASS, FAIL, or BLOCKED.
