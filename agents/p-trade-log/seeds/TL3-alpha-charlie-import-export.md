# Seed TL3 — Canonical export + native/csv import

**Project:** p-trade-log · **Agents:** Alpha (parse/export API), Charlie (Import sheet UI)  
**Depends on:** TL1  
**Gate:** Spec §§7–8 native + csv_generic  

## Objective

`fattail.labs.trade_log` export; import detect/preview/commit; Import slide-out with target account; Mike-minded validation (no cross-tenant, server-side parse).

## In scope

- Export/import routes under `/api/me/trade-log/`  
- Canonical types/validate  
- `csv_generic` + `native` adapters  
- Import sheet UI  
- Tests for idempotent re-import  

## Out of scope

- thinkorswim-specific parser (TL4)  

## Completion criteria

- [ ] Export downloads valid JSON with venues on accounts  
- [ ] Re-import idempotent  
- [ ] Preview does not write; commit writes  
- [ ] pytest + manual Import sheet evidence  
