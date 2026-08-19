# Seed W5-1 — Lima Analyzer §1.11 + DL

**Project:** p-az-what-if-tm  
**Agent:** Lima  
**Phase:** W5  
**Depends:** W2-1 · W3-1 (docs same body as land)  
**Gate it feeds:** W-G

## Intent

Docs parity. Analyzer §1.11 matches as-built after W2/W3. DL records two clocks + OD-1 B / OD-2 A / OD-3 B.

## Files in scope

- `Specs/FatTail-Labs-Options-Lab-Analyzer-Spec-v0_2.md` §1.11 (Time remaining last-trade; Implied vol; What-if heading)  
- `Architecture/00-decision-log.md`  
- What-if spec status line: BUILD AUTHORITY **only if** Coach stamped W0-BA; else keep DRAFT and cite the impl plan

## Out of scope

Rewriting OPF §3.7. Flag register dump.

## Done when

DL entry exists. §1.11 no longer says 0…72 h / −30…+30 pts as law.

## Invariants

Documentation parity. Coach Content Law — remaining-last-trade and measured-IV stay.
