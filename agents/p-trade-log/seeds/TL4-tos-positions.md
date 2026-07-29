# Seed TL4 — thinkorswim adapter + Positions mode

**Project:** p-trade-log · **Agents:** Alpha + Charlie  
**Depends on:** TL2 + TL3  
**Gate:** Spec §5.3 + §8 thinkorswim  

## Objective

Parse ToS-style trade history CSV → canonical; Positions mode single-account open book.

## In scope

- `thinkorswim` adapter + fixture  
- Positions API + UI mode  
- Tests for parse + netting  

## Completion criteria

- [ ] Fixture preview/commit  
- [ ] Positions never cross accounts  
- [ ] Evidence in gate-report notes  
